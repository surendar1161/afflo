"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useOrg } from "@/lib/hooks/useOrg";
import {
  Table, Button, Tag, Space, Typography, Popconfirm, App, Empty, Card,
  Drawer, Form, Input, InputNumber, Select, Switch, Row, Col, Divider, Steps,
} from "antd";
import {
  PlusOutlined, StopOutlined, AppstoreOutlined,
  DollarOutlined, CalendarOutlined, GlobalOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type Program = {
  id: string; name: string; category: string | null; status: string;
  default_commission_type: string; default_commission_value: number;
  currency: string; payout_frequency: string; created_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  active: "success", draft: "default", paused: "warning", closed: "error",
};

const CATEGORIES = ["ecommerce","saas","creator","finance","health","other"];
const CURRENCIES = ["USD","EUR","GBP","CAD","AUD","INR","SGD","AED"];
const STEPS = [
  { title: "Details",    icon: <AppstoreOutlined /> },
  { title: "Commission", icon: <DollarOutlined /> },
  { title: "Payouts",    icon: <CalendarOutlined /> },
];

export default function ProgramsPage() {
  const { message } = App.useApp();
  const { ctx } = useOrg();
  const [programs, setPrograms]   = useState<Program[]>([]);
  const [loading, setLoading]     = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [step, setStep]           = useState(0);
  const [saving, setSaving]       = useState(false);
  const [commType, setCommType]   = useState("percentage");
  const [form]                    = Form.useForm();

  useEffect(() => { if (ctx?.organization?.id) load(); }, [ctx?.organization?.id]);

  const load = async () => {
    setLoading(true);
    const res  = await fetch("/api/programs");
    const data = await res.json();
    setPrograms(data.programs || []);
    setLoading(false);
  };

  const archive = async (id: string) => {
    await fetch(`/api/programs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    message.success("Program archived");
    load();
  };

  const openDrawer = () => {
    form.resetFields();
    setStep(0);
    setCommType("percentage");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    form.resetFields();
    setStep(0);
  };

  const nextStep = async () => {
    const fields: Record<number, string[]> = {
      0: ["name", "description", "website", "category"],
      1: ["default_commission_type", "default_commission_value", "cookie_duration_days", "currency"],
    };
    try {
      await form.validateFields(fields[step] || []);
      setStep(s => s + 1);
    } catch { /* validation shown by antd */ }
  };

  const submit = async () => {
    try {
      await form.validateFields();
    } catch { return; }
    setSaving(true);
    const values = form.getFieldsValue(true);
    const res    = await fetch("/api/programs", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(values),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { message.error(data.error || "Failed to create program"); return; }
    message.success(`"${values.name}" created successfully!`);
    closeDrawer();
    load();
  };

  const columns: ColumnsType<Program> = [
    {
      title: "Program",
      dataIndex: "name",
      render: (name, record) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: "#12344d" }}>{name}</Text>
          {record.category && (
            <Tag style={{ fontSize: 11, textTransform: "capitalize" }}>{record.category}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: s => <Tag color={STATUS_COLOR[s] || "default"} style={{ textTransform: "capitalize" }}>{s}</Tag>,
    },
    {
      title: "Commission",
      width: 130,
      render: (_, r) => (
        <Text style={{ color: "#475867", fontWeight: 600 }}>
          {r.default_commission_value}
          {r.default_commission_type === "percentage" ? "%" : ` ${r.currency}`}
        </Text>
      ),
    },
    {
      title: "Payout",
      dataIndex: "payout_frequency",
      width: 110,
      render: v => <Text style={{ color: "#475867", textTransform: "capitalize" }}>{v}</Text>,
    },
    {
      title: "Currency",
      dataIndex: "currency",
      width: 90,
      render: v => <Tag>{v}</Tag>,
    },
    {
      title: "Created",
      dataIndex: "created_at",
      width: 110,
      render: v => <Text style={{ color: "#475867", fontSize: 12 }}>{new Date(v).toLocaleDateString()}</Text>,
    },
    {
      title: "Actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Link href={`/dashboard/programs/${record.id}`}>
            <Button size="small">View</Button>
          </Link>
          {record.status !== "closed" && (
            <Popconfirm
              title="Archive this program?"
              description="Affiliates will no longer be able to generate links."
              onConfirm={() => archive(record.id)}
              okText="Archive"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <Title level={2} style={{ margin: "0 0 4px", color: "#12344d" }}>Programs</Title>
          <Text style={{ color: "#8fa0b4" }}>Manage your affiliate programs and commission rules.</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openDrawer}
          style={{ fontWeight: 600 }}
        >
          New Program
        </Button>
      </div>

      {/* Programs table */}
      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: "hidden" }}>
        <Table
          columns={columns}
          dataSource={programs}
          rowKey="id"
          loading={loading}
          locale={{
            emptyText: (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <Text strong style={{ color: "#12344d", display: "block", marginBottom: 6 }}>No programs yet</Text>
                <Text style={{ color: "#8fa0b4", display: "block", marginBottom: 20 }}>Create your first affiliate program to start recruiting affiliates.</Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={openDrawer}>Create Program</Button>
              </div>
            ),
          }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </Card>

      {/* ── New Program Drawer ──────────────────────────────────────── */}
      <Drawer
        title={
          <Space>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#2C5CC5,#1a4aad)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AppstoreOutlined style={{ color: "#fff", fontSize: 16 }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#12344d", lineHeight: 1.2 }}>New Affiliate Program</div>
              <div style={{ fontSize: 12, color: "#8fa0b4", fontWeight: 400 }}>Fill in the details to launch your program</div>
            </div>
          </Space>
        }
        placement="right"
        width={520}
        open={drawerOpen}
        onClose={closeDrawer}
        styles={{
          header:  { background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px" },
          body:    { background: "#f5f7f9", padding: 0, overflowY: "auto" },
          footer:  { background: "#ffffff", borderTop: "1px solid #e2e8f0", padding: "14px 24px" },
          mask:    { backdropFilter: "blur(4px)", background: "rgba(12,52,77,0.3)" },
        }}
        footer={
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Button onClick={closeDrawer} style={{ color: "#8fa0b4" }}>Cancel</Button>
            <Space>
              {step > 0 && (
                <Button onClick={() => setStep(s => s - 1)}>← Back</Button>
              )}
              {step < 2 ? (
                <Button type="primary" onClick={nextStep} style={{ fontWeight: 600, minWidth: 100 }}>
                  Next →
                </Button>
              ) : (
                <Button type="primary" onClick={submit} loading={saving} style={{ fontWeight: 600, minWidth: 140 }}>
                  {saving ? "Creating…" : "✓ Create Program"}
                </Button>
              )}
            </Space>
          </Space>
        }
      >
        {/* Step indicator */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", background: "#ffffff" }}>
          <Steps
            current={step}
            size="small"
            items={STEPS.map((s, i) => ({
              title: <Text style={{ fontSize: 12, fontWeight: step === i ? 700 : 400, color: step === i ? "#2C5CC5" : "#8fa0b4" }}>{s.title}</Text>,
              icon: <span style={{ color: step === i ? "#2C5CC5" : step > i ? "#00875A" : "#8fa0b4", fontSize: 14 }}>{step > i ? "✓" : s.icon}</span>,
            }))}
          />
        </div>

        <Form
          form={form}
          layout="vertical"
          style={{ padding: "24px", background: "#f5f7f9" }}
          initialValues={{
            category: "ecommerce",
            default_commission_type: "percentage",
            default_commission_value: 10,
            cookie_duration_days: 30,
            payout_frequency: "monthly",
            min_payout_amount: 50,
            currency: "USD",
            is_public: true,
          }}
        >
          {/* ── Step 0: Program Details ─────────────────────────── */}
          <div style={{ display: step === 0 ? "block" : "none" }}>
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ color: "#12344d", fontSize: 14 }}>Program details</Text>
              <Paragraph style={{ color: "#8fa0b4", fontSize: 12, margin: "4px 0 0" }}>
                Basic information about your affiliate program.
              </Paragraph>
            </div>

            <Form.Item
              name="name"
              label="Program name"
              rules={[{ required: true, message: "Program name is required" }]}
            >
              <Input placeholder="e.g. FreshAffiliates Partner Program" size="large" autoFocus />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea
                placeholder="Tell affiliates what your program offers, commissions, and who it's for…"
                rows={3}
                style={{ resize: "none" }}
              />
            </Form.Item>

            <Row gutter={14}>
              <Col span={12}>
                <Form.Item name="website" label="Website URL">
                  <Input prefix={<GlobalOutlined style={{ color: "#475867" }} />} placeholder="https://yoursite.com" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="category" label="Category">
                  <Select>
                    {CATEGORIES.map(c => (
                      <Select.Option key={c} value={c} style={{ textTransform: "capitalize" }}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="is_public" valuePropName="checked">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#ebf0fb", border: "1px solid rgba(44,92,197,0.2)", borderRadius: 6 }}>
                <div>
                  <Text style={{ color: "#12344d", fontSize: 13, fontWeight: 600, display: "block" }}>List in marketplace</Text>
                  <Text style={{ color: "#8fa0b4", fontSize: 12 }}>Allow affiliates to discover and apply to your program</Text>
                </div>
                <Switch />
              </div>
            </Form.Item>
          </div>

          {/* ── Step 1: Commission Settings ─────────────────────── */}
          <div style={{ display: step === 1 ? "block" : "none" }}>
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ color: "#12344d", fontSize: 14 }}>Commission settings</Text>
              <Paragraph style={{ color: "#8fa0b4", fontSize: 12, margin: "4px 0 0" }}>
                How much will affiliates earn for each conversion they drive?
              </Paragraph>
            </div>

            <Row gutter={14}>
              <Col span={12}>
                <Form.Item name="default_commission_type" label="Commission type" rules={[{ required: true }]}>
                  <Select onChange={v => setCommType(v as string)}>
                    <Select.Option value="percentage">Percentage (%)</Select.Option>
                    <Select.Option value="flat">Flat amount</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="default_commission_value"
                  label={commType === "percentage" ? "Rate (%)" : "Amount"}
                  rules={[{ required: true, message: "Required" }]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    max={commType === "percentage" ? 100 : undefined}
                    precision={2}
                    addonAfter={commType === "percentage" ? "%" : undefined}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={14}>
              <Col span={12}>
                <Form.Item name="cookie_duration_days" label="Cookie duration (days)">
                  <InputNumber style={{ width: "100%" }} min={1} max={365} addonAfter="days" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="currency" label="Currency">
                  <Select>
                    {CURRENCIES.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* Commission preview */}
            <div style={{ padding: "14px 16px", background: "#e0f5ed", border: "1px solid rgba(0,135,90,0.2)", borderRadius: 6 }}>
              <Text style={{ color: "#00875A", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>
                Commission preview
              </Text>
              <Text style={{ color: "#475867", fontSize: 13 }}>
                On a $100 sale, affiliates earn{" "}
                <Text strong style={{ color: "#00875A", fontSize: 14 }}>
                  {commType === "percentage"
                    ? `$${((form.getFieldValue("default_commission_value") || 10) * 1).toFixed(2)}`
                    : `$${(form.getFieldValue("default_commission_value") || 0).toFixed(2)}`}
                </Text>
              </Text>
            </div>
          </div>

          {/* ── Step 2: Payout Settings ──────────────────────────── */}
          <div style={{ display: step === 2 ? "block" : "none" }}>
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ color: "#12344d", fontSize: 14 }}>Payout settings</Text>
              <Paragraph style={{ color: "#8fa0b4", fontSize: 12, margin: "4px 0 0" }}>
                When and how much affiliates need to earn before getting paid.
              </Paragraph>
            </div>

            <Form.Item name="payout_frequency" label="Payout frequency">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { value: "instant",  label: "Instant",   desc: "Pay immediately on approval" },
                  { value: "weekly",   label: "Weekly",    desc: "Every Friday" },
                  { value: "biweekly", label: "Bi-weekly", desc: "Every 2 weeks" },
                  { value: "monthly",  label: "Monthly",   desc: "1st of each month" },
                ].map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => form.setFieldValue("payout_frequency", opt.value)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 6,
                      border: `1.5px solid ${form.getFieldValue("payout_frequency") === opt.value ? "#2C5CC5" : "#e2e8f0"}`,
                      background: form.getFieldValue("payout_frequency") === opt.value ? "#ebf0fb" : "#ffffff",
                      cursor: "pointer",
                      transition: "all .15s",
                    }}
                  >
                    <Text strong style={{ color: "#12344d", fontSize: 13, display: "block" }}>{opt.label}</Text>
                    <Text style={{ color: "#8fa0b4", fontSize: 11 }}>{opt.desc}</Text>
                  </div>
                ))}
              </div>
            </Form.Item>

            <Form.Item name="min_payout_amount" label="Minimum payout threshold">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                precision={2}
                addonBefore="$"
                placeholder="50"
              />
            </Form.Item>

            <Divider style={{ borderColor: "#edf0f4", margin: "20px 0" }} />

            {/* Summary */}
            <div style={{ background: "#ffffff", border: "1px solid #e8ecf2", borderRadius: 8, padding: 16 }}>
              <Text style={{ color: "#8fa0b4", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 12 }}>
                Program summary
              </Text>
              {[
                ["Name",       form.getFieldValue("name")          || "—"],
                ["Category",   form.getFieldValue("category")       || "—"],
                ["Commission", `${form.getFieldValue("default_commission_value") || 0}${form.getFieldValue("default_commission_type") === "percentage" ? "%" : " flat"}`],
                ["Cookie",     `${form.getFieldValue("cookie_duration_days") || 30} days`],
                ["Currency",   form.getFieldValue("currency")       || "USD"],
                ["Payouts",    form.getFieldValue("payout_frequency") || "monthly"],
                ["Min payout", `$${form.getFieldValue("min_payout_amount") || 50}`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid #f2f5f8" }}>
                  <Text style={{ color: "#8fa0b4", fontSize: 13 }}>{label}</Text>
                  <Text strong style={{ color: "#12344d", fontSize: 13, textTransform: "capitalize" }}>{value}</Text>
                </div>
              ))}
            </div>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}
