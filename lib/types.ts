// ── Multi-tenant types ────────────────────────────────────────────────────

export type Plan = 'trial' | 'starter' | 'growth' | 'scale';
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';
export type MemberStatus = 'pending' | 'active' | 'suspended' | 'removed';
export type ProgramStatus = 'draft' | 'active' | 'paused' | 'closed';
export type AffiliateStatus = 'pending' | 'approved' | 'active' | 'suspended' | 'rejected';
export type ConversionStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'refunded' | 'chargedback';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
export type PayoutMethod = 'paypal' | 'bank_transfer' | 'stripe' | 'usdc' | 'usdt' | 'check';
export type CommissionType = 'percentage' | 'flat' | 'tiered' | 'recurring';
export type EventType = 'sale' | 'lead' | 'signup' | 'subscription' | 'custom';

// ── Organization (Tenant) ─────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  plan: Plan;
  plan_period: 'monthly' | 'yearly';
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  subscription_end: string | null;
  timezone: string;
  default_currency: string;
  portal_domain: string | null;
  created_at: string;
  updated_at: string;
}

// ── Organization Member (Domain User) ────────────────────────────────────

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  status: MemberStatus;
  can_manage_affiliates: boolean;
  can_approve_conversions: boolean;
  can_process_payouts: boolean;
  can_manage_billing: boolean;
  can_invite_members: boolean;
  can_view_analytics: boolean;
  invite_token: string;
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  profile?: Profile;
  organization?: Organization;
}

// ── User Profile ──────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  company_name: string | null;
  company_logo_url: string | null;
  website: string | null;
  primary_org_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── Program ───────────────────────────────────────────────────────────────

export interface Program {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  category: string | null;
  is_public: boolean;
  public_slug: string | null;
  default_commission_type: CommissionType;
  default_commission_value: number;
  cookie_duration_days: number;
  payout_frequency: 'instant' | 'weekly' | 'biweekly' | 'monthly';
  min_payout_amount: number;
  currency: string;
  portal_domain: string | null;
  portal_primary_color: string;
  portal_logo_url: string | null;
  status: ProgramStatus;
  created_at: string;
  updated_at: string;
}

// ── Affiliate ─────────────────────────────────────────────────────────────

export interface Affiliate {
  id: string;
  organization_id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  website: string | null;
  social_links: Record<string, string>;
  niche: string[];
  country_code: string | null;
  audience_size: number | null;
  bio: string | null;
  auth_user_id: string | null;
  is_marketplace_listed: boolean;
  marketplace_rating: number;
  created_at: string;
  updated_at: string;
}

// ── Conversion ────────────────────────────────────────────────────────────

export interface Conversion {
  id: string;
  organization_id: string;
  program_id: string;
  affiliate_id: string;
  link_id: string | null;
  click_id: string | null;
  event_type: EventType;
  order_id: string | null;
  revenue: number;
  currency: string;
  commission_type: CommissionType | null;
  commission_value: number | null;
  commission_amount: number;
  status: ConversionStatus;
  approved_at: string | null;
  fraud_score: number;
  is_flagged: boolean;
  metadata: Record<string, unknown>;
  converted_at: string;
  created_at: string;
  updated_at: string;
}

// ── Payout ────────────────────────────────────────────────────────────────

export interface Payout {
  id: string;
  organization_id: string;
  program_id: string;
  affiliate_id: string;
  amount: number;
  currency: string;
  fee: number;
  net_amount: number;
  method: PayoutMethod;
  status: PayoutStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Context ───────────────────────────────────────────────────────────────

export interface OrgContext {
  organization: Organization;
  member: OrganizationMember;
  role: OrgRole;
  can: {
    manageAffiliates: boolean;
    approveConversions: boolean;
    processPayouts: boolean;
    manageBilling: boolean;
    inviteMembers: boolean;
    viewAnalytics: boolean;
  };
}

// Role hierarchy helpers
export const ROLE_LABELS: Record<OrgRole, string> = {
  owner:  'Owner',
  admin:  'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export const ROLE_COLORS: Record<OrgRole, string> = {
  owner:  '#f59e0b',
  admin:  '#6366f1',
  member: '#10b981',
  viewer: '#64748b',
};

export function hasPermission(role: OrgRole, minRole: OrgRole): boolean {
  const hierarchy = { owner: 4, admin: 3, member: 2, viewer: 1 };
  return hierarchy[role] >= hierarchy[minRole];
}
