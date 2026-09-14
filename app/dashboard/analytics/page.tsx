"use client";
import { useEffect, useState } from "react";
import { useOrg } from "@/lib/hooks/useOrg";
import {
  Row, Col, Card, Statistic, Segmented, Progress, Typography, Spin,
} from "antd";
import {
  BarChartOutlined, SyncOutlined, DollarOutlined, WalletOutlined,
  RiseOutlined, ShoppingOutlined, FundOutlined, SafetyOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

type Summary = {
  total_clicks: number; total_conversions: number; total_revenue: number;
  total_commissions: number; conversion_rate: string; avg_order_value: string;
  epc: string; active_affiliates: number; fraud_rate: string;
};
type DayData = { date: string; clicks: number; conversions: number; revenue: number };

export default function AnalyticsPage() {
  const { ctx } = useOrg();
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [daily, setDaily]       = useState<DayData[]>([]);
  const [byDevice, setByDevice] = useState<[string, number][]>([]);
  const [byCountry, setByCountry] = useState<[string, number][]>([]);
  const [loading, setLoading]   = useState(true);
  const [days, setDays]         = useState<string | number>(30);

  useEffect(() => { if (ctx?.organization?.id) load(); }, [ctx?.organization?.id, days]);

  const load = async () => {
    setLoading(true);
    const res  = await fetch(`/api/analytics?days=${days}`);
    const data = await res.json();
    setSummary(data.summary);
    setDaily(data.daily || []);
    setByDevice(data.by_device || []);
    setByCountry(data.by_country || []);
    setLoading(false);
  };

  const maxClicks = Math.max(...daily.map(d => d.clicks), 1);

  const KPI = summary ? [
    { label: "Total Clicks",    value: summary.total_clicks,                       icon: <BarChartOutlined />,   color: "#6366f1" },
    { label: "Conversions",     value: summary.total_conversions,                   icon: <SyncOutlined />,       color: "#10b981" },
    { label: "Revenue",         value: parseFloat(summary.total_revenue as unknown as string), icon: <DollarOutlined />, color: "#22c55e", prefix: "$", precision: 2 },
    { label: "Commissions",     value: parseFloat(summary.total_commissions as unknown as string), icon: <WalletOutlined />, color: "#818cf8", prefix: "$", precision: 2 },
    { label: "Conversion Rate", value: parseFloat(summary.conversion_rate),         icon: <RiseOutlined />,       color: "#f59e0b", suffix: "%" },
    { label: "Avg Order Value", value: parseFloat(summary.avg_order_value),         icon: <ShoppingOutlined />,   color: "#06b6d4", prefix: "$", precision: 2 },
    { label: "EPC",             value: parseFloat(summary.epc),                     icon: <FundOutlined />,       color: "#a78bfa", prefix: "$", precision: 4 },
    { label: "Fraud Rate",      value: parseFloat(summary.fraud_rate),              icon: <SafetyOutlined />,     color: parseFloat(summary.fraud_rate) > 5 ? "#ef4444" : "#10b981", suffix: "%" },
  ] : [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <Title level={2} style={{ margin: "0 0 4px", color: "#fff" }}>Analytics</Title>
          <Text style={{ color: "#475569" }}>Performance metrics across all your affiliate programs.</Text>
        </div>
        <Segmented
          value={days}
          onChange={setDays}
          options={[
            { label: "7d", value: 7 },
            { label: "30d", value: 30 },
            { label: "90d", value: 90 },
          ]}
        />
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : summary ? (
        <>
          {/* KPI grid */}
          <Row gutter={[14, 14]} style={{ marginBottom: 28 }}>
            {KPI.map(k => (
              <Col key={k.label} xs={12} lg={6}>
                <Card>
                  <Statistic
                    title={k.label}
                    value={k.value}
                    prefix={k.prefix || k.icon}
                    suffix={k.suffix}
                    precision={k.precision ?? 0}
                    valueStyle={{ color: k.color, fontSize: 22, fontWeight: 900 }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {/* Clicks chart */}
          <Card title={<Text strong style={{ color: "#fff" }}>Clicks over time</Text>} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 100 }}>
              {daily.map(d => (
                <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div
                    title={`${d.date}: ${d.clicks} clicks`}
                    style={{
                      width: "100%",
                      borderRadius: "3px 3px 0 0",
                      background: `rgba(99,102,241,${0.2 + (d.clicks / maxClicks) * 0.8})`,
                      height: `${Math.max(2, (d.clicks / maxClicks) * 100)}%`,
                      transition: "all .2s",
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <Text style={{ color: "#334155", fontSize: 10 }}>{daily[0]?.date}</Text>
              <Text style={{ color: "#334155", fontSize: 10 }}>{daily[daily.length - 1]?.date}</Text>
            </div>
          </Card>

          <Row gutter={[20, 20]}>
            {/* By device */}
            <Col xs={24} lg={12}>
              <Card title={<Text strong style={{ color: "#fff" }}>By device</Text>}>
                {byDevice.length === 0 ? (
                  <Text style={{ color: "#475569", fontSize: 13 }}>No data yet</Text>
                ) : (
                  byDevice.map(([device, count]) => {
                    const total   = byDevice.reduce((s, [, c]) => s + c, 0);
                    const percent = total ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={device} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <Text style={{ color: "#94a3b8", textTransform: "capitalize" }}>{device}</Text>
                          <Text style={{ color: "#fff", fontWeight: 600 }}>{count} ({percent}%)</Text>
                        </div>
                        <Progress
                          percent={percent}
                          showInfo={false}
                          strokeColor={{ from: "#6366f1", to: "#818cf8" }}
                          trailColor="#edf0f4"
                          size="small"
                        />
                      </div>
                    );
                  })
                )}
              </Card>
            </Col>

            {/* By country */}
            <Col xs={24} lg={12}>
              <Card title={<Text strong style={{ color: "#fff" }}>Top countries</Text>}>
                {byCountry.length === 0 ? (
                  <Text style={{ color: "#475569", fontSize: 13 }}>No data yet</Text>
                ) : (
                  byCountry.slice(0, 6).map(([country, count]) => (
                    <div key={country} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f2f5f8" }}>
                      <Text style={{ color: "#94a3b8", fontSize: 13 }}>{country}</Text>
                      <Text style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{count}</Text>
                    </div>
                  ))
                )}
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Text style={{ color: "#475569" }}>No analytics data yet.</Text>
        </div>
      )}
    </div>
  );
}
