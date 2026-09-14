"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";

// Programs are now created via the right-side drawer on /dashboard/programs
// This page redirects there automatically
export default function ProgramsNewRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/programs"); }, [router]);
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
      <Spin size="large" />
    </div>
  );
}
