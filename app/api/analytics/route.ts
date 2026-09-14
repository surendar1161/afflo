import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const { searchParams } = new URL(req.url);
    const days       = parseInt(searchParams.get("days") || "30");
    const program_id = searchParams.get("program_id");
    const since      = new Date(Date.now() - days * 86400000).toISOString();

    let clickQ = supabase.from("clicks").select("id,affiliate_id,country_code,device_type,clicked_at,converted,fraud_score").eq("organization_id", orgId).gte("clicked_at", since);
    let convQ  = supabase.from("conversions").select("id,affiliate_id,revenue,commission_amount,status,converted_at").eq("organization_id", orgId).gte("converted_at", since);
    let affQ   = supabase.from("affiliates").select("id").eq("organization_id", orgId);

    if (program_id) { clickQ = clickQ.eq("program_id", program_id); convQ = convQ.eq("program_id", program_id); }

    const [clickRes, convRes, affRes] = await Promise.all([clickQ, convQ, affQ]);
    const clicks      = clickRes.data  || [];
    const conversions = convRes.data   || [];
    const affiliates  = affRes.data    || [];

    const approved = conversions.filter(c => ["approved","paid"].includes(c.status));
    const revenue  = approved.reduce((s, c) => s + (c.revenue || 0), 0);
    const commissions = approved.reduce((s, c) => s + (c.commission_amount || 0), 0);

    // Daily breakdown
    const daily: Record<string, { clicks: number; conversions: number; revenue: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
      daily[d] = { clicks: 0, conversions: 0, revenue: 0 };
    }
    clicks.forEach(c => {
      const d = c.clicked_at.split("T")[0];
      if (daily[d]) daily[d].clicks++;
    });
    approved.forEach(c => {
      const d = c.converted_at.split("T")[0];
      if (daily[d]) { daily[d].conversions++; daily[d].revenue += c.revenue || 0; }
    });

    // By country
    const byCountry: Record<string, number> = {};
    clicks.forEach(c => { if (c.country_code) byCountry[c.country_code] = (byCountry[c.country_code] || 0) + 1; });

    // By device
    const byDevice: Record<string, number> = {};
    clicks.forEach(c => { byDevice[c.device_type || "unknown"] = (byDevice[c.device_type || "unknown"] || 0) + 1; });

    return NextResponse.json({
      summary: {
        total_clicks:       clicks.length,
        total_conversions:  approved.length,
        total_revenue:      revenue,
        total_commissions:  commissions,
        conversion_rate:    clicks.length > 0 ? ((approved.length / clicks.length) * 100).toFixed(2) : "0",
        avg_order_value:    approved.length > 0 ? (revenue / approved.length).toFixed(2) : "0",
        epc:                clicks.length > 0 ? (commissions / clicks.length).toFixed(4) : "0",
        active_affiliates:  affiliates.length,
        fraud_rate:         clicks.length > 0 ? ((clicks.filter(c => c.fraud_score > 70).length / clicks.length) * 100).toFixed(1) : "0",
      },
      daily:     Object.entries(daily).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date)),
      by_country: Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 10),
      by_device:  Object.entries(byDevice),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
