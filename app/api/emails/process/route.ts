import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail, emailWelcomeDay3, emailWelcomeDay7 } from "@/lib/email";

const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
const CRON_SECRET = process.env.CRON_SECRET || "";

// Called by pg_cron every hour: POST /api/emails/process
export async function POST(req: NextRequest) {
  // Verify cron secret (skip check in dev if secret not set)
  if (CRON_SECRET) {
    const secret = req.headers.get("x-cron-secret");
    if (secret !== CRON_SECRET)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createAdminClient();

  // Fetch all pending emails due now
  const { data: pending, error } = await adminSupabase
    .from("email_schedules")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!pending || pending.length === 0)
    return NextResponse.json({ processed: 0, message: "No pending emails" });

  const results = await Promise.allSettled(pending.map(async (schedule: any) => {
    try {
      let emailData: { subject: string; html: string } | null = null;
      const meta = schedule.metadata || {};

      if (schedule.email_type === "welcome_d3") {
        emailData = emailWelcomeDay3({
          affiliateName: schedule.recipient_name || schedule.recipient_email,
          programName:   meta.program_name || "Affiliate Program",
          orgName:       meta.org_name     || "Your program",
          trackingUrl:   meta.tracking_url || APP_URL,
          portalUrl:     `${APP_URL}/portal/dashboard`,
        });
      } else if (schedule.email_type === "welcome_d7") {
        // Fetch 7-day stats for this affiliate
        const { data: stats } = await adminSupabase
          .from("conversions")
          .select("commission_amount")
          .eq("affiliate_id", schedule.affiliate_id)
          .in("status", ["approved", "paid"])
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const { data: clicks } = await adminSupabase
          .from("clicks")
          .select("id", { count: "exact", head: true })
          .eq("affiliate_id", schedule.affiliate_id)
          .gte("clicked_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const earned = (stats || []).reduce((s: number, c: any) => s + (c.commission_amount || 0), 0);
        emailData = emailWelcomeDay7({
          affiliateName: schedule.recipient_name || schedule.recipient_email,
          programName:   meta.program_name || "Affiliate Program",
          orgName:       meta.org_name     || "Your program",
          clicks:        (clicks as any)?.count || 0,
          conversions:   (stats || []).length,
          earned,
          currency:      meta.currency     || "USD",
          trackingUrl:   meta.tracking_url || APP_URL,
          portalUrl:     `${APP_URL}/portal/dashboard`,
        });
      }

      if (!emailData) {
        // Unknown type — mark skipped
        await adminSupabase.from("email_schedules")
          .update({ status: "skipped", sent_at: new Date().toISOString() })
          .eq("id", schedule.id);
        return { id: schedule.id, status: "skipped" };
      }

      await sendEmail({ to: schedule.recipient_email, ...emailData });

      await adminSupabase.from("email_schedules")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", schedule.id);

      return { id: schedule.id, status: "sent" };
    } catch (err: any) {
      await adminSupabase.from("email_schedules")
        .update({ status: "failed", error: err.message })
        .eq("id", schedule.id);
      return { id: schedule.id, status: "failed", error: err.message };
    }
  }));

  const summary = results.map((r) => r.status === "fulfilled" ? r.value : { status: "error", error: (r as any).reason });
  const sent    = summary.filter(s => s.status === "sent").length;
  const failed  = summary.filter(s => s.status === "failed" || s.status === "error").length;

  return NextResponse.json({ processed: pending.length, sent, failed, results: summary });
}
