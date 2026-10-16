import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-check";
import { updateTransactionSchema } from "@/lib/validations/transaction";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
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
    const { id } = await params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: auth.user.userId,
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
        auditLogs: {
          orderBy: { timestamp: "desc" },
          take: 10,
        },
      },
    });

    if (!transaction) {
      return errorResponse("NOT_FOUND", "Transaction record not found.", 404, undefined, { rateLimit });
    }

    return successResponse(
      {
        ...transaction,
        amount: Number(transaction.amount),
      },
      "Transaction retrieved successfully.",
      { rateLimit }
    );
  } catch (err) {
    return handleApiError(err, "Failed to retrieve transaction.", { rateLimit });
  }
}

export async function PUT(req: NextRequest, { params }: RouteProps) {
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

    // Strict Anti-IDOR check: verify record exists and belongs to user
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: auth.user.userId,
      },
    });

    if (!existing) {
      return errorResponse("NOT_FOUND", "Transaction record not found.", 404, undefined, { rateLimit });
    }

    // GATE 2: Strict Zod Validation (.strip())
    const json = await req.json();
    const validated = updateTransactionSchema.parse(json);

    // If categoryId is changed, verify new category
    if (validated.categoryId && validated.categoryId !== existing.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: validated.categoryId,
          OR: [{ userId: null }, { userId: auth.user.userId }],
        },
      });
      if (!category) {
        return errorResponse("CATEGORY_NOT_FOUND", "Specified category does not exist or is inaccessible.", 400, undefined, { rateLimit });
      }
    }

    // Compute field-level diff for immutable AuditLog
    const diff: Record<string, { from: unknown; to: unknown }> = {};

    if (validated.type !== undefined && validated.type !== existing.type) {
      diff.type = { from: existing.type, to: validated.type };
    }
    if (validated.amount !== undefined && Number(existing.amount) !== validated.amount) {
      diff.amount = { from: Number(existing.amount), to: validated.amount };
    }
    if (validated.categoryId !== undefined && validated.categoryId !== existing.categoryId) {
      diff.categoryId = { from: existing.categoryId, to: validated.categoryId };
    }
    if (validated.description !== undefined && validated.description !== existing.description) {
      diff.description = { from: existing.description, to: validated.description };
    }
    if (validated.date !== undefined && existing.date.getTime() !== validated.date.getTime()) {
      diff.date = { from: existing.date.toISOString(), to: validated.date.toISOString() };
    }

    // Build update payload
    const updateData: Prisma.TransactionUpdateInput = {};
    if (validated.type) updateData.type = validated.type;
    if (validated.amount !== undefined) updateData.amount = new Prisma.Decimal(validated.amount);
    if (validated.categoryId) updateData.category = { connect: { id: validated.categoryId } };
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.date) updateData.date = validated.date;

    // Atomic transaction: update record and write AuditLog diff
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.transaction.update({
        where: { id: existing.id },
        data: updateData,
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
      });

      if (Object.keys(diff).length > 0) {
        await tx.auditLog.create({
          data: {
            transactionId: result.id,
            action: "UPDATE",
            details: JSON.stringify({
              event: "Transaction updated",
              modifiedFields: diff,
            }),
            performedBy: auth.user.userId,
          },
        });
      }

      return result;
    });

    return successResponse(
      {
        ...updated,
        amount: Number(updated.amount),
        diff,
      },
      "Transaction updated successfully.",
      { rateLimit }
    );
  } catch (err) {
    return handleApiError(err, "Failed to update transaction.", { rateLimit });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
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

    const { searchParams } = new URL(req.url);
    const isPermanent = searchParams.get("permanent") === "true";

    if (isPermanent) {
      await prisma.transaction.delete({
        where: { id: existing.id },
      });

      return successResponse(
        {
          id: existing.id,
          deletedPermanently: true,
        },
        "Transaction permanently deleted.",
        { rateLimit }
      );
    }

    // Atomic soft-archival lifecycle and ARCHIVE audit log
    const archived = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const updated = await tx.transaction.update({
        where: { id: existing.id },
        data: {
          isArchived: true,
          archivedAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          transactionId: updated.id,
          action: "ARCHIVE",
          details: JSON.stringify({
            event: "Transaction soft-archived",
            archivedAt: now.toISOString(),
          }),
          performedBy: auth.user.userId,
        },
      });

      return updated;
    });

    return successResponse(
      {
        id: archived.id,
        isArchived: archived.isArchived,
        archivedAt: archived.archivedAt,
      },
      "Transaction archived successfully.",
      { rateLimit }
    );
  } catch (err) {
    return handleApiError(err, "Failed to archive transaction.", { rateLimit });
  }
}
