/**
 * POST /api/org/invite
 * Invite a domain user to an organization with a specified role.
 * Only org admins/owners can call this.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase      = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { org_id, email, role = "member" } = await req.json().catch(() => ({}));
    if (!org_id || !email) return NextResponse.json({ error: "org_id and email required" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    if (!["admin","member","viewer"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

    // Check caller is admin/owner
    const { data: callerMember } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", org_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!callerMember || !["owner","admin"].includes(callerMember.role)) {
      return NextResponse.json({ error: "Only admins and owners can invite members" }, { status: 403 });
    }

    // Get org details
    const { data: org } = await supabase
      .from("organizations")
      .select("name, slug")
      .eq("id", org_id)
      .single();

    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    // Check if user already exists in Supabase auth
    const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);

    const token = crypto.randomUUID().replace(/-/g, "");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
    const inviteLink = `${appUrl}/join?token=${token}`;

    if (existingUser) {
      // User exists — add them directly as pending member
      await adminSupabase.from("organization_members").upsert({
        organization_id: org_id,
        user_id: existingUser.id,
        role,
        status: "pending",
        invited_by: user.id,
        invited_at: new Date().toISOString(),
        invite_token: token,
      }, { onConflict: "organization_id,user_id" });
    } else {
      // New user — send Supabase invite email
      const { error: inviteErr } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: inviteLink,
        data: { org_id, org_name: org.name, role, invite_token: token, inviter_email: user.email },
      });
      if (inviteErr) {
        console.error("[invite]", inviteErr.message);
        return NextResponse.json({ error: "Failed to send invite email" }, { status: 500 });
      }

      // Pre-create pending member slot (will be filled when user accepts)
      // Store token in notifications table for now since we don't have user_id yet
    }

    return NextResponse.json({ success: true, invite_link: inviteLink, token });

  } catch (err: any) {
    console.error("[org/invite]", err?.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
