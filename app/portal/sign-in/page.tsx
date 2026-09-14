"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Form, Input, Button, Typography, Alert, Divider } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const INPUT_STYLE = {
  WebkitTextFillColor: "#f5f5f5" as const,
  WebkitBoxShadow: "0 0 0 1000px rgba(26,26,26,0.98) inset" as const,
};

export default function PortalSignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true); setError("");
    const supabase = createClient();
    const { error: authErr } = await supabase.auth.signInWithPassword(values);
    if (authErr) { setError(authErr.message); setLoading(false); return; }

    // Verify this user is an affiliate
    const res  = await fetch("/api/portal/me");
    if (!res.ok) {
      await supabase.auth.signOut();
      setError("This account is not registered as an affiliate. Contact your program manager.");
      setLoading(false);
      return;
    }
    router.push("/portal/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#2C5CC5,#1a4aad)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 auto 16px" }}>
            A
          </div>
          <Title level={3} style={{ margin: 0, color: "#f5f5f5" }}>Affiliate Portal</Title>
          <Text style={{ color: "#8fa0b4", fontSize: 14 }}>Sign in to access your affiliate dashboard</Text>
        </div>

        <div style={{ background: "#1e1e1e", border: "1px solid #e5eaf0", borderRadius: 8, padding: 28 }}>
          {error && <Alert type="error" message={error} style={{ marginBottom: 20, borderRadius: 4 }} />}

          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item name="email" label={<Text style={{ color: "#475867", fontSize: 13, fontWeight: 600 }}>Email</Text>}
              rules={[{ required: true, type: "email", message: "Valid email required" }]}>
              <Input prefix={<MailOutlined style={{ color: "#a0b0c0" }} />} placeholder="you@example.com" size="large"
                style={INPUT_STYLE} />
            </Form.Item>
            <Form.Item name="password" label={<Text style={{ color: "#475867", fontSize: 13, fontWeight: 600 }}>Password</Text>}
              rules={[{ required: true, message: "Password required" }]}>
              <Input.Password prefix={<LockOutlined style={{ color: "#a0b0c0" }} />} placeholder="••••••••" size="large"
                style={INPUT_STYLE} />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, marginTop: 4 }}>
              <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ fontWeight: 700, height: 44 }}>
                Sign in to Portal
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ borderColor: "#edf0f4", margin: "20px 0" }} />

          <Text style={{ color: "#a0b0c0", fontSize: 12, display: "block", textAlign: "center" }}>
            Are you a brand?{" "}
            <a href="/sign-in" style={{ color: "#2C5CC5" }}>Sign in to the dashboard →</a>
          </Text>
        </div>
      </div>
    </div>
  );
}
