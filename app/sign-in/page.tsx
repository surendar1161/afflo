"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Form, Input, Button, Divider, Typography, Checkbox, Alert } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";

const { Text } = Typography;

const FW = {
  blue:    "#2C5CC5",
  blueLt:  "#ebf0fb",
  blueHov: "#1a4aad",
  green:   "#00875A",
  greenLt: "#e0f5ed",
  text:    "#12344d",
  text2:   "#475867",
  text3:   "#8fa0b4",
  bg:      "#f5f7f9",
  white:   "#ffffff",
  border:  "#e2e8f0",
  borderMd:"#cdd7e0",
};

export default function SignInPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const submit = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError("");
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (authErr) { setError(authErr.message); setLoading(false); return; }
    router.push("/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "Inter,-apple-system,'Segoe UI',sans-serif", background: FW.white }}>

      {/* ── Left brand panel ─────────────────────────────────────────────── */}
      <div style={{
        width: "44%", flexShrink: 0,
        background: `linear-gradient(160deg, ${FW.blueLt} 0%, #dce8f8 100%)`,
        borderRight: `1px solid ${FW.border}`,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "40px 48px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(44,92,197,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(0,135,90,0.07)", pointerEvents: "none" }} />

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", position: "relative" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: FW.blue, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: "#fff" }}>F</div>
          <span style={{ fontWeight: 800, fontSize: 18, color: FW.text, letterSpacing: "-0.3px" }}>FreshAffiliates</span>
        </Link>

        {/* Main copy */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: FW.greenLt, border: `1px solid rgba(0,135,90,0.25)`, borderRadius: 100, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: FW.green, marginBottom: 24 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: FW.green, display: "inline-block" }} />
            Affiliate revenue, on autopilot
          </div>

          <h2 style={{ fontSize: "clamp(26px,2.8vw,36px)", fontWeight: 800, color: FW.text, lineHeight: 1.2, letterSpacing: "-0.8px", margin: "0 0 14px" }}>
            Welcome back to<br />your affiliate OS.
          </h2>
          <p style={{ color: FW.text2, fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Track every click, manage affiliates, and grow your program — all from one dashboard.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
            {[["3,000+","brands"],["$2.4B+","tracked"],["500K+","affiliates"]].map(([v, l]) => (
              <div key={l} style={{ flex: 1, background: FW.white, border: `1px solid ${FW.border}`, borderRadius: 12, padding: "14px 12px", textAlign: "center", boxShadow: "0 1px 3px rgba(12,52,77,0.06)" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: FW.blue }}>{v}</div>
                <div style={{ fontSize: 11, color: FW.text3, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={{ background: FW.white, border: `1px solid ${FW.border}`, borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 3px rgba(12,52,77,0.06)" }}>
            <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
              {Array(5).fill(0).map((_, i) => <span key={i} style={{ color: "#E86E0A", fontSize: 14 }}>★</span>)}
            </div>
            <p style={{ color: FW.text2, fontSize: 13, lineHeight: 1.7, margin: "0 0 14px", fontStyle: "italic" }}>
              "Switched from Impact.com and saved $2,400/mo. Every feature we needed at a fraction of the cost."
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: FW.blueLt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: FW.blue }}>MJ</div>
              <div>
                <div style={{ color: FW.text, fontWeight: 700, fontSize: 13 }}>Marcus Johnson</div>
                <div style={{ color: FW.text3, fontSize: 11 }}>CMO · B2B SaaS</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ color: FW.text3, fontSize: 12, position: "relative" }}>
          © 2026 FreshAffiliates ·{" "}
          <a href="#" style={{ color: FW.text3, textDecoration: "none" }}>Privacy</a> ·{" "}
          <a href="#" style={{ color: FW.text3, textDecoration: "none" }}>Terms</a>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px", background: FW.white, overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: FW.text, margin: "0 0 8px", letterSpacing: "-0.5px" }}>Sign in</h1>
            <Text style={{ color: FW.text2 }}>
              Don't have an account?{" "}
              <Link href="/sign-up" style={{ color: FW.blue, fontWeight: 600, textDecoration: "none" }}>Start free trial</Link>
            </Text>
          </div>

          {/* OAuth */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Google", icon: <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> },
              { label: "GitHub",  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill={FW.text}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.37.6.1.82-.26.82-.58 0-.28-.01-1.04-.02-2.04-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg> },
            ].map(b => (
              <button key={b.label} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 40, border: `1px solid ${FW.borderMd}`, borderRadius: 7, background: FW.white, cursor: "pointer", fontSize: 14, fontWeight: 500, color: FW.text, transition: "border-color .15s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = FW.blue)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = FW.borderMd)}>
                {b.icon}{b.label}
              </button>
            ))}
          </div>

          <Divider style={{ borderColor: FW.border, margin: "0 0 24px" }}>
            <Text style={{ color: FW.text3, fontSize: 12 }}>or continue with email</Text>
          </Divider>

          {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon />}

          <Form layout="vertical" onFinish={submit} style={{ gap: 0 }}>
            <Form.Item
              name="email"
              label={<span style={{ color: FW.text, fontSize: 13, fontWeight: 600 }}>Email address</span>}
              rules={[{ required: true, type: "email", message: "Valid email required" }]}
              style={{ marginBottom: 16 }}
            >
              <Input prefix={<MailOutlined style={{ color: FW.text3 }} />} placeholder="you@company.com" size="large" autoComplete="email" />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  <span style={{ color: FW.text, fontSize: 13, fontWeight: 600 }}>Password</span>
                  <a href="#" style={{ color: FW.blue, fontSize: 12, fontWeight: 500, textDecoration: "none" }}>Forgot password?</a>
                </div>
              }
              rules={[{ required: true }]}
              style={{ marginBottom: 16 }}
            >
              <Input.Password prefix={<LockOutlined style={{ color: FW.text3 }} />} placeholder="••••••••" size="large" autoComplete="current-password" />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 20 }}>
              <Checkbox>
                <span style={{ color: FW.text2, fontSize: 13 }}>Keep me signed in for 30 days</span>
              </Checkbox>
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", height: 44, background: loading ? "#8fa0b4" : FW.blue, color: "#fff", border: "none", borderRadius: 7, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "background .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = FW.blueHov; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = FW.blue; }}
              >
                {loading ? "Signing in…" : "Sign in to FreshAffiliates"}
              </button>
            </Form.Item>
          </Form>

          <p style={{ textAlign: "center", color: FW.text3, fontSize: 12, margin: 0 }}>
            By signing in you agree to our{" "}
            <a href="#" style={{ color: FW.text3 }}>Terms</a> and{" "}
            <a href="#" style={{ color: FW.text3 }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
