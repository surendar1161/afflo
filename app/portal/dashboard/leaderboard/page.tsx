"use client";
import { useEffect, useState } from "react";
import { Card, Table, Tag, Typography, Statistic, Spin, Alert } from "antd";
import { TrophyOutlined, RiseOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface LeaderboardEntry {
  rank: number;
  is_self: boolean;
  display_name: string;
  total_revenue: number;
  tier_name: string;
  tier_color: string;
  tier_icon: string;
}

export default function LeaderboardPage() {
  const [data, setData]     = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    fetch("/api/portal/leaderboard")
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setData(d.leaderboard || []);
        setMyRank(d.my_rank);
        setTotal(d.total || 0);
      })
      .catch(() => setError("Failed to load leaderboard"))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      title: "Rank",
      dataIndex: "rank",
      width: 72,
      render: (rank: number, row: LeaderboardEntry) => {
        const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
        return (
          <Text style={{ fontSize: 15, fontWeight: row.is_self ? 900 : 600, color: row.is_self ? "#2C5CC5" : "#475867" }}>
            {medal || `#${rank}`}
          </Text>
        );
      },
    },
    {
      title: "Affiliate",
      dataIndex: "display_name",
      render: (name: string, row: LeaderboardEntry) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text style={{ fontWeight: row.is_self ? 700 : 400, color: row.is_self ? "#12344d" : "#475867" }}>
            {name}
          </Text>
          {row.is_self && (
            <Tag color="#2C5CC5" style={{ fontSize: 10, fontWeight: 700, padding: "0 6px", borderRadius: 4 }}>You</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Tier",
      dataIndex: "tier_name",
      width: 120,
      render: (tier: string, row: LeaderboardEntry) => (
        <Tag style={{ background: `${row.tier_color}18`, color: row.tier_color, border: `1px solid ${row.tier_color}40`, fontWeight: 600, fontSize: 11 }}>
          {row.tier_icon} {tier}
        </Tag>
      ),
    },
    {
      title: "Total Revenue",
      dataIndex: "total_revenue",
      width: 140,
      align: "right" as const,
      render: (v: number, row: LeaderboardEntry) => (
        <Text style={{ fontWeight: row.is_self ? 700 : 400, color: row.is_self ? "#FFC639" : "#475867" }}>
          ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      ),
    },
  ];

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <Spin size="large" />
    </div>
  );

  if (error) return <Alert type="error" message={error} />;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: "#12344d", margin: 0 }}>
          <TrophyOutlined style={{ marginRight: 8, color: "#FFC639" }} />
          Affiliate Leaderboard
        </Title>
        <Text style={{ color: "#8fa0b4", fontSize: 13 }}>Rankings based on total approved revenue generated.</Text>
      </div>

      {myRank !== null && (
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <Card style={{ background: "#ffffff", border: "1px solid #e8ecf2", flex: 1 }} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#8fa0b4", fontSize: 12 }}>Your Rank</Text>}
              value={myRank}
              prefix={<RiseOutlined style={{ color: "#2C5CC5" }} />}
              suffix={<Text style={{ color: "#8fa0b4", fontSize: 14 }}>/ {total}</Text>}
              valueStyle={{ color: "#2C5CC5", fontWeight: 900 }}
            />
          </Card>
          <Card style={{ background: "#ffffff", border: "1px solid #e8ecf2", flex: 1 }} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#8fa0b4", fontSize: 12 }}>Top Percentile</Text>}
              value={total > 0 ? Math.round(((total - myRank) / total) * 100) : 0}
              suffix="%"
              valueStyle={{ color: "#00875A", fontWeight: 900 }}
            />
          </Card>
          <Card style={{ background: "#ffffff", border: "1px solid #e8ecf2", flex: 1 }} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#8fa0b4", fontSize: 12 }}>Total Affiliates</Text>}
              value={total}
              valueStyle={{ color: "#12344d", fontWeight: 900 }}
            />
          </Card>
        </div>
      )}

      <Card style={{ background: "#ffffff", border: "1px solid #e8ecf2" }} bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="rank"
          pagination={false}
          rowClassName={(row: LeaderboardEntry) => row.is_self ? "leaderboard-self-row" : ""}
          style={{ background: "transparent" }}
        />
      </Card>

      <style>{`
        .leaderboard-self-row td { background: rgba(44,92,197,0.05) !important; }
        .ant-table { background: transparent !important; }
        .ant-table-thead > tr > th { background: #f8fafc !important; color: #475867 !important; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #edf0f4 !important; }
        .ant-table-tbody > tr > td { background: transparent !important; border-bottom: 1px solid #f2f5f8 !important; }
        .ant-table-tbody > tr:hover > td { background: rgba(44,92,197,0.03) !important; }
      `}</style>
    </div>
  );
}
