import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:  () => request.cookies.getAll(),
        setAll: (cs) => {
          cs.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cs.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const isAuthPage       = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isDashboard      = pathname.startsWith("/dashboard");
  const isPortalDash     = pathname.startsWith("/portal/dashboard");
  const isPortalSignIn   = pathname.startsWith("/portal/sign-in");

  // Protect brand dashboard
  if (isDashboard && !user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Protect affiliate portal dashboard
  if (isPortalDash && !user) {
    return NextResponse.redirect(new URL("/portal/sign-in", request.url));
  }

  // Redirect authenticated brand users away from sign-in/sign-up
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/portal/dashboard/:path*", "/sign-in", "/sign-up", "/r/:path*"],
};
