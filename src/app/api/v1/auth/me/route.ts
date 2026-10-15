import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-check";

export async function GET(req: NextRequest) {
  // GATE 1: Rate Limiter (60 req / min)
  const rateLimit = checkRateLimit(req, "read");
  if (!rateLimit.allowed) {
    return errorResponse(
      "RATE_LIMIT_EXCEEDED",
      `Rate limit exceeded. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      429,
      undefined,
      { rateLimit }
    );
  }

  // GATE 3: Session Authentication
  const auth = await requireAuth(req);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        defaultCurrency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return errorResponse("NOT_FOUND", "User profile not found.", 404, undefined, { rateLimit });
    }

    return successResponse(user, "User profile retrieved.", { rateLimit });
  } catch (err) {
    return handleApiError(err, "Failed to retrieve user profile.", { rateLimit });
  }
}
