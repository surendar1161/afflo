/**
 * Email utility — uses Resend API (https://resend.com)
 * Set RESEND_API_KEY in .env.local to enable real emails.
 * Falls back to console.log in development if key not set.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL     = process.env.EMAIL_FROM || "FreshAffiliates <noreply@freshaffiliates.com>";
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";

interface EmailPayload {
  to:      string;
  subject: string;
  html:    string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY || RESEND_API_KEY === "re_placeholder") {
    console.log(`[Email DEV] To: ${payload.to} | Subject: ${payload.subject}`);
    return { ok: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: payload.to, subject: payload.subject, html: payload.html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[Email] Resend error:", err);
      return { ok: false, error: err };
    }
    return { ok: true };
  } catch (err: any) {
    console.error("[Email] Send failed:", err.message);
    return { ok: false, error: err.message };
  }
}

// ── Shared email wrapper style ─────────────────────────────────────────────
const wrap = (content: string, accentColor = "#4C82F7") => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>FreshAffiliates</title></head>
<body style="margin:0;padding:0;background:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#1e1e1e;border-radius:12px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:520px;width:100%;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,${accentColor},${accentColor}cc);padding:28px 32px;">
          <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">⚡ FreshAffiliates</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;">Affiliate Management Platform</div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${content}</td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <div style="font-size:12px;color:#525252;">You received this because you're enrolled in an affiliate program on FreshAffiliates.</div>
          <div style="font-size:12px;color:#525252;margin-top:4px;"><a href="${APP_URL}/portal/sign-in" style="color:#4C82F7;">Access your portal</a> · <a href="${APP_URL}" style="color:#525252;">FreshAffiliates</a></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

// ── Email Templates ────────────────────────────────────────────────────────

export function emailWelcomeAffiliate(opts: {
  affiliateName: string; email: string; programName: string; orgName: string;
  trackingUrl: string; portalUrl: string; commissionDesc: string;
}) {
  const content = `
    <h2 style="color:#f0f0f0;font-size:22px;font-weight:800;margin:0 0 8px;letter-spacing:-0.5px;">Welcome to ${opts.programName}! 🎉</h2>
    <p style="color:#a0a0a0;font-size:15px;line-height:1.6;margin:0 0 24px;">Hi ${opts.affiliateName}, you've been accepted as an affiliate for <strong style="color:#f0f0f0;">${opts.orgName}</strong>. Here's everything you need to get started.</p>

    <div style="background:#111111;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:20px;margin-bottom:24px;">
      <div style="font-size:11px;color:#6e6e6e;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Your tracking link</div>
      <div style="font-family:monospace;font-size:14px;color:#4C82F7;word-break:break-all;">${opts.trackingUrl}</div>
      <div style="font-size:12px;color:#525252;margin-top:8px;">Share this link — every click is tracked and commissions are credited automatically.</div>
    </div>

    <div style="background:#111111;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:20px;margin-bottom:28px;">
      <div style="font-size:11px;color:#6e6e6e;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Your commission</div>
      <div style="font-size:20px;font-weight:800;color:#00C48C;">${opts.commissionDesc}</div>
      <div style="font-size:12px;color:#525252;margin-top:4px;">Earned on every approved conversion you drive.</div>
    </div>

    <a href="${opts.portalUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#4C82F7,#2C5CC5);color:#fff;font-size:15px;font-weight:700;padding:14px;border-radius:8px;text-decoration:none;margin-bottom:16px;">
      Access your affiliate portal →
    </a>
    <div style="text-align:center;font-size:12px;color:#525252;">Track clicks, conversions, earnings, and payouts all in one place.</div>`;

  return { subject: `Welcome to ${opts.programName} — your affiliate link is ready`, html: wrap(content, "#4C82F7") };
}

export function emailCommissionApproved(opts: {
  affiliateName: string; programName: string; orgName: string;
  revenue: number; commissionAmount: number; currency: string;
  totalEarned: number; portalUrl: string;
}) {
  const content = `
    <h2 style="color:#f0f0f0;font-size:22px;font-weight:800;margin:0 0 8px;letter-spacing:-0.5px;">Commission approved! 💸</h2>
    <p style="color:#a0a0a0;font-size:15px;line-height:1.6;margin:0 0 24px;">Great news, ${opts.affiliateName}! A commission from <strong style="color:#f0f0f0;">${opts.orgName}</strong> has been approved.</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
      <div style="background:#111111;border:1px solid rgba(0,196,140,0.2);border-radius:8px;padding:18px;text-align:center;">
        <div style="font-size:11px;color:#6e6e6e;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">You earned</div>
        <div style="font-size:28px;font-weight:900;color:#00C48C;">${opts.currency} ${opts.commissionAmount.toFixed(2)}</div>
      </div>
      <div style="background:#111111;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:18px;text-align:center;">
        <div style="font-size:11px;color:#6e6e6e;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Sale value</div>
        <div style="font-size:28px;font-weight:900;color:#f0f0f0;">${opts.currency} ${opts.revenue.toFixed(2)}</div>
      </div>
    </div>

    <div style="background:#111111;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:16px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#6e6e6e;font-size:13px;">Total earned from ${opts.programName}</span>
        <span style="color:#4C82F7;font-weight:700;font-size:15px;">${opts.currency} ${opts.totalEarned.toFixed(2)}</span>
      </div>
    </div>

    <a href="${opts.portalUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#00C48C,#059669);color:#fff;font-size:15px;font-weight:700;padding:14px;border-radius:8px;text-decoration:none;">
      View your earnings →
    </a>`;

  return { subject: `✅ Commission approved: ${opts.currency} ${opts.commissionAmount.toFixed(2)} from ${opts.orgName}`, html: wrap(content, "#00C48C") };
}

export function emailPayoutSent(opts: {
  affiliateName: string; orgName: string;
  amount: number; currency: string; method: string;
  portalUrl: string; totalPaid: number;
}) {
  const content = `
    <h2 style="color:#f0f0f0;font-size:22px;font-weight:800;margin:0 0 8px;letter-spacing:-0.5px;">Payment sent! 🎉</h2>
    <p style="color:#a0a0a0;font-size:15px;line-height:1.6;margin:0 0 24px;">Hi ${opts.affiliateName}, your payout from <strong style="color:#f0f0f0;">${opts.orgName}</strong> has been processed.</p>

    <div style="background:#111111;border:2px solid rgba(0,196,140,0.3);border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
      <div style="font-size:13px;color:#6e6e6e;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Amount paid</div>
      <div style="font-size:42px;font-weight:900;color:#00C48C;letter-spacing:-1.5px;">${opts.currency} ${opts.amount.toFixed(2)}</div>
      <div style="font-size:13px;color:#6e6e6e;margin-top:8px;">via ${opts.method.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</div>
    </div>

    <div style="background:#111111;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:16px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#6e6e6e;font-size:13px;">Total paid out to date</span>
        <span style="color:#f0f0f0;font-weight:700;font-size:15px;">${opts.currency} ${opts.totalPaid.toFixed(2)}</span>
      </div>
    </div>

    <a href="${opts.portalUrl}/payouts" style="display:block;text-align:center;background:linear-gradient(135deg,#4C82F7,#2C5CC5);color:#fff;font-size:15px;font-weight:700;padding:14px;border-radius:8px;text-decoration:none;">
      View payout history →
    </a>`;

  return { subject: `💰 Payment of ${opts.currency} ${opts.amount.toFixed(2)} sent from ${opts.orgName}`, html: wrap(content, "#00C48C") };
}

export function emailTierUpgrade(opts: {
  affiliateName: string; programName: string; orgName: string;
  oldTier: string; newTier: string; tierColor: string;
  totalRevenue: number; currency: string; portalUrl: string;
  nextTierName?: string; nextTierRevenue?: number;
}) {
  const content = `
    <h2 style="color:#f0f0f0;font-size:22px;font-weight:800;margin:0 0 8px;letter-spacing:-0.5px;">You've levelled up! 🏆</h2>
    <p style="color:#a0a0a0;font-size:15px;line-height:1.6;margin:0 0 24px;">Congratulations ${opts.affiliateName}! Your performance in <strong style="color:#f0f0f0;">${opts.programName}</strong> has earned you a tier upgrade.</p>

    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#111111;border:2px solid ${opts.tierColor};border-radius:16px;padding:28px 48px;">
        <div style="font-size:13px;color:#6e6e6e;margin-bottom:8px;">${opts.oldTier} → </div>
        <div style="font-size:32px;font-weight:900;color:${opts.tierColor};">${opts.newTier}</div>
        <div style="font-size:12px;color:#6e6e6e;margin-top:8px;">Total revenue: ${opts.currency} ${opts.totalRevenue.toFixed(0)}</div>
      </div>
    </div>

    ${opts.nextTierName ? `
    <div style="background:#111111;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:16px;margin-bottom:24px;">
      <div style="font-size:12px;color:#6e6e6e;margin-bottom:6px;">Next tier: ${opts.nextTierName}</div>
      <div style="background:rgba(255,255,255,0.06);border-radius:4px;height:6px;overflow:hidden;">
        <div style="background:${opts.tierColor};height:100%;width:${Math.min(100, (opts.totalRevenue / opts.nextTierRevenue!) * 100).toFixed(0)}%;border-radius:4px;"></div>
      </div>
      <div style="font-size:12px;color:#525252;margin-top:6px;">${opts.currency} ${(opts.nextTierRevenue! - opts.totalRevenue).toFixed(0)} more to reach ${opts.nextTierName}</div>
    </div>` : `<div style="background:rgba(255,198,57,0.08);border:1px solid rgba(255,198,57,0.2);border-radius:8px;padding:14px;margin-bottom:24px;text-align:center;"><span style="color:#FFC639;font-size:14px;font-weight:600;">🏆 You've reached the highest tier! Maximum earning potential unlocked.</span></div>`}

    <a href="${opts.portalUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,${opts.tierColor},${opts.tierColor}cc);color:#fff;font-size:15px;font-weight:700;padding:14px;border-radius:8px;text-decoration:none;">
      View your portal →
    </a>`;

  return { subject: `🏆 You've reached ${opts.newTier} tier in ${opts.programName}!`, html: wrap(content, opts.tierColor) };
}

// ── Day 3 onboarding ──────────────────────────────────────────────────────
export function emailWelcomeDay3(opts: {
  affiliateName: string; programName: string; orgName: string;
  trackingUrl: string; portalUrl: string;
}) {
  const content = `
    <h2 style="color:#f0f0f0;font-size:22px;font-weight:800;margin:0 0 8px;">3 days in — tips to maximise your earnings 🚀</h2>
    <p style="color:#a0a0a0;font-size:15px;line-height:1.6;margin:0 0 24px;">Hi ${opts.affiliateName}! You joined <strong style="color:#f0f0f0;">${opts.programName}</strong> 3 days ago. Here are proven ways to drive your first conversions.</p>

    ${[
      { n:"1", title:"Share your link everywhere", desc:"Add it to your bio, blog posts, email signature, YouTube description, and social profiles. The more touchpoints, the more clicks." },
      { n:"2", title:"Write a genuine review", desc:"Content that converts best is honest and specific. Share your experience with the product — what problem it solves and who it's for." },
      { n:"3", title:"Use the creative assets", desc:"Your portal has banners, email copy, and social post templates — all ready to use. Check the Assets tab." },
    ].map(tip => `
      <div style="background:#111111;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:16px;margin-bottom:12px;display:flex;gap:14px;align-items:flex-start;">
        <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#4C82F7,#2C5CC5);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#fff;flex-shrink:0;">${tip.n}</div>
        <div><div style="font-size:14px;font-weight:700;color:#f0f0f0;margin-bottom:4px;">${tip.title}</div><div style="font-size:13px;color:#6e6e6e;line-height:1.5;">${tip.desc}</div></div>
      </div>`).join("")}

    <a href="${opts.portalUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#4C82F7,#2C5CC5);color:#fff;font-size:15px;font-weight:700;padding:14px;border-radius:8px;text-decoration:none;margin-top:20px;">
      Open your portal →
    </a>`;
  return { subject: `3 tips to get your first commissions from ${opts.programName}`, html: wrap(content, "#4C82F7") };
}

// ── Day 7 check-in ────────────────────────────────────────────────────────
export function emailWelcomeDay7(opts: {
  affiliateName: string; programName: string; orgName: string;
  clicks: number; conversions: number; earned: number; currency: string;
  trackingUrl: string; portalUrl: string;
}) {
  const hasActivity = opts.clicks > 0;
  const content = `
    <h2 style="color:#f0f0f0;font-size:22px;font-weight:800;margin:0 0 8px;">Your first week with ${opts.programName} 📊</h2>
    <p style="color:#a0a0a0;font-size:15px;line-height:1.6;margin:0 0 20px;">Hi ${opts.affiliateName}! Here's how your first 7 days looked.</p>

    <div style="display:flex;gap:10px;margin-bottom:24px;">
      ${[
        { label:"Clicks",      value: String(opts.clicks),      color:"#4C82F7" },
        { label:"Conversions", value: String(opts.conversions), color:"#00C48C" },
        { label:"Earned",      value:`${opts.currency} ${opts.earned.toFixed(2)}`, color:"#FFC639" },
      ].map(k => `
        <div style="flex:1;background:#111111;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:10px;color:#6e6e6e;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${k.label}</div>
          <div style="font-size:22px;font-weight:900;color:${k.color};">${k.value}</div>
        </div>`).join("")}
    </div>

    ${hasActivity
      ? `<div style="background:rgba(0,196,140,0.08);border:1px solid rgba(0,196,140,0.2);border-radius:8px;padding:14px;margin-bottom:20px;"><p style="color:#6ee7b7;font-size:14px;margin:0;">Great start! Keep sharing your link consistently — affiliate income compounds over time. 🎯</p></div>`
      : `<div style="background:rgba(76,130,247,0.08);border:1px solid rgba(76,130,247,0.2);border-radius:8px;padding:14px;margin-bottom:20px;"><p style="color:#93c5fd;font-size:14px;margin:0;">No activity yet — that's totally normal. Try sharing your link in a new channel this week. Even one post can make a difference.</p></div>`}

    <a href="${opts.portalUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#4C82F7,#2C5CC5);color:#fff;font-size:15px;font-weight:700;padding:14px;border-radius:8px;text-decoration:none;">
      View your full stats →
    </a>`;
  return { subject: `Your week 1 recap: ${opts.clicks} clicks, ${opts.currency} ${opts.earned.toFixed(2)} earned`, html: wrap(content, "#4C82F7") };
}

// ── Weekly performance digest ─────────────────────────────────────────────
export function emailWeeklyDigest(opts: {
  affiliateName: string; programName: string; orgName: string;
  weekClicks: number; weekConversions: number; weekEarned: number;
  totalEarned: number; currency: string;
  changeClicks: number; changeConversions: number;
  tier: string; tierIcon: string; tierColor: string;
  portalUrl: string;
}) {
  const up = (v: number) => v >= 0 ? `+${v}` : `${v}`;
  const content = `
    <h2 style="color:#f0f0f0;font-size:22px;font-weight:800;margin:0 0 4px;">Weekly performance digest</h2>
    <p style="color:#6e6e6e;font-size:13px;margin:0 0 24px;">${opts.programName} · Week ending ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</p>

    <div style="display:flex;gap:10px;margin-bottom:20px;">
      ${[
        { label:"Clicks this week",   value:String(opts.weekClicks),                       change:opts.changeClicks,       color:"#4C82F7" },
        { label:"Conversions",        value:String(opts.weekConversions),                  change:opts.changeConversions,  color:"#00C48C" },
        { label:"Earned this week",   value:`${opts.currency} ${opts.weekEarned.toFixed(2)}`, change:null,               color:"#FFC639" },
      ].map(k => `
        <div style="flex:1;background:#111111;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:10px;color:#6e6e6e;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${k.label}</div>
          <div style="font-size:20px;font-weight:900;color:${k.color};margin-bottom:4px;">${k.value}</div>
          ${k.change !== null ? `<div style="font-size:11px;color:${k.change >= 0?"#00C48C":"#FC5858"};">${up(k.change)} vs last week</div>` : ""}
        </div>`).join("")}
    </div>

    <div style="background:#111111;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
      <div><div style="font-size:11px;color:#6e6e6e;margin-bottom:4px;">Your tier</div><div style="font-size:16px;font-weight:700;color:${opts.tierColor};">${opts.tierIcon} ${opts.tier}</div></div>
      <div style="text-align:right;"><div style="font-size:11px;color:#6e6e6e;margin-bottom:4px;">All-time earned</div><div style="font-size:16px;font-weight:700;color:#f0f0f0;">${opts.currency} ${opts.totalEarned.toFixed(2)}</div></div>
    </div>

    <a href="${opts.portalUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#4C82F7,#2C5CC5);color:#fff;font-size:15px;font-weight:700;padding:14px;border-radius:8px;text-decoration:none;">
      View full analytics →
    </a>`;
  return { subject: `📊 Your weekly recap: ${opts.currency} ${opts.weekEarned.toFixed(2)} earned this week`, html: wrap(content, "#4C82F7") };
}
