import { NextRequest, NextResponse } from "next/server";

// Short-link redirect: /r/[code] → /api/track/[code]
// The actual click recording + redirect lives in /api/track/[code]/route.ts
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(`/api/track/${code}`, req.url);
  return NextResponse.redirect(url, { status: 302 });
}
