"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Typography, Space, Spin } from "antd";
import { LinkOutlined, DollarOutlined, BarChartOutlined, FileImageOutlined, LoginOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const FEATURES = [
  { icon: <BarChartOutlined />, label: "Track clicks & conversions", color: "#2C5CC5" },
  { icon: <LinkOutlined />,     label: "Access your tracking links", color: "#00875A" },
  { icon: <DollarOutlined />,   label: "View payout history",        color: "#FFC639" },
  { icon: <FileImageOutlined />,label: "Download creative assets",   color: "#D72D30" },
];

export default function PortalIndexPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If already logged in as affiliate, redirect to dashboard
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const res = await fetch("/api/portal/me");
        if (res.ok) { router.replace("/portal/dashboard"); return; }
      }
      setChecking(false);
    })();
  }, [router]);

  if (checking) return (
    <div style={{ minHeight: "100vh", background: "#f5f7f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7f9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* Glow */}
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: 500, height: 400, background: "radial-gradient(circle,rgba(44,92,197,0.10) 0%,transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 460, textAlign: "center" }}>

        {/* Logo */}
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#2C5CC5,#1a4aad)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 auto 28px", boxShadow: "0 8px 32px rgba(44,92,197,0.25)" }}>
          A
        </div>

        <Title level={2} style={{ color: "#12344d", margin: "0 0 10px", letterSpacing: "-0.5px", fontWeight: 800 }}>
          Affiliate Portal
        </Title>
        <Text style={{ color: "#8fa0b4", fontSize: 15, display: "block", marginBottom: 36, lineHeight: 1.6 }}>
          Access your performance dashboard, tracking links, payouts, and creative assets.
        </Text>

        {/* Features */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 36 }}>
          {FEATURES.map(f => (
            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#f5f7fa", border: "1px solid #e8ecf2", borderRadius: 8 }}>
              <span style={{ color: f.color, fontSize: 16 }}>{f.icon}</span>
              <Text style={{ color: "#475867", fontSize: 13 }}>{f.label}</Text>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href="/portal/sign-in" style={{ display: "block" }}>
          <Button
            type="primary"
            size="large"
            icon={<LoginOutlined />}
            block
            style={{ height: 48, fontWeight: 700, fontSize: 15, borderRadius: 8, boxShadow: "0 4px 20px rgba(44,92,197,0.3)" }}
          >
            Sign in to your portal
          </Button>
        </Link>

        <Text style={{ display: "block", color: "#4a4a4a", fontSize: 12, marginTop: 20 }}>
          Are you a brand?{" "}
          <Link href="/sign-in" style={{ color: "#2C5CC5" }}>Sign in to the brand dashboard →</Link>
        </Text>
      </div>
    </div>
  );
}
