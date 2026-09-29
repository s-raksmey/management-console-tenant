import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const TENANT_SESSION_COOKIE = "management_console_tenant_session";

const PUBLIC_PAGE_PREFIXES = [
  "/login",
  "/forgot-password",
  "/reset-password",
];

function isPublicPath(pathname: string) {
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt"
  ) {
    return true;
  }

  return PUBLIC_PAGE_PREFIXES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function middleware(req: NextRequest) {
  if (isPublicPath(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const session = req.cookies.get(TENANT_SESSION_COOKIE)?.value;
  if (session) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { success: 0, message: "Authentication required" },
      { status: 401 }
    );
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|uploads/|media/).*)"],
};
