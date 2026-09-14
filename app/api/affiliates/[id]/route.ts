import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const { id } = await params;

    const { data, error } = await supabase
      .from("affiliates")
      .select("*, memberships:program_memberships(*, program:programs(name,status)), links:tracking_links(id,short_code,click_count,conversion_count,created_at)")
      .eq("id", id).eq("organization_id", orgId).single();

    if (error || !data) return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    return NextResponse.json({ affiliate: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const { id } = await params;
    const body = await req.json();

    // Update affiliate
    if (body.full_name || body.email || body.bio || body.website || body.niche) {
      const allowed = ["full_name","email","bio","website","niche","country_code","audience_size","social_links"];
      const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
      await supabase.from("affiliates").update(updates).eq("id", id).eq("organization_id", orgId);
    }

    // Update membership status if provided
    if (body.program_id && body.membership_status) {
      await supabase.from("program_memberships")
        .update({ status: body.membership_status })
        .eq("affiliate_id", id).eq("program_id", body.program_id);
    }

    const { data } = await supabase.from("affiliates").select("*").eq("id", id).single();
    return NextResponse.json({ affiliate: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const { id } = await params;

    // Suspend all memberships
    await supabase.from("program_memberships").update({ status: "suspended" }).eq("affiliate_id", id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
