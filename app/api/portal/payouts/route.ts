import { NextRequest, NextResponse } from "next/server";
import { requireAffiliateAuth } from "@/lib/portal-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAffiliateAuth(req);
    if ("error" in auth) return auth.error;
    const { affiliate, supabase } = auth;

    const { data } = await supabase
      .from("payouts")
      .select("*, program:programs(name)")
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false });

    const total  = (data || []).reduce((s, p) => s + p.amount, 0);
    const paid   = (data || []).filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
    const pending = (data || []).filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);

    return NextResponse.json({ payouts: data || [], stats: { total, paid, pending } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
