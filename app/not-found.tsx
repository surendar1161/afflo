"use client";
import Link from "next/link";
import { Button, Typography } from "antd";
import { HomeOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh", background: "#f5f7f9",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 24px", textAlign: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 16,
        background: "#ebf0fb",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 32, marginBottom: 24,
      }}>
        🔍
      </div>
      <Title level={2} style={{ color: "#12344d", margin: "0 0 8px" }}>Page not found</Title>
      <Text style={{ color: "#8fa0b4", fontSize: 15, display: "block", marginBottom: 32 }}>
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <Link href="/dashboard">
        <Button type="primary" icon={<HomeOutlined />} size="large" style={{ fontWeight: 600 }}>
          Back to dashboard
        </Button>
      </Link>
    </div>
  );
}
