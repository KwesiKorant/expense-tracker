import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { checkRateLimit } from "@/lib/rate-limiter";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth-check";

export async function POST(req: NextRequest) {
  // GATE 1: Sliding-Window IP Rate Limiter (5 requests / 15m)
  const rateLimit = checkRateLimit(req, "auth");
  if (!rateLimit.allowed) {
    return errorResponse(
      "RATE_LIMIT_EXCEEDED",
      `Too many registration attempts. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      429,
      undefined,
      { rateLimit }
    );
  }

  try {
    // GATE 2: Strict Zod Validation (.strip())
    const json = await req.json();
    const validated = registerSchema.parse(json);

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return errorResponse(
        "EMAIL_ALREADY_EXISTS",
        "An account with this email address already exists.",
        409,
        undefined,
        { rateLimit }
      );
    }

    // Hash password with salt rounds = 10
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        passwordHash,
        fullName: validated.fullName,
        defaultCurrency: validated.defaultCurrency || "USD",
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        defaultCurrency: true,
        createdAt: true,
      },
    });

    // Issue session token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
    });

    const response = successResponse(
      { user, token },
      "User account registered successfully.",
      { status: 201, rateLimit }
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
    return handleApiError(err, "Failed to register user.", { rateLimit });
  }
}
