import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";
import QRCode from "qrcode";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;
    const { id } = await params;

    const { data: link } = await supabase
      .from("tracking_links").select("short_code,destination_url")
      .eq("id", id).eq("organization_id", orgId).single();

    if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });

    const appUrl      = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
    const trackingUrl = `${appUrl}/r/${link.short_code}`;
    const size        = parseInt(new URL(req.url).searchParams.get("size") || "256");

    // Generate QR as base64 PNG data URL — fully self-contained, no external service
    const dataUrl = await QRCode.toDataURL(trackingUrl, {
      width:          size,
      margin:         2,
      color: {
        dark:  "#12344d",   // Freshworks dark text
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });

    return NextResponse.json({ qr_url: dataUrl, tracking_url: trackingUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
