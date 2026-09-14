import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const { searchParams } = new URL(req.url);
    const program_id   = searchParams.get("program_id");
    const affiliate_id = searchParams.get("affiliate_id");

    let query = supabase
      .from("tracking_links")
      .select("*, affiliate:affiliates(id,email,full_name), program:programs(id,name,currency)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (program_id)   query = query.eq("program_id", program_id);
    if (affiliate_id) query = query.eq("affiliate_id", affiliate_id);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ links: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const {
      program_id, affiliate_id, destination_url, name,
      utm_campaign, utm_source, utm_medium,
      custom_short_code, expires_at,
    } = await req.json();

    if (!program_id || !affiliate_id || !destination_url)
      return NextResponse.json({ error: "program_id, affiliate_id, destination_url required" }, { status: 400 });

    // Validate destination URL
    try { new URL(destination_url); } catch {
      return NextResponse.json({ error: "destination_url must be a valid URL" }, { status: 400 });
    }

    // Use custom short code or auto-generate
    let shortCode = custom_short_code?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || "";
    if (!shortCode) shortCode = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

    // Check custom short code uniqueness
    if (custom_short_code) {
      const { data: existing } = await supabase.from("tracking_links").select("id").eq("short_code", shortCode).single();
      if (existing) return NextResponse.json({ error: `Short code "${shortCode}" is already taken` }, { status: 409 });
    }

    // Verify affiliate belongs to org
    const { data: aff } = await supabase.from("affiliates").select("id").eq("id", affiliate_id).eq("organization_id", orgId).single();
    if (!aff) return NextResponse.json({ error: "Affiliate not found in this organization" }, { status: 404 });

    const { data: membership } = await supabase.from("program_memberships")
      .select("id").eq("program_id", program_id).eq("affiliate_id", affiliate_id).single();

    const { data, error } = await supabase.from("tracking_links").insert({
      organization_id: orgId, program_id, affiliate_id,
      membership_id:   membership?.id || null,
      short_code:      shortCode,
      destination_url, name: name || null,
      utm_campaign:    utm_campaign || null,
      utm_source:      utm_source   || "freshaffiliates",
      utm_medium:      utm_medium   || "affiliate",
      expires_at:      expires_at   || null,
    }).select("*, affiliate:affiliates(email,full_name)").single();

    if (error) throw error;
    return NextResponse.json({
      link: data,
      tracking_url: `${process.env.NEXT_PUBLIC_APP_URL}/r/${shortCode}`,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
