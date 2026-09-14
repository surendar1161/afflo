-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 006: Add organization_id to tables missed in migration 004
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── tracking_links ────────────────────────────────────────────────────────
ALTER TABLE tracking_links
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE tracking_links tl
SET organization_id = p.organization_id
FROM programs p
WHERE tl.program_id = p.id AND tl.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_tracking_links_org ON tracking_links(organization_id);

-- ── program_memberships (also missed in 004, covered in 005 but repeat safe) ──
ALTER TABLE program_memberships
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE program_memberships pm
SET organization_id = p.organization_id
FROM programs p
WHERE pm.program_id = p.id AND pm.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_memberships_org ON program_memberships(organization_id);

-- ── payout_items ─────────────────────────────────────────────────────────
ALTER TABLE payout_items
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE payout_items pi
SET organization_id = pay.organization_id
FROM payouts pay
WHERE pi.payout_id = pay.id AND pi.organization_id IS NULL;

-- ── payout_methods ───────────────────────────────────────────────────────
-- payout_methods is per-affiliate, no org needed — skip

-- ── RLS for tracking_links ────────────────────────────────────────────────
DROP POLICY IF EXISTS "links_brand"     ON tracking_links;
DROP POLICY IF EXISTS "links_affiliate" ON tracking_links;

CREATE POLICY "links_org_read" ON tracking_links FOR SELECT USING (
  organization_id IN (SELECT my_organizations())
  OR EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND auth_user_id = auth.uid())
);
CREATE POLICY "links_org_write" ON tracking_links FOR ALL USING (
  organization_id IN (SELECT my_organizations())
);
CREATE POLICY "links_public_insert" ON tracking_links FOR INSERT WITH CHECK (TRUE);
