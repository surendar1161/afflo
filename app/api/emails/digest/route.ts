import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail, emailWeeklyDigest } from "@/lib/email";

const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
const CRON_SECRET = process.env.CRON_SECRET || "";

// Called by pg_cron every Monday at 9 AM: POST /api/emails/digest
export async function POST(req: NextRequest) {
  if (CRON_SECRET) {
    const secret = req.headers.get("x-cron-secret");
    if (secret !== CRON_SECRET)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createAdminClient();
  const now        = new Date();
  const weekAgo    = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString();
  const twoWeekAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Get all active affiliates with program memberships
  const { data: memberships, error } = await adminSupabase
    .from("program_memberships")
    .select("affiliate_id, program_id, organization_id, affiliate:affiliates(email,full_name), program:programs(name,currency)")
    .eq("status", "active");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!memberships || memberships.length === 0)
    return NextResponse.json({ sent: 0, message: "No active affiliates" });

  const results = await Promise.allSettled(memberships.map(async (m: any) => {
    const aff  = m.affiliate;
    const prog = m.program;
    if (!aff?.email) return { status: "skipped", reason: "no email" };

    // This week's conversions
    const { data: thisWeek } = await adminSupabase
      .from("conversions")
      .select("commission_amount")
      .eq("affiliate_id", m.affiliate_id)
      .eq("program_id", m.program_id)
      .in("status", ["approved", "paid"])
      .gte("created_at", weekAgo);

    // Last week's conversions (for change %)
    const { data: lastWeek } = await adminSupabase
      .from("conversions")
      .select("commission_amount")
      .eq("affiliate_id", m.affiliate_id)
      .eq("program_id", m.program_id)
      .in("status", ["approved", "paid"])
      .gte("created_at", twoWeekAgo)
      .lt("created_at", weekAgo);

    // This week's clicks
    const { count: thisClicks } = await adminSupabase
      .from("clicks")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", m.affiliate_id)
      .gte("clicked_at", weekAgo) as any;

    // Last week's clicks
    const { count: lastClicks } = await adminSupabase
      .from("clicks")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", m.affiliate_id)
      .gte("clicked_at", twoWeekAgo)
      .lt("clicked_at", weekAgo) as any;

    // Total earned all-time
    const { data: allTime } = await adminSupabase
      .from("conversions")
      .select("commission_amount")
      .eq("affiliate_id", m.affiliate_id)
      .in("status", ["approved", "paid"]);

    // Tier info
    const { data: tierProgress } = await adminSupabase
      .from("affiliate_tier_progress")
      .select("tier_name,tier_color,tier_icon")
      .eq("affiliate_id", m.affiliate_id)
      .eq("organization_id", m.organization_id)
      .single();

    const weekEarned      = (thisWeek  || []).reduce((s: number, c: any) => s + (c.commission_amount || 0), 0);
    const lastWeekEarned  = (lastWeek  || []).reduce((s: number, c: any) => s + (c.commission_amount || 0), 0);
    const totalEarned     = (allTime   || []).reduce((s: number, c: any) => s + (c.commission_amount || 0), 0);
    const weekConversions = (thisWeek  || []).length;
    const lastConversions = (lastWeek  || []).length;
    const weekClicksN     = thisClicks || 0;
    const lastClicksN     = lastClicks || 0;

    const emailData = emailWeeklyDigest({
      affiliateName:    aff.full_name || aff.email,
      programName:      prog?.name     || "Affiliate Program",
      orgName:          prog?.name     || "Your program",
      weekClicks:       weekClicksN,
      weekConversions,
      weekEarned,
      totalEarned,
      currency:         prog?.currency  || "USD",
      changeClicks:     weekClicksN  - lastClicksN,
      changeConversions: weekConversions - lastConversions,
      tier:             tierProgress?.tier_name  || "Bronze",
      tierIcon:         tierProgress?.tier_icon  || "🥉",
      tierColor:        tierProgress?.tier_color || "#CD7F32",
      portalUrl:        `${APP_URL}/portal/dashboard`,
    });

    await sendEmail({ to: aff.email, ...emailData });
    return { affiliate_id: m.affiliate_id, status: "sent" };
  }));

  const sent   = results.filter(r => r.status === "fulfilled" && (r as any).value?.status === "sent").length;
  const failed = results.filter(r => r.status === "rejected").length;

  return NextResponse.json({ processed: memberships.length, sent, failed });
}
