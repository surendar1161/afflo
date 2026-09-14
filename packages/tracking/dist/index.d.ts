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
interface FAConfig {
    orgId: string;
    host: string;
}
interface TrackPayload {
    revenue: number;
    orderId?: string;
    currency?: string;
    email?: string;
    [key: string]: unknown;
}
declare function init(config: FAConfig): void;
export { init as initFA };
export type { FAConfig, TrackPayload };
