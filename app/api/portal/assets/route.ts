import { NextRequest, NextResponse } from "next/server";
import { requireAffiliateAuth } from "@/lib/portal-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAffiliateAuth(req);
    if ("error" in auth) return auth.error;
    const { affiliate, supabase } = auth;

    // Get programs affiliate belongs to
    const { data: memberships } = await supabase
      .from("program_memberships")
      .select("program_id")
      .eq("affiliate_id", affiliate.id)
      .eq("status", "active");

    const programIds = (memberships || []).map(m => m.program_id);
    if (!programIds.length) return NextResponse.json({ assets: [] });

    const { data } = await supabase
      .from("creatives")
      .select("*, program:programs(name)")
      .in("program_id", programIds)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    // Increment download count on GET (simplified)
    return NextResponse.json({ assets: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
