-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 004: Multi-Tenant Architecture (FIXED ORDER)
-- Tables created first, then all RLS policies applied after.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. ORGANIZATIONS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,
  logo_url            TEXT,
  website             TEXT,
  industry            TEXT,
  plan                TEXT NOT NULL DEFAULT 'trial'
                      CHECK (plan IN ('trial','starter','growth','scale')),
  plan_period         TEXT DEFAULT 'monthly' CHECK (plan_period IN ('monthly','yearly')),
  trial_ends_at       TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  stripe_customer_id  TEXT UNIQUE,
  subscription_id     TEXT UNIQUE,
  subscription_end    TIMESTAMPTZ,
  timezone            TEXT DEFAULT 'UTC',
  default_currency    TEXT DEFAULT 'USD',
  portal_domain       TEXT UNIQUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_orgs_updated
  BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_orgs_slug ON organizations(slug);

-- ── 2. ORGANIZATION MEMBERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organization_members (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role                    TEXT NOT NULL DEFAULT 'member'
                          CHECK (role IN ('owner','admin','member','viewer')),
  status                  TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('pending','active','suspended','removed')),
  can_manage_affiliates   BOOLEAN DEFAULT TRUE,
  can_approve_conversions BOOLEAN DEFAULT TRUE,
  can_process_payouts     BOOLEAN DEFAULT FALSE,
  can_manage_billing      BOOLEAN DEFAULT FALSE,
  can_invite_members      BOOLEAN DEFAULT TRUE,
  can_view_analytics      BOOLEAN DEFAULT TRUE,
  invite_token            TEXT UNIQUE DEFAULT replace(gen_random_uuid()::TEXT, '-', ''),
  invited_by              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at              TIMESTAMPTZ,
  accepted_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

CREATE OR REPLACE TRIGGER trg_org_members_updated
  BEFORE UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_org_members_org    ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user   ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_token  ON organization_members(invite_token);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(organization_id, status);

-- ── 3. Helper functions (must exist before RLS policies) ─────────────────────
CREATE OR REPLACE FUNCTION my_organizations()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid() AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION is_org_admin(p_org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND role IN ('owner','admin')
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION is_org_member(p_org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

-- ── 4. RLS — Organizations (now safe: organization_members exists) ────────────
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orgs_member_read"  ON organizations FOR SELECT USING (id IN (SELECT my_organizations()));
CREATE POLICY "orgs_owner_update" ON organizations FOR UPDATE USING (is_org_admin(id));
CREATE POLICY "orgs_service_all"  ON organizations FOR ALL   USING (auth.role() = 'service_role');

-- ── 5. RLS — Organization Members ────────────────────────────────────────────
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read"        ON organization_members FOR SELECT USING (organization_id IN (SELECT my_organizations()));
CREATE POLICY "org_members_admin_write" ON organization_members FOR ALL    USING (is_org_admin(organization_id));
CREATE POLICY "org_members_self_update" ON organization_members FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "org_members_service"     ON organization_members FOR ALL    USING (auth.role() = 'service_role');

-- ── 6. Alter existing tables ──────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE programs         ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE affiliates        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE clicks            ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE conversions       ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE payouts           ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE commission_rules  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE creatives         ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE api_keys          ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE notifications     ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_programs_org         ON programs(organization_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_org       ON affiliates(organization_id);
CREATE INDEX IF NOT EXISTS idx_clicks_org           ON clicks(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversions_org      ON conversions(organization_id);
CREATE INDEX IF NOT EXISTS idx_payouts_org          ON payouts(organization_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_org ON commission_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_creatives_org        ON creatives(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_org         ON api_keys(organization_id);

-- ── 7. Update RLS on core tables ─────────────────────────────────────────────
DROP POLICY IF EXISTS "programs_own"    ON programs;
DROP POLICY IF EXISTS "programs_public" ON programs;
CREATE POLICY "programs_org_read"   ON programs FOR SELECT    USING  (organization_id IN (SELECT my_organizations()) OR (is_public=TRUE AND status='active'));
CREATE POLICY "programs_org_insert" ON programs FOR INSERT    WITH CHECK (is_org_member(organization_id));
CREATE POLICY "programs_org_update" ON programs FOR UPDATE    USING  (is_org_admin(organization_id));
CREATE POLICY "programs_org_delete" ON programs FOR DELETE    USING  (is_org_admin(organization_id));

DROP POLICY IF EXISTS "affiliates_own"         ON affiliates;
DROP POLICY IF EXISTS "affiliates_brand_read"  ON affiliates;
DROP POLICY IF EXISTS "affiliates_marketplace" ON affiliates;
CREATE POLICY "affiliates_org_read"  ON affiliates FOR SELECT USING (organization_id IN (SELECT my_organizations()) OR auth_user_id=auth.uid() OR is_marketplace_listed=TRUE);
CREATE POLICY "affiliates_org_write" ON affiliates FOR ALL    USING (organization_id IN (SELECT my_organizations()) OR auth_user_id=auth.uid());

DROP POLICY IF EXISTS "clicks_brand"         ON clicks;
DROP POLICY IF EXISTS "clicks_affiliate"     ON clicks;
DROP POLICY IF EXISTS "clicks_insert_public" ON clicks;
CREATE POLICY "clicks_org_read"      ON clicks FOR SELECT USING (organization_id IN (SELECT my_organizations()) OR EXISTS(SELECT 1 FROM affiliates WHERE id=affiliate_id AND auth_user_id=auth.uid()));
CREATE POLICY "clicks_public_insert" ON clicks FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "conversions_brand"          ON conversions;
DROP POLICY IF EXISTS "conversions_affiliate"      ON conversions;
DROP POLICY IF EXISTS "conversions_insert_service" ON conversions;
CREATE POLICY "conversions_org_read"      ON conversions FOR SELECT USING (organization_id IN (SELECT my_organizations()) OR EXISTS(SELECT 1 FROM affiliates WHERE id=affiliate_id AND auth_user_id=auth.uid()));
CREATE POLICY "conversions_org_write"     ON conversions FOR ALL    USING (organization_id IN (SELECT my_organizations()));
CREATE POLICY "conversions_public_insert" ON conversions FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "payouts_brand"     ON payouts;
DROP POLICY IF EXISTS "payouts_affiliate" ON payouts;
CREATE POLICY "payouts_org_read"  ON payouts FOR SELECT USING (organization_id IN (SELECT my_organizations()) OR EXISTS(SELECT 1 FROM affiliates WHERE id=affiliate_id AND auth_user_id=auth.uid()));
CREATE POLICY "payouts_org_write" ON payouts FOR ALL    USING (organization_id IN (SELECT my_organizations()));

DROP POLICY IF EXISTS "commission_rules_own" ON commission_rules;
CREATE POLICY "commission_rules_org" ON commission_rules FOR ALL USING (organization_id IN (SELECT my_organizations()));

DROP POLICY IF EXISTS "notifications_user"      ON notifications;
DROP POLICY IF EXISTS "notifications_affiliate" ON notifications;
CREATE POLICY "notifications_org" ON notifications FOR ALL USING (organization_id IN (SELECT my_organizations()) OR user_id=auth.uid() OR EXISTS(SELECT 1 FROM affiliates WHERE id=affiliate_id AND auth_user_id=auth.uid()));

-- ── 8. Auto-create org on signup ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org_id UUID;
  v_slug   TEXT;
  v_name   TEXT;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;

  v_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'),''), SPLIT_PART(NEW.email,'@',2), 'My Organization');
  v_slug := LOWER(REGEXP_REPLACE(v_name,'[^a-zA-Z0-9]','-','g'));
  v_slug := REGEXP_REPLACE(v_slug,'-+','-','g');
  v_slug := TRIM(BOTH '-' FROM v_slug);
  v_slug := v_slug || '-' || SUBSTR(REPLACE(gen_random_uuid()::TEXT,'-',''),1,6);

  INSERT INTO public.organizations (name, slug) VALUES (v_name, v_slug) RETURNING id INTO v_org_id;
  INSERT INTO public.organization_members (organization_id, user_id, role, status, accepted_at) VALUES (v_org_id, NEW.id, 'owner', 'active', NOW());
  UPDATE public.profiles SET primary_org_id = v_org_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 9. Invite & accept functions ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION invite_organization_member(p_org_id UUID, p_email TEXT, p_role TEXT DEFAULT 'member')
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_token TEXT;
BEGIN
  IF NOT is_org_admin(p_org_id) THEN RAISE EXCEPTION 'Only admins and owners can invite members'; END IF;
  SELECT replace(gen_random_uuid()::TEXT,'-','') INTO v_token;
  INSERT INTO organization_members (organization_id, user_id, role, status, invited_by, invited_at, invite_token)
  SELECT p_org_id, u.id, p_role, 'pending', auth.uid(), NOW(), v_token FROM auth.users u WHERE u.email = p_email
  ON CONFLICT (organization_id, user_id) DO UPDATE SET role=p_role, status='pending', invited_at=NOW(), invite_token=v_token;
  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION accept_org_invitation(p_token TEXT)
RETURNS organizations LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_member organization_members%ROWTYPE;
  v_org    organizations%ROWTYPE;
BEGIN
  SELECT * INTO v_member FROM organization_members WHERE invite_token = p_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid invitation token'; END IF;
  IF v_member.status = 'active' THEN RAISE EXCEPTION 'Invitation already accepted'; END IF;
  UPDATE organization_members SET status='active', accepted_at=NOW(), user_id=auth.uid() WHERE invite_token=p_token;
  UPDATE profiles SET primary_org_id=COALESCE(primary_org_id, v_member.organization_id) WHERE id=auth.uid();
  SELECT * INTO v_org FROM organizations WHERE id=v_member.organization_id;
  RETURN v_org;
END;
$$;
