"use client";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
];

const FEATURES = [
  {
    icon: "🔗",
    title: "Smart Tracking Links",
    desc: "Generate unique affiliate links with UTM parameters, pixel-based tracking, and server-side attribution. No cookies needed.",
    badge: "Core",
    color: "#7c3aed",
  },
  {
    icon: "🤖",
    title: "AI Fraud Detection",
    desc: "Real-time ML models detect click fraud, fake conversions, and suspicious affiliate behavior before payouts.",
    badge: "AI-Powered",
    color: "#10b981",
  },
  {
    icon: "💸",
    title: "Flexible Commissions",
    desc: "Flat fee, percentage, tiered, recurring, product-based, geo-based — set any commission structure in minutes.",
    badge: "Core",
    color: "#f59e0b",
  },
  {
    icon: "⚡",
    title: "Instant Payouts",
    desc: "Pay affiliates via PayPal, bank transfer, Stripe, USDC, or USDT. Automated on custom schedules.",
    badge: "Core",
    color: "#3b82f6",
  },
  {
    icon: "🏪",
    title: "Affiliate Marketplace",
    desc: "Discover and recruit from 500,000+ vetted affiliates and micro-influencers across 50+ niches.",
    badge: "Unique",
    color: "#ec4899",
  },
  {
    icon: "📊",
    title: "Real-Time Analytics",
    desc: "Live dashboard with clicks, conversions, EPC, AOV, LTV, and cohort analysis. Export to CSV or BI tools.",
    badge: "Core",
    color: "#06b6d4",
  },
  {
    icon: "🎨",
    title: "White-Label Portal",
    desc: "Give affiliates a fully branded portal with your logo, colors, and domain. They never see Afflo.",
    badge: "Pro",
    color: "#8b5cf6",
  },
  {
    icon: "🌍",
    title: "Multi-Tier Commissions",
    desc: "Run 2-tier and 3-tier referral programs. Reward affiliates for recruiting sub-affiliates.",
    badge: "Pro",
    color: "#10b981",
  },
  {
    icon: "🔌",
    title: "60+ Integrations",
    desc: "Shopify, WooCommerce, Stripe, PayPal, HubSpot, Klaviyo, Zapier, and 55 more. Connect in one click.",
    badge: "Core",
    color: "#f97316",
  },
  {
    icon: "📧",
    title: "Affiliate Email Automation",
    desc: "Automated welcome sequences, performance alerts, payment notifications, and custom campaigns to affiliates.",
    badge: "Pro",
    color: "#7c3aed",
  },
  {
    icon: "📄",
    title: "Contract & Compliance",
    desc: "Built-in e-signatures, W9/W8-BEN tax form collection, GDPR consent, and custom affiliate agreements.",
    badge: "Core",
    color: "#64748b",
  },
  {
    icon: "📱",
    title: "Mobile-First Affiliate App",
    desc: "Affiliates track their stats, access creatives, and request payouts from iOS and Android apps.",
    badge: "Unique",
    color: "#10b981",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Create your program", desc: "Set up your affiliate program in under 5 minutes. Define commissions, create your landing page, and configure payouts." },
  { step: "02", title: "Recruit affiliates", desc: "Share your public program page or browse our marketplace of 500K+ vetted affiliates and influencers." },
  { step: "03", title: "Track everything", desc: "Every click, conversion, and sale is tracked in real-time with server-side accuracy and AI fraud protection." },
  { step: "04", title: "Pay automatically", desc: "Set payout schedules and Afflo handles payments to every affiliate in their preferred method and currency." },
];

const PRICING = [
  {
    name: "Starter",
    price: 49,
    period: "mo",
    desc: "For bootstrapped brands launching their first affiliate program.",
    features: [
      "Up to 50 affiliates",
      "Unlimited tracking links",
      "Basic commission rules",
      "Email payouts (PayPal)",
      "Core analytics dashboard",
      "5 integrations",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlight: false,
    badge: null,
  },
  {
    name: "Growth",
    price: 149,
    period: "mo",
    desc: "For scaling brands with active affiliate programs.",
    features: [
      "Up to 500 affiliates",
      "Advanced commission rules (tiered, geo, product)",
      "AI fraud detection",
      "All payout methods (PayPal, bank, crypto)",
      "White-label affiliate portal",
      "Multi-tier referrals (2-tier)",
      "30+ integrations",
      "Affiliate email automation",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Scale",
    price: 399,
    period: "mo",
    desc: "For high-volume programs with complex needs.",
    features: [
      "Unlimited affiliates",
      "3-tier referral programs",
      "Affiliate marketplace access",
      "Custom domain white-label",
      "Advanced analytics + BI export",
      "Contract & compliance tools",
      "Dedicated account manager",
      "API access + webhooks",
      "Mobile app for affiliates",
      "Custom integrations",
    ],
    cta: "Talk to Sales",
    highlight: false,
    badge: null,
  },
];

const TESTIMONIALS = [
  {
    quote: "We launched our affiliate program in 20 minutes. Within 60 days, affiliates drove 34% of our total revenue. The ROI is insane.",
    name: "Sarah Chen",
    role: "Head of Growth, Shopify Brand",
    avatar: "SC",
    color: "#7c3aed",
    metric: "+34% revenue",
  },
  {
    quote: "Switched from Impact.com and saved $2,400/mo. Afflo has every feature we need and the dashboard is 10x cleaner.",
    name: "Marcus Johnson",
    role: "CMO, B2B SaaS Startup",
    avatar: "MJ",
    color: "#10b981",
    metric: "$2,400/mo saved",
  },
  {
    quote: "The AI fraud detection caught $18K in fraudulent commissions in our first month. That alone paid for 10 years of Afflo.",
    name: "Priya Patel",
    role: "Founder, DTC Supplement Brand",
    avatar: "PP",
    color: "#f59e0b",
    metric: "$18K fraud caught",
  },
];

const STATS = [
  { value: "500K+", label: "Verified affiliates in marketplace" },
  { value: "$2.4B+", label: "Commissions tracked" },
  { value: "99.9%", label: "Platform uptime SLA" },
  { value: "60+", label: "Native integrations" },
];

export default function HomePage() {
  const [billingYearly, setBillingYearly] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <div className="grid-bg min-h-screen">
      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#030711]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-sm font-bold text-white">A</div>
            <span className="font-bold text-white text-lg tracking-tight">Afflo</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">{l.label}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">Sign in</Link>
            <Link href="/sign-up" className="btn-primary text-sm text-white font-semibold px-4 py-2 rounded-lg">
              Start free trial →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-6 text-center overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Trusted by 3,000+ brands worldwide
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
            The affiliate OS<br />
            <span className="gradient-text">built for growth.</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Launch your affiliate program in 5 minutes. Track every click with server-side precision,
            detect fraud with AI, and pay 500+ affiliates automatically — all from one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <div className="flex w-full sm:w-auto">
              <input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-dark px-4 py-3 rounded-l-xl w-full sm:w-72 text-sm"
              />
              <Link href="/sign-up" className="btn-primary text-white font-semibold px-5 py-3 rounded-r-xl text-sm whitespace-nowrap">
                Get started free
              </Link>
            </div>
          </div>
          <p className="text-slate-500 text-sm">14-day free trial · No credit card · Cancel anytime</p>

          {/* Hero stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="stat-card rounded-xl p-4">
                <div className="text-2xl font-black text-white mb-1">{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="glow rounded-2xl border border-white/10 bg-[#0d0d1a] overflow-hidden">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0a0a14]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-4 h-6 rounded bg-white/5 flex items-center px-3">
                <span className="text-slate-500 text-xs">app.afflo.com/dashboard</span>
              </div>
            </div>
            {/* Mock dashboard */}
            <div className="p-6 grid grid-cols-12 gap-4 text-left">
              {/* Sidebar */}
              <div className="col-span-2 space-y-2">
                {["Overview","Affiliates","Links","Payouts","Analytics","Settings"].map((item, i) => (
                  <div key={item} className={`px-3 py-2 rounded-lg text-xs font-medium ${i === 0 ? "bg-violet-600/20 text-violet-300" : "text-slate-500"}`}>{item}</div>
                ))}
              </div>
              {/* Main content */}
              <div className="col-span-10 space-y-4">
                {/* KPI row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Total Revenue", value: "$48,290", change: "+23%", color: "#10b981" },
                    { label: "Active Affiliates", value: "284", change: "+12", color: "#7c3aed" },
                    { label: "Conversions", value: "1,847", change: "+8%", color: "#f59e0b" },
                    { label: "Commissions Paid", value: "$9,240", change: "This month", color: "#3b82f6" },
                  ].map(k => (
                    <div key={k.label} className="card-dark rounded-xl p-3">
                      <div className="text-xs text-slate-500 mb-1">{k.label}</div>
                      <div className="text-lg font-bold text-white">{k.value}</div>
                      <div className="text-xs mt-1" style={{ color: k.color }}>{k.change}</div>
                    </div>
                  ))}
                </div>
                {/* Chart bar mock */}
                <div className="card-dark rounded-xl p-4">
                  <div className="text-xs text-slate-400 mb-3 font-medium">Revenue by affiliate · Last 30 days</div>
                  <div className="flex items-end gap-1.5 h-20">
                    {[40,65,35,80,55,90,45,75,60,85,50,70,95,65,80,45,90,55,70,85,40,60,75,50,85,65,90,55,80,70].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 26 ? "#7c3aed" : "rgba(124,58,237,0.25)" }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Everything you need</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">
              Built for serious <span className="gradient-text">affiliate programs</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Every feature you'd expect from a $2,000/mo enterprise tool — at a fraction of the cost.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="card-dark rounded-2xl p-6 transition-all duration-300 group cursor-default">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{f.icon}</div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ background: f.color + "20", color: f.color, border: `1px solid ${f.color}40` }}>
                    {f.badge}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Simple by design</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">
              From zero to <span className="gradient-text">affiliate revenue</span><br />in 4 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="card-dark rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-4 right-6 text-7xl font-black text-white/3 select-none">{step.step}</div>
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-sm mb-5">
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Real results</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Brands that <span className="gradient-text">love Afflo</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card-dark rounded-2xl p-7">
                <div className="text-3xl mb-4" style={{ color: t.color + "60" }}>"</div>
                <p className="text-slate-300 leading-relaxed mb-6 text-sm">{t.quote}</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}88)` }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{t.name}</div>
                    <div className="text-slate-500 text-xs">{t.role}</div>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg text-xs font-bold inline-block"
                  style={{ background: t.color + "20", color: t.color }}>
                  {t.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Pricing</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">
              Simple, <span className="gradient-text">transparent pricing</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8">Start free. Upgrade when you grow. No hidden fees.</p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-1">
              <button onClick={() => setBillingYearly(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!billingYearly ? "bg-violet-600 text-white" : "text-slate-400"}`}>
                Monthly
              </button>
              <button onClick={() => setBillingYearly(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billingYearly ? "bg-violet-600 text-white" : "text-slate-400"}`}>
                Yearly
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map(plan => {
              const price = billingYearly ? Math.round(plan.price * 0.8) : plan.price;
              return (
                <div key={plan.name} className={`rounded-2xl p-7 relative ${plan.highlight
                  ? "bg-gradient-to-b from-violet-600/20 to-violet-900/10 border-2 border-violet-500/50 glow"
                  : "card-dark"}`}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      {plan.badge}
                    </div>
                  )}
                  <div className="text-slate-300 font-bold text-lg mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-black text-white">${price}</span>
                    <span className="text-slate-500">/{plan.period}</span>
                  </div>
                  {billingYearly && plan.price > 0 && (
                    <div className="text-xs text-emerald-400 mb-2">Billed ${price * 12}/year</div>
                  )}
                  <p className="text-slate-400 text-sm mb-6">{plan.desc}</p>
                  <Link href="/sign-up" className={`block text-center py-3 rounded-xl text-sm font-bold mb-7 transition-all ${
                    plan.highlight
                      ? "btn-primary text-white"
                      : "border border-white/15 text-white hover:bg-white/5"
                  }`}>
                    {plan.cta}
                  </Link>
                  <ul className="space-y-3">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative rounded-3xl p-16 overflow-hidden bg-gradient-to-br from-violet-900/50 via-violet-800/30 to-emerald-900/20 border border-violet-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-transparent" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Your affiliate program<br />
                <span className="gradient-text">starts today.</span>
              </h2>
              <p className="text-slate-400 text-lg mb-10">
                Join 3,000+ brands running profitable affiliate programs on Afflo. Free 14-day trial, no card needed.
              </p>
              <Link href="/sign-up" className="btn-primary inline-block text-white font-bold px-8 py-4 rounded-xl text-lg">
                Start your free trial →
              </Link>
              <p className="text-slate-500 text-sm mt-5">Setup in 5 minutes · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-xs font-bold text-white">A</div>
            <span className="font-bold text-white">Afflo</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500">
            {["Privacy","Terms","Security","Status","Docs","Blog"].map(l => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <div className="text-slate-600 text-sm">© 2026 Afflo. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
