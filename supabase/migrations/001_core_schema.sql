-- ═══════════════════════════════════════════════════════════════════════════
-- Afflo — Affiliate Management Platform
-- Migration 001: Core Schema
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Utility function ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

-- ── 1. PROFILES ──────────────────────────────────────────────────────────────
-- Extends auth.users. One row per brand/merchant account.
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT,
  company_name      TEXT,
  company_logo_url  TEXT,
  website           TEXT,
  plan              TEXT NOT NULL DEFAULT 'trial'
                    CHECK (plan IN ('trial','starter','growth','scale')),
  plan_period       TEXT DEFAULT 'monthly' CHECK (plan_period IN ('monthly','yearly')),
  trial_ends_at     TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  stripe_customer_id TEXT UNIQUE,
  subscription_id   TEXT UNIQUE,
  subscription_end  TIMESTAMPTZ,
  timezone          TEXT DEFAULT 'UTC',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, company_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'company_name'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 2. PROGRAMS ──────────────────────────────────────────────────────────────
-- An affiliate program created by a brand/merchant.
CREATE TABLE IF NOT EXISTS programs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  name                TEXT NOT NULL,
  description         TEXT,
  logo_url            TEXT,
  website             TEXT,
  category            TEXT,                    -- ecommerce | saas | creator | finance | health | other

  -- Public program page (for affiliate recruitment)
  is_public           BOOLEAN DEFAULT TRUE,
  public_slug         TEXT UNIQUE,             -- app.afflo.com/join/{slug}

  -- Commission defaults (can be overridden by commission_rules)
  default_commission_type  TEXT DEFAULT 'percentage'
                           CHECK (default_commission_type IN ('percentage','flat','tiered','recurring')),
  default_commission_value NUMERIC(10,4) DEFAULT 10,   -- % or $ amount
  cookie_duration_days     INTEGER DEFAULT 30,

  -- Payout settings
  payout_frequency    TEXT DEFAULT 'monthly'
                      CHECK (payout_frequency IN ('instant','weekly','biweekly','monthly')),
  min_payout_amount   NUMERIC(10,2) DEFAULT 50,
  currency            TEXT DEFAULT 'USD',

  -- Portal white-label
  portal_domain       TEXT UNIQUE,             -- custom domain e.g. affiliates.yoursite.com
  portal_primary_color TEXT DEFAULT '#7c3aed',
  portal_logo_url     TEXT,

  status              TEXT DEFAULT 'active' CHECK (status IN ('draft','active','paused','closed')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_programs_updated
  BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_programs_user   ON programs(user_id);
CREATE INDEX IF NOT EXISTS idx_programs_slug   ON programs(public_slug);

-- ── 3. AFFILIATES ─────────────────────────────────────────────────────────────
-- Affiliate accounts. Separate from brand accounts (profiles).
CREATE TABLE IF NOT EXISTS affiliates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  full_name       TEXT,
  username        TEXT UNIQUE,
  avatar_url      TEXT,
  website         TEXT,
  social_links    JSONB DEFAULT '{}',          -- { twitter, instagram, youtube, tiktok }
  niche           TEXT[],                      -- ['tech','finance','lifestyle']
  country_code    TEXT,
  audience_size   INTEGER,
  bio             TEXT,
  -- Auth (affiliates have their own Supabase auth account)
  auth_user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Marketplace profile
  is_marketplace_listed BOOLEAN DEFAULT FALSE,
  marketplace_rating    NUMERIC(3,2) DEFAULT 0,
  marketplace_reviews   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_affiliates_updated
  BEFORE UPDATE ON affiliates FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON affiliates(email);

-- ── 4. PROGRAM MEMBERSHIPS ────────────────────────────────────────────────────
-- Many-to-many: affiliates enrolled in programs.
CREATE TABLE IF NOT EXISTS program_memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,

  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','active','suspended','rejected')),

  -- Custom commission override for this affiliate (null = use program default)
  commission_type  TEXT CHECK (commission_type IN ('percentage','flat','tiered','recurring')),
  commission_value NUMERIC(10,4),

  -- Tier / level for multi-tier programs
  tier            INTEGER DEFAULT 1,           -- 1 = direct, 2 = sub-affiliate
  referred_by     UUID REFERENCES affiliates(id) ON DELETE SET NULL,

  invite_token    TEXT UNIQUE DEFAULT replace(gen_random_uuid()::TEXT, '-', ''),
  invited_at      TIMESTAMPTZ,
  approved_at     TIMESTAMPTZ,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (program_id, affiliate_id)
);

CREATE OR REPLACE TRIGGER trg_memberships_updated
  BEFORE UPDATE ON program_memberships FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_memberships_program   ON program_memberships(program_id);
CREATE INDEX IF NOT EXISTS idx_memberships_affiliate ON program_memberships(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_memberships_token     ON program_memberships(invite_token);

-- ── 5. TRACKING LINKS ─────────────────────────────────────────────────────────
-- Unique affiliate tracking links.
CREATE TABLE IF NOT EXISTS tracking_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  membership_id   UUID REFERENCES program_memberships(id) ON DELETE CASCADE,

  -- Link config
  short_code      TEXT NOT NULL UNIQUE,        -- the unique part of the URL e.g. /r/abc123
  destination_url TEXT NOT NULL,               -- where to redirect
  name            TEXT,                        -- "Blog post - May 2026"
  utm_source      TEXT,
  utm_medium      TEXT DEFAULT 'affiliate',
  utm_campaign    TEXT,

  -- Stats (denormalised for performance)
  click_count     BIGINT DEFAULT 0,
  unique_clicks   BIGINT DEFAULT 0,
  conversion_count BIGINT DEFAULT 0,

  is_active       BOOLEAN DEFAULT TRUE,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_links_updated
  BEFORE UPDATE ON tracking_links FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_links_short_code  ON tracking_links(short_code);
CREATE INDEX IF NOT EXISTS idx_links_affiliate   ON tracking_links(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_links_program     ON tracking_links(program_id);

-- ── 6. CLICKS ────────────────────────────────────────────────────────────────
-- Every click on a tracking link.
CREATE TABLE IF NOT EXISTS clicks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id         UUID NOT NULL REFERENCES tracking_links(id) ON DELETE CASCADE,
  program_id      UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,

  -- Attribution
  ip_address      TEXT,
  user_agent      TEXT,
  referrer        TEXT,
  country_code    TEXT,
  device_type     TEXT CHECK (device_type IN ('desktop','mobile','tablet','unknown')),
  browser         TEXT,
  os              TEXT,

  -- Fraud scoring (AI)
  fraud_score     NUMERIC(5,2) DEFAULT 0,      -- 0–100, higher = more suspicious
  is_flagged      BOOLEAN DEFAULT FALSE,
  fraud_reason    TEXT,

  -- Session linkage
  session_id      TEXT,                        -- for cookie-less tracking
  converted       BOOLEAN DEFAULT FALSE,       -- true once conversion recorded

  clicked_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clicks_link      ON clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_affiliate ON clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_clicks_at        ON clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_session   ON clicks(session_id);

-- ── 7. CONVERSIONS ───────────────────────────────────────────────────────────
-- Tracked conversion events (sales, signups, leads, etc.)
CREATE TABLE IF NOT EXISTS conversions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  link_id         UUID REFERENCES tracking_links(id) ON DELETE SET NULL,
  click_id        UUID REFERENCES clicks(id) ON DELETE SET NULL,

  -- Conversion details
  event_type      TEXT DEFAULT 'sale'
                  CHECK (event_type IN ('sale','lead','signup','subscription','custom')),
  order_id        TEXT,                        -- merchant's order/transaction ID
  revenue         NUMERIC(12,2) DEFAULT 0,     -- gross sale value
  currency        TEXT DEFAULT 'USD',

  -- Commission calc
  commission_type  TEXT,
  commission_value NUMERIC(10,4),
  commission_amount NUMERIC(12,2) DEFAULT 0,   -- final commission owed

  -- Status
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','paid','refunded','chargedback')),
  approved_at     TIMESTAMPTZ,
  rejected_reason TEXT,

  -- Fraud
  fraud_score     NUMERIC(5,2) DEFAULT 0,
  is_flagged      BOOLEAN DEFAULT FALSE,

  -- Metadata
  metadata        JSONB DEFAULT '{}',          -- product_id, plan_name, etc.
  customer_email  TEXT,                        -- hashed or tokenized
  ip_address      TEXT,

  converted_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_conversions_updated
  BEFORE UPDATE ON conversions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_conversions_program   ON conversions(program_id);
CREATE INDEX IF NOT EXISTS idx_conversions_affiliate ON conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_conversions_status    ON conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_at        ON conversions(converted_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_order     ON conversions(order_id);

-- ── 8. COMMISSION RULES ───────────────────────────────────────────────────────
-- Flexible commission rule engine. Rules evaluated in priority order.
CREATE TABLE IF NOT EXISTS commission_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,

  name            TEXT NOT NULL,
  priority        INTEGER DEFAULT 0,           -- higher = evaluated first

  -- Conditions (all must match)
  condition_type  TEXT CHECK (condition_type IN ('product','geo','tier','revenue_range','affiliate_tag','all')),
  condition_value JSONB DEFAULT '{}',          -- { "product_ids": ["p1","p2"] } or { "countries": ["US","UK"] }

  -- Commission to apply when rule matches
  commission_type  TEXT NOT NULL CHECK (commission_type IN ('percentage','flat','tiered','recurring')),
  commission_value NUMERIC(10,4) NOT NULL,
  tiered_config    JSONB,                      -- [{ min: 0, max: 1000, rate: 5 }, { min: 1000, rate: 8 }]

  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_commission_rules_updated
  BEFORE UPDATE ON commission_rules FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_commission_rules_program ON commission_rules(program_id, priority DESC);

-- ── 9. PAYOUTS ────────────────────────────────────────────────────────────────
-- Payout records. One payout = one payment to one affiliate.
CREATE TABLE IF NOT EXISTS payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,

  amount          NUMERIC(12,2) NOT NULL,
  currency        TEXT DEFAULT 'USD',
  fee             NUMERIC(10,2) DEFAULT 0,     -- payment processor fee
  net_amount      NUMERIC(12,2) GENERATED ALWAYS AS (amount - fee) STORED,

  method          TEXT NOT NULL
                  CHECK (method IN ('paypal','bank_transfer','stripe','usdc','usdt','check')),
  method_details  JSONB DEFAULT '{}',          -- { paypal_email: "...", bank_account: "..." }

  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','paid','failed','cancelled')),

  -- Stripe payout reference
  stripe_transfer_id TEXT UNIQUE,
  failure_reason  TEXT,

  period_start    DATE,
  period_end      DATE,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_payouts_updated
  BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_payouts_affiliate ON payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_payouts_program   ON payouts(program_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status    ON payouts(status);

-- ── 10. PAYOUT ITEMS ──────────────────────────────────────────────────────────
-- Which conversions are included in a payout.
CREATE TABLE IF NOT EXISTS payout_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id     UUID NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
  conversion_id UUID NOT NULL REFERENCES conversions(id) ON DELETE CASCADE,
  amount        NUMERIC(12,2) NOT NULL,
  UNIQUE (payout_id, conversion_id)
);

CREATE INDEX IF NOT EXISTS idx_payout_items_payout     ON payout_items(payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_conversion ON payout_items(conversion_id);

-- ── 11. PAYOUT METHODS ────────────────────────────────────────────────────────
-- Affiliate's preferred payout methods.
CREATE TABLE IF NOT EXISTS payout_methods (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id  UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  method        TEXT NOT NULL CHECK (method IN ('paypal','bank_transfer','stripe','usdc','usdt')),
  is_default    BOOLEAN DEFAULT FALSE,
  details       JSONB NOT NULL DEFAULT '{}',   -- encrypted payment details
  verified      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_methods_affiliate ON payout_methods(affiliate_id);

-- ── 12. CREATIVES ─────────────────────────────────────────────────────────────
-- Marketing assets provided to affiliates (banners, copy, videos).
CREATE TABLE IF NOT EXISTS creatives (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id    UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('banner','text','video','email','social_post','landing_page')),
  file_url      TEXT,
  content       TEXT,                          -- for text/email/copy assets
  width         INTEGER,
  height        INTEGER,
  file_size     BIGINT,
  mime_type     TEXT,
  tags          TEXT[] DEFAULT '{}',
  download_count INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creatives_program ON creatives(program_id);

-- ── 13. FRAUD FLAGS ───────────────────────────────────────────────────────────
-- AI fraud detection flags on clicks and conversions.
CREATE TABLE IF NOT EXISTS fraud_flags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  affiliate_id    UUID REFERENCES affiliates(id) ON DELETE SET NULL,
  click_id        UUID REFERENCES clicks(id) ON DELETE SET NULL,
  conversion_id   UUID REFERENCES conversions(id) ON DELETE SET NULL,

  flag_type       TEXT NOT NULL
                  CHECK (flag_type IN ('click_fraud','self_referral','ip_cluster','velocity','bot','fake_conversion','suspicious_ip')),
  severity        TEXT DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  fraud_score     NUMERIC(5,2),
  description     TEXT,
  details         JSONB DEFAULT '{}',

  status          TEXT DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed','actioned')),
  reviewed_at     TIMESTAMPTZ,
  actioned_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_program   ON fraud_flags(program_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_affiliate ON fraud_flags(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_status    ON fraud_flags(status);

-- ── 14. WEBHOOKS ─────────────────────────────────────────────────────────────
-- Merchant webhook endpoints.
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  secret          TEXT NOT NULL,               -- HMAC signing secret
  events          TEXT[] NOT NULL,             -- ['conversion.created','payout.paid']
  is_active       BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  failure_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_program ON webhook_endpoints(program_id);

-- ── 15. API KEYS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  key_prefix  TEXT NOT NULL,                   -- first 8 chars shown to user
  key_hash    TEXT NOT NULL UNIQUE,            -- bcrypt hash of full key
  scopes      TEXT[] DEFAULT '{}',             -- ['read:conversions','write:payouts']
  last_used_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

-- ── 16. NOTIFICATIONS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                   -- 'new_affiliate','conversion','payout_sent','fraud_alert'
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user      ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_affiliate ON notifications(affiliate_id, is_read);

-- ── 17. MARKETPLACE PROGRAMS ──────────────────────────────────────────────────
-- Public program listings in the affiliate discovery marketplace.
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id          UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE UNIQUE,
  featured            BOOLEAN DEFAULT FALSE,
  category_tags       TEXT[],
  avg_commission      TEXT,                    -- "5-15%" shown to affiliates
  avg_epc             NUMERIC(8,2),            -- earnings per click
  conversion_rate     NUMERIC(5,2),            -- %
  approval_type       TEXT DEFAULT 'auto' CHECK (approval_type IN ('auto','manual')),
  affiliate_count     INTEGER DEFAULT 0,
  total_paid_out      NUMERIC(14,2) DEFAULT 0,
  listed_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_featured ON marketplace_listings(featured, listed_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_listings USING GIN(category_tags);
