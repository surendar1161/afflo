import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const { searchParams } = new URL(req.url);
    const program_id = searchParams.get("program_id");
    const search     = searchParams.get("search");

    let query = supabase
      .from("affiliates")
      .select("*, memberships:program_memberships!affiliate_id(id,status,program_id,commission_type,commission_value,tier)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    const result = program_id
      ? (data || []).filter(a => a.memberships?.some((m: any) => m.program_id === program_id))
      : (data || []);

    return NextResponse.json({ affiliates: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, user, supabase } = auth;
    const adminSupabase = createAdminClient();

    const { email, full_name, program_id, commission_type, commission_value,
            country_code, niche, website } = await req.json();

    if (!email || !program_id)
      return NextResponse.json({ error: "email and program_id are required" }, { status: 400 });

    // ── Get org + program details for the invite email ───────────────────────
    const [orgRes, progRes] = await Promise.all([
      supabase.from("organizations").select("name,slug").eq("id", orgId).single(),
      supabase.from("programs").select("name,website,portal_primary_color,currency").eq("id", program_id).single(),
    ]);
    const orgName  = orgRes.data?.name  || "An affiliate program";
    const progName = progRes.data?.name || "their affiliate program";
    const appUrl   = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
    const portalUrl = `${appUrl}/portal/sign-in`;

    // ── Check if Supabase auth user already exists ───────────────────────────
    const { data: allUsers } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
    const existingAuthUser = allUsers?.users.find(u => u.email === email);

    // ── Create or find affiliate DB record ───────────────────────────────────
    let affiliateId: string;
    const { data: existing } = await supabase
      .from("affiliates").select("id,auth_user_id").eq("email", email).eq("organization_id", orgId).single();

    if (existing) {
      affiliateId = existing.id;
    } else {
      const { data: newAff, error: affErr } = await supabase.from("affiliates").insert({
        organization_id: orgId,
        email,
        full_name:    full_name    || email.split("@")[0],
        country_code: country_code || null,
        niche:        niche        || [],
        website:      website      || null,
        auth_user_id: existingAuthUser?.id || null,
      }).select().single();
      if (affErr) throw affErr;
      affiliateId = newAff.id;
    }

    // ── Enroll in program ────────────────────────────────────────────────────
    const { data: membership, error: memErr } = await supabase
      .from("program_memberships").upsert({
        program_id, affiliate_id: affiliateId,
        commission_type:  commission_type  || null,
        commission_value: commission_value || null,
        status: "active",
      }, { onConflict: "program_id,affiliate_id" }).select().single();
    if (memErr) throw memErr;

    // ── Generate tracking link ───────────────────────────────────────────────
    const shortCode = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
    await supabase.from("tracking_links").insert({
      program_id, affiliate_id: affiliateId, organization_id: orgId,
      membership_id:   membership.id,
      short_code:      shortCode,
      destination_url: progRes.data?.website || `${appUrl}/r/${shortCode}`,
    });

    // ── Schedule welcome email sequence (D3 + D7) ────────────────────────────
    void adminSupabase.rpc("schedule_affiliate_welcome_sequence", {
      p_affiliate_id: affiliateId,
      p_org_id:       orgId,
      p_program_id:   program_id,
      p_email:        email,
      p_name:         full_name || email.split("@")[0],
      p_metadata:     {
        program_name: progName,
        org_name:     orgName,
        tracking_url: `${appUrl}/r/${shortCode}`,
        currency:     progRes.data?.currency || "USD",
      },
    });

    // ── Send invite email via Supabase Auth ──────────────────────────────────
    let emailSent = false;
    let portalSignInUrl = portalUrl;

    if (!existingAuthUser) {
      // New user — send Supabase magic invite email (they set their own password)
      const { error: inviteErr } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${portalUrl}?welcome=1`,
        data: {
          full_name:    full_name || email.split("@")[0],
          affiliate_id: affiliateId,
          org_name:     orgName,
          program_name: progName,
          portal_url:   portalUrl,
          tracking_url: `${appUrl}/r/${shortCode}`,
          role:         "affiliate",
        },
      });

      if (!inviteErr) {
        emailSent = true;
        // Link the new auth user to the affiliate record (will be set on first login)
      } else {
        console.warn("[affiliates] Invite email failed:", inviteErr.message);
      }
    } else {
      // User already has an account — link it and notify
      await supabase.from("affiliates").update({ auth_user_id: existingAuthUser.id })
        .eq("id", affiliateId);
      emailSent = true; // They can already log in
    }

    return NextResponse.json({
      affiliate_id:   affiliateId,
      membership,
      tracking_url:   `${appUrl}/r/${shortCode}`,
      portal_url:     portalSignInUrl,
      email_sent:     emailSent,
      existing_user:  !!existingAuthUser,
      message:        emailSent
        ? existingAuthUser
          ? `${email} already has an account. They can log in at ${portalUrl}`
          : `Invite email sent to ${email}. They'll receive a link to set their password and access the portal.`
        : `Affiliate added but invite email could not be sent. Share the portal link manually: ${portalUrl}`,
    }, { status: 201 });

  } catch (err: any) {
    console.error("[affiliates POST]", err?.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
