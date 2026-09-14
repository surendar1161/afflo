import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireOrgAuth(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles").select("primary_org_id").eq("id", user.id).single();

  const orgId = profile?.primary_org_id;
  if (!orgId) return { error: NextResponse.json({ error: "No organization found" }, { status: 404 }) };

  const { data: member } = await supabase
    .from("organization_members")
    .select("role,status,can_manage_affiliates,can_approve_conversions,can_process_payouts,can_manage_billing")
    .eq("organization_id", orgId).eq("user_id", user.id).eq("status", "active").single();

  if (!member) return { error: NextResponse.json({ error: "Access denied" }, { status: 403 }) };

  return { user, orgId, member, supabase };
}
