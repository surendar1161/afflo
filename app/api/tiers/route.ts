/**
 * GET /api/tiers - List tier definitions for the org
 * GET /api/tiers?leaderboard=1 - Affiliate leaderboard with tiers
 */
import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const { searchParams } = new URL(req.url);
    const leaderboard = searchParams.get("leaderboard") === "1";

    // Tier definitions
    const { data: tiers } = await supabase
      .from("affiliate_tiers")
      .select("*")
      .eq("organization_id", orgId)
      .order("min_revenue");

    if (!leaderboard) return NextResponse.json({ tiers });

    // Leaderboard — top affiliates with their tiers
    const { data: progress } = await supabase
      .from("affiliate_tier_progress")
      .select("*, affiliate:affiliates(id,email,full_name,website)")
      .eq("organization_id", orgId)
      .order("total_revenue", { ascending: false })
      .limit(20);

    // Calculate next tier for each affiliate
    const enriched = (progress || []).map(p => {
      const nextTier = (tiers || []).find(t => t.min_revenue > p.total_revenue);
      return {
        ...p,
        next_tier:            nextTier || null,
        progress_to_next_pct: nextTier
          ? Math.min(100, Math.round((p.total_revenue / nextTier.min_revenue) * 100))
          : 100,
      };
    });

    return NextResponse.json({ tiers, leaderboard: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
