import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const { searchParams } = new URL(req.url);
    const program_id   = searchParams.get("program_id");
    const affiliate_id = searchParams.get("affiliate_id");

    let query = supabase
      .from("coupon_codes")
      .select("*, affiliate:affiliates(full_name,email), program:programs(name)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (program_id)   query = query.eq("program_id", program_id);
    if (affiliate_id) query = query.eq("affiliate_id", affiliate_id);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ coupons: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;

    const {
      program_id, affiliate_id, code,
      discount_type = "percentage", discount_value = 10,
      currency = "USD", usage_limit, min_order_value, expires_at, notes,
    } = await req.json();

    if (!program_id || !affiliate_id || !code)
      return NextResponse.json({ error: "program_id, affiliate_id, and code are required" }, { status: 400 });

    const { data, error } = await supabase
      .from("coupon_codes")
      .insert({
        organization_id: orgId,
        program_id, affiliate_id,
        code: code.toUpperCase().trim(),
        discount_type, discount_value,
        currency, usage_limit: usage_limit || null,
        min_order_value: min_order_value || 0,
        expires_at: expires_at || null,
        notes: notes || null,
      })
      .select("*, affiliate:affiliates(full_name,email), program:programs(name)")
      .single();

    if (error) {
      if (error.code === "23505")
        return NextResponse.json({ error: `Coupon code "${code.toUpperCase()}" already exists for this organization` }, { status: 409 });
      throw error;
    }

    return NextResponse.json({ coupon: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("coupon_codes")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ coupon: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { error } = await supabase
      .from("coupon_codes")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
