import { NextRequest, NextResponse } from "next/server";
import { requireAffiliateAuth } from "@/lib/portal-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAffiliateAuth(req);
    if ("error" in auth) return auth.error;
    const { affiliate, supabase } = auth;

    const { data } = await supabase
      .from("tracking_links")
      .select("*, program:programs(id,name,website,portal_primary_color)")
      .eq("affiliate_id", affiliate.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
    const links = (data || []).map(l => ({
      ...l,
      tracking_url: `${appUrl}/r/${l.short_code}`,
    }));

    return NextResponse.json({ links });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
