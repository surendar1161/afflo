import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Public endpoint — no auth required. Used by merchant checkout to validate a coupon code.
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(req.url);
    const organization_id = searchParams.get("org");

    if (!code || !organization_id)
      return NextResponse.json({ error: "code and org query param are required" }, { status: 400 });

    const adminSupabase = createAdminClient();

    const { data: coupon, error } = await adminSupabase
      .from("coupon_codes")
      .select("id,code,discount_type,discount_value,currency,usage_limit,usage_count,min_order_value,is_active,expires_at,affiliate_id,program_id")
      .eq("code", code.toUpperCase().trim())
      .eq("organization_id", organization_id)
      .single();

    if (error || !coupon)
      return NextResponse.json({ valid: false, error: "Coupon not found" }, { status: 404 });

    if (!coupon.is_active)
      return NextResponse.json({ valid: false, error: "Coupon is inactive" });

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
      return NextResponse.json({ valid: false, error: "Coupon has expired" });

    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit)
      return NextResponse.json({ valid: false, error: "Coupon usage limit reached" });

    return NextResponse.json({
      valid:          true,
      code:           coupon.code,
      discount_type:  coupon.discount_type,
      discount_value: coupon.discount_value,
      currency:       coupon.currency,
      min_order_value: coupon.min_order_value,
      affiliate_id:   coupon.affiliate_id,
      program_id:     coupon.program_id,
      uses_remaining: coupon.usage_limit !== null ? coupon.usage_limit - coupon.usage_count : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Increment usage count when a coupon is applied
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const { organization_id } = await req.json();

    if (!organization_id)
      return NextResponse.json({ error: "organization_id is required" }, { status: 400 });

    const adminSupabase = createAdminClient();

    const { data: coupon } = await adminSupabase
      .from("coupon_codes")
      .select("id,usage_count,usage_limit,is_active,expires_at")
      .eq("code", code.toUpperCase().trim())
      .eq("organization_id", organization_id)
      .single();

    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    if (!coupon.is_active) return NextResponse.json({ error: "Coupon is inactive" }, { status: 400 });
    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit)
      return NextResponse.json({ error: "Usage limit reached" }, { status: 400 });

    const { data, error } = await adminSupabase
      .from("coupon_codes")
      .update({ usage_count: coupon.usage_count + 1 })
      .eq("id", coupon.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, usage_count: data.usage_count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
