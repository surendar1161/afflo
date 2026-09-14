"use client";
import { useEffect, useState } from "react";
import { useOrg } from "@/lib/hooks/useOrg";
import {
  Table, Card, Button, Tag, Tabs, Popconfirm, Space, Typography, App, Empty,
} from "antd";

import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

type Conversion = {
  id: string; revenue: number; commission_amount: number; currency: string;
  status: string; event_type: string; order_id: string | null; converted_at: string;
  affiliate?: { email: string; full_name: string | null };
  program?: { name: string };
};

const STATUS_COLOR: Record<string, string> = {
  pending: "warning", approved: "success", rejected: "error",
  paid: "processing", refunded: "default", chargedback: "error",
};

export default function ConversionsPage() {
  const { message } = App.useApp();
  const { ctx } = useOrg();
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("all");
  const [acting, setActing]           = useState<string | null>(null);

  useEffect(() => { if (ctx?.organization?.id) load(); }, [ctx?.organization?.id, filter]);

  const load = async () => {
    setLoading(true);
    const qs   = filter !== "all" ? `?status=${filter}` : "";
    const res  = await fetch(`/api/conversions${qs}`);
    const data = await res.json();
    setConversions(data.conversions || []);
    setLoading(false);
  };

  const act = async (id: string, action: "approve" | "reject") => {
    setActing(id);
    await fetch(`/api/conversions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    message.success(`Conversion ${action}d`);
    setActing(null);
    load();
  };

  const canApprove = ctx?.can.approveConversions;

  const columns: ColumnsType<Conversion> = [
    {
      title: "Affiliate / Program",
      render: (_, c) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: "#fff", fontSize: 13 }}>
            {c.affiliate?.full_name || c.affiliate?.email || "—"}
          </Text>
          <Text style={{ color: "#475569", fontSize: 11 }}>
            {c.program?.name} · {c.order_id ? `Order #${c.order_id}` : c.event_type}
          </Text>
        </Space>
      ),
    },
    {
      title: "Revenue",
      dataIndex: "revenue",
      render: v => <Text style={{ color: "#22c55e", fontWeight: 700 }}>${(v || 0).toFixed(2)}</Text>,
    },
    {
      title: "Commission",
      dataIndex: "commission_amount",
      render: v => <Text style={{ color: "#818cf8", fontWeight: 700 }}>${(v || 0).toFixed(2)}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: s => <Tag color={STATUS_COLOR[s] || "default"}>{s}</Tag>,
    },
    {
      title: "Date",
      dataIndex: "converted_at",
      render: v => <Text style={{ color: "#475569", fontSize: 12 }}>{new Date(v).toLocaleDateString()}</Text>,
    },
    {
      title: "Actions",
      render: (_, c) => (
        c.status === "pending" && canApprove ? (
          <Space>
            <Popconfirm
              title="Approve this conversion?"
              onConfirm={() => act(c.id, "approve")}
              okText="Approve"
            >
              <Button
                size="small"
                icon={<CheckOutlined />}
                style={{ color: "#10b981", borderColor: "#10b981" }}
                loading={acting === c.id}
              >
                Approve
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Reject this conversion?"
              onConfirm={() => act(c.id, "reject")}
              okText="Reject"
              okButtonProps={{ danger: true }}
            >
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                loading={acting === c.id}
              >
                Reject
              </Button>
            </Popconfirm>
          </Space>
        ) : null
      ),
    },
  ];

  const tabItems = ["all", "pending", "approved", "rejected", "paid"].map(s => ({
    key: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  }));

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ margin: "0 0 4px", color: "#fff" }}>Conversions</Title>
        <Text style={{ color: "#475569" }}>Review and approve affiliate conversions before payout.</Text>
      </div>

      <Tabs
        activeKey={filter}
        onChange={setFilter}
        items={tabItems}
        style={{ marginBottom: 20 }}
      />

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 14, overflow: "hidden" }}>


        <Table
        columns={columns}
        dataSource={conversions}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: <Empty description="No conversions yet." image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />
      </Card>
    </div>
  );
}
