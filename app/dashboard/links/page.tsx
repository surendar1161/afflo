"use client";
import { useEffect, useState } from "react";
import { useOrg } from "@/lib/hooks/useOrg";
import {
  Table, Button, Tag, Space, Typography, App, Empty, Card,
  Drawer, Form, Input, Select, DatePicker, Modal, Progress,
  Tooltip, Popconfirm, Row, Col, Statistic, Divider,
} from "antd";
import {
  PlusOutlined, CopyOutlined, CheckOutlined, LinkOutlined, StopOutlined,
  QrcodeOutlined, BarChartOutlined, ThunderboltOutlined, GlobalOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
const APP_URL = typeof window !== "undefined" ? window.location.origin : "http://localhost:3010";

type Link = {
  id: string; short_code: string; name: string | null; destination_url: string;
  click_count: number; unique_clicks: number; conversion_count: number;
  utm_campaign: string | null; utm_source: string | null; utm_medium: string | null;
  expires_at: string | null; is_active: boolean; created_at: string;
  affiliate?: { id: string; email: string; full_name: string | null };
  program?:   { id: string; name: string; website: string | null };
};

type StatsData = {
  summary: { total_clicks: number; total_conversions: number; total_revenue: number; conversion_rate: string };
  daily: { date: string; clicks: number; conversions: number }[];
  by_device: [string, number][];
  by_country: [string, number][];
};

export default function LinksPage() {
  const { message } = App.useApp();
  const { ctx } = useOrg();

  const [links, setLinks]           = useState<Link[]>([]);
  const [loading, setLoading]       = useState(true);
  const [affiliates, setAffiliates] = useState<{ id: string; email: string; full_name: string | null }[]>([]);
  const [programs, setPrograms]     = useState<{ id: string; name: string; website: string | null }[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [form]                      = Form.useForm();

  const [bulkOpen, setBulkOpen]   = useState(false);
  const [bulkForm]                = Form.useForm();
  const [bulking, setBulking]     = useState(false);

  const [copied, setCopied]       = useState<string | null>(null);
  const [qrModal, setQrModal]     = useState<{ url: string; shortCode: string } | null>(null);
  const [statsModal, setStatsModal] = useState<{ link: Link; stats: StatsData } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  useEffect(() => { if (ctx?.organization?.id) loadAll(); }, [ctx?.organization?.id]);

  const loadAll = async () => {
    setLoading(true);
    const [lr, ar, pr] = await Promise.all([
      fetch("/api/links"), fetch("/api/affiliates"), fetch("/api/programs?status=active"),
    ]);
    const [ld, ad, pd] = await Promise.all([lr.json(), ar.json(), pr.json()]);
    setLinks(ld.links || []);
    setAffiliates(ad.affiliates || []);
    setPrograms(pd.programs || []);
    setLoading(false);
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(`${APP_URL}/r/${code}`);
    message.success("Tracking link copied!");
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyEmbed = (code: string) => {
    navigator.clipboard.writeText(`<a href="${APP_URL}/r/${code}" target="_blank">Shop now</a>`);
    message.success("HTML embed copied!");
  };

  const deactivate = async (id: string) => {
    setDeactivating(id);
    await fetch(`/api/links/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: false }) });
    message.success("Link deactivated");
    setDeactivating(null);
    loadAll();
  };

  const loadQr = async (link: Link) => {
    const res  = await fetch(`/api/links/${link.id}/qr`);
    const data = await res.json();
    setQrModal({ url: data.qr_url, shortCode: link.short_code });
  };

  const loadStats = async (link: Link) => {
    setStatsLoading(true);
    const res  = await fetch(`/api/links/${link.id}/stats?days=30`);
    const data = await res.json();
    setStatsModal({ link, stats: data });
    setStatsLoading(false);
  };

  const createLink = async (values: Record<string, unknown>) => {
    setCreating(true);
    const payload: Record<string, unknown> = {
      program_id: values.program_id, affiliate_id: values.affiliate_id,
      destination_url: values.destination_url, name: values.name || null,
      utm_campaign: values.utm_campaign || null,
      utm_source:   values.utm_source   || "freshaffiliates",
      utm_medium:   values.utm_medium   || "affiliate",
      expires_at:   values.expires_at   ? (values.expires_at as any).toISOString() : null,
    };
    if (values.custom_short_code) payload.custom_short_code = values.custom_short_code;

    const res  = await fetch("/api/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { message.error(data.error || "Failed to create link"); return; }
    message.success("Link created and URL copied to clipboard!");
    navigator.clipboard.writeText(data.tracking_url).catch(() => {});
    setDrawerOpen(false);
    form.resetFields();
    loadAll();
  };

  const bulkCreate = async (values: Record<string, unknown>) => {
    setBulking(true);
    const res  = await fetch("/api/links/bulk", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        program_id: values.program_id, destination_url: values.destination_url,
        name: values.name || null, utm_campaign: values.utm_campaign || null,
        expires_at: values.expires_at ? (values.expires_at as any).toISOString() : null,
      }),
    });
    const data = await res.json();
    setBulking(false);
    if (!res.ok) { message.error(data.error); return; }
    message.success(data.message);
    setBulkOpen(false);
    bulkForm.resetFields();
    loadAll();
  };

  const columns: ColumnsType<Link> = [
    {
      title: "Link",
      render: (_, l) => (
        <Space direction="vertical" size={2}>
          <Space size={6}>
            <Text style={{ color: "#2C5CC5", fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>
              <LinkOutlined style={{ marginRight: 5 }} />/r/{l.short_code}
            </Text>
            {!l.is_active && <Tag color="error" style={{ fontSize: 10 }}>Inactive</Tag>}
            {l.expires_at && new Date(l.expires_at) < new Date() && <Tag color="warning" style={{ fontSize: 10 }}>Expired</Tag>}
          </Space>
          <Space size={14} style={{ fontSize: 12, color: "#8fa0b4" }}>
            {l.name && <span>📝 {l.name}</span>}
            <span style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>🎯 {l.destination_url}</span>
          </Space>
          <Space size={10} style={{ fontSize: 11, color: "#4a4a4a" }}>
            <span>👤 {l.affiliate?.full_name || l.affiliate?.email || "—"}</span>
            <span>📋 {l.program?.name || "—"}</span>
            {l.utm_campaign && <span>📊 {l.utm_campaign}</span>}
          </Space>
        </Space>
      ),
    },
    { title: "Clicks",   dataIndex: "click_count",      width: 80,  render: v => <Text style={{ fontWeight: 700, color: "#475867" }}>{v}</Text>, sorter: (a,b) => a.click_count - b.click_count },
    { title: "Conv.",    dataIndex: "conversion_count", width: 70,  render: v => <Text style={{ fontWeight: 700, color: v > 0 ? "#00875A" : "#475867" }}>{v}</Text>, sorter: (a,b) => a.conversion_count - b.conversion_count },
    { title: "Rate",     width: 70, render: (_, l) => { const r = l.click_count > 0 ? ((l.conversion_count / l.click_count) * 100).toFixed(1) : "0"; return <Text style={{ color: "#FFC639", fontSize: 12 }}>{r}%</Text>; } },
    { title: "Expires",  dataIndex: "expires_at", width: 100, render: v => v ? <Text style={{ color: new Date(v) < new Date() ? "#D72D30" : "#8fa0b4", fontSize: 12 }}>{new Date(v).toLocaleDateString()}</Text> : <Text style={{ color: "#4a4a4a", fontSize: 12 }}>Never</Text> },
    {
      title: "Actions", width: 200,
      render: (_, l) => (
        <Space size={4}>
          <Tooltip title="Copy tracking URL"><Button size="small" icon={copied === l.short_code ? <CheckOutlined /> : <CopyOutlined />} onClick={() => copy(l.short_code)} style={copied === l.short_code ? { color: "#00875A", borderColor: "#00875A" } : {}} /></Tooltip>
          <Tooltip title="Analytics"><Button size="small" icon={<BarChartOutlined />} onClick={() => loadStats(l)} /></Tooltip>
          <Tooltip title="QR code"><Button size="small" icon={<QrcodeOutlined />} onClick={() => loadQr(l)} /></Tooltip>
          <Tooltip title="HTML embed"><Button size="small" onClick={() => copyEmbed(l.short_code)} style={{ fontSize: 11, color: "#8fa0b4", fontFamily: "monospace" }}>&lt;/&gt;</Button></Tooltip>
          {l.is_active && (
            <Popconfirm title="Deactivate this link?" onConfirm={() => deactivate(l.id)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Tooltip title="Deactivate"><Button size="small" danger icon={<StopOutlined />} loading={deactivating === l.id} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const totalClicks = links.reduce((s, l) => s + l.click_count, 0);
  const totalConv   = links.reduce((s, l) => s + l.conversion_count, 0);
  const activeLinks = links.filter(l => l.is_active).length;

  const DRAWER_STYLES = {
    header: { background: "#ffffff", borderBottom: "1px solid #edf0f4", padding: "14px 20px" },
    body:   { background: "#f5f7f9", padding: "20px" },
    footer: { background: "#ffffff", borderTop: "1px solid #edf0f4", padding: "12px 20px" },
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <Title level={2} style={{ margin: "0 0 4px", color: "#12344d" }}>Tracking Links</Title>
          <Text style={{ color: "#8fa0b4" }}>Create links with deep linking, custom UTM params, QR codes, and per-link analytics.</Text>
        </div>
        <Space>
          <Tooltip title="Create links for ALL affiliates in a program at once">
            <Button icon={<ThunderboltOutlined />} onClick={() => setBulkOpen(true)}>Bulk Create</Button>
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)} style={{ fontWeight: 600 }}>New Link</Button>
        </Space>
      </div>

      <Row gutter={[14, 14]} style={{ marginBottom: 24 }}>
        {[
          { label: "Total Links", value: links.length, color: "#12344d" },
          { label: "Active",      value: activeLinks,  color: "#00875A" },
          { label: "Clicks",      value: totalClicks,  color: "#2C5CC5" },
          { label: "Conversions", value: totalConv,    color: "#FFC639" },
        ].map(k => (
          <Col key={k.label} xs={12} md={6}>
            <Card styles={{ body: { padding: "14px 16px" } }}>
              <Statistic title={k.label} value={k.value} valueStyle={{ color: k.color, fontSize: 22, fontWeight: 800 }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: "hidden" }}>
        <Table columns={columns} dataSource={links} rowKey="id" loading={loading}
          locale={{ emptyText: (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
              <Text strong style={{ color: "#12344d", display: "block", marginBottom: 6 }}>No tracking links yet</Text>
              <Text style={{ color: "#8fa0b4", display: "block", marginBottom: 20 }}>Links are auto-created when affiliates join programs, or create one manually.</Text>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>Create First Link</Button>
            </div>
          )}}
          pagination={{ pageSize: 20, showSizeChanger: false }} />
      </Card>

      {/* ── Create Drawer ─────────────────────────────────────────────────── */}
      <Drawer
        title={<Space><div style={{ width:30,height:30,borderRadius:7,background:"linear-gradient(135deg,#2C5CC5,#1a4aad)",display:"flex",alignItems:"center",justifyContent:"center" }}><LinkOutlined style={{color:"#fff",fontSize:14}}/></div><div><div style={{fontSize:14,fontWeight:700,color:"#12344d"}}>New Tracking Link</div><div style={{fontSize:11,color:"#8fa0b4",fontWeight:400}}>Deep link to any page with UTM tracking</div></div></Space>}
        placement="right" width={480} open={drawerOpen}
        onClose={() => { setDrawerOpen(false); form.resetFields(); }}
        styles={DRAWER_STYLES}
        footer={<Space style={{width:"100%",justifyContent:"space-between"}}><Button onClick={() => { setDrawerOpen(false); form.resetFields(); }}>Cancel</Button><Button type="primary" loading={creating} onClick={() => form.submit()} style={{fontWeight:600,minWidth:120}}>{creating?"Creating…":"✓ Create Link"}</Button></Space>}
      >
        <Form form={form} layout="vertical" onFinish={createLink}>
          <Form.Item name="program_id" label="Program" rules={[{required:true,message:"Select a program"}]}>
            <Select placeholder="Select program…" onChange={v => { const p = programs.find(x => x.id===v); if (p?.website) form.setFieldValue("destination_url", p.website); }}>
              {programs.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
            </Select>
          </Form.Item>

          <Form.Item name="affiliate_id" label="Affiliate" rules={[{required:true,message:"Select an affiliate"}]}>
            <Select placeholder="Select affiliate…" showSearch optionFilterProp="label">
              {affiliates.map(a => (
                <Select.Option key={a.id} value={a.id} label={a.full_name||a.email}>
                  <Space><div style={{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#2C5CC5,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff"}}>{(a.full_name||a.email)[0].toUpperCase()}</div><span>{a.full_name||a.email}</span></Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="destination_url" label={<span>Destination URL <span style={{color:"#2C5CC5",fontSize:11}}>(deep link to any page)</span></span>} rules={[{required:true},{type:"url",message:"Must be a valid URL"}]} extra={<Text style={{color:"#4a4a4a",fontSize:11}}>Can be a product page, landing page, or any URL on your site.</Text>}>
            <Input placeholder="https://yoursite.com/products/item" prefix={<GlobalOutlined style={{color:"#a0b0c0"}}/>} style={{fontFamily:"monospace"}}/>
          </Form.Item>

          <Form.Item name="name" label="Link name (optional)" extra={<Text style={{color:"#4a4a4a",fontSize:11}}>A label like "Blog post May 2026" for your reference.</Text>}>
            <Input placeholder="Blog promotion May 2026"/>
          </Form.Item>

          <Divider style={{margin:"16px 0",borderColor:"#edf0f4"}}><Text style={{color:"#4a4a4a",fontSize:12}}>UTM Parameters</Text></Divider>

          <Row gutter={12}>
            <Col span={12}><Form.Item name="utm_campaign" label="Campaign"><Input placeholder="summer-sale"/></Form.Item></Col>
            <Col span={12}><Form.Item name="utm_source" label="Source" initialValue="freshaffiliates"><Input placeholder="freshaffiliates"/></Form.Item></Col>
            <Col span={12}><Form.Item name="utm_medium" label="Medium" initialValue="affiliate"><Input placeholder="affiliate"/></Form.Item></Col>
            <Col span={12}><Form.Item name="custom_short_code" label="Custom short code" extra={<Text style={{color:"#4a4a4a",fontSize:11}}>e.g. "john-deal" → /r/john-deal</Text>}><Input placeholder="john-deal" addonBefore="/r/" style={{fontFamily:"monospace"}}/></Form.Item></Col>
          </Row>

          <Form.Item name="expires_at" label="Expiry date (optional)" extra={<Text style={{color:"#4a4a4a",fontSize:11}}>Clicks stop redirecting after this date.</Text>}>
            <DatePicker style={{width:"100%"}} placeholder="No expiry"/>
          </Form.Item>
        </Form>
      </Drawer>

      {/* ── Bulk Drawer ────────────────────────────────────────────────────── */}
      <Drawer
        title={<Space><ThunderboltOutlined style={{color:"#FFC639",fontSize:18}}/><div><div style={{fontSize:14,fontWeight:700,color:"#12344d"}}>Bulk Create Links</div><div style={{fontSize:11,color:"#8fa0b4",fontWeight:400}}>Generate links for ALL active affiliates in a program</div></div></Space>}
        placement="right" width={440} open={bulkOpen}
        onClose={() => { setBulkOpen(false); bulkForm.resetFields(); }}
        styles={DRAWER_STYLES}
        footer={<Space style={{width:"100%",justifyContent:"space-between"}}><Button onClick={() => setBulkOpen(false)}>Cancel</Button><Button type="primary" loading={bulking} onClick={() => bulkForm.submit()} icon={<ThunderboltOutlined/>} style={{fontWeight:600}}>{bulking?"Creating…":"Create for all affiliates"}</Button></Space>}
      >
        <div style={{background:"rgba(255,198,57,0.08)",border:"1px solid rgba(255,198,57,0.2)",borderRadius:6,padding:"10px 14px",marginBottom:20}}>
          <Text style={{color:"#FFC639",fontSize:13}}>Creates one tracking link per active affiliate in the program. Perfect for campaign launches.</Text>
        </div>
        <Form form={bulkForm} layout="vertical" onFinish={bulkCreate}>
          <Form.Item name="program_id" label="Program" rules={[{required:true}]}><Select placeholder="Select program…">{programs.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}</Select></Form.Item>
          <Form.Item name="destination_url" label="Destination URL" rules={[{required:true},{type:"url"}]}><Input placeholder="https://yoursite.com/campaign" prefix={<LinkOutlined style={{color:"#a0b0c0"}}/>}/></Form.Item>
          <Form.Item name="name" label="Link name"><Input placeholder="May 2026 Campaign"/></Form.Item>
          <Form.Item name="utm_campaign" label="UTM Campaign"><Input placeholder="may-2026"/></Form.Item>
          <Form.Item name="expires_at" label="Expiry date"><DatePicker style={{width:"100%"}}/></Form.Item>
        </Form>
      </Drawer>

      {/* ── QR Modal ──────────────────────────────────────────────────────── */}
      <Modal title={<Text strong style={{color:"#12344d"}}>QR Code — /r/{qrModal?.shortCode}</Text>} open={!!qrModal} onCancel={() => setQrModal(null)}
        footer={[
          <Button key="dl" type="primary" onClick={() => {
            if (!qrModal) return;
            const a = document.createElement("a");
            a.href = qrModal.url;
            a.download = `qr-${qrModal.shortCode}.png`;
            a.click();
          }}>Download PNG</Button>,
          <Button key="c" onClick={() => setQrModal(null)}>Close</Button>,
        ]}>
        {qrModal && (
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <img src={qrModal.url} alt="QR" style={{width:220,height:220,borderRadius:8,border:"1px solid #e2e8f0"}}/>
            <Text style={{display:"block",color:"#8fa0b4",fontSize:12,marginTop:14,fontFamily:"monospace"}}>{APP_URL}/r/{qrModal.shortCode}</Text>
          </div>
        )}
      </Modal>

      {/* ── Stats Modal ────────────────────────────────────────────────────── */}
      <Modal title={<Text strong style={{color:"#12344d"}}>Analytics — /r/{statsModal?.link.short_code}</Text>} open={!!statsModal} onCancel={() => setStatsModal(null)} footer={null} width={620}>
        {statsModal && (() => {
          const { stats } = statsModal;
          const maxC = Math.max(...(stats.daily||[]).map(d=>d.clicks),1);
          return (
            <div>
              <Row gutter={[12,12]} style={{marginBottom:16}}>
                {[
                  {label:"Clicks",value:stats.summary.total_clicks,color:"#2C5CC5"},
                  {label:"Conversions",value:stats.summary.total_conversions,color:"#00875A"},
                  {label:"Revenue",value:`$${parseFloat(stats.summary.total_revenue as any||0).toFixed(2)}`,color:"#00875A"},
                  {label:"Conv. Rate",value:`${stats.summary.conversion_rate}%`,color:"#FFC639"},
                ].map(k=>(
                  <Col span={6} key={k.label}>
                    <div style={{background:"#ffffff",borderRadius:8,padding:"12px 14px"}}>
                      <div style={{fontSize:10,color:"#8fa0b4",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>{k.label}</div>
                      <div style={{fontSize:20,fontWeight:800,color:k.color}}>{k.value}</div>
                    </div>
                  </Col>
                ))}
              </Row>
              <div style={{background:"#ffffff",borderRadius:8,padding:16,marginBottom:16}}>
                <Text style={{color:"#8fa0b4",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:10}}>Clicks — Last 30 days</Text>
                <div style={{display:"flex",alignItems:"flex-end",gap:2,height:60}}>
                  {(stats.daily||[]).map(d=>(
                    <div key={d.date} style={{flex:1}} title={`${d.date}: ${d.clicks}`}>
                      <div style={{width:"100%",borderRadius:"2px 2px 0 0",background:`rgba(76,130,247,${0.15+(d.clicks/maxC)*0.85})`,height:`${Math.max(2,(d.clicks/maxC)*100)}%`}}/>
                    </div>
                  ))}
                </div>
              </div>
              <Row gutter={[12,12]}>
                <Col span={12}>
                  <div style={{background:"#ffffff",borderRadius:8,padding:14}}>
                    <Text style={{color:"#8fa0b4",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:12}}>By Device</Text>
                    {stats.by_device?.length ? stats.by_device.map(([dev,cnt])=>{
                      const tot=stats.by_device.reduce((s,[,c])=>s+c,0);
                      return(<div key={dev} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><Text style={{color:"#475867",fontSize:12,textTransform:"capitalize"}}>{dev}</Text><Text style={{color:"#12344d",fontSize:12,fontWeight:600}}>{cnt}</Text></div><Progress percent={tot?Math.round((cnt/tot)*100):0} showInfo={false} strokeColor="#2C5CC5" trailColor="#edf0f4" size="small"/></div>);
                    }) : <Text style={{color:"#4a4a4a",fontSize:12}}>No data yet</Text>}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{background:"#ffffff",borderRadius:8,padding:14}}>
                    <Text style={{color:"#8fa0b4",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:12}}>Top Countries</Text>
                    {stats.by_country?.length ? stats.by_country.map(([c,n])=>(
                      <div key={c} style={{display:"flex",justifyContent:"space-between",paddingBottom:8,marginBottom:8,borderBottom:"1px solid #f2f5f8"}}><Text style={{color:"#475867",fontSize:12}}>{c}</Text><Text style={{color:"#12344d",fontSize:12,fontWeight:700}}>{n}</Text></div>
                    )) : <Text style={{color:"#4a4a4a",fontSize:12}}>No data yet</Text>}
                  </div>
                </Col>
              </Row>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
