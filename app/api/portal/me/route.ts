import { NextRequest, NextResponse } from "next/server";
import { requireAffiliateAuth } from "@/lib/portal-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAffiliateAuth(req);
    if ("error" in auth) return auth.error;
    const { affiliate, supabase } = auth;

    const { data: memberships } = await supabase
      .from("program_memberships")
      .select("*, program:programs(id,name,portal_primary_color,portal_logo_url,currency,default_commission_type,default_commission_value)")
      .eq("affiliate_id", affiliate.id)
      .eq("status", "active");

    return NextResponse.json({ affiliate, memberships: memberships || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
