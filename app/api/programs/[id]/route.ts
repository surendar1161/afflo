import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const { id } = await params;

    const { data, error } = await supabase.from("programs").select("*").eq("id", id).eq("organization_id", orgId).single();
    if (error || !data) return NextResponse.json({ error: "Program not found" }, { status: 404 });
    return NextResponse.json({ program: data });
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

    const allowed = ["name","description","website","category","default_commission_type","default_commission_value",
                     "cookie_duration_days","payout_frequency","min_payout_amount","currency",
                     "portal_primary_color","portal_logo_url","is_public","status"];
    const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

    const { data, error } = await supabase.from("programs").update(updates).eq("id", id).eq("organization_id", orgId).select().single();
    if (error) throw error;
    return NextResponse.json({ program: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, member, supabase } = auth;
    if (!["owner","admin"].includes(member.role)) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    const { id } = await params;

    await supabase.from("programs").update({ status: "closed" }).eq("id", id).eq("organization_id", orgId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
