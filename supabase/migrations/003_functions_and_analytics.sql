-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 003: Analytics Functions, Materialized Views & Helpers
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Program analytics summary ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_program_stats(p_program_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_clicks        BIGINT,
  unique_clicks       BIGINT,
  total_conversions   BIGINT,
  total_revenue       NUMERIC,
  total_commissions   NUMERIC,
  conversion_rate     NUMERIC,
  avg_order_value     NUMERIC,
  epc                 NUMERIC,    -- earnings per click
  active_affiliates   BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    COUNT(DISTINCT c.id)                                    AS total_clicks,
    COUNT(DISTINCT c.session_id)                            AS unique_clicks,
    COUNT(DISTINCT cv.id) FILTER (WHERE cv.status = 'approved' OR cv.status = 'paid') AS total_conversions,
    COALESCE(SUM(cv.revenue) FILTER (WHERE cv.status IN ('approved','paid')), 0) AS total_revenue,
    COALESCE(SUM(cv.commission_amount) FILTER (WHERE cv.status IN ('approved','paid')), 0) AS total_commissions,
    CASE WHEN COUNT(c.id) > 0
         THEN ROUND((COUNT(cv.id)::NUMERIC / COUNT(c.id)) * 100, 2)
         ELSE 0 END                                         AS conversion_rate,
    CASE WHEN COUNT(cv.id) > 0
         THEN ROUND(SUM(cv.revenue) / COUNT(cv.id), 2)
         ELSE 0 END                                         AS avg_order_value,
    CASE WHEN COUNT(c.id) > 0
         THEN ROUND(SUM(cv.commission_amount) / COUNT(c.id), 4)
         ELSE 0 END                                         AS epc,
    COUNT(DISTINCT pm.affiliate_id) FILTER (WHERE pm.status = 'active') AS active_affiliates
  FROM programs p
  LEFT JOIN clicks c ON c.program_id = p.id AND c.clicked_at >= NOW() - (p_days || ' days')::INTERVAL
  LEFT JOIN conversions cv ON cv.program_id = p.id AND cv.converted_at >= NOW() - (p_days || ' days')::INTERVAL
  LEFT JOIN program_memberships pm ON pm.program_id = p.id
  WHERE p.id = p_program_id;
$$;

-- ── Affiliate performance for a program ──────────────────────────────────────
CREATE OR REPLACE FUNCTION get_affiliate_performance(p_program_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  affiliate_id        UUID,
  affiliate_name      TEXT,
  affiliate_email     TEXT,
  clicks              BIGINT,
  conversions         BIGINT,
  revenue             NUMERIC,
  commission          NUMERIC,
  conversion_rate     NUMERIC,
  epc                 NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    a.id,
    a.full_name,
    a.email,
    COUNT(DISTINCT c.id)                                     AS clicks,
    COUNT(DISTINCT cv.id) FILTER (WHERE cv.status IN ('approved','paid')) AS conversions,
    COALESCE(SUM(cv.revenue) FILTER (WHERE cv.status IN ('approved','paid')), 0) AS revenue,
    COALESCE(SUM(cv.commission_amount) FILTER (WHERE cv.status IN ('approved','paid')), 0) AS commission,
    CASE WHEN COUNT(c.id) > 0 THEN ROUND((COUNT(cv.id)::NUMERIC / COUNT(c.id)) * 100, 2) ELSE 0 END AS conversion_rate,
    CASE WHEN COUNT(c.id) > 0 THEN ROUND(COALESCE(SUM(cv.commission_amount),0) / COUNT(c.id), 4) ELSE 0 END AS epc
  FROM program_memberships pm
  JOIN affiliates a ON a.id = pm.affiliate_id
  LEFT JOIN tracking_links tl ON tl.affiliate_id = a.id AND tl.program_id = p_program_id
  LEFT JOIN clicks c ON c.link_id = tl.id AND c.clicked_at >= NOW() - (p_days || ' days')::INTERVAL
  LEFT JOIN conversions cv ON cv.affiliate_id = a.id AND cv.program_id = p_program_id AND cv.converted_at >= NOW() - (p_days || ' days')::INTERVAL
  WHERE pm.program_id = p_program_id AND pm.status = 'active'
  GROUP BY a.id, a.full_name, a.email
  ORDER BY commission DESC;
$$;

-- ── Apply commission rule to a conversion ────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_commission(
  p_program_id UUID,
  p_affiliate_id UUID,
  p_revenue NUMERIC,
  p_event_type TEXT DEFAULT 'sale'
) RETURNS TABLE (commission_type TEXT, commission_value NUMERIC, commission_amount NUMERIC)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_rule commission_rules%ROWTYPE;
  v_membership program_memberships%ROWTYPE;
  v_program programs%ROWTYPE;
BEGIN
  -- Check membership override first
  SELECT * INTO v_membership FROM program_memberships
    WHERE program_id = p_program_id AND affiliate_id = p_affiliate_id LIMIT 1;

  IF v_membership.commission_type IS NOT NULL THEN
    commission_type  := v_membership.commission_type;
    commission_value := v_membership.commission_value;
  ELSE
    -- Check commission rules (highest priority first)
    SELECT * INTO v_rule FROM commission_rules
      WHERE program_id = p_program_id AND is_active = TRUE
      ORDER BY priority DESC LIMIT 1;

    IF v_rule.id IS NOT NULL THEN
      commission_type  := v_rule.commission_type;
      commission_value := v_rule.commission_value;
    ELSE
      -- Fall back to program default
      SELECT * INTO v_program FROM programs WHERE id = p_program_id;
      commission_type  := v_program.default_commission_type;
      commission_value := v_program.default_commission_value;
    END IF;
  END IF;

  -- Calculate amount
  commission_amount := CASE commission_type
    WHEN 'percentage' THEN ROUND(p_revenue * (commission_value / 100), 2)
    WHEN 'flat'       THEN commission_value
    ELSE ROUND(p_revenue * (commission_value / 100), 2)
  END;

  RETURN NEXT;
END; $$;

-- ── Update click + link stats on new click ───────────────────────────────────
CREATE OR REPLACE FUNCTION increment_link_clicks()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE tracking_links
  SET click_count = click_count + 1
  WHERE id = NEW.link_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_increment_clicks
  AFTER INSERT ON clicks
  FOR EACH ROW EXECUTE FUNCTION increment_link_clicks();

-- ── Update link conversion count on approved conversion ──────────────────────
CREATE OR REPLACE FUNCTION increment_link_conversions()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IN ('approved','paid') AND (OLD.status IS NULL OR OLD.status NOT IN ('approved','paid')) THEN
    UPDATE tracking_links SET conversion_count = conversion_count + 1 WHERE id = NEW.link_id;
    UPDATE clicks SET converted = TRUE WHERE id = NEW.click_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_increment_conversions
  AFTER INSERT OR UPDATE ON conversions
  FOR EACH ROW EXECUTE FUNCTION increment_link_conversions();

-- ── Daily stats rollup view (for fast dashboard rendering) ───────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_program_stats AS
  SELECT
    program_id,
    DATE_TRUNC('day', clicked_at) AS day,
    COUNT(*)                       AS clicks,
    COUNT(DISTINCT session_id)     AS unique_clicks,
    COUNT(DISTINCT affiliate_id)   AS active_affiliates
  FROM clicks
  WHERE clicked_at >= NOW() - INTERVAL '90 days'
  GROUP BY 1, 2;

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_stats ON daily_program_stats(program_id, day);

-- Refresh daily (run via pg_cron or Supabase cron)
-- SELECT cron.schedule('refresh-daily-stats', '0 1 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY daily_program_stats');
