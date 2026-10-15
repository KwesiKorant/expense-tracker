import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { checkRateLimit } from "@/lib/rate-limiter";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth-check";

export async function POST(req: NextRequest) {
  // GATE 1: Sliding-Window IP Rate Limiter (5 requests / 15m)
  const rateLimit = checkRateLimit(req, "auth");
  if (!rateLimit.allowed) {
    return errorResponse(
      "RATE_LIMIT_EXCEEDED",
      `Too many login attempts. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      429,
      undefined,
      { rateLimit }
    );
  }

  try {
    // GATE 2: Strict Zod Validation
    const json = await req.json();
    const validated = loginSchema.parse(json);

    // Look up user by email
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      return errorResponse(
        "INVALID_CREDENTIALS",
        "Invalid email or password provided.",
        401,
        undefined,
        { rateLimit }
      );
    }

    // Verify password hash
    const isValid = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isValid) {
      return errorResponse(
        "INVALID_CREDENTIALS",
        "Invalid email or password provided.",
        401,
        undefined,
        { rateLimit }
      );
    }

    // Issue session token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
    });

    const response = successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          defaultCurrency: user.defaultCurrency,
          createdAt: user.createdAt,
        },
        token,
      },
      "Logged in successfully.",
      { status: 200, rateLimit }
    );

    // Set secure HttpOnly session cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    return handleApiError(err, "Authentication failed.", { rateLimit });
  }
}
