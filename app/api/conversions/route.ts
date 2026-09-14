import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const { searchParams } = new URL(req.url);
    const status     = searchParams.get("status");
    const program_id = searchParams.get("program_id");

    let query = supabase
      .from("conversions")
      .select("*, affiliate:affiliates(id,email,full_name), program:programs(id,name,currency), link:tracking_links(short_code)")
      .eq("organization_id", orgId)
      .order("converted_at", { ascending: false })
      .limit(100);

    if (status)     query = query.eq("status", status);
    if (program_id) query = query.eq("program_id", program_id);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ conversions: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Public webhook — merchants POST sales to this endpoint
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { short_code, order_id, revenue, currency, event_type = "sale", metadata = {} } = body;

    if (!short_code || revenue === undefined)
      return NextResponse.json({ error: "short_code and revenue required" }, { status: 400 });

    // Find tracking link
    const { data: link } = await supabase
      .from("tracking_links")
      .select("id,program_id,affiliate_id,organization_id")
      .eq("short_code", short_code).eq("is_active", true).single();

    if (!link) return NextResponse.json({ error: "Invalid short_code" }, { status: 404 });

    // Calculate commission via DB function
    const { data: commCalc } = await supabase.rpc("calculate_commission", {
      p_program_id: link.program_id,
      p_affiliate_id: link.affiliate_id,
      p_revenue: revenue,
      p_event_type: event_type,
    });

    const calc = (commCalc as any[])?.[0] || { commission_type: "percentage", commission_value: 10, commission_amount: revenue * 0.1 };

    const { data: conv, error } = await supabase.from("conversions").insert({
      organization_id: link.organization_id,
      program_id:      link.program_id,
      affiliate_id:    link.affiliate_id,
      link_id:         link.id,
      event_type, order_id,
      revenue: parseFloat(revenue),
      currency: currency || "USD",
      commission_type:   calc.commission_type,
      commission_value:  calc.commission_value,
      commission_amount: calc.commission_amount,
      status: "pending",
      metadata,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ conversion_id: conv.id, commission_amount: calc.commission_amount }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
