"use client";
import { useEffect, useState } from "react";
import { useOrg } from "@/lib/hooks/useOrg";
import {
  Table, Statistic, Row, Col, Card, Tag, Tabs, Typography, Space, Empty,
} from "antd";

import { DollarOutlined, ClockCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

type Payout = {
  id: string; amount: number; currency: string; method: string; status: string;
  created_at: string; paid_at: string | null;
  affiliate?: { email: string; full_name: string | null };
  program?: { name: string };
};

const STATUS_COLOR: Record<string, string> = {
  pending: "warning", processing: "processing", paid: "success",
  failed: "error", cancelled: "default",
};

export default function PayoutsPage() {
  const { ctx } = useOrg();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats]     = useState<{ total: number; pending: number; paid: number }>({ total: 0, pending: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");

  useEffect(() => { if (ctx?.organization?.id) load(); }, [ctx?.organization?.id, filter]);

  const load = async () => {
    setLoading(true);
    const qs   = filter !== "all" ? `?status=${filter}` : "";
    const res  = await fetch(`/api/payouts${qs}`);
    const data = await res.json();
    setPayouts(data.payouts || []);
    setStats(data.stats || { total: 0, pending: 0, paid: 0 });
    setLoading(false);
  };

  const columns: ColumnsType<Payout> = [
    {
      title: "Affiliate",
      render: (_, p) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: "#fff", fontSize: 13 }}>
            {p.affiliate?.full_name || p.affiliate?.email || "—"}
          </Text>
          <Text style={{ color: "#475569", fontSize: 11 }}>{p.program?.name || "—"}</Text>
        </Space>
      ),
    },
    {
      title: "Amount",
      render: (_, p) => (
        <Space>
          <Text style={{ color: "#fff", fontWeight: 700 }}>${p.amount.toFixed(2)}</Text>
          <Text style={{ color: "#475569", fontSize: 11 }}>{p.currency}</Text>
        </Space>
      ),
    },
    {
      title: "Method",
      dataIndex: "method",
      render: v => <Text style={{ color: "#64748b", textTransform: "capitalize" }}>{v.replace("_", " ")}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: s => <Tag color={STATUS_COLOR[s] || "default"}>{s}</Tag>,
    },
    {
      title: "Date",
      render: (_, p) => (
        <Text style={{ color: "#475569", fontSize: 12 }}>
          {p.paid_at
            ? new Date(p.paid_at).toLocaleDateString()
            : new Date(p.created_at).toLocaleDateString()}
        </Text>
      ),
    },
  ];

  const tabItems = ["all", "pending", "processing", "paid", "failed"].map(s => ({
    key: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  }));

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ margin: "0 0 4px", color: "#fff" }}>Payouts</Title>
        <Text style={{ color: "#475569" }}>Track and process affiliate commission payouts.</Text>
      </div>

      {/* Stats */}
      <Row gutter={[14, 14]} style={{ marginBottom: 28 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Payouts"
              value={stats.total}
              prefix={<DollarOutlined />}
              precision={2}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: "#f59e0b" }} />}
              precision={2}
              valueStyle={{ color: "#f59e0b" }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Paid Out"
              value={stats.paid}
              prefix={<CheckCircleOutlined style={{ color: "#10b981" }} />}
              precision={2}
              valueStyle={{ color: "#10b981" }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={filter}
        onChange={setFilter}
        items={tabItems}
        style={{ marginBottom: 20 }}
      />

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 14, overflow: "hidden" }}>


        <Table
        columns={columns}
        dataSource={payouts}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: <Empty description="No payouts yet." image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />
      </Card>
    </div>
  );
}
