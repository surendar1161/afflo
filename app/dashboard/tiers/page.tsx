"use client";
import { useEffect, useState } from "react";
import { useOrg } from "@/lib/hooks/useOrg";
import { Row, Col, Card, Typography, Tag, Progress, Avatar, Spin, Table, Space } from "antd";
import { TrophyOutlined, RiseOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

type Tier = { id: string; name: string; min_revenue: number; color: string; icon: string; benefits: string[]; commission_bonus: number };
type LeaderEntry = { id: string; affiliate: { id:string; email:string; full_name:string|null }; tier_name:string; tier_color:string; tier_icon:string; total_revenue:number; total_conversions:number; next_tier:Tier|null; progress_to_next_pct:number };

export default function TiersPage() {
  const { ctx } = useOrg();
  const [tiers, setTiers]           = useState<Tier[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => { if (ctx?.organization?.id) load(); }, [ctx?.organization?.id]);

  const load = async () => {
    setLoading(true);
    const res  = await fetch("/api/tiers?leaderboard=1");
    const data = await res.json();
    setTiers(data.tiers || []);
    setLeaderboard(data.leaderboard || []);
    setLoading(false);
  };

  const cols: ColumnsType<LeaderEntry> = [
    {
      title: "Rank", width: 60,
      render: (_, __, i) => (
        <Text style={{ fontWeight: 800, color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#8fa0b4", fontSize: 16 }}>
          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
        </Text>
      ),
    },
    {
      title: "Affiliate",
      render: (_, r) => (
        <Space>
          <Avatar size={32} style={{ background: `linear-gradient(135deg,${r.tier_color},${r.tier_color}88)`, fontWeight: 800, fontSize: 13 }}>
            {(r.affiliate?.full_name || r.affiliate?.email || "?")[0].toUpperCase()}
          </Avatar>
          <div>
            <Text strong style={{ color: "#12344d", display: "block" }}>{r.affiliate?.full_name || "—"}</Text>
            <Text style={{ color: "#8fa0b4", fontSize: 11 }}>{r.affiliate?.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Tier", width: 110,
      render: (_, r) => (
        <Tag style={{ background: `${r.tier_color}18`, border: `1px solid ${r.tier_color}44`, color: r.tier_color, borderRadius: 24, fontWeight: 700 }}>
          {r.tier_icon} {r.tier_name}
        </Tag>
      ),
    },
    {
      title: "Revenue",   dataIndex: "total_revenue",
      render: v => <Text style={{ color: "#00875A", fontWeight: 700 }}>${(v || 0).toFixed(0)}</Text>,
      sorter: (a, b) => a.total_revenue - b.total_revenue,
    },
    {
      title: "Conversions", dataIndex: "total_conversions",
      render: v => <Text style={{ color: "#475867", fontWeight: 600 }}>{v}</Text>, width: 110,
    },
    {
      title: "Progress to next tier", width: 220,
      render: (_, r) => r.next_tier ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 11, color: "#8fa0b4" }}>→ {r.next_tier.icon} {r.next_tier.name}</Text>
            <Text style={{ fontSize: 11, color: "#8fa0b4" }}>${r.next_tier.min_revenue.toFixed(0)}</Text>
          </div>
          <Progress percent={r.progress_to_next_pct} showInfo={false} strokeColor={r.tier_color} trailColor="#edf0f4" size="small" />
        </div>
      ) : <Tag color="warning" style={{ borderRadius: 24 }}>Max tier reached 🏆</Tag>,
    },
  ];

  if (loading) return <div style={{ display:"flex",justifyContent:"center",alignItems:"center",height:400 }}><Spin size="large"/></div>;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ margin: "0 0 4px", color: "#12344d" }}>
          <TrophyOutlined style={{ color: "#FFD700", marginRight: 10 }} />VIP Tiers
        </Title>
        <Text style={{ color: "#8fa0b4" }}>Affiliates earn higher tiers as they drive more revenue. Tiers unlock benefits and bonus commissions.</Text>
      </div>

      {/* Tier cards */}
      <Row gutter={[14, 14]} style={{ marginBottom: 28 }}>
        {tiers.map(t => {
          const count = leaderboard.filter(l => l.tier_name === t.name).length;
          return (
            <Col key={t.id} xs={12} md={6}>
              <Card style={{ borderColor: `${t.color}33`, background: `${t.color}0a` }} styles={{ body: { padding: "18px 20px" } }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 24 }}>{t.icon}</span>
                  <Text strong style={{ fontSize: 16, color: t.color }}>{t.name}</Text>
                </div>
                <Text style={{ color: "#8fa0b4", fontSize: 12, display: "block", marginBottom: 8 }}>
                  From ${t.min_revenue.toLocaleString()} revenue
                </Text>
                {t.commission_bonus > 0 && (
                  <Tag style={{ background: `${t.color}18`, border: `1px solid ${t.color}44`, color: t.color, borderRadius: 24, fontSize: 11, marginBottom: 8 }}>
                    +{t.commission_bonus}% bonus
                  </Tag>
                )}
                <div style={{ fontSize: 11, color: "#4a4a4a", marginBottom: 8 }}>
                  {t.benefits?.slice(0, 2).map(b => <div key={b}>✓ {b}</div>)}
                </div>
                <Text style={{ color: "#8fa0b4", fontSize: 12 }}>{count} affiliate{count !== 1 ? "s" : ""}</Text>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Leaderboard */}
      <Card
        title={<Space><RiseOutlined style={{ color: "#2C5CC5" }} /><Text strong style={{ color: "#12344d" }}>Affiliate Leaderboard</Text></Space>}
        styles={{ body: { padding: 0 } }}
        style={{ borderRadius: 8, overflow: "hidden" }}
      >
        <Table
          columns={cols}
          dataSource={leaderboard}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: "No affiliate data yet — tiers are calculated as conversions are approved." }}
        />
      </Card>
    </div>
  );
}
