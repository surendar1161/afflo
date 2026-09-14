import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;

    const [orgRes, memberRes] = await Promise.all([
      supabase.from("organizations").select("*").eq("id", orgId).single(),
      supabase.from("organization_members").select("*").eq("organization_id", orgId).neq("status","removed"),
    ]);

    return NextResponse.json({ organization: orgRes.data, members: memberRes.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, member, supabase } = auth;
    if (!member.can_manage_billing && !["owner","admin"].includes(member.role))
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const body = await req.json();
    const allowed = ["name","website","industry","timezone","default_currency","portal_domain","logo_url"];
    const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

    const { data, error } = await supabase.from("organizations").update(updates).eq("id", orgId).select().single();
    if (error) throw error;
    return NextResponse.json({ organization: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
