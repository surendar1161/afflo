"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Organization, OrganizationMember, OrgContext, OrgRole } from "@/lib/types";

/**
 * Returns the current user's active organization context.
 * Picks primary_org_id from profile, or the first org they belong to.
 */
export function useOrg() {
  const [ctx, setCtx]       = useState<OrgContext | null>(null);
  const [orgs, setOrgs]     = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Load all orgs the user belongs to
      const { data: memberships, error: mErr } = await supabase
        .from("organization_members")
        .select("*, organization:organizations(*)")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (mErr) throw mErr;
      if (!memberships?.length) { setLoading(false); return; }

      const allOrgs = memberships.map(m => m.organization as Organization);
      setOrgs(allOrgs);

      // Get primary org from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("primary_org_id")
        .eq("id", user.id)
        .single();

      const primaryId = profile?.primary_org_id;
      const activeMembership = memberships.find(m =>
        primaryId ? m.organization_id === primaryId : true
      ) ?? memberships[0];

      const org  = activeMembership.organization as Organization;
      const role = activeMembership.role as OrgRole;

      setCtx({
        organization: org,
        member: activeMembership as OrganizationMember,
        role,
        can: {
          manageAffiliates:   activeMembership.can_manage_affiliates,
          approveConversions: activeMembership.can_approve_conversions,
          processPayouts:     activeMembership.can_process_payouts,
          manageBilling:      activeMembership.can_manage_billing,
          inviteMembers:      activeMembership.can_invite_members,
          viewAnalytics:      activeMembership.can_view_analytics,
        },
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const switchOrg = async (orgId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ primary_org_id: orgId }).eq("id", user.id);
    load();
  };

  return { ctx, orgs, loading, error, refresh: load, switchOrg };
}
