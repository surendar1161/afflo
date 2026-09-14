"use client";
import { useEffect, useState } from "react";
import { useOrg } from "@/lib/hooks/useOrg";
import { getOrgMembers, updateMemberRole, removeMember } from "@/lib/org/members";
import type { OrganizationMember, OrgRole } from "@/lib/types";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/types";
import {
  Table, Card, Button, Drawer, Form, Input, Select, Tag, Avatar, Popconfirm,
  Space, Typography, App, Row, Col, Divider,
} from "antd";
import { UserAddOutlined, MailOutlined, DeleteOutlined, TeamOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

const ROLES: OrgRole[] = ["admin", "member", "viewer"];

const ROLE_DESC: Record<OrgRole, string> = {
  owner:  "Full access including billing and org deletion",
  admin:  "Manage affiliates, approve conversions, invite members",
  member: "Day-to-day operations — create links, view reports",
  viewer: "Read-only access to analytics and reports",
};

const ROLE_PERMS: Record<OrgRole, string[]> = {
  owner:  ["All permissions", "Billing & plan", "Delete organization", "Invite team", "Manage affiliates"],
  admin:  ["Invite team members", "Manage affiliates", "Approve conversions", "View all reports"],
  member: ["Create tracking links", "Add affiliates", "View reports", "Cannot approve payouts"],
  viewer: ["View analytics", "View programs", "Read-only access — no write actions"],
};

export default function TeamPage() {
  const { message } = App.useApp();
  const { ctx, loading: orgLoading } = useOrg();

  const [members, setMembers]     = useState<OrganizationMember[]>([]);
  const [loading, setLoading]     = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inviting, setInviting]   = useState(false);
  const [form]                    = Form.useForm();
  const [previewRole, setPreviewRole] = useState<OrgRole>("member");

  const orgId   = ctx?.organization?.id;
  const myRole  = ctx?.role || "viewer";
  const isAdmin = ["owner","admin"].includes(myRole);

  useEffect(() => { if (!orgId) return; loadMembers(); }, [orgId]);

  const loadMembers = async () => {
    if (!orgId) return;
    setLoading(true);
    try { setMembers(await getOrgMembers(orgId)); }
    catch { }
    finally { setLoading(false); }
  };

  const handleInvite = async (values: { email: string; role: OrgRole }) => {
    if (!orgId) return;
    setInviting(true);
    try {
      const res  = await fetch("/api/org/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, email: values.email, role: values.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      message.success(`Invite sent to ${values.email}`);
      form.resetFields();
      setPreviewRole("member");
      setDrawerOpen(false);
      loadMembers();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: OrgRole) => {
    try { await updateMemberRole(memberId, role); loadMembers(); }
    catch { message.error("Failed to update role"); }
  };

  const handleRemove = async (memberId: string) => {
    try { await removeMember(memberId); message.success("Member removed"); loadMembers(); }
    catch { message.error("Failed to remove member"); }
  };

  const columns: ColumnsType<OrganizationMember> = [
    {
      title: "Member",
      render: (_, m) => {
        const profile = m.profile as unknown as Record<string, string>;
        const name    = profile?.full_name || "—";
        const isMe    = m.user_id === ctx?.member?.user_id;
        return (
          <Space>
            <Avatar size={36} style={{ background: `linear-gradient(135deg,${ROLE_COLORS[m.role]},${ROLE_COLORS[m.role]}88)`, fontWeight: 800, fontSize: 14 }}>
              {name[0]?.toUpperCase() || "?"}
            </Avatar>
            <div>
              <Space size={6}>
                <Text strong style={{ color: "#12344d" }}>{name}</Text>
                {isMe && <Tag style={{ fontSize: 10, borderRadius: 24 }}>You</Tag>}
              </Space>
              <div style={{ fontSize: 11, color: "#8fa0b4", marginTop: 2 }}>{ROLE_DESC[m.role]}</div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Status", dataIndex: "status", width: 110,
      render: (s, m) => (
        <Tag color={s === "pending" ? "warning" : "success"} style={{ borderRadius: 24 }}>
          {s === "pending" ? "Pending invite" : ROLE_LABELS[m.role]}
        </Tag>
      ),
    },
    {
      title: "Role", width: 140,
      render: (_, m) => {
        const isOwner = m.role === "owner";
        const isMe    = m.user_id === ctx?.member?.user_id;
        if (!isAdmin || isOwner || isMe) {
          return <Tag color={ROLE_COLORS[m.role] as string} style={{ borderRadius: 24, fontWeight: 700 }}>{ROLE_LABELS[m.role]}</Tag>;
        }
        return (
          <Select value={m.role} size="small" style={{ width: 110 }} onChange={v => handleRoleChange(m.id, v as OrgRole)}>
            {ROLES.map(r => <Select.Option key={r} value={r}>{ROLE_LABELS[r]}</Select.Option>)}
          </Select>
        );
      },
    },
    {
      title: "Actions", width: 100,
      render: (_, m) => {
        const isOwner = m.role === "owner";
        const isMe    = m.user_id === ctx?.member?.user_id;
        if (!isAdmin || isOwner || isMe) return null;
        return (
          <Popconfirm title="Remove this member?" description="They will lose access to this organization." onConfirm={() => handleRemove(m.id)} okText="Remove" okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />}>Remove</Button>
          </Popconfirm>
        );
      },
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
          <Title level={2} style={{ margin: "0 0 4px", color: "#12344d" }}>Team Management</Title>
          <Text style={{ color: "#8fa0b4" }}>Invite domain users and manage their roles and permissions.</Text>
        </div>
        {isAdmin && (
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => setDrawerOpen(true)} style={{ fontWeight: 600 }}>
            Invite Member
          </Button>
        )}
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: "hidden" }}>
            <Table
              columns={columns}
              dataSource={members}
              rowKey="id"
              loading={loading || orgLoading}
              pagination={false}
              locale={{ emptyText: (
                <div style={{ padding: "32px", textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
                  <Text style={{ color: "#8fa0b4" }}>No team members yet. Invite your first team member.</Text>
                </div>
              )}}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={<Space><SafetyCertificateOutlined style={{ color: "#2C5CC5" }} /><Text strong style={{ color: "#12344d" }}>Role permissions</Text></Space>}>
            {(["owner","admin","member","viewer"] as OrgRole[]).map(r => (
              <div key={r} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: r !== "viewer" ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <Tag color={ROLE_COLORS[r] as string} style={{ fontWeight: 700, borderRadius: 24, marginBottom: 8 }}>{ROLE_LABELS[r]}</Tag>
                <ul style={{ margin: "4px 0 0", padding: "0 0 0 16px" }}>
                  {ROLE_PERMS[r].map(p => <li key={p} style={{ color: "#8fa0b4", fontSize: 12, lineHeight: "1.7" }}>{p}</li>)}
                </ul>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* ── Invite Member Drawer ─────────────────────────────────────────── */}
      <Drawer
        title={
          <Space>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg,#2C5CC5,#1a4aad)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserAddOutlined style={{ color: "#fff", fontSize: 14 }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#12344d" }}>Invite Team Member</div>
              <div style={{ fontSize: 11, color: "#8fa0b4", fontWeight: 400 }}>They'll receive an email invitation to join your organization</div>
            </div>
          </Space>
        }
        placement="right"
        width={460}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); form.resetFields(); setPreviewRole("member"); }}
        styles={DRAWER_STYLES}
        footer={
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Button onClick={() => { setDrawerOpen(false); form.resetFields(); setPreviewRole("member"); }}>Cancel</Button>
            <Button type="primary" loading={inviting} onClick={() => form.submit()} disabled={!isAdmin} style={{ fontWeight: 600, minWidth: 120 }}>
              {inviting ? "Sending…" : "✉ Send Invite"}
            </Button>
          </Space>
        }
      >
        {!isAdmin ? (
          <div style={{ background: "rgba(44,92,197,0.06)", border: "1px solid rgba(44,92,197,0.15)", borderRadius: 6, padding: "14px 16px" }}>
            <Text style={{ color: "#2C5CC5", fontSize: 13 }}>Only admins and owners can invite team members.</Text>
          </div>
        ) : (
          <Form form={form} layout="vertical" onFinish={handleInvite} initialValues={{ role: "member" }}>
            <Form.Item name="email" label="Email address" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
              <Input prefix={<MailOutlined style={{ color: "#a0b0c0" }} />} placeholder="colleague@company.com" size="large" />
            </Form.Item>

            <Form.Item name="role" label="Role" rules={[{ required: true }]}>
              <Select size="large" onChange={v => setPreviewRole(v as OrgRole)}>
                {ROLES.map(r => (
                  <Select.Option key={r} value={r}>
                    <Space>
                      <Tag color={ROLE_COLORS[r] as string} style={{ borderRadius: 24, fontWeight: 700, margin: 0 }}>{ROLE_LABELS[r]}</Tag>
                      <Text style={{ color: "#8fa0b4", fontSize: 12 }}>{ROLE_DESC[r].slice(0, 38)}…</Text>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Role preview */}
            <Divider style={{ borderColor: "#edf0f4", margin: "4px 0 16px" }}>
              <Text style={{ color: "#4a4a4a", fontSize: 12 }}>What they can do</Text>
            </Divider>

            <div style={{ background: "#ffffff", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Tag color={ROLE_COLORS[previewRole] as string} style={{ borderRadius: 24, fontWeight: 700 }}>{ROLE_LABELS[previewRole]}</Tag>
                <Text style={{ color: "#8fa0b4", fontSize: 12 }}>{ROLE_DESC[previewRole]}</Text>
              </div>
              <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                {ROLE_PERMS[previewRole].map(p => (
                  <li key={p} style={{ color: "#475867", fontSize: 13, lineHeight: "1.8" }}>
                    <span style={{ color: "#00875A", marginRight: 6 }}>✓</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          </Form>
        )}
      </Drawer>
    </div>
  );
}
