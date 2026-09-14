import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";

const CHARGEBEE_SITE    = process.env.CHARGEBEE_SITE    || "";
const CHARGEBEE_API_KEY = process.env.CHARGEBEE_API_KEY || "";
const APP_URL           = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";

// Map plan+period → exact Chargebee item price ID
const PRICE_ID: Record<string, string> = {
  "starter-monthly": process.env.CHARGEBEE_STARTER_MONTHLY || "freshaffiliates-starter-monthly",
  "starter-annual":  process.env.CHARGEBEE_STARTER_ANNUAL  || "freshaffiliates-starter-annual",
  "growth-monthly":  process.env.CHARGEBEE_GROWTH_MONTHLY  || "freshaffiliates-growth-monthly",
  "growth-annual":   process.env.CHARGEBEE_GROWTH_ANNUAL   || "freshaffiliates-growth-annual",
  "scale-monthly":   process.env.CHARGEBEE_SCALE_MONTHLY   || "freshaffiliates-scale-monthly",
  "scale-annual":    process.env.CHARGEBEE_SCALE_ANNUAL    || "freshaffiliates-scale-annual",
};

export async function POST(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, user } = auth;
    const { plan, period } = await req.json();

    if (!CHARGEBEE_SITE || !CHARGEBEE_API_KEY) {
      return NextResponse.json(
        { error: "Billing not configured. Set CHARGEBEE_SITE and CHARGEBEE_API_KEY." },
        { status: 503 }
      );
    }

    const key    = `${plan}-${period === "yearly" ? "annual" : "monthly"}`;
    const planId = PRICE_ID[key];
    if (!planId) return NextResponse.json({ error: `Unknown plan: ${plan} / ${period}` }, { status: 400 });

    const res = await fetch(
      `https://${CHARGEBEE_SITE}.chargebee.com/api/v2/hosted_pages/checkout_new_for_items`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${CHARGEBEE_API_KEY}:`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          "subscription_items[item_price_id][0]": planId,
          "customer[email]": user.email || "",
          "customer[cf_org_id]":               orgId,
          "redirect_url":                       `${APP_URL}/dashboard/subscription?success=1`,
          "cancel_url":                         `${APP_URL}/dashboard/subscription`,
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Chargebee error");

    return NextResponse.json({ url: data.hosted_page?.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
