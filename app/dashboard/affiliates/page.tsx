"use client";
import { useEffect, useState } from "react";
import { useOrg } from "@/lib/hooks/useOrg";
import {
  Table, Card, Button, Drawer, Form, Input, Select, Tag, Avatar,
  Space, Typography, App, Empty, Divider, Row, Col,
} from "antd";
import { PlusOutlined, UserOutlined, SearchOutlined, TeamOutlined, MailOutlined, GlobalOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

type Affiliate = {
  id: string; email: string; full_name: string | null; country_code: string | null;
  niche: string[]; created_at: string; memberships?: { status: string; program_id: string }[];
};

const NICHES = ["Technology","Finance","Health","Lifestyle","Fashion","Food","Travel","Gaming","Crypto","Education","Business","Beauty","Fitness","Entertainment","Other"];

export default function AffiliatesPage() {
  const { message } = App.useApp();
  const { ctx }     = useOrg();

  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [programs, setPrograms]     = useState<{ id: string; name: string }[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inviting, setInviting]     = useState(false);
  const [form]                      = Form.useForm();

  useEffect(() => {
    if (ctx?.organization?.id) { load(); loadPrograms(); }
  }, [ctx?.organization?.id]);

  const load = async () => {
    setLoading(true);
    const res  = await fetch(`/api/affiliates${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    const data = await res.json();
    setAffiliates(data.affiliates || []);
    setLoading(false);
  };

  const loadPrograms = async () => {
    const res  = await fetch("/api/programs?status=active");
    const data = await res.json();
    setPrograms(data.programs || []);
  };

  const handleAdd = async (values: { email: string; full_name?: string; program_id: string; country_code?: string; niche?: string[]; website?: string }) => {
    setInviting(true);
    const res  = await fetch("/api/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    setInviting(false);
    if (!res.ok) { message.error(data.error || "Failed to add affiliate"); return; }

    if (data.email_sent && !data.existing_user) {
      message.success(`✉ Invite email sent to ${values.email}! They'll receive a link to set their password and access the portal.`, 6);
    } else if (data.existing_user) {
      message.info(`${values.email} already has a portal account. They can sign in at /portal/sign-in`, 5);
    } else {
      message.warning(`Affiliate added, but invite email failed. Share this link manually: ${data.portal_url}`, 8);
    }

    form.resetFields();
    setDrawerOpen(false);
    load();
  };

  const columns: ColumnsType<Affiliate> = [
    {
      title: "Affiliate",
      render: (_, a) => (
        <Space>
          <Avatar size={36} style={{ background: "linear-gradient(135deg,#2C5CC5,#8b5cf6)", fontWeight: 800, fontSize: 14 }}>
            {(a.full_name || a.email)[0].toUpperCase()}
          </Avatar>
          <div>
            <Text strong style={{ color: "#12344d", fontSize: 14, display: "block" }}>{a.full_name || "—"}</Text>
            <Text style={{ color: "#8fa0b4", fontSize: 12 }}>{a.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Programs",
      render: (_, a) => (
        <Text style={{ color: "#475867" }}>
          {a.memberships?.length || 0} program{(a.memberships?.length || 0) !== 1 ? "s" : ""}
        </Text>
      ),
      width: 110,
    },
    {
      title: "Niche",
      dataIndex: "niche",
      render: (v: string[]) => v?.length ? <Tag style={{ borderRadius: 24, fontSize: 11 }}>{v[0]}</Tag> : <Text style={{ color: "#4a4a4a" }}>—</Text>,
      width: 120,
    },
    {
      title: "Country",
      dataIndex: "country_code",
      render: v => <Text style={{ color: "#8fa0b4" }}>{v || "—"}</Text>,
      width: 90,
    },
    {
      title: "Joined",
      dataIndex: "created_at",
      render: v => <Text style={{ color: "#4a4a4a", fontSize: 12 }}>{new Date(v).toLocaleDateString()}</Text>,
      width: 100,
    },
  ];

  const DRAWER_STYLES = {
    header: { background: "#ffffff", borderBottom: "1px solid #edf0f4", padding: "14px 20px" },
    body:   { background: "#f5f7f9", padding: "20px" },
    footer: { background: "#ffffff", borderTop: "1px solid #edf0f4", padding: "12px 20px" },
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <Title level={2} style={{ margin: "0 0 4px", color: "#12344d" }}>Affiliates</Title>
          <Text style={{ color: "#8fa0b4" }}>{affiliates.length} affiliate{affiliates.length !== 1 ? "s" : ""} in your organization.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)} style={{ fontWeight: 600 }}>
          Add Affiliate
        </Button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20, maxWidth: 380 }}>
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onPressEnter={load}
          prefix={<SearchOutlined style={{ color: "#a0b0c0" }} />}
          allowClear
          onClear={load}
        />
      </div>

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: "hidden" }}>
        <Table
          columns={columns}
          dataSource={affiliates}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <Text strong style={{ color: "#12344d", display: "block", marginBottom: 6 }}>No affiliates yet</Text>
              <Text style={{ color: "#8fa0b4", display: "block", marginBottom: 20 }}>Add affiliates to your programs to start tracking performance.</Text>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>Add First Affiliate</Button>
            </div>
          )}}
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </Card>

      {/* ── Add Affiliate Drawer ──────────────────────────────────────────── */}
      <Drawer
        title={
          <Space>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg,#00C48C,#059669)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TeamOutlined style={{ color: "#fff", fontSize: 14 }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#12344d" }}>Add Affiliate</div>
              <div style={{ fontSize: 11, color: "#8fa0b4", fontWeight: 400 }}>Enroll an affiliate into one of your programs</div>
            </div>
          </Space>
        }
        placement="right"
        width={460}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); form.resetFields(); }}
        styles={DRAWER_STYLES}
        footer={
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Button onClick={() => { setDrawerOpen(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" loading={inviting} onClick={() => form.submit()} style={{ fontWeight: 600, minWidth: 130 }}>
              {inviting ? "Adding…" : "✓ Add Affiliate"}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Divider style={{ borderColor: "#edf0f4", margin: "0 0 16px" }}>
            <Text style={{ color: "#8fa0b4", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Contact info</Text>
          </Divider>

          <Row gutter={12}>
            <Col span={14}>
              <Form.Item name="email" label="Email *" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
                <Input prefix={<MailOutlined style={{ color: "#a0b0c0" }} />} placeholder="affiliate@email.com" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="full_name" label="Full name">
                <Input prefix={<UserOutlined style={{ color: "#a0b0c0" }} />} placeholder="Jane Smith" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="website" label="Website / Blog">
                <Input prefix={<GlobalOutlined style={{ color: "#a0b0c0" }} />} placeholder="https://yourblog.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="country_code" label="Country">
                <Select placeholder="Select…" showSearch allowClear>
                  {["US","GB","CA","AU","IN","DE","FR","BR","SG","NL","SE","NG","ZA","PH","AE","PK","MY"].map(c => (
                    <Select.Option key={c} value={c}>{c}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="niche" label="Niche / Audience">
            <Select mode="multiple" placeholder="e.g. Technology, Finance…" maxTagCount={3}>
              {NICHES.map(n => <Select.Option key={n} value={n}>{n}</Select.Option>)}
            </Select>
          </Form.Item>

          <Divider style={{ borderColor: "#edf0f4", margin: "4px 0 16px" }}>
            <Text style={{ color: "#8fa0b4", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Program enrollment</Text>
          </Divider>

          <Form.Item name="program_id" label="Enroll in program *"
            rules={[{ required: true, message: "Select a program to enroll this affiliate" }]}
            extra={<Text style={{ color: "#4a4a4a", fontSize: 11 }}>A tracking link will be auto-generated after enrollment.</Text>}>
            <Select placeholder="Select program…" showSearch optionFilterProp="label">
              {programs.map(p => (
                <Select.Option key={p.id} value={p.id} label={p.name}>
                  <Space>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2C5CC5" }} />
                    {p.name}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {programs.length === 0 && (
            <div style={{ background: "rgba(255,198,57,0.08)", border: "1px solid rgba(255,198,57,0.2)", borderRadius: 6, padding: "10px 14px", marginTop: -8, marginBottom: 16 }}>
              <Text style={{ color: "#FFC639", fontSize: 13 }}>No active programs yet. Create a program first.</Text>
            </div>
          )}
        </Form>
      </Drawer>
    </div>
  );
}
