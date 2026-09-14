"use client";
import { useEffect, useState } from "react";
import { useOrg } from "@/lib/hooks/useOrg";
import {
  Row, Col, Card, Button, Tag, Progress, Typography, Divider, Space, Spin, App,
} from "antd";
import {
  CreditCardOutlined, CheckOutlined, CloseOutlined,
  RocketOutlined, ThunderboltOutlined, CrownOutlined,
} from "@ant-design/icons";
import Link from "next/link";

const { Title, Text, Paragraph } = Typography;

interface Usage { used: number; limit: number; }
interface SubData {
  plan: string; plan_period: string;
  trial_ends_at: string | null; subscription_end: string | null;
  usage: { affiliates: Usage; programs: Usage };
}

const PLANS = [
  {
    id: "starter", name: "Starter", icon: <RocketOutlined />, color: "#64748b",
    monthly: 15, yearly: 12,
    desc: "For bootstrapped brands launching their first program.",
    features: [
      { text: "Up to 50 affiliates",     included: true  },
      { text: "5 affiliate programs",    included: true  },
      { text: "Tracking links",          included: true  },
      { text: "Core analytics",          included: true  },
      { text: "PayPal payouts",          included: true  },
      { text: "AI fraud detection",      included: false },
      { text: "White-label portal",      included: false },
      { text: "API access",              included: false },
    ],
  },
  {
    id: "growth", name: "Growth", icon: <ThunderboltOutlined />, color: "#2C5CC5",
    monthly: 30, yearly: 25, popular: true,
    desc: "For scaling brands with active affiliate programs.",
    features: [
      { text: "Up to 500 affiliates",    included: true },
      { text: "20 affiliate programs",   included: true },
      { text: "AI fraud detection",      included: true },
      { text: "All payout methods",      included: true },
      { text: "White-label portal",      included: true },
      { text: "30+ integrations",        included: true },
      { text: "Email automation",        included: true },
      { text: "API access",              included: false },
    ],
  },
  {
    id: "scale", name: "Scale", icon: <CrownOutlined />, color: "#FFC639",
    monthly: 75, yearly: 62,
    desc: "Unlimited power for high-volume programs.",
    features: [
      { text: "Unlimited affiliates",    included: true },
      { text: "Unlimited programs",      included: true },
      { text: "Custom portal domain",    included: true },
      { text: "API + webhooks",          included: true },
      { text: "Advanced BI analytics",   included: true },
      { text: "Dedicated manager",       included: true },
      { text: "Priority support",        included: true },
      { text: "SLA guarantee",           included: true },
    ],
  },
];

export default function SubscriptionPage() {
  const { message } = App.useApp();
  const { ctx } = useOrg();
  const [data, setData]         = useState<SubData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [billing, setBilling]   = useState<"monthly"|"yearly">("monthly");
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => { if (ctx?.organization?.id) load(); }, [ctx?.organization?.id]);

  const load = async () => {
    const res = await fetch("/api/subscription");
    const d   = await res.json();
    setData(d);
    setBilling(d.plan_period === "yearly" ? "yearly" : "monthly");
    setLoading(false);
  };

  const upgrade = async (planId: string) => {
    setUpgrading(planId);
    const res  = await fetch("/api/chargebee/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId, period: billing }),
    });
    const d = await res.json();
    setUpgrading(null);
    if (!res.ok) { message.error(d.error || "Failed to open checkout"); return; }
    if (d.url) window.location.href = d.url;
  };

  const openBillingPortal = async () => {
    const res  = await fetch("/api/chargebee/portal", { method: "POST" });
    const d    = await res.json();
    if (d.url) window.open(d.url, "_blank");
    else message.error("Could not open billing portal");
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
      <Spin size="large" />
    </div>
  );

  const currentPlan   = data?.plan || "trial";
  const trialDaysLeft = data?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(data.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null;
  const isTrial = currentPlan === "trial";

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: "0 0 4px", color: "#12344d" }}>Subscription</Title>
        <Text style={{ color: "#8fa0b4" }}>Manage your plan, billing, and usage.</Text>
      </div>

      {/* Current plan + usage */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={10}>
          <Card style={{ height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: isTrial ? "rgba(255,198,57,0.12)" : "rgba(44,92,197,0.10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                {isTrial ? "⏱" : "⚡"}
              </div>
              <div>
                <Text style={{ color: "#8fa0b4", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>Current plan</Text>
                <Title level={3} style={{ margin: 0, color: "#12344d", textTransform: "capitalize" }}>{currentPlan}</Title>
              </div>
              <Tag color={isTrial ? "warning" : "processing"} style={{ marginLeft: "auto", borderRadius: 24, fontWeight: 700 }}>
                {isTrial ? `${trialDaysLeft}d left` : "Active"}
              </Tag>
            </div>

            {isTrial && (
              <div style={{ background: trialDaysLeft !== null && trialDaysLeft <= 5 ? "rgba(215,45,48,0.07)" : "rgba(232,110,10,0.07)", border: `1px solid ${trialDaysLeft !== null && trialDaysLeft <= 5 ? "rgba(215,45,48,0.25)" : "rgba(232,110,10,0.25)"}`, borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: trialDaysLeft !== null && trialDaysLeft <= 5 ? "#D72D30" : "#E86E0A", marginBottom: 4 }}>
                  {trialDaysLeft !== null && trialDaysLeft <= 5 ? "⚠️ Trial ending soon!" : "⏳ Trial in progress"}
                </div>
                <Text style={{ color: "#475867", fontSize: 13, display: "block" }}>
                  You have <strong>{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left</strong> on your trial (ends{" "}
                  <strong>{data?.trial_ends_at ? new Date(data.trial_ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "—"}</strong>).
                  Pick a plan below to keep your data and continue without interruption.
                </Text>
              </div>
            )}

            {!isTrial && data?.subscription_end && (
              <Text style={{ color: "#8fa0b4", fontSize: 13, display: "block", marginBottom: 16 }}>
                Renews {new Date(data.subscription_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </Text>
            )}

            <Divider style={{ margin: "16px 0" }} />
            <Button block onClick={openBillingPortal} style={{ fontWeight: 600 }}>
              Manage billing & invoices →
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title={<Text strong style={{ color: "#12344d" }}>Usage this month</Text>} style={{ height: "100%" }}>
            <Space direction="vertical" size={20} style={{ width: "100%" }}>
              {data && Object.entries(data.usage).map(([key, val]) => {
                const pct = val.limit === -1 ? 0 : val.limit > 0 ? Math.min(100, Math.round((val.used / val.limit) * 100)) : 0;
                const isUnlimited = val.limit === -1;
                return (
                  <div key={key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ color: "#475867", textTransform: "capitalize", fontWeight: 600, fontSize: 13 }}>{key}</Text>
                      <Text style={{ color: "#12344d", fontWeight: 700, fontSize: 13 }}>
                        {val.used} / {isUnlimited ? "∞" : val.limit}
                      </Text>
                    </div>
                    {!isUnlimited && (
                      <Progress
                        percent={pct}
                        showInfo={false}
                        strokeColor={pct >= 90 ? "#D72D30" : pct >= 70 ? "#FFC639" : "#2C5CC5"}
                        trailColor="#edf0f4"
                        size="small"
                      />
                    )}
                    {isUnlimited && (
                      <div style={{ height: 4, background: "rgba(44,92,197,0.25)", borderRadius: 2 }} />
                    )}
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Plan comparison */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <Title level={4} style={{ margin: "0 0 2px", color: "#12344d" }}>
              {isTrial ? "Choose a plan to continue" : "Upgrade your plan"}
            </Title>
            {isTrial && (
              <Text style={{ color: "#8fa0b4", fontSize: 13 }}>All plans include your remaining trial days. No charge until your trial ends.</Text>
            )}
          </div>
          {/* Billing toggle */}
          <div style={{ display: "flex", background: "#f0f3f7", border: "1px solid #e2e8f0", borderRadius: 8, padding: 4 }}>
            {(["monthly","yearly"] as const).map(p => (
              <button key={p} onClick={() => setBilling(p)}
                style={{ padding: "7px 20px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                  background: billing === p ? "#2C5CC5" : "transparent",
                  color: billing === p ? "#ffffff" : "#475867",
                  boxShadow: billing === p ? "0 1px 4px rgba(44,92,197,0.25)" : "none" }}>
                {p === "monthly" ? "Monthly" : "Yearly"}
                {p === "yearly" && <span style={{ marginLeft: 6, fontSize: 10, color: "#00875A", fontWeight: 700 }}>Save 17%</span>}
              </button>
            ))}
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {PLANS.map(plan => {
            const isCurrent = currentPlan === plan.id;
            const price     = billing === "yearly" ? plan.yearly : plan.monthly;
            return (
              <Col key={plan.id} xs={24} md={8}>
                <Card
                  style={{
                    height: "100%",
                    border: isCurrent ? `1px solid ${plan.color}60` : plan.popular ? "1px solid rgba(44,92,197,0.3)" : undefined,
                    background: isCurrent ? `${plan.color}0a` : plan.popular ? "rgba(44,92,197,0.05)" : undefined,
                    position: "relative",
                  }}
                >
                  {plan.popular && !isCurrent && (
                    <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#2C5CC5", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 16px", borderRadius: 24 }}>
                      Most Popular
                    </div>
                  )}
                  {isCurrent && (
                    <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 16px", borderRadius: 24 }}>
                      Current Plan
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${plan.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: plan.color }}>
                      {plan.icon}
                    </div>
                    <Text strong style={{ fontSize: 16, color: "#12344d" }}>{plan.name}</Text>
                  </div>

                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: "#12344d" }}>${price}</span>
                    <span style={{ color: "#8fa0b4", fontSize: 14 }}>/mo</span>
                  </div>
                  {billing === "yearly" && (
                    <Text style={{ color: "#00875A", fontSize: 12, display: "block", marginBottom: 4 }}>
                      Billed ${price * 12}/year
                    </Text>
                  )}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(0,135,90,0.08)", border: "1px solid rgba(0,135,90,0.2)", borderRadius: 100, padding: "3px 10px", marginBottom: 12 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00875A", flexShrink: 0, display: "inline-block" }} />
                    <Text style={{ fontSize: 11, color: "#00875A", fontWeight: 700 }}>15-day free trial included</Text>
                  </div>
                  <Paragraph style={{ color: "#475867", fontSize: 13, marginBottom: 20 }}>{plan.desc}</Paragraph>

                  <Button
                    type={plan.popular ? "primary" : "default"}
                    block
                    disabled={isCurrent}
                    loading={upgrading === plan.id}
                    onClick={() => !isCurrent && upgrade(plan.id)}
                    style={{ fontWeight: 700, marginBottom: 20, ...(isCurrent ? { opacity: 0.6 } : {}) }}
                  >
                    {isCurrent ? "✓ Current plan" : isTrial ? `Choose ${plan.name}` : `Upgrade to ${plan.name}`}
                  </Button>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {plan.features.map(f => (
                      <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 8, opacity: f.included ? 1 : 0.4 }}>
                        <span style={{ color: f.included ? "#00875A" : "#8fa0b4", fontSize: 13, flexShrink: 0 }}>
                          {f.included ? <CheckOutlined /> : <CloseOutlined />}
                        </span>
                        <Text style={{ fontSize: 13, color: f.included ? "#475867" : "#a0b0c0" }}>{f.text}</Text>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      <div style={{ textAlign: "center", padding: "24px 0", color: "#a0b0c0", fontSize: 13 }}>
        All plans include a 15-day free trial — no charge until the trial ends. Cancel anytime.{" "}
        <a onClick={openBillingPortal} style={{ color: "#2C5CC5", cursor: "pointer" }}>View invoices</a>
      </div>
    </div>
  );
}
