"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Row, Col, Card, Statistic, Tag, Button, Tabs, Table, Typography,
  Spin, App, Popconfirm, Space, Divider, Badge, Progress,
} from "antd";
import {
  ArrowLeftOutlined, EditOutlined, StopOutlined, LinkOutlined,
  TeamOutlined, SyncOutlined, DollarOutlined, CopyOutlined, CheckOutlined,
  GlobalOutlined, CalendarOutlined, SettingOutlined, CodeOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

type Program = {
  id: string; name: string; description: string | null; website: string | null;
  category: string | null; status: string; is_public: boolean;
  default_commission_type: string; default_commission_value: number;
  cookie_duration_days: number; payout_frequency: string;
  min_payout_amount: number; currency: string;
  portal_primary_color: string; public_slug: string | null;
  created_at: string;
};
type Affiliate  = { id: string; email: string; full_name: string | null; created_at: string; membership?: { status: string } };
type TrackLink  = { id: string; short_code: string; name: string | null; click_count: number; conversion_count: number; affiliate?: { email: string; full_name: string | null } };
type Conversion = { id: string; revenue: number; commission_amount: number; status: string; converted_at: string; affiliate?: { email: string; full_name: string | null } };

const STATUS_COLOR: Record<string, string> = { active: "success", draft: "default", paused: "warning", closed: "error" };
const CONV_COLOR:   Record<string, string> = { pending: "warning", approved: "success", rejected: "error", paid: "processing" };
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";

export default function ProgramDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { message } = App.useApp();

  const [program, setProgram]     = useState<Program | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [links, setLinks]         = useState<TrackLink[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [stats, setStats]         = useState({ clicks: 0, conversions: 0, revenue: 0, commissions: 0 });
  const [loading, setLoading]     = useState(true);
  const [copied, setCopied]       = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [codeCopied, setCodeCopied] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "ok" | "fail">("idle");

  useEffect(() => { if (id) load(); }, [id]);

  const load = async () => {
    setLoading(true);
    const [progRes, affRes, linkRes, convRes] = await Promise.all([
      fetch(`/api/programs/${id}`),
      fetch(`/api/affiliates?program_id=${id}`),
      fetch(`/api/links?program_id=${id}`),
      fetch(`/api/conversions?program_id=${id}`),
    ]);

    const [progData, affData, linkData, convData] = await Promise.all([
      progRes.json(), affRes.json(), linkRes.json(), convRes.json(),
    ]);

    if (!progRes.ok) { message.error("Program not found"); router.push("/dashboard/programs"); return; }

    setProgram(progData.program);
    setAffiliates(affData.affiliates || []);
    setLinks(linkData.links || []);

    const convList: Conversion[] = convData.conversions || [];
    setConversions(convList);

    const approved = convList.filter(c => ["approved","paid"].includes(c.status));
    setStats({
      clicks:      (linkData.links || []).reduce((s: number, l: TrackLink) => s + l.click_count, 0),
      conversions: approved.length,
      revenue:     approved.reduce((s: number, c: Conversion) => s + (c.revenue || 0), 0),
      commissions: approved.reduce((s: number, c: Conversion) => s + (c.commission_amount || 0), 0),
    });

    setLoading(false);
  };

  const archive = async () => {
    setArchiving(true);
    await fetch(`/api/programs/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "closed" }) });
    message.success("Program archived");
    router.push("/dashboard/programs");
  };

  const copyPublicLink = () => {
    if (!program?.public_slug) return;
    navigator.clipboard.writeText(`${APP_URL}/join/${program.public_slug}`);
    message.success("Public program link copied!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
      <Spin size="large" />
    </div>
  );

  if (!program) return null;

  // ── Column definitions ────────────────────────────────────────────────────

  const affCols: ColumnsType<Affiliate> = [
    { title: "Affiliate", render: (_, a) => (
      <Space>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#2C5CC5,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>
          {(a.full_name || a.email)[0].toUpperCase()}
        </div>
        <div>
          <Text strong style={{ color: "#12344d", fontSize: 13, display: "block" }}>{a.full_name || "—"}</Text>
          <Text style={{ color: "#8fa0b4", fontSize: 11 }}>{a.email}</Text>
        </div>
      </Space>
    )},
    { title: "Status", render: (_, a) => <Tag color={(a.membership as any)?.status === "active" ? "success" : "default"}>{(a.membership as any)?.status || "active"}</Tag> },
    { title: "Joined",  dataIndex: "created_at", render: v => <Text style={{ color: "#8fa0b4", fontSize: 12 }}>{new Date(v).toLocaleDateString()}</Text>, width: 120 },
  ];

  const linkCols: ColumnsType<TrackLink> = [
    { title: "Affiliate", render: (_, l) => <Text style={{ color: "#12344d", fontSize: 13 }}>{l.affiliate?.full_name || l.affiliate?.email || "—"}</Text> },
    { title: "Link", render: (_, l) => (
      <Text style={{ color: "#2C5CC5", fontFamily: "monospace", fontSize: 12 }}>
        <LinkOutlined style={{ marginRight: 6 }} />{APP_URL}/r/{l.short_code}
      </Text>
    )},
    { title: "Clicks",      dataIndex: "click_count",      render: v => <Text style={{ fontWeight: 600, color: "#475867" }}>{v}</Text>, width: 90 },
    { title: "Conversions", dataIndex: "conversion_count", render: v => <Text style={{ fontWeight: 600, color: "#475867" }}>{v}</Text>, width: 110 },
  ];

  const convCols: ColumnsType<Conversion> = [
    { title: "Affiliate", render: (_, c) => <Text style={{ color: "#12344d", fontSize: 13 }}>{c.affiliate?.full_name || c.affiliate?.email || "—"}</Text> },
    { title: "Revenue",   dataIndex: "revenue",           render: v => <Text style={{ color: "#00875A", fontWeight: 700 }}>${(v || 0).toFixed(2)}</Text>, width: 110 },
    { title: "Commission",dataIndex: "commission_amount",  render: v => <Text style={{ color: "#2C5CC5", fontWeight: 700 }}>${(v || 0).toFixed(2)}</Text>, width: 120 },
    { title: "Status",    dataIndex: "status",             render: s => <Tag color={CONV_COLOR[s] || "default"}>{s}</Tag>, width: 110 },
    { title: "Date",      dataIndex: "converted_at",       render: v => <Text style={{ color: "#8fa0b4", fontSize: 12 }}>{new Date(v).toLocaleDateString()}</Text>, width: 110 },
  ];

  const convRate = stats.clicks > 0 ? ((stats.conversions / stats.clicks) * 100).toFixed(1) : "0";
  const epc      = stats.clicks > 0 ? (stats.commissions / stats.clicks).toFixed(4) : "0";

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/dashboard/programs")} style={{ marginTop: 4 }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Title level={2} style={{ margin: 0, color: "#12344d" }}>{program.name}</Title>
              <Tag color={STATUS_COLOR[program.status] || "default"} style={{ textTransform: "capitalize", fontSize: 12 }}>
                {program.status}
              </Tag>
              {program.category && <Tag style={{ textTransform: "capitalize", fontSize: 11 }}>{program.category}</Tag>}
            </div>
            <Space size={16}>
              {program.description && <Text style={{ color: "#8fa0b4", fontSize: 13 }}>{program.description}</Text>}
              {program.website && (
                <a href={program.website} target="_blank" rel="noreferrer" style={{ color: "#2C5CC5", fontSize: 13 }}>
                  <GlobalOutlined style={{ marginRight: 4 }} />{program.website}
                </a>
              )}
            </Space>
          </div>
        </div>

        <Space>
          {program.public_slug && (
            <Button
              icon={copied ? <CheckOutlined style={{ color: "#00875A" }} /> : <CopyOutlined />}
              onClick={copyPublicLink}
              style={copied ? { borderColor: "#00875A", color: "#00875A" } : {}}
            >
              {copied ? "Copied!" : "Copy public link"}
            </Button>
          )}
          {program.status !== "closed" && (
            <Popconfirm
              title="Archive this program?"
              description="Affiliates will no longer be able to generate links."
              onConfirm={archive}
              okText="Archive"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<StopOutlined />} loading={archiving}>Archive</Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────── */}
      <Row gutter={[14, 14]} style={{ marginBottom: 24 }}>
        {[
          { label: "Affiliates",      value: affiliates.length,        color: "#2C5CC5", icon: <TeamOutlined />, suffix: undefined, precision: 0 },
          { label: "Total Clicks",    value: stats.clicks,             color: "#475867", icon: <LinkOutlined />,  suffix: undefined, precision: 0 },
          { label: "Conversions",     value: stats.conversions,        color: "#00875A", icon: <SyncOutlined />,  suffix: undefined, precision: 0 },
          { label: "Revenue",         value: stats.revenue,            color: "#00875A", icon: <DollarOutlined />,prefix: "$",      precision: 2 },
          { label: "Commissions",     value: stats.commissions,        color: "#2C5CC5", icon: <DollarOutlined />,prefix: "$",      precision: 2 },
          { label: "Conv. Rate",      value: parseFloat(convRate),     color: "#FFC639", icon: undefined,         suffix: "%",      precision: 1 },
        ].map(k => (
          <Col key={k.label} xs={12} md={4}>
            <Card styles={{ body: { padding: "14px 16px" } }}>
              <Statistic title={k.label} value={k.value} prefix={k.prefix} suffix={k.suffix}
                precision={k.precision} valueStyle={{ color: k.color, fontSize: 20, fontWeight: 800 }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Program details + Tabs ───────────────────────────────────── */}
      <Row gutter={[20, 20]}>
        {/* Left: details card */}
        <Col xs={24} lg={7}>
          <Card title={<Text strong style={{ color: "#12344d" }}><SettingOutlined style={{ marginRight: 8 }} />Program settings</Text>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Commission", value: `${program.default_commission_value}${program.default_commission_type === "percentage" ? "%" : " " + program.currency + " flat"}` },
                { label: "Cookie",     value: `${program.cookie_duration_days} days` },
                { label: "Payouts",    value: program.payout_frequency, capitalize: true },
                { label: "Min payout", value: `$${program.min_payout_amount}` },
                { label: "Currency",   value: program.currency },
                { label: "Marketplace",value: program.is_public ? "Listed" : "Private" },
                { label: "Created",    value: new Date(program.created_at).toLocaleDateString() },
              ].map(f => (
                <div key={f.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <Text style={{ color: "#8fa0b4", fontSize: 12 }}>{f.label}</Text>
                  <Text strong style={{ color: "#12344d", fontSize: 13, textTransform: (f.capitalize ? "capitalize" : "none") as any }}>
                    {f.value}
                  </Text>
                </div>
              ))}
            </div>

            {/* EPC */}
            <Divider style={{ margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text style={{ color: "#8fa0b4", fontSize: 12 }}>EPC (earnings/click)</Text>
              <Text strong style={{ color: "#2C5CC5" }}>${epc}</Text>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ color: "#8fa0b4", fontSize: 12 }}>Conversion rate</Text>
              <Text strong style={{ color: "#FFC639" }}>{convRate}%</Text>
            </div>
          </Card>
        </Col>

        {/* Right: tabs */}
        <Col xs={24} lg={17}>
          <Card styles={{ body: { padding: 0 } }}>
            <Tabs
              style={{ padding: "0 20px" }}
              items={[
                {
                  key: "affiliates",
                  label: <span><TeamOutlined style={{ marginRight: 6 }} />Affiliates ({affiliates.length})</span>,
                  children: (
                    <Table columns={affCols} dataSource={affiliates} rowKey="id"
                      locale={{ emptyText: "No affiliates yet. Add affiliates to this program." }}
                      pagination={{ pageSize: 8, showSizeChanger: false }}
                      style={{ borderRadius: 0 }} />
                  ),
                },
                {
                  key: "links",
                  label: <span><LinkOutlined style={{ marginRight: 6 }} />Links ({links.length})</span>,
                  children: (
                    <Table columns={linkCols} dataSource={links} rowKey="id"
                      locale={{ emptyText: "No tracking links yet." }}
                      pagination={{ pageSize: 8, showSizeChanger: false }}
                      style={{ borderRadius: 0 }} />
                  ),
                },
                {
                  key: "conversions",
                  label: <span><SyncOutlined style={{ marginRight: 6 }} />Conversions ({conversions.length})</span>,
                  children: (
                    <Table columns={convCols} dataSource={conversions} rowKey="id"
                      locale={{ emptyText: "No conversions yet." }}
                      pagination={{ pageSize: 8, showSizeChanger: false }}
                      style={{ borderRadius: 0 }} />
                  ),
                },
                {
                  key: "integration",
                  label: <span><CodeOutlined style={{ marginRight: 6 }} />Integration</span>,
                  children: program ? <IntegrationTab program={program} testStatus={testStatus} setTestStatus={setTestStatus} codeCopied={codeCopied} setCodeCopied={setCodeCopied} /> : null,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// ── Integration tab ────────────────────────────────────────────────────────────
function IntegrationTab({ program, testStatus, setTestStatus, codeCopied, setCodeCopied }: {
  program: Program;
  testStatus: "idle" | "loading" | "ok" | "fail";
  setTestStatus: (s: "idle" | "loading" | "ok" | "fail") => void;
  codeCopied: string | null;
  setCodeCopied: (s: string | null) => void;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCodeCopied(key);
    setTimeout(() => setCodeCopied(null), 2000);
  };

  const cdnSnippet = `<!-- FreshAffiliates tracking pixel — paste in <head> of every page -->
<script src="${appUrl}/fa.min.js"
        data-org="${program.id}"
        data-host="${appUrl}">
</script>`;

  const purchaseSnippet = `<!-- Call this on your order confirmation / thank-you page -->
<script>
  window.FA.track("purchase", {
    revenue:  ORDER_TOTAL,      // number, e.g. 99.00
    orderId:  ORDER_ID,         // string, e.g. "ord_abc123"
    currency: "USD",            // ISO 4217
    email:    CUSTOMER_EMAIL,   // optional, for dedup
  });
</script>`;

  const npmSnippet = `npm install @freshaffiliates/track`;

  const npmUsageSnippet = `import { initFA } from "@freshaffiliates/track";

// Call once when your app boots
initFA({
  orgId: "${program.id}",
  host:  "${appUrl}",
});

// On purchase / checkout success:
window.FA.track("purchase", {
  revenue:  orderTotal,
  orderId:  orderId,
  currency: "USD",
});`;

  const webhookSnippet = `# Server-side option — POST from your backend after payment succeeds
curl -X POST ${appUrl}/api/conversions \\
  -H "Content-Type: application/json" \\
  -d '{
    "short_code": "REF_CODE_FROM_QUERY_PARAM",
    "order_id":   "ord_abc123",
    "revenue":    99.00,
    "currency":   "USD"
  }'`;

  const testConversion = async () => {
    setTestStatus("loading");
    try {
      const r = await fetch("/api/pixel", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event:    "purchase",
          org_id:   program.id,
          ref_code: "TEST_REF",   // won't match any real link — tests CORS only
          revenue:  1.00,
          currency: "USD",
          order_id: `test_${Date.now()}`,
        }),
      });
      setTestStatus(r.status === 404 ? "ok" : r.ok ? "ok" : "fail");
      // 404 is expected (TEST_REF doesn't exist) — means the endpoint is reachable
    } catch {
      setTestStatus("fail");
    }
  };

  const Block = ({ label, snippet, id }: { label: string; snippet: string; id: string }) => (
    <div style={{ marginBottom: 24 }}>
      <Text style={{ color: "#475867", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>
        {label}
      </Text>
      <div style={{ position: "relative", background: "#f5f7f9", border: "1px solid #e5eaf0", borderRadius: 8, padding: "14px 16px" }}>
        <pre style={{ margin: 0, fontSize: 12, color: "#475867", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", overflowX: "auto" }}>
          {snippet}
        </pre>
        <Button
          size="small" type="text"
          icon={codeCopied === id ? <CheckOutlined style={{ color: "#00875A" }} /> : <CopyOutlined />}
          onClick={() => copy(id, snippet)}
          style={{ position: "absolute", top: 10, right: 10, color: "#a0b0c0" }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ padding: "20px 4px 28px" }}>
      {/* How it works */}
      <div style={{ display: "flex", gap: 0, marginBottom: 32 }}>
        {[
          { n: "1", title: "Customer clicks affiliate link", desc: "Your affiliate shares a tracking link. Customer arrives at your site with ?ref=CODE in the URL." },
          { n: "2", title: "Pixel saves the ref code", desc: "The script reads ?ref=, saves it to localStorage + cookie (30 days). Survives page navigation." },
          { n: "3", title: "Customer purchases", desc: "You call FA.track('purchase', { revenue, orderId }) on your thank-you page." },
          { n: "4", title: "Commission calculated", desc: "FreshAffiliates records the conversion, calculates commission, and notifies you to approve it." },
        ].map((step, i, arr) => (
          <div key={step.n} style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#2C5CC5,#1a4aad)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                {step.n}
              </div>
              {i < arr.length - 1 && <div style={{ width: 1, flex: 1, background: "rgba(44,92,197,0.15)", marginTop: 4, marginBottom: 0, minHeight: 20 }} />}
            </div>
            <div style={{ paddingLeft: 12, paddingBottom: i < arr.length - 1 ? 24 : 0 }}>
              <Text style={{ fontSize: 13, fontWeight: 700, color: "#12344d", display: "block" }}>{step.title}</Text>
              <Text style={{ fontSize: 12, color: "#8fa0b4", lineHeight: 1.5 }}>{step.desc}</Text>
            </div>
          </div>
        ))}
      </div>

      {/* Option A: CDN snippet */}
      <Text style={{ color: "#12344d", fontWeight: 700, fontSize: 15, display: "block", marginBottom: 16 }}>
        Option A — Script tag (no install required)
      </Text>
      <Block label="1. Add to &lt;head&gt; of every page" snippet={cdnSnippet}         id="cdn" />
      <Block label="2. Fire on your thank-you page"      snippet={purchaseSnippet}    id="purchase" />

      <Divider style={{ borderColor: "#e8ecf2", margin: "28px 0" }} />

      {/* Option B: npm */}
      <Text style={{ color: "#12344d", fontWeight: 700, fontSize: 15, display: "block", marginBottom: 16 }}>
        Option B — npm package (React / Vue / Next.js)
      </Text>
      <Block label="Install"   snippet={npmSnippet}      id="npm-install" />
      <Block label="Usage"     snippet={npmUsageSnippet} id="npm-usage" />

      <Divider style={{ borderColor: "#e8ecf2", margin: "28px 0" }} />

      {/* Option C: server-side webhook */}
      <Text style={{ color: "#12344d", fontWeight: 700, fontSize: 15, display: "block", marginBottom: 16 }}>
        Option C — Server-side webhook (Shopify, WooCommerce, custom backend)
      </Text>
      <div style={{ background: "rgba(44,92,197,0.05)", border: "1px solid rgba(44,92,197,0.15)", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
        <Text style={{ color: "#60a5fa", fontSize: 13 }}>
          Your server captures <code style={{ background: "#edf0f4", padding: "1px 5px", borderRadius: 3 }}>?ref=CODE</code> from the URL when the customer lands, stores it in their session, then POSTs to FreshAffiliates after the payment succeeds.
        </Text>
      </div>
      <Block label="Webhook call" snippet={webhookSnippet} id="webhook" />

      <Divider style={{ borderColor: "#e8ecf2", margin: "28px 0" }} />

      {/* Test */}
      <Text style={{ color: "#12344d", fontWeight: 700, fontSize: 15, display: "block", marginBottom: 12 }}>
        Test your integration
      </Text>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Button
          type="primary"
          loading={testStatus === "loading"}
          onClick={testConversion}
          icon={<CodeOutlined />}
        >
          Ping pixel endpoint
        </Button>
        {testStatus === "ok" && (
          <Space>
            <CheckCircleOutlined style={{ color: "#00875A" }} />
            <Text style={{ color: "#00875A", fontSize: 13 }}>Endpoint reachable — integration is working</Text>
          </Space>
        )}
        {testStatus === "fail" && (
          <Space>
            <CloseCircleOutlined style={{ color: "#D72D30" }} />
            <Text style={{ color: "#D72D30", fontSize: 13 }}>Could not reach endpoint — check your domain / CORS settings</Text>
          </Space>
        )}
      </div>

      {/* Org ID reference */}
      <div style={{ marginTop: 32, background: "#f5f7f9", border: "1px solid #edf0f4", borderRadius: 8, padding: "14px 16px" }}>
        <Text style={{ color: "#8fa0b4", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>Your Program ID</Text>
        <Text style={{ fontFamily: "monospace", fontSize: 13, color: "#2C5CC5" }}>{program.id}</Text>
      </div>
    </div>
  );
}
