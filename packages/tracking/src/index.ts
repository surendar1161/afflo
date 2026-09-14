/**
 * FreshAffiliates Tracking Pixel
 *
 * Merchants embed this script on their website to attribute
 * purchases back to the affiliate who referred the customer.
 *
 * Usage (CDN):
 *   <script src="https://your-domain.com/fa.min.js"
 *           data-org="YOUR_PROGRAM_ID"
 *           data-host="https://your-domain.com"></script>
 *
 * Usage (npm):
 *   import { initFA } from "@freshaffiliates/track";
 *   initFA({ orgId: "YOUR_PROGRAM_ID", host: "https://your-domain.com" });
 *   // then on purchase:
 *   window.FA.track("purchase", { revenue: 99.00, orderId: "ord_xyz", currency: "USD" });
 */

const STORAGE_KEY = "_fa_ref";
const COOKIE_DAYS = 30;
const SCRIPT_ID   = "__freshaffiliates__";

interface FAConfig {
  orgId: string;
  host:  string;   // e.g. "https://app.freshaffiliates.com"
}

interface TrackPayload {
  revenue:   number;
  orderId?:  string;
  currency?: string;
  email?:    string;
  [key: string]: unknown;
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ── Ref code persistence ──────────────────────────────────────────────────────

function saveRef(code: string): void {
  try { localStorage.setItem(STORAGE_KEY, code); } catch { /* private mode */ }
  setCookie(STORAGE_KEY, code, COOKIE_DAYS);
}

function loadRef(): string | null {
  try {
    const ls = localStorage.getItem(STORAGE_KEY);
    if (ls) return ls;
  } catch { /* ignore */ }
  return getCookie(STORAGE_KEY);
}

function clearRef(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  document.cookie = `${STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// ── Core init ─────────────────────────────────────────────────────────────────

function init(config: FAConfig): void {
  const params  = new URLSearchParams(window.location.search);
  const refCode = params.get("ref") || params.get("fa_ref");

  if (refCode) {
    saveRef(refCode);
    navigator.sendBeacon(
      `${config.host}/api/pixel`,
      JSON.stringify({ event: "click", org_id: config.orgId, ref_code: refCode, url: location.href, referrer: document.referrer })
    );
  }

  (window as any).FA = {
    track(event: string, payload: TrackPayload): void {
      const refCode = loadRef();
      if (!refCode) return;

      const body = JSON.stringify({
        event,
        org_id:   config.orgId,
        ref_code: refCode,
        url:      location.href,
        ...payload,
      });

      const endpoint = `${config.host}/api/pixel`;
      const sent = navigator.sendBeacon?.(endpoint, body);
      if (!sent) {
        fetch(endpoint, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => { /* non-critical */ });
      }

      if (event === "purchase" || event === "sale") {
        clearRef();
      }
    },

    refresh(): void { init(config); },
  };
}

// ── Auto-init from script tag attributes ─────────────────────────────────────

function autoInit(): void {
  const script = (
    document.currentScript ||
    document.getElementById(SCRIPT_ID) ||
    document.querySelector("script[data-org]")
  ) as HTMLScriptElement | null;

  if (!script) return;

  const orgId = script.getAttribute("data-org");
  const host  = script.getAttribute("data-host") || "https://app.freshaffiliates.com";

  if (!orgId) {
    console.warn("[FreshAffiliates] Missing data-org attribute on script tag.");
    return;
  }

  init({ orgId, host });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  autoInit();
}

export { init as initFA };
export type { FAConfig, TrackPayload };
