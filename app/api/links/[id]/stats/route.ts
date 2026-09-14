import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const { id } = await params;
    const days   = parseInt(new URL(req.url).searchParams.get("days") || "30");
    const since  = new Date(Date.now() - days * 86400000).toISOString();

    // Verify link belongs to org
    const { data: link } = await supabase
      .from("tracking_links").select("id,click_count,unique_clicks,conversion_count,affiliate_id,program_id")
      .eq("id", id).eq("organization_id", orgId).single();
    if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });

    const { data: clicks } = await supabase
      .from("clicks").select("clicked_at,device_type,country_code,converted")
      .eq("link_id", id).gte("clicked_at", since);

    const { data: convs } = await supabase
      .from("conversions").select("revenue,commission_amount,status,converted_at")
      .eq("link_id", id).gte("converted_at", since);

    // Daily breakdown
    const daily: Record<string, { clicks: number; conversions: number }> = {};
    for (let i = 0; i < days; i++) {
      daily[new Date(Date.now() - i * 86400000).toISOString().split("T")[0]] = { clicks: 0, conversions: 0 };
    }
    (clicks || []).forEach(c => { const d = c.clicked_at.split("T")[0]; if (daily[d]) daily[d].clicks++; });
    (convs || []).filter(c => ["approved","paid"].includes(c.status)).forEach(c => {
      const d = c.converted_at.split("T")[0]; if (daily[d]) daily[d].conversions++;
    });

    const byDevice: Record<string, number> = {};
    (clicks || []).forEach(c => { byDevice[c.device_type || "unknown"] = (byDevice[c.device_type || "unknown"] || 0) + 1; });

    const byCountry: Record<string, number> = {};
    (clicks || []).forEach(c => { if (c.country_code) byCountry[c.country_code] = (byCountry[c.country_code] || 0) + 1; });

    const approved = (convs || []).filter(c => ["approved","paid"].includes(c.status));

    return NextResponse.json({
      link,
      summary: {
        total_clicks:      clicks?.length || 0,
        total_conversions: approved.length,
        total_revenue:     approved.reduce((s, c) => s + (c.revenue || 0), 0),
        total_commissions: approved.reduce((s, c) => s + (c.commission_amount || 0), 0),
        conversion_rate:   (clicks?.length || 0) > 0 ? ((approved.length / (clicks?.length || 1)) * 100).toFixed(1) : "0",
      },
      daily: Object.entries(daily).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date)),
      by_device:  Object.entries(byDevice).sort((a, b) => b[1] - a[1]),
      by_country: Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 8),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
