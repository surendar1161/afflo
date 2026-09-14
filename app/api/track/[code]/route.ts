import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Public endpoint — no auth required — handles affiliate link clicks
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const supabase = createAdminClient();

    // Find active tracking link
    const { data: link } = await supabase
      .from("tracking_links")
      .select("id,program_id,affiliate_id,organization_id,destination_url,expires_at")
      .eq("short_code", code).eq("is_active", true).single();

    if (!link) return NextResponse.redirect(new URL("/", req.url));

    // Check expiry
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Parse request info
    const ua         = req.headers.get("user-agent") || "";
    const ip         = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
    const referrer   = req.headers.get("referer") || null;
    const sessionId  = req.cookies.get(`aff_${link.affiliate_id}`)?.value || crypto.randomUUID();

    // Simple device detection
    const deviceType = /mobile|android|iphone|ipad/i.test(ua) ? "mobile"
                     : /tablet|ipad/i.test(ua)                ? "tablet"
                     : "desktop";

    // Record click (fire & forget — don't block redirect)
    supabase.from("clicks").insert({
      link_id:         link.id,
      program_id:      link.program_id,
      affiliate_id:    link.affiliate_id,
      organization_id: link.organization_id,
      ip_address:      ip,
      user_agent:      ua,
      referrer,
      device_type:     deviceType,
      session_id:      sessionId,
      fraud_score:     0, // real scoring would happen async
    }).then(() => {});

    // Build redirect URL with UTM params
    const dest = new URL(link.destination_url);
    dest.searchParams.set("utm_source", "freshaffiliates");
    dest.searchParams.set("utm_medium", "affiliate");
    dest.searchParams.set("ref", code);

    const response = NextResponse.redirect(dest.toString(), { status: 302 });

    // Set affiliate cookie for attribution (30-day default)
    response.cookies.set(`aff_${link.affiliate_id}`, sessionId, {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }
}
