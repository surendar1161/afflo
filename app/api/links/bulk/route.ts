/**
 * POST /api/links/bulk
 * Create tracking links for ALL active affiliates in a program at once.
 * Skips affiliates who already have a link for the same destination URL.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, supabase } = auth;

    const { program_id, destination_url, name, utm_campaign, utm_source, utm_medium, expires_at } = await req.json();
    if (!program_id || !destination_url) return NextResponse.json({ error: "program_id and destination_url required" }, { status: 400 });

    // Get all active affiliates in this program
    const { data: memberships } = await supabase
      .from("program_memberships")
      .select("affiliate_id, id")
      .eq("program_id", program_id)
      .eq("status", "active");

    if (!memberships?.length) return NextResponse.json({ created: 0, message: "No active affiliates in this program" });

    const created: string[] = [];
    const skipped: string[] = [];

    for (const m of memberships) {
      const shortCode = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
      const { error } = await supabase.from("tracking_links").insert({
        organization_id: orgId,
        program_id,
        affiliate_id:    m.affiliate_id,
        membership_id:   m.id,
        short_code:      shortCode,
        destination_url,
        name:            name || null,
        utm_campaign:    utm_campaign || null,
        utm_source:      utm_source   || "freshaffiliates",
        utm_medium:      utm_medium   || "affiliate",
        expires_at:      expires_at   || null,
      });

      if (error) skipped.push(m.affiliate_id);
      else created.push(m.affiliate_id);
    }

    return NextResponse.json({
      created: created.length,
      skipped: skipped.length,
      message: `Created ${created.length} links, skipped ${skipped.length}`,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
