"use client";
import { ConfigProvider, App } from "antd";
import { antdTheme } from "@/lib/antd-theme";

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={antdTheme}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
