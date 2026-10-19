import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME, isValidRedirectUrl } from "./lib/auth-check";
import { SECURITY_HEADERS } from "./lib/api-response";

const JWT_SECRET = process.env.JWT_SECRET || "expense_tracker_secure_jwt_secret_key_2026_min_32_chars";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Clone headers to inject mandatory security headers
  const responseHeaders = new Headers();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    responseHeaders.set(key, value);
  }

  // Allow static files, Next internals, and public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    const res = NextResponse.next();
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      res.headers.set(key, value);
    }
    return res;
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      await jwtVerify(sessionCookie, secretKey);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  const isAuthPage = pathname === "/login" || pathname === "/register";

  // If already authenticated and trying to view /login or /register, redirect to dashboard /
  if (isAuthenticated && isAuthPage) {
    const rawNext = searchParams.get("next");
    const targetUrl = isValidRedirectUrl(rawNext) ? rawNext! : "/";
    return NextResponse.redirect(new URL(targetUrl, request.url));
  }

  // If not authenticated and attempting to view root or protected pages
  if (!isAuthenticated && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
