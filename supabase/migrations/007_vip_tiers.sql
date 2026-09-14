-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 007: VIP Tier System
-- Tiers are calculated per affiliate based on total approved revenue.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Tier definitions table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_tiers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id       UUID REFERENCES programs(id) ON DELETE CASCADE, -- NULL = applies to all programs
  name             TEXT NOT NULL,                 -- 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  min_revenue      NUMERIC(12,2) NOT NULL DEFAULT 0,
  color            TEXT NOT NULL DEFAULT '#CD7F32',
  icon             TEXT NOT NULL DEFAULT '🥉',
  benefits         TEXT[] DEFAULT '{}',           -- ['Priority support', 'Higher commissions']
  commission_bonus NUMERIC(5,2) DEFAULT 0,        -- extra % on top of base commission
  position         INTEGER DEFAULT 0,             -- display order
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE affiliate_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tiers_org" ON affiliate_tiers FOR ALL USING (organization_id IN (SELECT my_organizations()));

CREATE INDEX IF NOT EXISTS idx_tiers_org     ON affiliate_tiers(organization_id);
CREATE INDEX IF NOT EXISTS idx_tiers_program ON affiliate_tiers(program_id);

-- ── Affiliate tier progress (cached, recalculated on conversion approval) ─
CREATE TABLE IF NOT EXISTS affiliate_tier_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id      UUID REFERENCES programs(id) ON DELETE SET NULL,
  current_tier_id UUID REFERENCES affiliate_tiers(id) ON DELETE SET NULL,
  tier_name       TEXT,
  tier_color      TEXT,
  tier_icon       TEXT,
  total_revenue   NUMERIC(12,2) DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (affiliate_id, organization_id)
);

ALTER TABLE affiliate_tier_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tier_progress_org"       ON affiliate_tier_progress FOR SELECT USING (organization_id IN (SELECT my_organizations()));
CREATE POLICY "tier_progress_affiliate" ON affiliate_tier_progress FOR SELECT USING (EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND auth_user_id = auth.uid()));
CREATE POLICY "tier_progress_service"   ON affiliate_tier_progress FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_tier_progress_affiliate ON affiliate_tier_progress(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_tier_progress_org       ON affiliate_tier_progress(organization_id);

-- ── Seed default tiers for existing organizations ─────────────────────────
INSERT INTO affiliate_tiers (organization_id, name, min_revenue, color, icon, benefits, commission_bonus, position)
SELECT
  id,
  tier.name,
  tier.min_revenue,
  tier.color,
  tier.icon,
  tier.benefits,
  tier.commission_bonus,
  tier.position
FROM organizations
CROSS JOIN (VALUES
  ('Bronze',   0,      '#CD7F32', '🥉', ARRAY['Basic support','Monthly newsletter'], 0,   1),
  ('Silver',   1000,   '#C0C0C0', '🥈', ARRAY['Priority support','Featured in marketplace'], 1, 2),
  ('Gold',     5000,   '#FFD700', '🥇', ARRAY['Dedicated manager','Exclusive bonuses','Co-marketing'], 2, 3),
  ('Platinum', 20000,  '#A0E8F0', '💎', ARRAY['All Gold perks','Custom commission rates','VIP events'], 3, 4)
) AS tier(name, min_revenue, color, icon, benefits, commission_bonus, position)
ON CONFLICT DO NOTHING;

-- ── Function: recalculate affiliate tier ─────────────────────────────────
CREATE OR REPLACE FUNCTION recalculate_affiliate_tier(p_affiliate_id UUID, p_org_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total_revenue    NUMERIC := 0;
  v_total_conversions INTEGER := 0;
  v_tier             affiliate_tiers%ROWTYPE;
BEGIN
  -- Calculate total approved revenue for this affiliate in this org
  SELECT
    COALESCE(SUM(revenue), 0),
    COUNT(*)
  INTO v_total_revenue, v_total_conversions
  FROM conversions
  WHERE affiliate_id = p_affiliate_id
    AND organization_id = p_org_id
    AND status IN ('approved', 'paid');

  -- Find highest matching tier
  SELECT * INTO v_tier
  FROM affiliate_tiers
  WHERE organization_id = p_org_id
    AND min_revenue <= v_total_revenue
  ORDER BY min_revenue DESC
  LIMIT 1;

  -- Upsert progress record
  INSERT INTO affiliate_tier_progress (
    affiliate_id, organization_id, current_tier_id,
    tier_name, tier_color, tier_icon,
    total_revenue, total_conversions, updated_at
  ) VALUES (
    p_affiliate_id, p_org_id, v_tier.id,
    v_tier.name, v_tier.color, v_tier.icon,
    v_total_revenue, v_total_conversions, NOW()
  )
  ON CONFLICT (affiliate_id, organization_id) DO UPDATE SET
    current_tier_id   = EXCLUDED.current_tier_id,
    tier_name         = EXCLUDED.tier_name,
    tier_color        = EXCLUDED.tier_color,
    tier_icon         = EXCLUDED.tier_icon,
    total_revenue     = EXCLUDED.total_revenue,
    total_conversions = EXCLUDED.total_conversions,
    updated_at        = NOW();
END;
$$;

-- ── Trigger: recalculate tier when conversion status changes ──────────────
CREATE OR REPLACE FUNCTION trigger_recalculate_tier()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Only recalculate when status changes to/from approved or paid
  IF NEW.status IN ('approved','paid') OR OLD.status IN ('approved','paid') THEN
    PERFORM recalculate_affiliate_tier(NEW.affiliate_id, NEW.organization_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tier_on_conversion ON conversions;
CREATE TRIGGER trg_tier_on_conversion
  AFTER UPDATE ON conversions
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION trigger_recalculate_tier();
