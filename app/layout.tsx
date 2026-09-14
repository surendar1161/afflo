import type { Metadata } from "next";
import "./globals.css";
import AntdProvider from "./antd-provider";
export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "FreshAffiliates — The Affiliate OS for Modern Brands",
  description: "Launch, manage, and scale your affiliate program in minutes. AI-powered tracking, smart commissions, instant payouts.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col"><AntdProvider>{children}</AntdProvider></body>
    </html>
  );
}
