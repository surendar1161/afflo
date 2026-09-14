"use client";
import { useEffect } from "react";
import { Button, Typography } from "antd";
import { ReloadOutlined, HomeOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh", background: "#f5f7f9",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 24px", textAlign: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 16,
        background: "rgba(215,45,48,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 32, marginBottom: 24,
      }}>
        ⚠️
      </div>
      <Title level={2} style={{ color: "#12344d", margin: "0 0 8px" }}>Something went wrong</Title>
      <Text style={{ color: "#8fa0b4", fontSize: 15, display: "block", marginBottom: 8 }}>
        An unexpected error occurred. Our team has been notified.
      </Text>
      {error.digest && (
        <Text style={{ color: "#a0b0c0", fontSize: 12, display: "block", marginBottom: 32, fontFamily: "monospace" }}>
          Error ID: {error.digest}
        </Text>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={reset} style={{ fontWeight: 600 }}>
          Try again
        </Button>
        <Button type="primary" icon={<HomeOutlined />} href="/dashboard" style={{ fontWeight: 600 }}>
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
