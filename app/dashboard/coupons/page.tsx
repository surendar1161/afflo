"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Card, Table, Button, Drawer, Form, Input, Select, InputNumber,
  Tag, Typography, Space, Popconfirm, DatePicker, Switch, message, Tooltip,
} from "antd";
import {
  PlusOutlined, DeleteOutlined, CopyOutlined, TagOutlined, CheckCircleOutlined, CloseCircleOutlined,
} from "@ant-design/icons";
import { useOrg } from "@/lib/hooks/useOrg";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface Coupon {
  id: string; code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number; currency: string;
  usage_limit: number | null; usage_count: number;
  min_order_value: number; is_active: boolean;
  expires_at: string | null; notes: string | null;
  affiliate: { full_name: string; email: string } | null;
  program: { name: string } | null;
  created_at: string;
}

export default function CouponsPage() {
  const { ctx } = useOrg();
  const [coupons, setCoupons]     = useState<Coupon[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [programs, setPrograms]   = useState<any[]>([]);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/coupons");
    const d = await r.json();
    setCoupons(d.coupons || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = async () => {
    // Load affiliates + programs for the form
    const [ar, pr] = await Promise.all([
      fetch("/api/affiliates").then(r => r.json()),
      fetch("/api/programs").then(r => r.json()),
    ]);
    setAffiliates(ar.affiliates || []);
    setPrograms(pr.programs || []);
    form.resetFields();
    setModalOpen(true);
  };

  const createCoupon = async (values: any) => {
    setSaving(true);
    try {
      const r = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          expires_at: values.expires_at ? values.expires_at.toISOString() : null,
          code: values.code.toUpperCase().trim(),
        }),
      });
      const d = await r.json();
      if (!r.ok) { message.error(d.error); return; }
      message.success("Coupon created");
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    await fetch("/api/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: coupon.id, is_active: !coupon.is_active }),
    });
    load();
  };

  const deleteCoupon = async (id: string) => {
    await fetch(`/api/coupons?id=${id}`, { method: "DELETE" });
    message.success("Coupon deleted");
    load();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success("Copied!");
  };

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      render: (code: string, row: Coupon) => (
        <Space>
          <Tag style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, background: "#f5f7f9", color: "#2C5CC5", border: "1px solid rgba(44,92,197,0.25)", padding: "2px 10px" }}>
            {code}
          </Tag>
          {!row.is_active && <Tag color="default" style={{ fontSize: 11 }}>Inactive</Tag>}
          <Tooltip title="Copy code">
            <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyCode(code)} style={{ color: "#a0b0c0" }} />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Discount",
      render: (_: any, row: Coupon) => (
        <Text style={{ color: "#00875A", fontWeight: 700 }}>
          {row.discount_type === "percentage"
            ? `${row.discount_value}% off`
            : `${row.currency} ${row.discount_value} off`}
        </Text>
      ),
    },
    {
      title: "Affiliate",
      render: (_: any, row: Coupon) => (
        <div>
          <Text style={{ color: "#12344d", fontSize: 13 }}>{row.affiliate?.full_name || "—"}</Text>
          <br />
          <Text style={{ color: "#a0b0c0", fontSize: 11 }}>{row.affiliate?.email || ""}</Text>
        </div>
      ),
    },
    {
      title: "Program",
      render: (_: any, row: Coupon) => (
        <Text style={{ color: "#475867", fontSize: 13 }}>{row.program?.name || "—"}</Text>
      ),
    },
    {
      title: "Usage",
      render: (_: any, row: Coupon) => (
        <Text style={{ color: "#475867" }}>
          {row.usage_count}{row.usage_limit !== null ? ` / ${row.usage_limit}` : ""}
        </Text>
      ),
    },
    {
      title: "Expires",
      render: (_: any, row: Coupon) => row.expires_at
        ? <Text style={{ color: new Date(row.expires_at) < new Date() ? "#D72D30" : "#475867", fontSize: 12 }}>
            {dayjs(row.expires_at).format("MMM D, YYYY")}
          </Text>
        : <Text style={{ color: "#a0b0c0", fontSize: 12 }}>Never</Text>,
    },
    {
      title: "Active",
      render: (_: any, row: Coupon) => (
        <Switch
          checked={row.is_active}
          size="small"
          onChange={() => toggleActive(row)}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<CloseCircleOutlined />}
        />
      ),
    },
    {
      title: "",
      render: (_: any, row: Coupon) => (
        <Popconfirm title="Delete this coupon?" onConfirm={() => deleteCoupon(row.id)} okText="Delete" okButtonProps={{ danger: true }}>
          <Button size="small" type="text" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ color: "#12344d", margin: 0 }}>
            <TagOutlined style={{ marginRight: 8 }} />
            Coupon Codes
          </Title>
          <Text style={{ color: "#8fa0b4", fontSize: 13 }}>
            Assign discount codes to affiliates. Conversions from code usage are attributed automatically.
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
          New Coupon
        </Button>
      </div>

      <Card style={{ background: "#ffffff", border: "1px solid #e8ecf2" }} bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={coupons}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: <div style={{ padding: 40, color: "#a0b0c0" }}>No coupon codes yet. Create one to get started.</div> }}
          style={{ background: "transparent" }}
        />
      </Card>

      <style>{`
        .ant-table { background: transparent !important; }
        .ant-table-thead > tr > th { background: #f8fafc !important; color: #475867 !important; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #edf0f4 !important; }
        .ant-table-tbody > tr > td { background: transparent !important; border-bottom: 1px solid #f2f5f8 !important; }
        .ant-table-tbody > tr:hover > td { background: rgba(44,92,197,0.03) !important; }
      `}</style>

      <Drawer
        title={<Text style={{ color: "#12344d", fontWeight: 700, fontSize: 16 }}>New Coupon Code</Text>}
        placement="right"
        width={480}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              Create Coupon
            </Button>
          </div>
        }
        styles={{
          header: { borderBottom: "1px solid #e2e8f0", padding: "16px 24px" },
          body:   { padding: 24 },
          footer: { borderTop: "1px solid #e2e8f0", padding: "14px 24px" },
        }}
      >
        <Form form={form} layout="vertical" onFinish={createCoupon}>
          <Form.Item name="program_id" label={<Text style={{ color: "#475867" }}>Program</Text>} rules={[{ required: true }]}>
            <Select placeholder="Select program" options={programs.map((p: any) => ({ label: p.name, value: p.id }))} />
          </Form.Item>
          <Form.Item name="affiliate_id" label={<Text style={{ color: "#475867" }}>Affiliate</Text>} rules={[{ required: true }]}>
            <Select
              placeholder="Select affiliate"
              showSearch
              optionFilterProp="label"
              options={affiliates.map((a: any) => ({ label: `${a.full_name || a.email} (${a.email})`, value: a.id }))}
            />
          </Form.Item>
          <Form.Item name="code" label={<Text style={{ color: "#475867" }}>Code</Text>} rules={[{ required: true, pattern: /^[A-Z0-9_-]+$/i, message: "Letters, numbers, - and _ only" }]}
            extra={<Text style={{ fontSize: 12, color: "#8fa0b4" }}>e.g. JOHN20, SAVE15 — shown to customers at checkout</Text>}>
            <Input placeholder="JOHN20" style={{ fontFamily: "monospace", textTransform: "uppercase" }} />
          </Form.Item>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="discount_type" label={<Text style={{ color: "#475867" }}>Discount type</Text>} initialValue="percentage" style={{ flex: 1 }}>
              <Select options={[{ label: "Percentage (%)", value: "percentage" }, { label: "Fixed amount", value: "fixed" }]} />
            </Form.Item>
            <Form.Item name="discount_value" label={<Text style={{ color: "#475867" }}>Value</Text>} initialValue={10} rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="usage_limit" label={<Text style={{ color: "#475867" }}>Usage limit</Text>}
              extra={<Text style={{ fontSize: 12, color: "#8fa0b4" }}>Leave blank for unlimited</Text>} style={{ flex: 1 }}>
              <InputNumber min={1} placeholder="Unlimited" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="min_order_value" label={<Text style={{ color: "#475867" }}>Min order ($)</Text>} initialValue={0} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item name="expires_at" label={<Text style={{ color: "#475867" }}>Expiry date</Text>}
            extra={<Text style={{ fontSize: 12, color: "#8fa0b4" }}>Leave blank — coupon never expires</Text>}>
            <DatePicker style={{ width: "100%" }} disabledDate={(d) => d.isBefore(dayjs())} />
          </Form.Item>
          <Form.Item name="notes" label={<Text style={{ color: "#475867" }}>Internal notes</Text>}>
            <Input.TextArea rows={3} placeholder="e.g. Created for influencer campaign Q3 2026 (optional)" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
