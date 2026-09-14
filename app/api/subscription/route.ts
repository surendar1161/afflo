import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";

const PLAN_LIMITS = {
  trial:    { affiliates: 10,  programs: 2  },
  starter:  { affiliates: 50,  programs: 5  },
  growth:   { affiliates: 500, programs: 20 },
  scale:    { affiliates: -1,  programs: -1 },  // -1 = unlimited
};

export async function GET(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;

    const [orgRes, affRes, progRes] = await Promise.all([
      supabase.from("organizations").select("*").eq("id", orgId).single(),
      supabase.from("affiliates").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
      supabase.from("programs").select("id", { count: "exact", head: true }).eq("organization_id", orgId).neq("status", "closed"),
    ]);

    const org    = orgRes.data;
    const plan   = (org?.plan || "trial") as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.trial;

    return NextResponse.json({
      plan:             org?.plan || "trial",
      plan_period:      org?.plan_period || "monthly",
      trial_ends_at:    org?.trial_ends_at,
      subscription_end: org?.subscription_end,
      usage: {
        affiliates: { used: affRes.count  || 0, limit: limits.affiliates },
        programs:   { used: progRes.count || 0, limit: limits.programs   },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
