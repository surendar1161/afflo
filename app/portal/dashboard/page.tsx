"use client";
import { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Segmented, Spin, Typography, Progress } from "antd";
import { BarChartOutlined, DollarOutlined, SyncOutlined, WalletOutlined, RiseOutlined, FundOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

type Summary = { total_clicks:number; total_conversions:number; total_earned:number; pending_earned:number; total_paid:number; balance:number; conversion_rate:string; epc:string };
type DayData  = { date:string; clicks:number; conversions:number; earnings:number };

export default function PortalDashboard() {
  const [summary, setSummary] = useState<Summary|null>(null);
  const [daily, setDaily]     = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays]       = useState<string|number>(30);
  const [tier, setTier]       = useState<{tier_name:string;tier_color:string;tier_icon:string;total_revenue:number;next_tier:{name:string;min_revenue:number}|null;progress_to_next_pct:number}|null>(null);

  useEffect(() => { load(); }, [days]);

  const load = async () => {
    setLoading(true);
    const [res, tierRes] = await Promise.all([
      fetch(`/api/portal/stats?days=${days}`),
      fetch("/api/portal/tier"),
    ]);
    const data = await res.json();
    if (tierRes.ok) { const td = await tierRes.json(); setTier(td.progress || null); }
    setSummary(data.summary);
    setDaily(data.daily || []);
    setLoading(false);
  };

  const maxClicks = Math.max(...daily.map(d => d.clicks), 1);

  const KPI = summary ? [
    { label:"Total Clicks",      value:summary.total_clicks,                               color:"#2C5CC5", icon:<BarChartOutlined /> },
    { label:"Conversions",       value:summary.total_conversions,                           color:"#00875A", icon:<SyncOutlined /> },
    { label:"Total Earned",      value:parseFloat(summary.total_earned as unknown as string), color:"#00875A", prefix:"$", precision:2, icon:<DollarOutlined /> },
    { label:"Pending",           value:parseFloat(summary.pending_earned as unknown as string), color:"#FFC639", prefix:"$", precision:2, icon:<WalletOutlined /> },
    { label:"Paid Out",          value:parseFloat(summary.total_paid as unknown as string), color:"#475867", prefix:"$", precision:2, icon:<DollarOutlined /> },
    { label:"Balance",           value:parseFloat(summary.balance as unknown as string),   color:"#2C5CC5", prefix:"$", precision:2, icon:<FundOutlined /> },
    { label:"Conversion Rate",   value:parseFloat(summary.conversion_rate),                color:"#FFC639", suffix:"%", precision:1, icon:<RiseOutlined /> },
    { label:"EPC",               value:parseFloat(summary.epc),                            color:"#475867", prefix:"$", precision:4, icon:<FundOutlined /> },
  ] : [];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <Title level={2} style={{ margin:"0 0 4px", color:"#f5f5f5" }}>Dashboard</Title>
          <Text style={{ color:"#8fa0b4" }}>Your affiliate performance overview.</Text>
        </div>
        <Segmented value={days} onChange={setDays} options={[{label:"7d",value:7},{label:"30d",value:30},{label:"90d",value:90}]} />
      </div>

      {/* Tier card */}
      {tier && (
        <div style={{ marginBottom: 20, background: `${tier.tier_color}0d`, border: `1px solid ${tier.tier_color}33`, borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 32 }}>{tier.tier_icon}</span>
              <div>
                <Text style={{ color: "#8fa0b4", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>Your tier</Text>
                <Text strong style={{ fontSize: 18, color: tier.tier_color }}>{tier.tier_name}</Text>
              </div>
            </div>
            <div style={{ flex: 1, maxWidth: 280 }}>
              {tier.next_tier ? (<>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ color: "#8fa0b4", fontSize: 12 }}>Progress to {tier.next_tier.name}</Text>
                  <Text style={{ color: "#12344d", fontSize: 12, fontWeight: 700 }}>${tier.total_revenue.toFixed(0)} / ${tier.next_tier.min_revenue.toFixed(0)}</Text>
                </div>
                <Progress percent={tier.progress_to_next_pct} showInfo={false} strokeColor={tier.tier_color} trailColor="#edf0f4" size="small" />
              </>) : (
                <Text style={{ color: "#FFD700", fontWeight: 700 }}>🏆 Maximum tier reached!</Text>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spin size="large" /></div>
      ) : (<>
        <Row gutter={[14,14]} style={{ marginBottom:24 }}>
          {KPI.map(k => (
            <Col key={k.label} xs={12} md={6}>
              <Card>
                <Statistic title={k.label} value={k.value} prefix={k.prefix} suffix={k.suffix} precision={k.precision ?? 0}
                  valueStyle={{ color:k.color, fontSize:22, fontWeight:800 }} />
              </Card>
            </Col>
          ))}
        </Row>

        <Card title={<Text strong style={{ color:"#f5f5f5" }}>Clicks over time</Text>}>
          <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:90 }}>
            {daily.map(d => (
              <div key={d.date} style={{ flex:1 }} title={`${d.date}: ${d.clicks} clicks`}>
                <div style={{ width:"100%", borderRadius:"3px 3px 0 0", background:`rgba(76,130,247,${0.15+(d.clicks/maxClicks)*0.85})`, height:`${Math.max(2,(d.clicks/maxClicks)*100)}%`, transition:"all .2s" }} />
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
            <Text style={{ color:"#a0b0c0", fontSize:11 }}>{daily[0]?.date}</Text>
            <Text style={{ color:"#a0b0c0", fontSize:11 }}>{daily[daily.length-1]?.date}</Text>
          </div>
        </Card>
      </>)}
    </div>
  );
}
