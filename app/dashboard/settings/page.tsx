"use client";
import { useEffect } from "react";
import { useOrg } from "@/lib/hooks/useOrg";
import {
  Form, Input, Select, Card, Button, Alert, Divider, Typography, Space, App, Row, Col, Tag,
} from "antd";
import { SaveOutlined, RocketOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function SettingsPage() {
  const { message } = App.useApp();
  const { ctx, refresh } = useOrg();
  const [form] = Form.useForm();

  useEffect(() => {
    if (ctx?.organization) {
      const o = ctx.organization;
      form.setFieldsValue({
        name: o.name || "",
        website: o.website || "",
        industry: o.industry || "",
        timezone: o.timezone || "UTC",
        default_currency: o.default_currency || "USD",
        portal_domain: o.portal_domain || "",
      });
    }
  }, [ctx?.organization?.id]);

  const save = async (values: Record<string, unknown>) => {
    const res  = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      message.error(data.error);
    } else {
      message.success("Settings saved successfully.");
      refresh();
    }
  };

  const canEdit = ctx?.role && ["owner", "admin"].includes(ctx.role);
  const org     = ctx?.organization;

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: "0 0 4px", color: "#fff" }}>Organization Settings</Title>
        <Text style={{ color: "#475569" }}>Manage your organization details, branding, and preferences.</Text>
      </div>

      {!canEdit && (
        <Alert
          type="info"
          message="Only admins and owners can change organization settings."
          style={{ marginBottom: 20 }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={save} disabled={!canEdit}>
        <Card title={<Text strong style={{ color: "#fff" }}>Organization details</Text>} style={{ marginBottom: 20 }}>
          <Form.Item name="name" label="Organization name" rules={[{ required: true }]}>
            <Input placeholder="Acme Corp" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="website" label="Website">
                <Input type="url" placeholder="https://yoursite.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="industry" label="Industry">
                <Select allowClear placeholder="Select…">
                  {["ecommerce", "saas", "creator", "finance", "health", "other"].map(i => (
                    <Select.Option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="default_currency" label="Default currency">
                <Select>
                  {["USD", "EUR", "GBP", "CAD", "AUD", "INR"].map(c => (
                    <Select.Option key={c} value={c}>{c}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="timezone" label="Timezone">
                <Select>
                  {["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney"].map(tz => (
                    <Select.Option key={tz} value={tz}>{tz}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="portal_domain" label="Custom portal domain">
                <Input placeholder="affiliates.yoursite.com" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Plan info */}
        <Card title={<Text strong style={{ color: "#fff" }}>Current plan</Text>} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <Space>
                <Text style={{ fontSize: 20, fontWeight: 900, color: "#6366f1", textTransform: "capitalize" }}>
                  {org?.plan || "—"}
                </Text>
                <Tag color={org?.plan === "trial" ? "warning" : "success"} style={{ fontWeight: 700 }}>
                  {org?.plan?.toUpperCase()}
                </Tag>
              </Space>
              {org?.trial_ends_at && org.plan === "trial" && (
                <div style={{ fontSize: 13, color: "#f59e0b", marginTop: 4 }}>
                  Trial ends {new Date(org.trial_ends_at).toLocaleDateString()}
                </div>
              )}
            </div>
            <Button type="primary" icon={<RocketOutlined />} style={{ fontWeight: 700 }}>
              Upgrade plan →
            </Button>
          </div>
        </Card>

        <Divider style={{ borderColor: "#edf0f4" }} />

        {canEdit && (
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            size="large"
            style={{ fontWeight: 700 }}
          >
            Save settings
          </Button>
        )}
      </Form>
    </div>
  );
}
