-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 008: Medium Impact Features
--   1. Coupon/discount codes for affiliates
--   2. Email sequence scheduling
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. COUPON CODES ───────────────────────────────────────────────────────
-- Discount codes assigned to affiliates. When a customer uses the code,
-- the conversion is attributed to that affiliate.
CREATE TABLE IF NOT EXISTS coupon_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id      UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,

  code            TEXT NOT NULL,                  -- e.g. "JOHN20", "SAVE15"
  discount_type   TEXT NOT NULL DEFAULT 'percentage'
                  CHECK (discount_type IN ('percentage','fixed')),
  discount_value  NUMERIC(10,2) NOT NULL DEFAULT 10,
  currency        TEXT DEFAULT 'USD',

  -- Limits
  usage_limit     INTEGER,                        -- NULL = unlimited
  usage_count     INTEGER DEFAULT 0,
  min_order_value NUMERIC(12,2) DEFAULT 0,

  -- Validity
  is_active       BOOLEAN DEFAULT TRUE,
  expires_at      TIMESTAMPTZ,

  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (organization_id, code)
);

CREATE OR REPLACE TRIGGER trg_coupons_updated
  BEFORE UPDATE ON coupon_codes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_org"       ON coupon_codes FOR ALL USING (organization_id IN (SELECT my_organizations()));
CREATE POLICY "coupons_affiliate" ON coupon_codes FOR SELECT USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND auth_user_id = auth.uid())
);
CREATE POLICY "coupons_public_validate" ON coupon_codes FOR SELECT USING (is_active = TRUE);

CREATE INDEX IF NOT EXISTS idx_coupons_org       ON coupon_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code      ON coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupons_affiliate ON coupon_codes(affiliate_id);

-- ── 2. EMAIL SEQUENCE SCHEDULES ───────────────────────────────────────────
-- Scheduled emails for affiliate onboarding sequences.
-- A background job calls /api/emails/process to send pending emails.
CREATE TABLE IF NOT EXISTS email_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  program_id      UUID REFERENCES programs(id) ON DELETE CASCADE,

  email_type      TEXT NOT NULL,                  -- 'welcome_d3' | 'welcome_d7' | 'digest'
  recipient_email TEXT NOT NULL,
  recipient_name  TEXT,

  scheduled_at    TIMESTAMPTZ NOT NULL,
  sent_at         TIMESTAMPTZ,
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','sent','failed','skipped')),
  error           TEXT,

  metadata        JSONB DEFAULT '{}',             -- extra data for email template
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_schedules_org" ON email_schedules FOR ALL USING (organization_id IN (SELECT my_organizations()));
CREATE POLICY "email_schedules_service" ON email_schedules FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_email_schedules_status     ON email_schedules(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_schedules_affiliate  ON email_schedules(affiliate_id);

-- ── 3. Function: schedule welcome sequence for new affiliate ──────────────
CREATE OR REPLACE FUNCTION schedule_affiliate_welcome_sequence(
  p_affiliate_id    UUID,
  p_org_id          UUID,
  p_program_id      UUID,
  p_email           TEXT,
  p_name            TEXT,
  p_metadata        JSONB DEFAULT '{}'
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Day 3: Tips for promoting the program
  INSERT INTO email_schedules (organization_id, affiliate_id, program_id, email_type, recipient_email, recipient_name, scheduled_at, metadata)
  VALUES (p_org_id, p_affiliate_id, p_program_id, 'welcome_d3', p_email, p_name, NOW() + INTERVAL '3 days', p_metadata)
  ON CONFLICT DO NOTHING;

  -- Day 7: Performance check-in with stats
  INSERT INTO email_schedules (organization_id, affiliate_id, program_id, email_type, recipient_email, recipient_name, scheduled_at, metadata)
  VALUES (p_org_id, p_affiliate_id, p_program_id, 'welcome_d7', p_email, p_name, NOW() + INTERVAL '7 days', p_metadata)
  ON CONFLICT DO NOTHING;
END;
$$;

-- ── 4. pg_cron setup (run in Supabase SQL Editor after enabling pg_cron) ──
-- This sends the weekly performance digest every Monday at 9 AM UTC:
--
-- SELECT cron.schedule(
--   'weekly-affiliate-digest',
--   '0 9 * * 1',
--   $$SELECT net.http_post(
--     url := current_setting('app.api_url') || '/api/emails/digest',
--     headers := jsonb_build_object('x-cron-secret', current_setting('app.cron_secret')),
--     body := '{}'::jsonb
--   )$$
-- );
--
-- And process scheduled emails every hour:
-- SELECT cron.schedule(
--   'process-email-queue',
--   '0 * * * *',
--   $$SELECT net.http_post(
--     url := current_setting('app.api_url') || '/api/emails/process',
--     headers := jsonb_build_object('x-cron-secret', current_setting('app.cron_secret')),
--     body := '{}'::jsonb
--   )$$
-- );
