import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";
import { sendEmail, emailPayoutSent } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("payouts")
      .select("*, affiliate:affiliates(id,email,full_name), program:programs(id,name,currency)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    // Summary stats
    const total    = (data || []).reduce((s, p) => s + p.amount, 0);
    const pending  = (data || []).filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
    const paid     = (data || []).filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);

    return NextResponse.json({ payouts: data, stats: { total, pending, paid } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, member, supabase } = auth;
    if (!member.can_process_payouts) return NextResponse.json({ error: "No permission to process payouts" }, { status: 403 });

    const { affiliate_id, program_id, amount, currency = "USD", method = "paypal", method_details = {} } = await req.json();
    if (!affiliate_id || !amount) return NextResponse.json({ error: "affiliate_id and amount required" }, { status: 400 });

    const { data, error } = await supabase.from("payouts").insert({
      organization_id: orgId, program_id, affiliate_id,
      amount: parseFloat(amount), currency, method, method_details,
      status: "pending",
      period_start: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
      period_end:   new Date().toISOString().split("T")[0],
    }).select().single();

    if (error) throw error;

    // ── Send payout notification email ────────────────────────────────────
    const adminSupabase = createAdminClient();
    const { data: aff } = await adminSupabase
      .from("affiliates").select("email,full_name").eq("id", affiliate_id).single();
    const { data: org } = await adminSupabase
      .from("organizations").select("name").eq("id", orgId).single();
    const { data: allPayouts } = await adminSupabase
      .from("payouts").select("amount").eq("affiliate_id", affiliate_id).eq("status", "paid");

    if (aff?.email) {
      const totalPaid = (allPayouts || []).reduce((s: number, p: any) => s + p.amount, 0) + parseFloat(amount);
      const emailData = emailPayoutSent({
        affiliateName: aff.full_name || aff.email,
        orgName:       org?.name || "Your program",
        amount:        parseFloat(amount),
        currency:      currency || "USD",
        method:        method   || "paypal",
        portalUrl:     `${APP_URL}/portal/dashboard`,
        totalPaid,
      });
      sendEmail({ to: aff.email, ...emailData }).catch(console.error);
    }

    return NextResponse.json({ payout: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
