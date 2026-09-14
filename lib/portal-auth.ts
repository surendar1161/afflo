import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireAffiliateAuth(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!affiliate) return { error: NextResponse.json({ error: "Not an affiliate account" }, { status: 403 }) };

  return { user, affiliate, supabase };
}
