import { NextRequest, NextResponse } from "next/server";
import { requireAffiliateAuth } from "@/lib/portal-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAffiliateAuth(req);
    if ("error" in auth) return auth.error;
    const { affiliate } = auth;

    const adminSupabase = createAdminClient();

    // Get all affiliates in the same org(s) with their stats
    const { data: peers, error } = await adminSupabase
      .from("affiliate_tier_progress")
      .select("affiliate_id,total_revenue,tier_name,tier_color,tier_icon,organization_id")
      .eq("organization_id", affiliate.organization_id)
      .order("total_revenue", { ascending: false })
      .limit(100);

    if (error) throw error;

    // Get names/emails for the peers (anonymised for non-self entries)
    const affiliateIds = (peers || []).map((p: any) => p.affiliate_id);
    const { data: affiliateDetails } = await adminSupabase
      .from("affiliates")
      .select("id,full_name,email")
      .in("id", affiliateIds);

    const detailMap = Object.fromEntries((affiliateDetails || []).map((a: any) => [a.id, a]));

    const leaderboard = (peers || []).map((p: any, index: number) => {
      const isSelf = p.affiliate_id === affiliate.id;
      const detail = detailMap[p.affiliate_id];
      return {
        rank:          index + 1,
        is_self:       isSelf,
        display_name:  isSelf
          ? (detail?.full_name || detail?.email || "You")
          : `Affiliate #${index + 1}`,
        total_revenue: p.total_revenue,
        tier_name:     p.tier_name,
        tier_color:    p.tier_color,
        tier_icon:     p.tier_icon,
      };
    });

    const myRank = leaderboard.find((e: any) => e.is_self)?.rank || null;

    return NextResponse.json({ leaderboard, my_rank: myRank, total: leaderboard.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
