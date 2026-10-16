import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-check";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  // GATE 1: Sliding-Window IP Rate Limiter (20 req / min)
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

  // GATE 3: Session Authentication & Anti-IDOR clamp
  const auth = await requireAuth(req);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { id } = await params;

    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: auth.user.userId,
      },
    });

    if (!existing) {
      return errorResponse("NOT_FOUND", "Transaction record not found.", 404, undefined, { rateLimit });
    }

    // Atomic restoration lifecycle and RESTORE audit log in a single pipelined round-trip
    const [restored] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id: existing.id },
        data: {
          isArchived: false,
          archivedAt: null,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
              type: true,
            },
          },
        },
      }),
      prisma.auditLog.create({
        data: {
          transactionId: existing.id,
          action: "RESTORE",
          details: JSON.stringify({
            event: "Transaction restored from archive",
          }),
          performedBy: auth.user.userId,
        },
      }),
    ]);

    return successResponse(
      {
        ...restored,
        amount: Number(restored.amount),
      },
      "Transaction restored successfully.",
      { rateLimit }
    );
  } catch (err) {
    return handleApiError(err, "Failed to restore transaction.", { rateLimit });
  }
}
