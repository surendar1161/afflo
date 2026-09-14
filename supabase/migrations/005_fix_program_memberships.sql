-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 005: Add organization_id to program_memberships
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Add organization_id to program_memberships (was missed in migration 004)
ALTER TABLE program_memberships
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Back-fill from the linked program's organization
UPDATE program_memberships pm
SET organization_id = p.organization_id
FROM programs p
WHERE pm.program_id = p.id
  AND pm.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_memberships_org ON program_memberships(organization_id);

-- RLS: org members can access memberships of their programs
DROP POLICY IF EXISTS "memberships_brand"     ON program_memberships;
DROP POLICY IF EXISTS "memberships_affiliate" ON program_memberships;

CREATE POLICY "memberships_org" ON program_memberships FOR ALL USING (
  organization_id IN (SELECT my_organizations())
  OR EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND auth_user_id = auth.uid())
);
