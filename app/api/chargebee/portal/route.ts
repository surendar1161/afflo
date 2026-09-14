import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";

const CHARGEBEE_SITE    = process.env.CHARGEBEE_SITE    || "";
const CHARGEBEE_API_KEY = process.env.CHARGEBEE_API_KEY || "";
const APP_URL           = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { user } = auth;

    if (!CHARGEBEE_SITE || !CHARGEBEE_API_KEY) {
      return NextResponse.json(
        { error: "Billing not configured. Set CHARGEBEE_SITE and CHARGEBEE_API_KEY." },
        { status: 503 }
      );
    }

    const res = await fetch(
      `https://${CHARGEBEE_SITE}.chargebee.com/api/v2/portal_sessions`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${CHARGEBEE_API_KEY}:`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          "customer[id]":   user.email || "",
          "redirect_url":   `${APP_URL}/dashboard/subscription`,
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Chargebee error");

    return NextResponse.json({ url: data.portal_session?.access_url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
