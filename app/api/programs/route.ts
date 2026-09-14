import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabase.from("programs").select("*").eq("organization_id", orgId).order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ programs: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, user, supabase } = auth;

    const body = await req.json();
    const { name, description, website, category, default_commission_type, default_commission_value,
            cookie_duration_days, payout_frequency, min_payout_amount, currency,
            portal_primary_color, is_public } = body;

    if (!name) return NextResponse.json({ error: "Program name is required" }, { status: 400 });

    // Generate unique slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").trim() + "-" + Date.now().toString(36);

    const { data, error } = await supabase.from("programs").insert({
      organization_id:          orgId,
      user_id:                  user.id,
      name, description, website, category,
      default_commission_type:  default_commission_type  || "percentage",
      default_commission_value: default_commission_value || 10,
      cookie_duration_days:     cookie_duration_days     || 30,
      payout_frequency:         payout_frequency         || "monthly",
      min_payout_amount:        min_payout_amount        || 50,
      currency:                 currency                 || "USD",
      portal_primary_color:     portal_primary_color     || "#6366f1",
      is_public:                is_public                ?? true,
      public_slug:              slug,
      status:                   "active",
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ program: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
