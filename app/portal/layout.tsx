// Portal root layout — simple passthrough, no auth checking here.
// Auth is handled per-section:
//   /portal/dashboard/* → portal/dashboard/layout.tsx (requires affiliate login)
//   /portal/sign-in     → no auth check
//   /portal             → public landing page
export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
