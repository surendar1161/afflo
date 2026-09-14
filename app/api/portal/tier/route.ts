import { NextRequest, NextResponse } from "next/server";
import { requireAffiliateAuth } from "@/lib/portal-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAffiliateAuth(req);
    if ("error" in auth) return auth.error;
    const { affiliate, supabase } = auth;

    // Get affiliate's tier progress
    const { data: progress } = await supabase
      .from("affiliate_tier_progress")
      .select("*")
      .eq("affiliate_id", affiliate.id)
      .single();

    if (!progress) return NextResponse.json({ progress: null });

    // Get next tier
    const { data: nextTier } = await supabase
      .from("affiliate_tiers")
      .select("name,min_revenue,color,icon")
      .eq("organization_id", progress.organization_id)
      .gt("min_revenue", progress.total_revenue)
      .order("min_revenue")
      .limit(1)
      .single();

    const progressPct = nextTier
      ? Math.min(100, Math.round((progress.total_revenue / nextTier.min_revenue) * 100))
      : 100;

    return NextResponse.json({
      progress: {
        ...progress,
        next_tier:            nextTier || null,
        progress_to_next_pct: progressPct,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
