-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 002: Row-Level Security Policies
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_links     ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_methods     ENABLE ROW LEVEL SECURITY;
ALTER TABLE creatives          ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_flags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints  ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ─────────────────────────────────────────────────────────────────
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- ── PROGRAMS ─────────────────────────────────────────────────────────────────
CREATE POLICY "programs_own"    ON programs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "programs_public" ON programs FOR SELECT USING (is_public = TRUE AND status = 'active');

-- ── AFFILIATES ────────────────────────────────────────────────────────────────
-- Brands can view affiliates in their programs; affiliates manage their own profile
CREATE POLICY "affiliates_own"   ON affiliates FOR ALL USING (auth.uid() = auth_user_id);
CREATE POLICY "affiliates_brand_read" ON affiliates FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM program_memberships pm
    JOIN programs p ON p.id = pm.program_id
    WHERE pm.affiliate_id = affiliates.id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "affiliates_marketplace" ON affiliates FOR SELECT USING (is_marketplace_listed = TRUE);

-- ── PROGRAM MEMBERSHIPS ───────────────────────────────────────────────────────
CREATE POLICY "memberships_brand" ON program_memberships FOR ALL USING (
  EXISTS (SELECT 1 FROM programs WHERE id = program_id AND user_id = auth.uid())
);
CREATE POLICY "memberships_affiliate" ON program_memberships FOR SELECT USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND auth_user_id = auth.uid())
);

-- ── TRACKING LINKS ────────────────────────────────────────────────────────────
CREATE POLICY "links_brand" ON tracking_links FOR ALL USING (
  EXISTS (SELECT 1 FROM programs WHERE id = program_id AND user_id = auth.uid())
);
CREATE POLICY "links_affiliate" ON tracking_links FOR SELECT USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND auth_user_id = auth.uid())
);

-- ── CLICKS ───────────────────────────────────────────────────────────────────
CREATE POLICY "clicks_brand" ON clicks FOR SELECT USING (
  EXISTS (SELECT 1 FROM programs WHERE id = program_id AND user_id = auth.uid())
);
CREATE POLICY "clicks_affiliate" ON clicks FOR SELECT USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND auth_user_id = auth.uid())
);
CREATE POLICY "clicks_insert_public" ON clicks FOR INSERT WITH CHECK (TRUE);

-- ── CONVERSIONS ───────────────────────────────────────────────────────────────
CREATE POLICY "conversions_brand" ON conversions FOR ALL USING (
  EXISTS (SELECT 1 FROM programs WHERE id = program_id AND user_id = auth.uid())
);
CREATE POLICY "conversions_affiliate" ON conversions FOR SELECT USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND auth_user_id = auth.uid())
);
CREATE POLICY "conversions_insert_service" ON conversions FOR INSERT WITH CHECK (TRUE);

-- ── COMMISSION RULES ──────────────────────────────────────────────────────────
CREATE POLICY "commission_rules_own" ON commission_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM programs WHERE id = program_id AND user_id = auth.uid())
);

-- ── PAYOUTS ──────────────────────────────────────────────────────────────────
CREATE POLICY "payouts_brand" ON payouts FOR ALL USING (
  EXISTS (SELECT 1 FROM programs WHERE id = program_id AND user_id = auth.uid())
);
CREATE POLICY "payouts_affiliate" ON payouts FOR SELECT USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND auth_user_id = auth.uid())
);

-- ── PAYOUT ITEMS ─────────────────────────────────────────────────────────────
CREATE POLICY "payout_items_own" ON payout_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM payouts WHERE id = payout_id AND (
    EXISTS (SELECT 1 FROM programs WHERE id = payouts.program_id AND user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM affiliates WHERE id = payouts.affiliate_id AND auth_user_id = auth.uid())
  ))
);

-- ── PAYOUT METHODS ────────────────────────────────────────────────────────────
CREATE POLICY "payout_methods_own" ON payout_methods FOR ALL USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND auth_user_id = auth.uid())
);

-- ── CREATIVES ─────────────────────────────────────────────────────────────────
CREATE POLICY "creatives_brand" ON creatives FOR ALL USING (
  EXISTS (SELECT 1 FROM programs WHERE id = program_id AND user_id = auth.uid())
);
CREATE POLICY "creatives_affiliate_read" ON creatives FOR SELECT USING (
  is_active = TRUE AND EXISTS (
    SELECT 1 FROM program_memberships pm
    JOIN affiliates a ON a.id = pm.affiliate_id
    WHERE pm.program_id = creatives.program_id AND a.auth_user_id = auth.uid() AND pm.status = 'active'
  )
);

-- ── FRAUD FLAGS ───────────────────────────────────────────────────────────────
CREATE POLICY "fraud_flags_brand" ON fraud_flags FOR ALL USING (
  EXISTS (SELECT 1 FROM programs WHERE id = program_id AND user_id = auth.uid())
);

-- ── WEBHOOKS ─────────────────────────────────────────────────────────────────
CREATE POLICY "webhooks_own" ON webhook_endpoints FOR ALL USING (
  EXISTS (SELECT 1 FROM programs WHERE id = program_id AND user_id = auth.uid())
);

-- ── API KEYS ─────────────────────────────────────────────────────────────────
CREATE POLICY "api_keys_own" ON api_keys FOR ALL USING (auth.uid() = user_id);

-- ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
CREATE POLICY "notifications_user"      ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notifications_affiliate" ON notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND auth_user_id = auth.uid())
);

-- ── MARKETPLACE ───────────────────────────────────────────────────────────────
CREATE POLICY "marketplace_public_read" ON marketplace_listings FOR SELECT USING (TRUE);
CREATE POLICY "marketplace_brand_write" ON marketplace_listings FOR ALL USING (
  EXISTS (SELECT 1 FROM programs WHERE id = program_id AND user_id = auth.uid())
);
