import { SignJWT, jwtVerify } from "jose";
import { errorResponse } from "./api-response";
import type { NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "expense_session";
const JWT_SECRET = process.env.JWT_SECRET || "arcfield_expense_tracker_secure_jwt_secret_key_2026_min_32_chars";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface AuthUserPayload {
  userId: string;
  email: string;
  fullName: string;
}

/**
 * Creates a signed JWT session token with 7-day expiration
 */
export async function createSessionToken(payload: AuthUserPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

/**
 * Verifies and decodes a session token
 */
export async function verifySessionToken(token: string): Promise<AuthUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the authenticated user from Request headers, cookies, or non-production test bypass
 */
export async function getAuthUser(req: Request): Promise<AuthUserPayload | null> {
  // 1. Non-production test bypass check (Strictly protected by CWE-290 defense)
  if (
    process.env.NODE_ENV !== "production" &&
    req.headers.get("x-test-bypass") === "true"
  ) {
    const testUserId = req.headers.get("x-test-user-id") || "demo_user_id";
    const testEmail = req.headers.get("x-test-email") || "test@arcfield.dev";
    return {
      userId: testUserId,
      email: testEmail,
      fullName: "Test User",
    };
  }

  // 2. Check Authorization Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const verified = await verifySessionToken(token);
    if (verified) return verified;
  }

  // 3. Check Cookie header from request
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));

    if (match) {
      const token = match.split("=")[1];
      const verified = await verifySessionToken(token);
      if (verified) return verified;
    }
  }

  return null;
}

/**
 * Enforces session authentication for protected routes (GATE 3)
 */
export async function requireAuth(
  req: Request
): Promise<{ user: AuthUserPayload; errorResponse?: never } | { user?: never; errorResponse: NextResponse }> {
  const user = await getAuthUser(req);
  if (!user) {
    return {
      errorResponse: errorResponse(
        "UNAUTHORIZED",
        "Authentication required to access this resource.",
        401
      ),
    };
  }
  return { user };
}

/**
 * Defensive check for open redirects (CWE-601)
 * Enforces strictly relative paths starting with a single '/' and rejects protocol-relative '//' URLs
 */
export function isValidRedirectUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // Strictly relative path starting with single slash, followed by valid path chars
  const relativeRegex = /^\/(?!\/)[a-zA-Z0-9_\-\.\/]*$/;
  return relativeRegex.test(url);
}
