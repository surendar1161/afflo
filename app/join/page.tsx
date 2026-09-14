"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Form, Input, Button, Result, Card, Typography, Alert, Spin,
} from "antd";
import { MailOutlined, LockOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function JoinPage() {
  const params   = useSearchParams();
  const router   = useRouter();
  const token    = params.get("token");
  const supabase = createClient();

  const [status, setStatus] = useState<"loading" | "sign-in" | "accepting" | "done" | "error">("loading");
  const [orgName, setOrgName] = useState("");
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setError("Invalid invite link — no token found."); return; }
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        acceptInvite(token);
      } else {
        const { data } = await supabase
          .from("organization_members")
          .select("organization:organizations(name), status")
          .eq("invite_token", token)
          .single();
        setOrgName((data?.organization as unknown as { name: string })?.name || "an organization");
        setStatus("sign-in");
      }
    });
  }, [token]);

  const acceptInvite = async (t: string) => {
    setStatus("accepting");
    const { data, error: rpcErr } = await supabase.rpc("accept_org_invitation", { p_token: t });
    if (rpcErr) { setError(rpcErr.message); setStatus("error"); return; }
    setOrgName((data as unknown as { name: string })?.name || "");
    setStatus("done");
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  const handleSignIn = async (values: { email: string; password: string }) => {
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: values.email, password: values.password,
    });
    if (signInErr) { setError(signInErr.message); return; }
    acceptInvite(token!);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050816", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}>A</div>
        </div>

        {status === "loading" && (
          <div style={{ textAlign: "center" }}>
            <Spin size="large" />
            <Text style={{ display: "block", color: "#64748b", marginTop: 16 }}>Verifying invitation…</Text>
          </div>
        )}

        {status === "accepting" && (
          <div style={{ textAlign: "center" }}>
            <Spin size="large" />
            <Text style={{ display: "block", color: "#64748b", marginTop: 16 }}>Joining {orgName}…</Text>
          </div>
        )}

        {status === "done" && (
          <Result
            icon={<CheckCircleOutlined style={{ color: "#10b981" }} />}
            title={<Text style={{ color: "#fff", fontSize: 22, fontWeight: 900 }}>You&apos;ve joined {orgName}!</Text>}
            subTitle={<Text style={{ color: "#64748b" }}>Redirecting to your dashboard…</Text>}
          />
        )}

        {status === "error" && (
          <Result
            icon={<CloseCircleOutlined style={{ color: "#ef4444" }} />}
            title={<Text style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>Invalid invitation</Text>}
            subTitle={<Text style={{ color: "#ef4444" }}>{error}</Text>}
            extra={[
              <Link key="back" href="/">
                <Button type="default">← Back to FreshAffiliates</Button>
              </Link>,
            ]}
          />
        )}

        {status === "sign-in" && (
          <Card title={
            <div style={{ textAlign: "center" }}>
              <Title level={3} style={{ color: "#fff", margin: 0 }}>You&apos;ve been invited!</Title>
              <Text style={{ color: "#64748b", fontSize: 14 }}>
                Sign in to join <Text strong style={{ color: "#fff" }}>{orgName}</Text> on FreshAffiliates.
              </Text>
            </div>
          }>
            {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}

            <Form layout="vertical" onFinish={handleSignIn}>
              <Form.Item
                name="email"
                label={<Text style={{ color: "#94a3b8", fontWeight: 600 }}>Email</Text>}
                rules={[{ required: true, type: "email" }]}
              >
                <Input prefix={<MailOutlined />} placeholder="you@company.com" size="large" />
              </Form.Item>
              <Form.Item
                name="password"
                label={<Text style={{ color: "#94a3b8", fontWeight: 600 }}>Password</Text>}
                rules={[{ required: true }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block size="large" style={{ fontWeight: 700, height: 48 }}>
                  Sign in &amp; join {orgName}
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: "center" }}>
              <Text style={{ color: "#475569", fontSize: 13 }}>
                No account?{" "}
                <Link href={`/sign-up?token=${token}`} style={{ color: "#818cf8" }}>Create one free</Link>
              </Text>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
