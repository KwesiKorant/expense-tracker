import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limiter";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth, SESSION_COOKIE_NAME } from "@/lib/auth-check";

export async function POST(req: NextRequest) {
  // GATE 1: Rate limiter (20 requests / min)
  const rateLimit = checkRateLimit(req, "mutation");
  if (!rateLimit.allowed) {
    return errorResponse(
      "RATE_LIMIT_EXCEEDED",
      `Rate limit exceeded. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      429,
      undefined,
      { rateLimit }
    );
  }

  // GATE 3: Verify authentication (or allow clearing cookie regardless)
  const auth = await requireAuth(req);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const response = successResponse(
    { loggedOut: true },
    "Logged out successfully.",
    { rateLimit }
  );

  // Invalidate session cookie immediately
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
