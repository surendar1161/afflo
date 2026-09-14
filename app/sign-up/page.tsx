"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Form, Input, Typography, Checkbox, Alert } from "antd";
import { MailOutlined, LockOutlined, UserOutlined, BankOutlined, CheckCircleOutlined, ArrowRightOutlined } from "@ant-design/icons";

const { Text } = Typography;

const FW = {
  blue:    "#2C5CC5",
  blueLt:  "#ebf0fb",
  blueHov: "#1a4aad",
  green:   "#00875A",
  greenLt: "#e0f5ed",
  amber:   "#E86E0A",
  text:    "#12344d",
  text2:   "#475867",
  text3:   "#8fa0b4",
  bg:      "#f5f7f9",
  white:   "#ffffff",
  border:  "#e2e8f0",
  borderMd:"#cdd7e0",
};

const PLANS = [
  { id: "starter", name: "Starter", price: "$15/mo", annualPrice: "$12/mo", desc: "Up to 50 affiliates · 5 programs" },
  { id: "growth",  name: "Growth",  price: "$30/mo", annualPrice: "$25/mo", desc: "Up to 500 affiliates · AI fraud detection", popular: true },
  { id: "scale",   name: "Scale",   price: "$75/mo", annualPrice: "$62/mo", desc: "Unlimited affiliates · API access" },
];

const PROGRAM_TYPES = [
  { id: "ecommerce", icon: "🛍️", label: "E-commerce"      },
  { id: "saas",      icon: "💻", label: "SaaS / Software" },
  { id: "creator",   icon: "🎥", label: "Creator / Media" },
  { id: "finance",   icon: "💰", label: "Finance"         },
  { id: "health",    icon: "🏥", label: "Health & Wellness"},
  { id: "other",     icon: "📦", label: "Other"           },
];

export default function SignUpPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [step, setStep]           = useState(0);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading]     = useState(false);
  const [pType, setPType]         = useState("");
  const [plan, setPlan]           = useState("growth");
  const [account, setAccount]     = useState<{ name: string; email: string; password: string; company: string } | null>(null);
  const [step0Form] = Form.useForm();

  const handleStep0 = (values: { name: string; email: string; password: string; company: string }) => {
    setAccount(values);
    setStep(1);
  };

  const handleStep1 = async () => {
    if (!pType || !account) return;
    setLoading(true);
    setAuthError("");
    const { error: signUpErr } = await supabase.auth.signUp({
      email: account.email,
      password: account.password,
      options: { data: { full_name: account.name, company_name: account.company } },
    });
    if (signUpErr) { setAuthError(signUpErr.message); setLoading(false); return; }
    setStep(2);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "Inter,-apple-system,'Segoe UI',sans-serif", background: FW.white }}>

      {/* Left brand panel */}
      <div style={{ width: 400, flexShrink: 0, background: "linear-gradient(160deg,#ebf0fb 0%,#dce8f8 100%)", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px 44px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(44,92,197,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 60, left: -60, width: 180, height: 180, borderRadius: "50%", background: "rgba(0,135,90,0.07)", pointerEvents: "none" }} />

        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", position: "relative" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: FW.blue, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: "#fff" }}>F</div>
          <span style={{ fontWeight: 800, fontSize: 18, color: FW.text, letterSpacing: "-0.3px" }}>FreshAffiliates</span>
        </Link>

        <div style={{ position: "relative" }}>
          <h2 style={{ fontSize: "clamp(22px,2.5vw,30px)", fontWeight: 800, color: FW.text, lineHeight: 1.25, letterSpacing: "-0.5px", margin: "0 0 20px" }}>
            Start earning from<br />your affiliates today.
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 13 }}>
            {["15-day free trial, no card required","Setup in under 5 minutes","AI fraud detection from day 1","Cancel or downgrade anytime"].map(p => (
              <li key={p} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: FW.text2 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: FW.greenLt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircleOutlined style={{ color: FW.green, fontSize: 11 }} />
                </div>
                {p}
              </li>
            ))}
          </ul>
          <div style={{ background: FW.white, border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 3px rgba(12,52,77,0.06)" }}>
            <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
              {Array(5).fill(0).map((_, i) => <span key={i} style={{ color: FW.amber, fontSize: 13 }}>★</span>)}
            </div>
            <p style={{ color: FW.text2, fontSize: 13, lineHeight: 1.65, margin: "0 0 10px", fontStyle: "italic" }}>
              "We went from $0 to $48K/mo in affiliate revenue in 90 days. Setup took 20 minutes."
            </p>
            <div style={{ color: FW.text3, fontSize: 12 }}>— Sarah Chen, Head of Growth</div>
          </div>
        </div>

        <div style={{ color: FW.text3, fontSize: 12, position: "relative" }}>
          © 2026 FreshAffiliates · <a href="#" style={{ color: FW.text3, textDecoration: "none" }}>Privacy</a> · <a href="#" style={{ color: FW.text3, textDecoration: "none" }}>Terms</a>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px", background: FW.white, overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 500 }}>

          {/* Progress */}
          {step < 2 && (
            <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
              {["Account", "Your program", "All done"].map((label, i) => (
                <div key={label} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: i <= step ? FW.blue : "#e2e8f0", color: i <= step ? "#fff" : FW.text3 }}>
                      {i < step ? "✓" : i + 1}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: i === step ? 600 : 400, color: i === step ? FW.text : FW.text3, whiteSpace: "nowrap" }}>{label}</span>
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: 1, background: i < step ? FW.blue : "#e2e8f0", margin: "0 12px" }} />}
                </div>
              ))}
            </div>
          )}

          {/* STEP 0 */}
          {step === 0 && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: FW.text, margin: "0 0 8px", letterSpacing: "-0.5px" }}>Create your account</h1>
                <Text style={{ color: FW.text2 }}>Already have one? <Link href="/sign-in" style={{ color: FW.blue, fontWeight: 600, textDecoration: "none" }}>Sign in</Link></Text>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Google", icon: <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> },
                  { label: "GitHub",  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#12344d"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.37.6.1.82-.26.82-.58 0-.28-.01-1.04-.02-2.04-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg> },
                ].map(b => (
                  <button key={b.label} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 40, border: "1px solid #cdd7e0", borderRadius: 7, background: FW.white, cursor: "pointer", fontSize: 13, fontWeight: 500, color: FW.text, transition: "border-color .15s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = FW.blue)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "#cdd7e0")}>
                    {b.icon} Continue with {b.label}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                <span style={{ color: FW.text3, fontSize: 12 }}>or with email</span>
                <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              </div>

              {authError && <Alert type="error" message={authError} style={{ marginBottom: 16 }} showIcon />}

              <Form form={step0Form} layout="vertical" onFinish={handleStep0}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Form.Item name="name" label={<span style={{ color: FW.text, fontSize: 13, fontWeight: 600 }}>Full name</span>} rules={[{ required: true }]} style={{ marginBottom: 14 }}>
                    <Input prefix={<UserOutlined style={{ color: FW.text3 }} />} placeholder="Alex Johnson" size="large" />
                  </Form.Item>
                  <Form.Item name="company" label={<span style={{ color: FW.text, fontSize: 13, fontWeight: 600 }}>Company</span>} rules={[{ required: true }]} style={{ marginBottom: 14 }}>
                    <Input prefix={<BankOutlined style={{ color: FW.text3 }} />} placeholder="Acme Inc." size="large" />
                  </Form.Item>
                </div>
                <Form.Item name="email" label={<span style={{ color: FW.text, fontSize: 13, fontWeight: 600 }}>Work email</span>} rules={[{ required: true, type: "email" }]} style={{ marginBottom: 14 }}>
                  <Input prefix={<MailOutlined style={{ color: FW.text3 }} />} placeholder="you@company.com" size="large" autoComplete="email" />
                </Form.Item>
                <Form.Item name="password" label={<span style={{ color: FW.text, fontSize: 13, fontWeight: 600 }}>Password</span>} rules={[{ required: true, min: 8, message: "Minimum 8 characters" }]} style={{ marginBottom: 14 }}>
                  <Input.Password prefix={<LockOutlined style={{ color: FW.text3 }} />} placeholder="Min. 8 characters" size="large" autoComplete="new-password" />
                </Form.Item>
                <Form.Item name="agreed" valuePropName="checked" rules={[{ validator: (_, v) => v ? Promise.resolve() : Promise.reject("You must agree to continue") }]} style={{ marginBottom: 20 }}>
                  <Checkbox>
                    <span style={{ color: FW.text2, fontSize: 13 }}>I agree to FreshAffiliates' <a href="#" style={{ color: FW.blue }}>Terms</a> and <a href="#" style={{ color: FW.blue }}>Privacy Policy</a></span>
                  </Checkbox>
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <button type="submit" style={{ width: "100%", height: 44, background: FW.blue, color: "#fff", border: "none", borderRadius: 7, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = FW.blueHov)}
                    onMouseLeave={e => (e.currentTarget.style.background = FW.blue)}>
                    Continue →
                  </button>
                </Form.Item>
              </Form>
            </>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: FW.text, margin: "0 0 6px", letterSpacing: "-0.5px" }}>Set up your program</h1>
                <Text style={{ color: FW.text2, fontSize: 14 }}>Tell us about your business — takes 30 seconds.</Text>
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: FW.text, marginBottom: 12 }}>What type of business are you?</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {PROGRAM_TYPES.map(pt => (
                    <button key={pt.id} type="button" onClick={() => setPType(pt.id)} style={{ padding: "14px 8px", borderRadius: 10, cursor: "pointer", textAlign: "center", transition: "all .15s", border: "1.5px solid " + (pType === pt.id ? FW.blue : "#e2e8f0"), background: pType === pt.id ? FW.blueLt : FW.white, color: pType === pt.id ? FW.blue : FW.text2 }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{pt.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{pt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: FW.text }}>Choose your plan</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: FW.greenLt, border: "1px solid rgba(0,135,90,0.2)", borderRadius: 100, padding: "3px 10px" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: FW.green, display: "inline-block" }} />
                    <span style={{ fontSize: 11, color: FW.green, fontWeight: 700 }}>15-day free trial on all plans</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {PLANS.map(p => (
                    <button key={p.id} type="button" onClick={() => setPlan(p.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: 10, cursor: "pointer", transition: "all .15s", textAlign: "left", width: "100%", border: "1.5px solid " + (plan === p.id ? FW.blue : "#e2e8f0"), background: plan === p.id ? FW.blueLt : FW.white, position: "relative" }}>
                      {p.popular && <span style={{ position: "absolute", top: -10, right: 14, background: FW.green, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 100 }}>Most Popular</span>}
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid " + (plan === p.id ? FW.blue : "#cdd7e0"), background: plan === p.id ? FW.blue : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {plan === p.id && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block" }} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: FW.text, fontSize: 14 }}>{p.name}</div>
                          <div style={{ color: FW.text3, fontSize: 12 }}>{p.desc}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, color: FW.text, fontSize: 15 }}>{p.price}</div>
                        <div style={{ color: FW.text3, fontSize: 11 }}>or {p.annualPrice} yearly</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {authError && <Alert type="error" message={authError} style={{ marginBottom: 12 }} showIcon />}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button type="button" disabled={!pType || loading} onClick={handleStep1}
                  style={{ width: "100%", height: 44, background: !pType ? "#e2e8f0" : FW.blue, color: !pType ? FW.text3 : "#fff", border: "none", borderRadius: 7, fontSize: 15, fontWeight: 700, cursor: !pType ? "not-allowed" : "pointer" }}
                  onMouseEnter={e => { if (pType && !loading) e.currentTarget.style.background = FW.blueHov; }}
                  onMouseLeave={e => { if (pType && !loading) e.currentTarget.style.background = FW.blue; }}>
                  {loading ? "Setting up your program…" : "Launch my affiliate program →"}
                </button>
                <button type="button" onClick={() => setStep(0)} style={{ width: "100%", height: 40, background: "transparent", color: FW.text2, border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 14, cursor: "pointer" }}>
                  ← Back
                </button>
              </div>
              {!pType && <p style={{ textAlign: "center", color: FW.text3, fontSize: 12, marginTop: 10 }}>Select a business type above to continue</p>}
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: FW.greenLt, border: "2px solid rgba(0,135,90,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 24px" }}>🎉</div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: FW.text, margin: "0 0 8px", letterSpacing: "-0.5px" }}>You&apos;re all set!</h1>
              <p style={{ color: FW.text2, fontSize: 15, margin: "0 0 4px" }}>Welcome to FreshAffiliates, <strong>{account?.name || "there"}</strong>.</p>
              <p style={{ color: FW.text3, fontSize: 13, marginBottom: 36 }}>Your 15-day trial starts now. No charge until the trial ends.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32, textAlign: "left" }}>
                {[
                  { icon: "🔗", title: "Create your first tracking link", desc: "Generate a link in 30 seconds and share it with affiliates" },
                  { icon: "👥", title: "Invite your affiliates",           desc: "Share your program page or browse the marketplace" },
                  { icon: "💸", title: "Set up payouts",                   desc: "Connect PayPal, bank transfer, Stripe, or crypto" },
                ].map((item, i) => (
                  <div key={item.title} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: i === 0 ? FW.blueLt : FW.bg, border: "1px solid " + (i === 0 ? "rgba(44,92,197,0.2)" : "#e2e8f0"), borderRadius: 10, cursor: "pointer", transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = FW.blue; e.currentTarget.style.background = FW.blueLt; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = i === 0 ? "rgba(44,92,197,0.2)" : "#e2e8f0"; e.currentTarget.style.background = i === 0 ? FW.blueLt : FW.bg; }}>
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: FW.text, fontSize: 14 }}>{item.title}</div>
                      <div style={{ color: FW.text3, fontSize: 12 }}>{item.desc}</div>
                    </div>
                    <ArrowRightOutlined style={{ color: FW.blue, flexShrink: 0 }} />
                  </div>
                ))}
              </div>

              <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: FW.blue, color: "#fff", padding: "13px 36px", borderRadius: 7, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
                Go to your dashboard →
              </Link>
              <p style={{ color: FW.text3, fontSize: 12, marginTop: 14 }}>Check <strong style={{ color: FW.text2 }}>{account?.email}</strong> for your account details</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
