import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api-auth";
import { sendEmail, emailCommissionApproved } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOrgAuth(req);
    if ("error" in auth) return auth.error;
    const { orgId, member, supabase } = auth;
    if (!member.can_approve_conversions) return NextResponse.json({ error: "No permission to approve conversions" }, { status: 403 });
    const { id } = await params;
    const { action, rejected_reason } = await req.json();

    if (!["approve","reject"].includes(action))
      return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });

    const updates: Record<string, unknown> = {
      status:          action === "approve" ? "approved" : "rejected",
      approved_at:     action === "approve" ? new Date().toISOString() : null,
      rejected_reason: action === "reject"  ? rejected_reason : null,
    };

    const { data, error } = await supabase.from("conversions")
      .update(updates).eq("id", id).eq("organization_id", orgId)
      .select("*, affiliate:affiliates(email,full_name), program:programs(name,currency)")
      .single();
    if (error) throw error;

    // ── Send commission approved email & recalculate tier ─────────────────
    if (action === "approve" && data.affiliate?.email) {
      const adminSupabase = createAdminClient();

      // Get org name
      const { data: org } = await adminSupabase.from("organizations").select("name").eq("id", orgId).single();

      // Get affiliate's total earned from this org (for email context)
      const { data: totals } = await adminSupabase
        .from("conversions")
        .select("commission_amount")
        .eq("affiliate_id", data.affiliate_id)
        .eq("organization_id", orgId)
        .in("status", ["approved","paid"]);

      const totalEarned = (totals || []).reduce((s: number, c: any) => s + (c.commission_amount || 0), 0);

      // Send email (non-blocking)
      const emailData = emailCommissionApproved({
        affiliateName:    data.affiliate.full_name || data.affiliate.email,
        programName:      data.program?.name       || "Affiliate Program",
        orgName:          org?.name                || "Your program",
        revenue:          data.revenue             || 0,
        commissionAmount: data.commission_amount   || 0,
        currency:         data.program?.currency   || "USD",
        totalEarned,
        portalUrl:        `${APP_URL}/portal/dashboard`,
      });
      sendEmail({ to: data.affiliate.email, ...emailData }).catch(console.error);

      // Recalculate affiliate tier (non-blocking, fire & forget)
      void adminSupabase.rpc("recalculate_affiliate_tier", {
        p_affiliate_id: data.affiliate_id,
        p_org_id:       orgId,
      });
    }

    return NextResponse.json({ conversion: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
