"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrg } from "@/lib/hooks/useOrg";
import { Row, Col, Card, Statistic, Button, Typography, List, Tag, Spin, Avatar, Progress } from "antd";
import {
  AppstoreOutlined, TeamOutlined, SyncOutlined, DollarOutlined,
  WalletOutlined, ClockCircleOutlined, PlusOutlined, UserAddOutlined,
  LinkOutlined, ArrowRightOutlined, TrophyOutlined, RiseOutlined,
} from "@ant-design/icons";
import Link from "next/link";

const { Title, Text } = Typography;

interface Stats {
  programs: number; affiliates: number; conversions: number;
  revenue: number; commissions: number; pending_payouts: number;
}
interface TopAffiliate { id: string; email: string; full_name: string | null; revenue: number; conversions: number; }
interface RecentConversion { id: string; revenue: number; commission_amount: number; status: string; converted_at: string; affiliate_email: string; affiliate_name: string | null; program_name: string; }
interface DayData { date: string; revenue: number; }

const CONV_COLOR: Record<string, string> = { pending: "warning", approved: "success", rejected: "error", paid: "processing" };

export default function DashboardPage() {
  const { ctx, loading: orgLoading } = useOrg();
  const [stats, setStats]             = useState<Stats | null>(null);
  const [topAff, setTopAff]           = useState<TopAffiliate[]>([]);
  const [recentConv, setRecentConv]   = useState<RecentConversion[]>([]);
  const [daily, setDaily]             = useState<DayData[]>([]);
  const [loading, setLoading]         = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!ctx?.organization?.id) return;
    loadAll(ctx.organization.id);
  }, [ctx?.organization?.id]);

  const loadAll = async (orgId: string) => {
    setLoading(true);

    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

    const [progRes, affRes, convRes, payRes, recentRes] = await Promise.all([
      supabase.from("programs").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "active"),
      supabase.from("affiliates").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
      supabase.from("conversions").select("revenue,commission_amount,affiliate_id").eq("organization_id", orgId).in("status", ["approved","paid"]),
      supabase.from("payouts").select("amount", { count: "exact" }).eq("organization_id", orgId).eq("status", "pending"),
      supabase.from("conversions")
        .select("id,revenue,commission_amount,status,converted_at,affiliate:affiliates(email,full_name),program:programs(name)")
        .eq("organization_id", orgId)
        .order("converted_at", { ascending: false })
        .limit(5),
    ]);

    const convs       = (convRes.data || []) as { revenue: number; commission_amount: number; affiliate_id: string }[];
    const revenue     = convs.reduce((s, c) => s + (c.revenue || 0), 0);
    const commissions = convs.reduce((s, c) => s + (c.commission_amount || 0), 0);

    setStats({ programs: progRes.count || 0, affiliates: affRes.count || 0, conversions: convs.length, revenue, commissions, pending_payouts: payRes.count || 0 });

    // Top affiliates by revenue
    const affRevMap: Record<string, { revenue: number; conversions: number }> = {};
    convs.forEach(c => {
      if (!affRevMap[c.affiliate_id]) affRevMap[c.affiliate_id] = { revenue: 0, conversions: 0 };
      affRevMap[c.affiliate_id].revenue     += c.revenue || 0;
      affRevMap[c.affiliate_id].conversions += 1;
    });

    if (Object.keys(affRevMap).length) {
      const topIds   = Object.entries(affRevMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5).map(([id]) => id);
      const { data: affDetails } = await supabase.from("affiliates").select("id,email,full_name").in("id", topIds);
      setTopAff(
        topIds.map(id => {
          const aff = (affDetails || []).find(a => a.id === id);
          return { id, email: aff?.email || "—", full_name: aff?.full_name || null, ...affRevMap[id] };
        })
      );
    } else {
      setTopAff([]);
    }

    // Recent conversions
    const rc = (recentRes.data || []).map((c: any) => ({
      id:              c.id,
      revenue:         c.revenue,
      commission_amount: c.commission_amount,
      status:          c.status,
      converted_at:    c.converted_at,
      affiliate_email: c.affiliate?.email || "—",
      affiliate_name:  c.affiliate?.full_name || null,
      program_name:    c.program?.name || "—",
    }));
    setRecentConv(rc);

    // 30-day daily revenue
    const { data: dailyConvs } = await supabase
      .from("conversions")
      .select("revenue,converted_at")
      .eq("organization_id", orgId)
      .in("status", ["approved","paid"])
      .gte("converted_at", since30);

    const dayMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      dayMap[new Date(Date.now() - i * 86400000).toISOString().split("T")[0]] = 0;
    }
    (dailyConvs || []).forEach((c: any) => {
      const d = c.converted_at.split("T")[0];
      if (dayMap[d] !== undefined) dayMap[d] += c.revenue || 0;
    });
    setDaily(Object.entries(dayMap).map(([date, rev]) => ({ date, revenue: rev })));

    setLoading(false);
  };

  const org  = ctx?.organization;
  const role = ctx?.role;
  const maxRev = Math.max(...daily.map(d => d.revenue), 1);

  if (orgLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <Spin size="large" />
    </div>
  );

  const KPI = [
    { label: "Active Programs",  value: stats?.programs,        icon: <AppstoreOutlined />, color: "#2C5CC5" },
    { label: "Total Affiliates", value: stats?.affiliates,       icon: <TeamOutlined />,    color: "#00875A" },
    { label: "Conversions",      value: stats?.conversions,      icon: <SyncOutlined />,    color: "#FFC639" },
    { label: "Total Revenue",    value: stats?.revenue,          icon: <DollarOutlined />,  color: "#00875A", prefix: "$", precision: 2 },
    { label: "Commissions Paid", value: stats?.commissions,      icon: <WalletOutlined />,  color: "#2C5CC5", prefix: "$", precision: 2 },
    { label: "Pending Payouts",  value: stats?.pending_payouts,  icon: <ClockCircleOutlined />, color: (stats?.pending_payouts || 0) > 0 ? "#D72D30" : "#8fa0b4" },
  ];

  const quickActions = [
    { icon: <PlusOutlined />,    label: "Create a program",      href: "/dashboard/programs", desc: "Launch an affiliate program",    color: "#2C5CC5" },
    { icon: <UserAddOutlined />, label: "Add an affiliate",      href: "/dashboard/affiliates",desc: "Enroll affiliates into programs", color: "#00875A" },
    { icon: <LinkOutlined />,    label: "Generate tracking links",href: "/dashboard/links",    desc: "Deep link to any product page",  color: "#FFC639" },
    { icon: <DollarOutlined />,  label: "Process payouts",       href: "/dashboard/payouts",  desc: "Pay your affiliates",            color: "#D72D30" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ margin: "0 0 4px", color: "#12344d" }}>
          {org ? `${org.name} Dashboard` : "Dashboard"}
        </Title>
        <Text style={{ color: "#8fa0b4" }}>
          Welcome back ·{" "}
          <Text strong style={{ color: "#2C5CC5" }}>{role}</Text> access
        </Text>
      </div>

      {/* KPI row */}
      <Row gutter={[14, 14]} style={{ marginBottom: 24 }}>
        {KPI.map(k => (
          <Col key={k.label} xs={12} lg={4}>
            <Card styles={{ body: { padding: "14px 16px" } }}>
              <div style={{ fontSize: 10, color: "#8fa0b4", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{k.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: k.color, fontSize: 18 }}>{k.icon}</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: k.color }}>
                  {loading ? "—" : `${k.prefix || ""}${(k.value ?? 0).toLocaleString("en-US", { minimumFractionDigits: k.precision || 0, maximumFractionDigits: k.precision || 0 })}`}
                </span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Revenue sparkline */}
      {!loading && daily.some(d => d.revenue > 0) && (
        <Card style={{ marginBottom: 20 }} styles={{ body: { padding: "16px 20px" } }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text strong style={{ color: "#12344d", fontSize: 14 }}><RiseOutlined style={{ color: "#00875A", marginRight: 6 }} />Revenue — last 30 days</Text>
            <Text style={{ color: "#00875A", fontWeight: 700 }}>${daily.reduce((s, d) => s + d.revenue, 0).toFixed(2)} total</Text>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 56 }}>
            {daily.map(d => (
              <div key={d.date} title={`${d.date}: $${d.revenue.toFixed(2)}`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                <div style={{ width: "100%", borderRadius: "2px 2px 0 0", background: d.revenue > 0 ? `rgba(0,196,140,${0.2 + (d.revenue / maxRev) * 0.8})` : "#f2f5f8", height: `${Math.max(4, (d.revenue / maxRev) * 100)}%`, transition: "height .2s" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <Text style={{ color: "#4a4a4a", fontSize: 10 }}>{daily[0]?.date}</Text>
            <Text style={{ color: "#4a4a4a", fontSize: 10 }}>{daily[daily.length - 1]?.date}</Text>
          </div>
        </Card>
      )}

      <Row gutter={[20, 20]}>
        {/* Quick actions */}
        <Col xs={24} lg={8}>
          <Card title={<Text strong style={{ color: "#12344d" }}>Quick actions</Text>} style={{ height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {quickActions.map(a => (
                <Link key={a.href} href={a.href} style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(44,92,197,0.03)", transition: "all .15s", cursor: "pointer" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${a.color}40`; (e.currentTarget as HTMLElement).style.background = `${a.color}0a`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.background = "rgba(44,92,197,0.03)"; }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: `${a.color}16`, border: `1px solid ${a.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: a.color, flexShrink: 0 }}>
                      {a.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#12344d" }}>{a.label}</div>
                      <div style={{ fontSize: 11, color: "#8fa0b4" }}>{a.desc}</div>
                    </div>
                    <ArrowRightOutlined style={{ color: "#4a4a4a", fontSize: 12 }} />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </Col>

        {/* Top affiliates */}
        <Col xs={24} lg={8}>
          <Card
            title={<Text strong style={{ color: "#12344d" }}><TrophyOutlined style={{ color: "#FFC639", marginRight: 8 }} />Top Affiliates</Text>}
            extra={<Link href="/dashboard/affiliates" style={{ color: "#2C5CC5", fontSize: 12 }}>View all →</Link>}
            style={{ height: "100%" }}
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
            ) : topAff.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
                <Text style={{ color: "#8fa0b4", fontSize: 13 }}>No conversions yet. Add affiliates to your programs to see top performers here.</Text>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {topAff.map((a, i) => {
                  const maxAffRev = topAff[0].revenue;
                  const pct = maxAffRev > 0 ? Math.round((a.revenue / maxAffRev) * 100) : 0;
                  return (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? "#FFC639" : i === 1 ? "#475867" : "#CD7F32", width: 16, textAlign: "center", flexShrink: 0 }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                      </div>
                      <Avatar size={30} style={{ background: `linear-gradient(135deg,#2C5CC5,#8b5cf6)`, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                        {(a.full_name || a.email)[0].toUpperCase()}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text style={{ fontSize: 12, fontWeight: 600, color: "#12344d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                            {a.full_name || a.email}
                          </Text>
                          <Text style={{ fontSize: 12, fontWeight: 700, color: "#00875A", flexShrink: 0 }}>${a.revenue.toFixed(0)}</Text>
                        </div>
                        <Progress percent={pct} showInfo={false} strokeColor="#2C5CC5" trailColor="rgba(255,255,255,0.05)" size="small" style={{ margin: 0 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        {/* Recent conversions */}
        <Col xs={24} lg={8}>
          <Card
            title={<Text strong style={{ color: "#12344d" }}><SyncOutlined style={{ color: "#2C5CC5", marginRight: 8 }} />Recent Conversions</Text>}
            extra={<Link href="/dashboard/conversions" style={{ color: "#2C5CC5", fontSize: 12 }}>View all →</Link>}
            style={{ height: "100%" }}
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
            ) : recentConv.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💫</div>
                <Text style={{ color: "#8fa0b4", fontSize: 13 }}>No conversions yet. They'll appear here when affiliates drive sales.</Text>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {recentConv.map((c, i) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < recentConv.length - 1 ? "1px solid #f2f5f8" : "none" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 13, fontWeight: 600, color: "#12344d", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.affiliate_name || c.affiliate_email}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#8fa0b4" }}>
                        {c.program_name} · {new Date(c.converted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Text>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: 700, color: "#00875A", display: "block" }}>${c.revenue.toFixed(2)}</Text>
                      <Tag color={CONV_COLOR[c.status] || "default"} style={{ margin: 0, fontSize: 10, borderRadius: 24 }}>{c.status}</Tag>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
