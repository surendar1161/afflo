"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layout, Menu, Avatar, Dropdown, Typography, Tooltip, Space, Tag, Button,
} from "antd";
import {
  AppstoreOutlined, UnorderedListOutlined, TeamOutlined, LinkOutlined,
  SyncOutlined, DollarOutlined, BarChartOutlined, SettingOutlined,
  LogoutOutlined, CreditCardOutlined, LeftOutlined, RightOutlined,
  TagOutlined, TrophyOutlined,
} from "@ant-design/icons";
import { createClient } from "@/lib/supabase/client";
import { useOrg } from "@/lib/hooks/useOrg";
import type { OrgRole } from "@/lib/types";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/types";

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const SIDER_W   = 232;
const COLLAPSED = 64;

const NAV_ITEMS = [
  { key: "/dashboard",              icon: <AppstoreOutlined />,      label: "Overview",      minRole: "viewer" },
  { key: "/dashboard/programs",     icon: <UnorderedListOutlined />, label: "Programs",      minRole: "viewer" },
  { key: "/dashboard/affiliates",   icon: <TeamOutlined />,          label: "Affiliates",    minRole: "viewer" },
  { key: "/dashboard/links",        icon: <LinkOutlined />,          label: "Links",         minRole: "member" },
  { key: "/dashboard/conversions",  icon: <SyncOutlined />,          label: "Conversions",   minRole: "member" },
  { key: "/dashboard/payouts",      icon: <DollarOutlined />,        label: "Payouts",       minRole: "admin"  },
  { key: "/dashboard/analytics",    icon: <BarChartOutlined />,      label: "Analytics",     minRole: "viewer" },
  { key: "/dashboard/coupons",      icon: <TagOutlined />,           label: "Coupons",       minRole: "member" },
  { key: "/dashboard/tiers",        icon: <TrophyOutlined />,        label: "VIP Tiers",     minRole: "member" },
  { key: "divider1", type: "divider" as const },
  { key: "/dashboard/team",         icon: <TeamOutlined />,          label: "Team",          minRole: "admin"  },
  { key: "/dashboard/subscription", icon: <CreditCardOutlined />,    label: "Subscription",  minRole: "owner"  },
  { key: "/dashboard/settings",     icon: <SettingOutlined />,       label: "Settings",      minRole: "owner"  },
];

const ROLE_HIERARCHY: Record<OrgRole, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };
function canAccess(userRole: OrgRole, minRole: string) {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole as OrgRole];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { ctx, orgs, loading, switchOrg } = useOrg();
  const [userEmail, setUserEmail]   = useState("");
  const [collapsed, setCollapsed]   = useState(false);

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem("fa_sidebar_collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("fa_sidebar_collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/sign-in"); return; }
      setUserEmail(user.email || "");
    });
  }, [router]);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const role     = ctx?.role || "viewer";
  const org      = ctx?.organization;
  const initials = org?.name?.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "??";

  const selectedKey = (() => {
    for (const item of NAV_ITEMS) {
      if ("type" in item) continue;
      if (item.key === "/dashboard" && pathname === "/dashboard") return item.key;
      if (item.key !== "/dashboard" && pathname.startsWith(item.key)) return item.key;
    }
    return "/dashboard";
  })();

  const menuItems = NAV_ITEMS.filter(item => {
    if ("type" in item) return true;
    return canAccess(role, item.minRole!);
  }).map(item => {
    if ("type" in item) return { type: "divider" as const, key: item.key };
    return {
      key:   item.key,
      icon:  collapsed
        ? <Tooltip title={item.label} placement="right">{item.icon}</Tooltip>
        : item.icon,
      label: <Link href={item.key} style={{ color: "inherit" }}>{item.label}</Link>,
    };
  });

  const orgMenuItems = [
    ...orgs.map(o => ({
      key: o.id,
      label: (
        <div onClick={() => switchOrg(o.id)} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar size={26} style={{ background: "linear-gradient(135deg,#2C5CC5,#1a4aad)", fontSize: 10, fontWeight: 800 }}>
            {o.name.slice(0, 2).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{o.name}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{o.plan}</div>
          </div>
          {o.id === org?.id && <span style={{ marginLeft: "auto", color: "#2C5CC5" }}>✓</span>}
        </div>
      ),
    })),
  ];

  const userMenuItems = [
    { key: "email", label: <span style={{ color: "#94a3b8", fontSize: 12 }}>{userEmail}</span>, disabled: true },
    { type: "divider" as const, key: "d" },
    { key: "portal", label: <Link href="/portal/sign-in" style={{ color: "#64748b" }}>Affiliate Portal</Link> },
    { type: "divider" as const, key: "d2" },
    {
      key: "signout",
      icon: <LogoutOutlined style={{ color: "#ef4444" }} />,
      label: <span style={{ color: "#ef4444" }} onClick={signOut}>Sign out</span>,
    },
  ];

  const trialDaysLeft = org?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null;

  const siderWidth = collapsed ? COLLAPSED : SIDER_W;

  return (
    <Layout style={{ minHeight: "100vh", background: "var(--fw-surface-0)" }}>
      <Sider
        width={SIDER_W}
        collapsedWidth={COLLAPSED}
        collapsed={collapsed}
        trigger={null}
        style={{
          background: "var(--fw-surface-1)",
          borderRight: "1px solid var(--fw-border-2)",
          position: "fixed",
          height: "100vh",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s ease",
          overflow: "hidden",
        }}
      >
        {/* ── Workspace header: logo + name + collapse chevron (Linear/Vercel style) ── */}
        <div style={{
          padding: "0 12px",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid var(--fw-border-2)",
          flexShrink: 0,
          overflow: "hidden",
        }}>
          {/* Company logo / avatar */}
          <Tooltip title={collapsed ? (org?.name || "Organization") : undefined} placement="right">
            {org?.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "linear-gradient(135deg,#2C5CC5,#1a4aad)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: "#fff",
                letterSpacing: "-0.5px",
              }}>
                {loading ? "…" : initials}
              </div>
            )}
          </Tooltip>

          {/* Org name + role — hidden when collapsed */}
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fw-text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: "18px" }}>
                {loading ? "Loading…" : org?.name || "No organization"}
              </div>
              <div style={{ fontSize: 10, color: "var(--fw-text-3)", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                {ROLE_LABELS[role]}
              </div>
            </div>
          )}

          {/* Collapse chevron — always visible at top right, Linear/Vercel style */}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              width: 24, height: 24, borderRadius: 6, border: "none",
              background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--fw-text-3)", flexShrink: 0,
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#e5eaf0"; (e.currentTarget as HTMLElement).style.color = "var(--fw-text-1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--fw-text-3)"; }}
          >
            {collapsed ? <RightOutlined style={{ fontSize: 11 }} /> : <LeftOutlined style={{ fontSize: 11 }} />}
          </button>
        </div>

        {/* Nav menu */}
        <Menu
          mode="inline"
          theme="light"
          selectedKeys={[selectedKey]}
          inlineCollapsed={collapsed}
          items={menuItems}
          style={{ flex: 1, border: "none", background: "transparent", padding: "8px 0" }}
        />

        {/* User footer */}
        <div style={{ padding: collapsed ? "10px 8px" : "10px 14px", borderTop: "1px solid var(--fw-border-2)", transition: "padding 0.2s" }}>
          <Dropdown menu={{ items: userMenuItems }} trigger={["click"]} placement="topLeft">
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", justifyContent: collapsed ? "center" : "flex-start" }}>
              <Tooltip title={collapsed ? userEmail : undefined} placement="right">
                <Avatar size={30} style={{ background: "linear-gradient(135deg,#2C5CC5,#8b5cf6)", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {userEmail[0]?.toUpperCase() || "?"}
                </Avatar>
              </Tooltip>
              {!collapsed && (
                <Text style={{ fontSize: 12, color: "var(--fw-text-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userEmail}
                </Text>
              )}
            </div>
          </Dropdown>
        </div>
      </Sider>

      {/* Main content — transitions with sidebar */}
      <Layout style={{
        marginLeft: siderWidth,
        background: "var(--fw-surface-0)",
        transition: "margin-left 0.2s ease",
      }}>
        {/* Top bar */}
        <Header style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "rgba(255,255,255,0.96)", backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--fw-border-2)",
          padding: "0 28px", height: 52,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Space size={6}>
            {org && <Text style={{ color: "#475569", fontSize: 13 }}>{org.name}</Text>}
            {org && <Text style={{ color: "#1e293b", fontSize: 13 }}>/</Text>}
            <Text style={{ color: "#94a3b8", fontSize: 13, textTransform: "capitalize" }}>
              {pathname === "/dashboard"
                ? "overview"
                : pathname.split("/").filter(Boolean).slice(1).join(" / ").replace(/-/g, " ")}
            </Text>
          </Space>

          <Space>
            {org?.plan === "trial" && trialDaysLeft !== null && (
              <Link href="/dashboard/subscription">
                <Tag style={{ background: "rgba(255,198,57,0.1)", border: "1px solid rgba(255,198,57,0.25)", color: "#FFC639", fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "2px 12px", cursor: "pointer" }}>
                  Trial · {trialDaysLeft}d left → Upgrade
                </Tag>
              </Link>
            )}
          </Space>
        </Header>

        <Content style={{ padding: 28, minHeight: "calc(100vh - 52px)" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
