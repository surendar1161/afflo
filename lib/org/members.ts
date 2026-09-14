/**
 * Organization member management helpers (client-side).
 * All operations are RLS-protected — only admins/owners can write.
 */
import { createClient } from "@/lib/supabase/client";
import type { OrganizationMember, OrgRole } from "@/lib/types";

export async function getOrgMembers(orgId: string): Promise<OrganizationMember[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("*, profile:profiles(id,full_name,company_name)")
    .eq("organization_id", orgId)
    .neq("status", "removed")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as OrganizationMember[];
}

export async function inviteMember(orgId: string, email: string, role: OrgRole): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("invite_organization_member", {
    p_org_id: orgId,
    p_email:  email,
    p_role:   role,
  });
  if (error) throw error;
  return data as string; // returns invite_token
}

export async function updateMemberRole(memberId: string, role: OrgRole): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("id", memberId);
  if (error) throw error;
}

export async function removeMember(memberId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("organization_members")
    .update({ status: "removed" })
    .eq("id", memberId);
  if (error) throw error;
}

export async function acceptInvitation(token: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("accept_org_invitation", { p_token: token });
  if (error) throw error;
  return data;
}

// Affiliate users — external users with limited access
export async function getOrgAffiliates(orgId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("affiliates")
    .select("*, memberships:program_memberships(status, program:programs(name))")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
