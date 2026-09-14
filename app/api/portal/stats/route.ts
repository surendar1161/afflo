import { NextRequest, NextResponse } from "next/server";
import { requireAffiliateAuth } from "@/lib/portal-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAffiliateAuth(req);
    if ("error" in auth) return auth.error;
    const { affiliate, supabase } = auth;

    const days  = parseInt(new URL(req.url).searchParams.get("days") || "30");
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [clickRes, convRes, payRes] = await Promise.all([
      supabase.from("clicks").select("id,clicked_at,converted").eq("affiliate_id", affiliate.id).gte("clicked_at", since),
      supabase.from("conversions").select("id,revenue,commission_amount,status,converted_at").eq("affiliate_id", affiliate.id).gte("converted_at", since),
      supabase.from("payouts").select("amount,status").eq("affiliate_id", affiliate.id),
    ]);

    const clicks = clickRes.data || [];
    const convs  = convRes.data  || [];
    const approved = convs.filter(c => ["approved","paid"].includes(c.status));
    const pendingConvs = convs.filter(c => c.status === "pending");

    const totalEarned  = approved.reduce((s, c) => s + (c.commission_amount || 0), 0);
    const pendingEarned = pendingConvs.reduce((s, c) => s + (c.commission_amount || 0), 0);
    const totalPaid    = (payRes.data || []).filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);

    // Daily breakdown
    const daily: Record<string, { clicks: number; conversions: number; earnings: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
      daily[d] = { clicks: 0, conversions: 0, earnings: 0 };
    }
    clicks.forEach(c => { const d = c.clicked_at.split("T")[0]; if (daily[d]) daily[d].clicks++; });
    approved.forEach(c => {
      const d = c.converted_at.split("T")[0];
      if (daily[d]) { daily[d].conversions++; daily[d].earnings += c.commission_amount || 0; }
    });

    return NextResponse.json({
      summary: {
        total_clicks:       clicks.length,
        unique_clicks:      new Set(clicks.map(c => c.clicked_at.split("T")[0])).size,
        total_conversions:  approved.length,
        pending_conversions:pendingConvs.length,
        total_earned:       totalEarned,
        pending_earned:     pendingEarned,
        total_paid:         totalPaid,
        balance:            totalEarned - totalPaid,
        conversion_rate:    clicks.length > 0 ? ((approved.length / clicks.length) * 100).toFixed(1) : "0",
        epc:                clicks.length > 0 ? (totalEarned / clicks.length).toFixed(4) : "0",
      },
      daily: Object.entries(daily).map(([date, v]) => ({ date, ...v })).sort((a,b) => a.date.localeCompare(b.date)),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
