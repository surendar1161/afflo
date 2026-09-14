import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// CORS headers — must allow any merchant domain
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, org_id, ref_code, url, referrer, revenue, order_id, currency = "USD", email } = body;

    if (!org_id || !ref_code)
      return NextResponse.json({ error: "org_id and ref_code required" }, { status: 400, headers: CORS });

    const adminSupabase = createAdminClient();

    // Look up the tracking link by short_code + org
    const { data: link } = await adminSupabase
      .from("tracking_links")
      .select("id,program_id,affiliate_id,organization_id,is_active,expires_at")
      .eq("short_code", ref_code)
      .eq("organization_id", org_id)
      .single();

    if (!link || !link.is_active)
      return NextResponse.json({ ok: false, error: "Invalid or inactive ref code" }, { status: 404, headers: CORS });

    if (link.expires_at && new Date(link.expires_at) < new Date())
      return NextResponse.json({ ok: false, error: "Link expired" }, { status: 410, headers: CORS });

    // ── Click event (SPA / fallback) ──────────────────────────────────────────
    if (event === "click") {
      const ua         = req.headers.get("user-agent") || "";
      const ip         = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
      const deviceType = /mobile|android|iphone|ipad/i.test(ua) ? "mobile"
                       : /tablet|ipad/i.test(ua) ? "tablet" : "desktop";

      await adminSupabase.from("clicks").insert({
        link_id:         link.id,
        program_id:      link.program_id,
        affiliate_id:    link.affiliate_id,
        organization_id: link.organization_id,
        ip_address:      ip,
        user_agent:      ua,
        referrer:        referrer || null,
        device_type:     deviceType,
        session_id:      crypto.randomUUID(),
        fraud_score:     0,
      });

      return NextResponse.json({ ok: true, event: "click" }, { headers: CORS });
    }

    // ── Conversion events (purchase / sale / signup / lead) ───────────────────
    if (["purchase", "sale", "signup", "lead"].includes(event)) {
      if (!revenue && event !== "signup" && event !== "lead")
        return NextResponse.json({ error: "revenue required for purchase/sale events" }, { status: 400, headers: CORS });

      // Check for duplicate order_id within this org
      if (order_id) {
        const { data: dupe } = await adminSupabase
          .from("conversions")
          .select("id")
          .eq("organization_id", org_id)
          .eq("order_id", order_id)
          .single();
        if (dupe)
          return NextResponse.json({ ok: true, duplicate: true }, { headers: CORS });
      }

      // Calculate commission via DB function
      const { data: commCalc } = await adminSupabase.rpc("calculate_commission", {
        p_program_id:   link.program_id,
        p_affiliate_id: link.affiliate_id,
        p_revenue:      revenue || 0,
        p_event_type:   event,
      });

      const calc = (commCalc as any[])?.[0] || {
        commission_type: "percentage",
        commission_value: 10,
        commission_amount: (revenue || 0) * 0.1,
      };

      const { data: conv, error } = await adminSupabase.from("conversions").insert({
        organization_id:   link.organization_id,
        program_id:        link.program_id,
        affiliate_id:      link.affiliate_id,
        link_id:           link.id,
        event_type:        event,
        order_id:          order_id || null,
        revenue:           parseFloat(revenue) || 0,
        currency,
        commission_type:   calc.commission_type,
        commission_value:  calc.commission_value,
        commission_amount: calc.commission_amount,
        status:            "pending",
        metadata:          { source: "pixel", url, email: email || null },
      }).select("id,commission_amount").single();

      if (error) throw error;

      return NextResponse.json({
        ok: true,
        event,
        conversion_id:     conv.id,
        commission_amount: conv.commission_amount,
      }, { headers: CORS });
    }

    return NextResponse.json({ ok: false, error: `Unknown event type: ${event}` }, { status: 400, headers: CORS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS });
  }
}
