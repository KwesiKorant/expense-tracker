import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-check";

export async function GET(req: NextRequest) {
  // GATE 1: Sliding-Window IP Rate Limiter (60 req / min)
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

  // GATE 3: Session Authentication & Anti-IDOR clamp
  const auth = await requireAuth(req);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId: auth.user.userId }],
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        type: true,
        color: true,
        icon: true,
        userId: true,
      },
    });

    return successResponse(
      { categories },
      "Categories retrieved successfully.",
      {
        rateLimit,
        headers: {
          "Cache-Control": "private, max-age=900", // 15-minute client cache per TRD
        },
      }
    );
  } catch (err) {
    return handleApiError(err, "Failed to retrieve categories.", { rateLimit });
  }
}
