"use client";
import Link from "next/link";
import { useState } from "react";

// ── Freshworks Crayons tokens ──────────────────────────────────────────────────
const FW = {
  blue:    "#2C5CC5",
  blueLt:  "#ebf0fb",
  blueHov: "#1a4aad",
  green:   "#00875A",
  greenLt: "#e0f5ed",
  amber:   "#E86E0A",
  amberLt: "#fef3e2",
  red:     "#D72D30",
  bg:      "#f5f7f9",
  white:   "#ffffff",
  text:    "#12344d",
  text2:   "#475867",
  text3:   "#8fa0b4",
  border:  "#e2e8f0",
  borderMd:"#cdd7e0",
};

const STATS = [
  { val: "96%",   label: "Conversion attribution accuracy", color: FW.blue  },
  { val: "74%",   label: "Reduction in payout disputes",    color: FW.green },
  { val: "66%",   label: "Fraud blocked by AI detection",   color: FW.amber },
  { val: "3,000+",label: "Brands running programs today",   color: FW.blue  },
];

const TABS = ["For brands", "For affiliates", "For teams"] as const;
type Tab = typeof TABS[number];

const TAB_CONTENT: Record<Tab, { icon: string; headline: string; body: string; points: string[] }> = {
  "For brands": {
    icon: "🏢",
    headline: "Launch and scale your affiliate program without complexity",
    body: "FreshAffiliates gives your marketing team everything needed to recruit top affiliates, set smart commission rules, and track every conversion in real time — all from a single dashboard.",
    points: ["One-click program setup with customizable commission structures", "AI fraud detection stops invalid traffic before a single dollar is paid out", "Automated payouts to any method, any currency, on your schedule", "White-label portal — affiliates see your brand, never ours"],
  },
  "For affiliates": {
    icon: "🤝",
    headline: "A beautiful portal your affiliates will actually use",
    body: "Give your affiliates a clean, branded dashboard where they can access their tracking links, view real-time stats, download creative assets, and check their earnings — from any device.",
    points: ["Real-time click and conversion stats with 30-day history", "Personalised tracking links and QR codes", "Creative asset library with banners, copy, and email templates", "Leaderboard and VIP tier progress to keep top affiliates motivated"],
  },
  "For teams": {
    icon: "👥",
    headline: "Give your team the visibility and control they need",
    body: "From approving conversions to managing payout schedules, FreshAffiliates gives operations, finance, and marketing teams the tools to run a clean, compliant affiliate program at scale.",
    points: ["Role-based access for owners, admins, members, and viewers", "Conversion approval workflow with audit trail", "Bulk payout processing with automatic tax form collection", "Analytics export and API access for BI integrations"],
  },
};

const CAPABILITIES = [
  { icon: "⚡", color: FW.blue,  title: "Instant Tracking Links", desc: "Server-side attribution with UTM, cookie, and pixel tracking. Zero latency, 100% accuracy." },
  { icon: "🤖", color: FW.green, title: "AI Fraud Detection",     desc: "Real-time ML models catch click fraud, fake conversions, and suspicious patterns before payout." },
  { icon: "💸", color: FW.amber, title: "Smart Commissions",       desc: "Flat, percentage, tiered, geo-based, product-based, or recurring — any structure you need." },
  { icon: "🚀", color: FW.blue,  title: "Instant Payouts",         desc: "Automate payments via PayPal, bank transfer, Stripe, or crypto on any schedule, in any currency." },
  { icon: "🌐", color: FW.green, title: "Affiliate Marketplace",   desc: "Discover and recruit from 500K+ vetted affiliates and micro-influencers across 50+ niches." },
  { icon: "📊", color: FW.amber, title: "Real-Time Analytics",     desc: "Live clicks, conversions, EPC, AOV, and LTV. Attribution modeling and BI export built in." },
  { icon: "🎨", color: FW.blue,  title: "White-Label Portal",      desc: "Your logo. Your domain. Your colors. Affiliates see your brand everywhere, not ours." },
  { icon: "🔗", color: FW.green, title: "60+ Integrations",        desc: "Shopify, WooCommerce, Stripe, HubSpot, Klaviyo, Zapier — one-click setup for all." },
];

const TESTIMONIALS = [
  { quote: "We went from $0 to $48K/month in affiliate revenue in 90 days. The setup literally took 20 minutes.", name: "Sarah Chen", role: "Head of Growth · DTC Brand", avatar: "SC", metric: "+$48K/mo", metricColor: FW.blue },
  { quote: "Switched from Impact.com and saved $2,400/mo. FreshAffiliates has every feature we needed at a fraction of the cost.", name: "Marcus Johnson", role: "CMO · B2B SaaS", avatar: "MJ", metric: "$2,400/mo saved", metricColor: FW.green },
  { quote: "AI fraud detection caught $18K in fraudulent commissions in week one. That alone paid for years of the platform.", name: "Priya Patel", role: "Founder · Supplement Brand", avatar: "PP", metric: "$18K caught", metricColor: FW.amber },
];

const PLANS = [
  { name: "Starter", price: 15,  desc: "Perfect for launching your first program", features: ["50 affiliates", "Unlimited links", "Basic commissions", "PayPal payouts", "Core analytics", "5 integrations"] },
  { name: "Growth",  price: 30, desc: "For scaling brands with active programs",  features: ["500 affiliates", "AI fraud detection", "Advanced commissions", "All payout methods", "White-label portal", "30+ integrations", "Email automation"], popular: true },
  { name: "Scale",   price: 75, desc: "Unlimited power for high-volume programs", features: ["Unlimited affiliates", "Marketplace access", "Custom portal domain", "API + webhooks", "Advanced BI analytics", "Dedicated manager"] },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("For brands");
  const [yearly, setYearly]       = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const NAV_LINKS = ["Features", "How it works", "Pricing", "Customers"];

  return (
    <div style={{ background: FW.white, minHeight: "100vh", color: FW.text, fontFamily: "Inter,-apple-system,'Segoe UI',sans-serif" }}>

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: FW.white, borderBottom: `1px solid ${FW.border}`, boxShadow: "0 1px 3px rgba(12,52,77,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: FW.blue, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: "#fff" }}>F</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: FW.text, letterSpacing: "-0.3px" }}>FreshAffiliates</span>
          </Link>

          {/* Center links */}
          <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                style={{ fontSize: 14, fontWeight: 500, color: FW.text2, textDecoration: "none", transition: "color .15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = FW.blue)}
                onMouseLeave={e => (e.currentTarget.style.color = FW.text2)}>
                {l}
              </a>
            ))}
          </div>

          {/* Right CTAs */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/sign-in" style={{ fontSize: 14, fontWeight: 500, color: FW.text2, textDecoration: "none", padding: "8px 14px" }}
              onMouseEnter={e => (e.currentTarget.style.color = FW.blue)}
              onMouseLeave={e => (e.currentTarget.style.color = FW.text2)}>
              Sign in
            </Link>
            <Link href="/sign-up" style={{ fontSize: 14, fontWeight: 600, color: "#fff", background: FW.blue, padding: "9px 20px", borderRadius: 6, textDecoration: "none", transition: "background .15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = FW.blueHov)}
              onMouseLeave={e => (e.currentTarget.style.background = FW.blue)}>
              Try it free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{ background: `linear-gradient(180deg, ${FW.white} 0%, ${FW.bg} 100%)`, padding: "80px 24px 0", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: FW.blueLt, border: `1px solid ${FW.blue}33`, borderRadius: 100, padding: "6px 16px", fontSize: 13, fontWeight: 600, color: FW.blue, marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: FW.blue, flexShrink: 0, display: "inline-block" }} />
            Affiliate Management Platform
          </div>

          <h1 style={{ fontSize: "clamp(36px,5.5vw,64px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1.5px", margin: "0 0 24px", color: FW.text }}>
            Modern, AI-powered<br />affiliate management
          </h1>

          <p style={{ fontSize: "clamp(16px,1.8vw,20px)", color: FW.text2, maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Transform your affiliate program with a unified platform that's easy to use and built for growth. Launch in minutes, scale to millions.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: "#fff", background: FW.blue, padding: "13px 28px", borderRadius: 7, textDecoration: "none", boxShadow: "0 2px 8px rgba(44,92,197,0.3)", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = FW.blueHov; e.currentTarget.style.boxShadow = "0 4px 16px rgba(44,92,197,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = FW.blue;    e.currentTarget.style.boxShadow = "0 2px 8px rgba(44,92,197,0.3)"; }}>
              Try it free
            </Link>
            <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, color: FW.blue, background: FW.white, padding: "13px 28px", borderRadius: 7, textDecoration: "none", border: `1.5px solid ${FW.borderMd}`, transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = FW.blue; e.currentTarget.style.background = FW.blueLt; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = FW.borderMd; e.currentTarget.style.background = FW.white; }}>
              Book a demo
            </Link>
          </div>
          <p style={{ color: FW.text3, fontSize: 13, marginBottom: 64 }}>15-day free trial on all plans · No credit card required · Cancel anytime</p>
        </div>

        {/* ── Dashboard screenshot mockup ── */}
        <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative", paddingBottom: 0 }}>
          <div style={{ borderRadius: "14px 14px 0 0", border: `1px solid ${FW.border}`, borderBottom: "none", background: FW.white, boxShadow: "0 -8px 40px rgba(12,52,77,0.12), 0 0 0 1px rgba(12,52,77,0.04)", overflow: "hidden" }}>
            {/* Browser chrome */}
            <div style={{ background: FW.bg, borderBottom: `1px solid ${FW.border}`, padding: "10px 18px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {[FW.red, FW.amber, "#22c55e"].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: 0.7 }} />)}
              </div>
              <div style={{ flex: 1, height: 24, margin: "0 16px", background: FW.white, borderRadius: 6, border: `1px solid ${FW.border}`, display: "flex", alignItems: "center", paddingLeft: 10, gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: FW.green, display: "inline-block" }} />
                <span style={{ color: FW.text3, fontSize: 11 }}>app.freshaffiliates.com/dashboard</span>
              </div>
            </div>

            {/* App layout */}
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: 400 }}>
              {/* Sidebar */}
              <div style={{ background: FW.white, borderRight: `1px solid ${FW.border}`, padding: "16px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, padding: "0 16px 16px", borderBottom: `1px solid ${FW.border}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: FW.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff" }}>F</div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: FW.text }}>FreshAffiliates</span>
                </div>
                {[["📊","Overview",true],["📋","Programs",false],["👥","Affiliates",false],["🔗","Links",false],["💰","Payouts",false],["📈","Analytics",false]].map(([icon,label,active]) => (
                  <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", margin: "2px 8px", borderRadius: 6, background: active ? FW.blueLt : "transparent", color: active ? FW.blue : FW.text2, fontSize: 13, fontWeight: active ? 600 : 400, borderLeft: active ? `3px solid ${FW.blue}` : "3px solid transparent" }}>
                    <span>{icon}</span>{label}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div style={{ padding: "24px 28px", background: FW.bg }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: FW.text, marginBottom: 4 }}>Good morning, Sarah 👋</div>
                    <div style={{ fontSize: 13, color: FW.text3 }}>Your program is performing 23% above last month</div>
                  </div>
                  <div style={{ background: FW.blue, borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#fff" }}>+ Add affiliate</div>
                </div>

                {/* KPI cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
                  {[
                    { label: "Total Revenue",    value: "$48,290", change: "+23%",     color: FW.green },
                    { label: "Active Affiliates", value: "284",     change: "+12",      color: FW.blue  },
                    { label: "Conversions",       value: "1,847",   change: "+8%",      color: FW.amber },
                    { label: "Commissions Due",   value: "$9,240",  change: "this month",color: FW.blue },
                  ].map(k => (
                    <div key={k.label} style={{ background: FW.white, border: `1px solid ${FW.border}`, borderRadius: 8, padding: "14px 16px", boxShadow: "0 1px 3px rgba(12,52,77,0.06)" }}>
                      <div style={{ fontSize: 10, color: FW.text3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{k.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: FW.text, marginBottom: 4 }}>{k.value}</div>
                      <div style={{ fontSize: 11, color: k.color, fontWeight: 600 }}>{k.change}</div>
                    </div>
                  ))}
                </div>

                {/* Chart placeholder */}
                <div style={{ background: FW.white, border: `1px solid ${FW.border}`, borderRadius: 8, padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, color: FW.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Revenue — Last 30 days</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 64 }}>
                    {[30,50,40,70,55,85,45,90,60,80,50,75,95,65,85,45,88,55,72,90,40,60,78,55,88,68,95,60,82,74].map((h,i) => (
                      <div key={i} style={{ flex: 1, borderRadius: "3px 3px 0 0", height: `${h}%`, background: i === 26 ? FW.blue : `rgba(44,92,197,${0.15 + (h/100)*0.25})` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating notification cards */}
          <div style={{ position: "absolute", top: 80, right: -20, background: FW.white, border: `1px solid ${FW.border}`, borderRadius: 12, padding: "12px 18px", boxShadow: "0 8px 24px rgba(12,52,77,0.12)" }}>
            <div style={{ fontSize: 10, color: FW.green, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>New conversion</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: FW.text }}>+$340.00</div>
            <div style={{ fontSize: 11, color: FW.text3 }}>via @techblogger · just now</div>
          </div>
          <div style={{ position: "absolute", bottom: 60, left: -20, background: FW.white, border: `1px solid ${FW.border}`, borderRadius: 12, padding: "12px 18px", boxShadow: "0 8px 24px rgba(12,52,77,0.12)" }}>
            <div style={{ fontSize: 10, color: FW.red, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Fraud blocked</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: FW.text }}>$1,200 ⚠</div>
            <div style={{ fontSize: 11, color: FW.text3 }}>AI stopped invalid payout</div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR (like Freshservice's 96%/74%/66%/77%) ──────────────── */}
      <section style={{ background: FW.blue, padding: "40px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ textAlign: "center", padding: "0 24px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.2)" : "none" }}>
              <div style={{ fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 800, color: "#fff", letterSpacing: "-1px", marginBottom: 6 }}>{s.val}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BENEFITS TABS (like Freshservice's "For employees/agents/leaders") */}
      <section id="features" style={{ padding: "96px 24px", background: FW.white }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-block", background: FW.blueLt, color: FW.blue, fontSize: 12, fontWeight: 700, padding: "5px 16px", borderRadius: 100, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Built for everyone
            </div>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, letterSpacing: "-1px", margin: "0 0 14px", color: FW.text }}>
              Modern affiliate management<br />for today's growth teams
            </h2>
            <p style={{ color: FW.text2, fontSize: 17, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              Explore the comprehensive capabilities that transform how you run affiliate programs at scale.
            </p>
          </div>

          {/* Tab pills */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 48 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: "10px 24px", borderRadius: 100, border: `1.5px solid ${activeTab === t ? FW.blue : FW.border}`, background: activeTab === t ? FW.blue : FW.white, color: activeTab === t ? "#fff" : FW.text2, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}>
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 40, marginBottom: 20 }}>{TAB_CONTENT[activeTab].icon}</div>
              <h3 style={{ fontSize: "clamp(22px,2.5vw,30px)", fontWeight: 800, color: FW.text, margin: "0 0 16px", letterSpacing: "-0.5px", lineHeight: 1.25 }}>
                {TAB_CONTENT[activeTab].headline}
              </h3>
              <p style={{ color: FW.text2, fontSize: 16, lineHeight: 1.75, margin: "0 0 28px" }}>
                {TAB_CONTENT[activeTab].body}
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                {TAB_CONTENT[activeTab].points.map(p => (
                  <li key={p} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 15, color: FW.text2 }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: FW.blueLt, color: FW.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, flexShrink: 0, marginTop: 2 }}>✓</span>
                    {p}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 36 }}>
                <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: FW.blue, textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget.style.color = FW.blueHov)}
                  onMouseLeave={e => (e.currentTarget.style.color = FW.blue)}>
                  Explore {activeTab.toLowerCase()} features →
                </Link>
              </div>
            </div>
            {/* Visual side */}
            <div style={{ background: FW.bg, border: `1px solid ${FW.border}`, borderRadius: 16, padding: 32, minHeight: 320, display: "flex", flexDirection: "column", gap: 14 }}>
              {TAB_CONTENT[activeTab].points.map((p, i) => (
                <div key={i} style={{ background: FW.white, border: `1px solid ${FW.border}`, borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 3px rgba(12,52,77,0.05)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: i === 0 ? FW.blueLt : i === 1 ? FW.greenLt : i === 2 ? FW.amberLt : FW.blueLt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {i === 0 ? "⚡" : i === 1 ? "🛡️" : i === 2 ? "💸" : "🎨"}
                  </div>
                  <span style={{ fontSize: 13, color: FW.text2, fontWeight: 500 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES GRID (like Freshservice's "Simplify the complex") ── */}
      <section style={{ padding: "96px 24px", background: FW.bg, borderTop: `1px solid ${FW.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, flexWrap: "wrap", gap: 24 }}>
            <div>
              <div style={{ display: "inline-block", background: FW.blueLt, color: FW.blue, fontSize: 12, fontWeight: 700, padding: "5px 16px", borderRadius: 100, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Capabilities
              </div>
              <h2 style={{ fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 800, letterSpacing: "-0.8px", margin: 0, color: FW.text }}>
                Simplify the complex —<br />powerful affiliate tools
              </h2>
            </div>
            <Link href="/sign-up" style={{ fontSize: 14, fontWeight: 600, color: FW.blue, textDecoration: "none", whiteSpace: "nowrap" }}>
              See all features →
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {CAPABILITIES.map(c => (
              <div key={c.title} style={{ background: FW.white, border: `1px solid ${FW.border}`, borderRadius: 12, padding: "24px 22px", boxShadow: "0 1px 3px rgba(12,52,77,0.06)", transition: "all .2s", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = FW.blue; e.currentTarget.style.boxShadow = "0 4px 16px rgba(44,92,197,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = FW.border; e.currentTarget.style.boxShadow = "0 1px 3px rgba(12,52,77,0.06)"; e.currentTarget.style.transform = "none"; }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{c.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: FW.text, margin: "0 0 8px" }}>{c.title}</h3>
                <p style={{ fontSize: 13, color: FW.text2, lineHeight: 1.65, margin: 0 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: "96px 24px", background: FW.white, borderTop: `1px solid ${FW.border}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-block", background: FW.blueLt, color: FW.blue, fontSize: 12, fontWeight: 700, padding: "5px 16px", borderRadius: 100, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>Simple by design</div>
            <h2 style={{ fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 800, letterSpacing: "-0.8px", margin: "0 0 14px", color: FW.text }}>Zero to revenue in 4 steps</h2>
            <p style={{ color: FW.text2, fontSize: 16, margin: "0 auto", maxWidth: 480, lineHeight: 1.7 }}>Launch your affiliate program faster than you can finish your coffee.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, position: "relative" }}>
            {/* Connector line */}
            <div style={{ position: "absolute", top: 28, left: "12.5%", right: "12.5%", height: 2, background: `linear-gradient(90deg,${FW.blue},${FW.blue})`, opacity: 0.15, zIndex: 0 }} />
            {[
              { n: "01", title: "Create your program",   desc: "Set commission rules, configure payouts, and launch your affiliate page in under 5 minutes." },
              { n: "02", title: "Recruit affiliates",     desc: "Share your public program page or browse our marketplace of 500K+ verified creators." },
              { n: "03", title: "Track everything",       desc: "Every click and conversion tracked server-side with real-time fraud scoring and attribution." },
              { n: "04", title: "Pay automatically",      desc: "Automated payouts on your schedule — any method, any currency, globally." },
            ].map((s, i) => (
              <div key={s.n} style={{ textAlign: "center", padding: "0 20px", position: "relative", zIndex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: FW.blue, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, margin: "0 auto 20px" }}>
                  {i + 1}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: FW.text, margin: "0 0 10px" }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: FW.text2, lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF (like Freshservice's "Join 74,000+ companies") ───── */}
      <section id="customers" style={{ padding: "96px 24px", background: FW.bg, borderTop: `1px solid ${FW.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-block", background: FW.blueLt, color: FW.blue, fontSize: 12, fontWeight: 700, padding: "5px 16px", borderRadius: 100, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>Real results</div>
            <h2 style={{ fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 800, letterSpacing: "-0.8px", margin: "0 0 14px", color: FW.text }}>
              Join 3,000+ brands growing<br />with FreshAffiliates
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: FW.white, border: `1px solid ${FW.border}`, borderRadius: 12, padding: "32px 28px", boxShadow: "0 1px 3px rgba(12,52,77,0.06)", transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(12,52,77,0.10)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(12,52,77,0.06)"; e.currentTarget.style.transform = "none"; }}>
                {/* Stars */}
                <div style={{ display: "flex", gap: 3, marginBottom: 18 }}>
                  {Array(5).fill(0).map((_,i) => <span key={i} style={{ color: FW.amber, fontSize: 15 }}>★</span>)}
                </div>
                <p style={{ color: FW.text2, fontSize: 15, lineHeight: 1.75, margin: "0 0 24px", fontStyle: "italic" }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${t.metricColor}18`, border: `2px solid ${t.metricColor}33`, display: "flex", alignItems: "center", justifyContent: "center", color: t.metricColor, fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ color: FW.text, fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ color: FW.text3, fontSize: 12 }}>{t.role}</div>
                  </div>
                  <div style={{ marginLeft: "auto", background: `${t.metricColor}12`, border: `1px solid ${t.metricColor}30`, color: t.metricColor, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 100, whiteSpace: "nowrap" }}>
                    {t.metric}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "96px 24px", background: FW.white, borderTop: `1px solid ${FW.border}` }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ display: "inline-block", background: FW.blueLt, color: FW.blue, fontSize: 12, fontWeight: 700, padding: "5px 16px", borderRadius: 100, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pricing</div>
            <h2 style={{ fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 800, letterSpacing: "-0.8px", margin: "0 0 12px", color: FW.text }}>Simple, transparent pricing</h2>
            <p style={{ color: FW.text2, fontSize: 16, marginBottom: 32 }}>Start free. No hidden fees. Upgrade when you're ready.</p>
            {/* Toggle */}
            <div style={{ display: "inline-flex", background: FW.bg, border: `1px solid ${FW.border}`, borderRadius: 8, padding: 4, gap: 4 }}>
              {(["Monthly","Yearly"] as const).map(p => (
                <button key={p} onClick={() => setYearly(p === "Yearly")}
                  style={{ padding: "8px 22px", borderRadius: 6, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                    background: (yearly) === (p === "Yearly") ? FW.blue : "transparent",
                    color: (yearly) === (p === "Yearly") ? "#fff" : FW.text2,
                    display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {p}
                  {p === "Yearly" && <span style={{ fontSize: 10, background: FW.greenLt, color: FW.green, padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>Save 17%</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {PLANS.map(plan => {
              const price = yearly ? Math.round(plan.price * 0.83) : plan.price;
              return (
                <div key={plan.name} style={{ background: plan.popular ? FW.blue : FW.white, border: `1.5px solid ${plan.popular ? FW.blue : FW.border}`, borderRadius: 14, padding: "32px 28px", position: "relative", boxShadow: plan.popular ? "0 8px 32px rgba(44,92,197,0.25)" : "0 1px 3px rgba(12,52,77,0.06)" }}>
                  {plan.popular && (
                    <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: FW.green, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 18px", borderRadius: 100, whiteSpace: "nowrap" }}>
                      Most Popular
                    </div>
                  )}
                  <div style={{ fontSize: 18, fontWeight: 800, color: plan.popular ? "#fff" : FW.text, marginBottom: 6 }}>{plan.name}</div>
                  <div style={{ fontSize: 13, color: plan.popular ? "rgba(255,255,255,0.7)" : FW.text3, marginBottom: 24, lineHeight: 1.5 }}>{plan.desc}</div>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 44, fontWeight: 900, color: plan.popular ? "#fff" : FW.text, letterSpacing: "-1.5px" }}>${price}</span>
                    <span style={{ color: plan.popular ? "rgba(255,255,255,0.6)" : FW.text3, fontSize: 14 }}>/mo</span>
                  </div>
                  {yearly && (
                    <div style={{ fontSize: 12, color: plan.popular ? "rgba(255,255,255,0.7)" : FW.green, marginBottom: 4 }}>
                      Billed ${price * 12}/year
                    </div>
                  )}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: plan.popular ? "rgba(255,255,255,0.15)" : "rgba(0,135,90,0.08)", borderRadius: 100, padding: "3px 10px", marginBottom: 20, marginTop: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: plan.popular ? "#fff" : FW.green, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: plan.popular ? "#fff" : FW.green, fontWeight: 700 }}>15-day free trial</span>
                  </div>
                  <Link href="/sign-up" style={{ display: "block", textAlign: "center", padding: "12px", borderRadius: 7, fontSize: 14, fontWeight: 700, marginBottom: 28, textDecoration: "none", transition: "all .15s",
                    background: plan.popular ? "#fff" : FW.blue,
                    color: plan.popular ? FW.blue : "#fff" }}>
                    Start 15-day trial →
                  </Link>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: plan.popular ? "rgba(255,255,255,0.85)" : FW.text2 }}>
                        <span style={{ color: plan.popular ? "#fff" : FW.green, flexShrink: 0, fontWeight: 700 }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p style={{ textAlign: "center", color: FW.text3, fontSize: 13, marginTop: 28 }}>
            All plans include a 15-day free trial. No charge until the trial ends. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── GET STARTED (like Freshservice's Trial + Contact Sales + Tour) ── */}
      <section style={{ padding: "96px 24px", background: FW.bg, borderTop: `1px solid ${FW.border}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 800, letterSpacing: "-0.8px", margin: "0 0 12px", color: FW.text }}>
              Get started with FreshAffiliates
            </h2>
            <p style={{ color: FW.text2, fontSize: 16, lineHeight: 1.7 }}>
              Three ways to explore the platform — hands-on, guided, or self-paced.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { icon: "🚀", title: "15-day free trial", sub: "Try it free", body: "Explore any paid plan hands-on for 15 days — no credit card required. Your card is only charged after the trial ends.", cta: "Start free trial", href: "/sign-up", primary: true },
              { icon: "📅", title: "Contact sales", sub: "Book a demo", body: "Connect with our product experts for a tailored demo, pricing insights, and answers to your questions.", cta: "Book a demo", href: "/sign-up", primary: false },
              { icon: "▶️", title: "Product tour", sub: "Self-guided tour", body: "Watch a short 6-minute tour of FreshAffiliates to see how it streamlines affiliate operations.", cta: "Take the tour", href: "/sign-up", primary: false },
            ].map(item => (
              <div key={item.title} style={{ background: FW.white, border: `1px solid ${FW.border}`, borderRadius: 12, padding: "32px 28px", boxShadow: "0 1px 3px rgba(12,52,77,0.06)", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{item.icon}</div>
                <div style={{ fontSize: 11, color: FW.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{item.sub}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: FW.text, margin: "0 0 12px" }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: FW.text2, lineHeight: 1.7, margin: "0 0 24px", flex: 1 }}>{item.body}</p>
                <Link href={item.href} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "11px 24px", borderRadius: 7, fontSize: 14, fontWeight: 600, textDecoration: "none", transition: "all .15s",
                  background: item.primary ? FW.blue : "transparent",
                  color: item.primary ? "#fff" : FW.blue,
                  border: item.primary ? "none" : `1.5px solid ${FW.blue}` }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                  {item.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ background: FW.text, padding: "56px 24px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: FW.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff" }}>F</div>
                <span style={{ fontWeight: 800, color: "#fff", fontSize: 16 }}>FreshAffiliates</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.7, margin: "0 0 20px" }}>
                Modern, AI-powered affiliate management for brands that are serious about growth.
              </p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>© 2026 FreshAffiliates, Inc.</p>
            </div>
            {/* Link columns */}
            {[
              { title: "Product",  links: ["Features","Pricing","Changelog","Roadmap","Status"] },
              { title: "Company",  links: ["About","Blog","Careers","Press","Partners"] },
              { title: "Resources",links: ["Docs","API","Integrations","Community","Templates"] },
              { title: "Legal",    links: ["Privacy","Terms","Security","Cookies","GDPR"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>{col.title}</div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(l => (
                    <li key={l}><a href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "color .15s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}>{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 20 }}>
              {["Privacy Notice","Site Terms","Cookie Policy","Accessibility"].map(l => (
                <a key={l} href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>{l}</a>
              ))}
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
