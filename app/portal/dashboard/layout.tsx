"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Layout, Menu, Avatar, Typography, Spin, Dropdown, Button } from "antd";
import {
  BarChartOutlined, LinkOutlined, DollarOutlined,
  FileImageOutlined, SettingOutlined, LogoutOutlined, TrophyOutlined,
} from "@ant-design/icons";

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const NAV = [
  { key: "/portal/dashboard",               icon: <BarChartOutlined />,  label: "Dashboard"   },
  { key: "/portal/dashboard/links",         icon: <LinkOutlined />,      label: "My Links"    },
  { key: "/portal/dashboard/leaderboard",   icon: <TrophyOutlined />,    label: "Leaderboard" },
  { key: "/portal/dashboard/payouts",       icon: <DollarOutlined />,    label: "Payouts"     },
  { key: "/portal/dashboard/assets",        icon: <FileImageOutlined />, label: "Assets"      },
  { key: "/portal/dashboard/settings",      icon: <SettingOutlined />,   label: "Settings"    },
];

export default function PortalDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [aff,  setAff]     = useState<any>(null);
  const [prog, setProg]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/portal/sign-in"); return; }

      const res  = await fetch("/api/portal/me");
      const data = await res.json();
      if (!res.ok) { router.replace("/portal/sign-in"); return; }

      setAff(data.affiliate);
      setProg(data.memberships?.[0]?.program || null);
      setLoading(false);
    })();
  }, [router]);

  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace("/portal/sign-in");
  };

  const primary = prog?.portal_primary_color || "#2C5CC5";
  const logo    = prog?.portal_logo_url;
  const orgName = prog?.name || "Affiliate Portal";

  const selectedKey =
    NAV.find(n => pathname === n.key || (n.key !== "/portal/dashboard" && pathname.startsWith(n.key)))?.key
    || "/portal/dashboard";

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f5f7f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" />
    </div>
  );

  const userMenu = {
    items: [
      { key: "email", label: <Text style={{ color: "#8fa0b4", fontSize: 12 }}>{aff?.email}</Text>, disabled: true },
      { type: "divider" as const, key: "d" },
      { key: "logout", icon: <LogoutOutlined style={{ color: "#D72D30" }} />, label: <span style={{ color: "#D72D30" }} onClick={signOut}>Sign out</span> },
    ],
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7f9" }}>
      {/* Sidebar */}
      <Sider width={220} style={{ background: "#ffffff", borderRight: "1px solid #edf0f4", position: "fixed", height: "100vh", zIndex: 20 }}>
        {/* Brand */}
        <div style={{ padding: "16px", height: 56, display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #e2e8f0" }}>
          {logo ? (
            <img src={logo} alt="logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg,${primary},${primary}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {orgName[0]}
            </div>
          )}
          <Text strong style={{ color: "#12344d", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{orgName}</Text>
        </div>

        {/* Nav */}
        <Menu mode="inline" theme="light" selectedKeys={[selectedKey]}
          items={NAV.map(n => ({ key: n.key, icon: n.icon, label: <Link href={n.key} style={{ color: "inherit" }}>{n.label}</Link> }))}
          style={{ flex: 1, border: "none", background: "#ffffff", padding: "8px 0" }}
        />

        {/* User footer */}
        <div style={{ padding: "12px 14px", borderTop: "1px solid #e2e8f0", position: "absolute", bottom: 0, width: "100%" }}>
          <Dropdown menu={userMenu} trigger={["click"]} placement="topLeft">
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <Avatar size={28} style={{ background: `linear-gradient(135deg,${primary},${primary}88)`, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {(aff?.full_name || aff?.email || "?")[0].toUpperCase()}
              </Avatar>
              <Text style={{ fontSize: 12, color: "#475867", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {aff?.full_name || aff?.email}
              </Text>
            </div>
          </Dropdown>
        </div>
      </Sider>

      {/* Main */}
      <Layout style={{ marginLeft: 220, background: "#f5f7f9" }}>
        <Header style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: "#8fa0b4", fontSize: 13 }}>
            Affiliate Portal <span style={{ color: "#e2e8f0", margin: "0 6px" }}>/</span>
            <span style={{ color: "#475867", textTransform: "capitalize" }}>
              {pathname.split("/").pop()?.replace(/-/g, " ") || "dashboard"}
            </span>
          </Text>
          <Button size="small" onClick={signOut} icon={<LogoutOutlined />} type="text" style={{ color: "#a0b0c0" }}>
            Sign out
          </Button>
        </Header>
        <Content style={{ padding: 28 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
