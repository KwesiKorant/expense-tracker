import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-check";
import { createTransactionSchema, queryTransactionsSchema } from "@/lib/validations/transaction";

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
    const { searchParams } = new URL(req.url);
    const queryObj = Object.fromEntries(searchParams.entries());
    const validated = queryTransactionsSchema.parse(queryObj);

    // Build compound tenant-scoped query
    const where: Prisma.TransactionWhereInput = {
      userId: auth.user.userId,
      isArchived: validated.isArchived,
    };

    if (validated.type) {
      where.type = validated.type;
    }

    if (validated.categoryId) {
      where.categoryId = validated.categoryId;
    }

    if (validated.startDate || validated.endDate) {
      where.date = {};
      if (validated.startDate) where.date.gte = validated.startDate;
      if (validated.endDate) where.date.lte = validated.endDate;
    }

    // Arc-AA Multi-Token Whitespace Search
    if (validated.search) {
      const tokens = validated.search.split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        where.AND = tokens.map((token) => ({
          description: { contains: token, mode: "insensitive" },
        }));
      }
    }

    const [total, rawTransactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        skip: (validated.page - 1) * validated.limit,
        take: validated.limit,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
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
    ]);

    // Format Decimal amounts to numbers for JSON serialization
    const transactions = rawTransactions.map((tx) => ({
      ...tx,
      amount: Number(tx.amount),
    }));

    return successResponse(
      {
        transactions,
        pagination: {
          total,
          page: validated.page,
          limit: validated.limit,
          totalPages: Math.ceil(total / validated.limit),
        },
      },
      "Transactions retrieved successfully.",
      { rateLimit }
    );
  } catch (err) {
    return handleApiError(err, "Failed to retrieve transactions.", { rateLimit });
  }
}

export async function POST(req: NextRequest) {
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
    // GATE 2: Strict Zod Validation (.strip())
    const json = await req.json();
    const validated = createTransactionSchema.parse(json);

    // Verify category exists and belongs to system defaults or authenticated user
    const category = await prisma.category.findFirst({
      where: {
        id: validated.categoryId,
        OR: [{ userId: null }, { userId: auth.user.userId }],
      },
    });

    if (!category) {
      return errorResponse("CATEGORY_NOT_FOUND", "Specified category does not exist or is inaccessible.", 400, undefined, { rateLimit });
    }

    // Atomic transaction: create ledger row and append CREATE audit log
    const created = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: auth.user.userId,
          categoryId: validated.categoryId,
          type: validated.type,
          amount: new Prisma.Decimal(validated.amount),
          date: validated.date,
          description: validated.description,
          isArchived: false,
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
      });

      await tx.auditLog.create({
        data: {
          transactionId: transaction.id,
          action: "CREATE",
          details: JSON.stringify({
            event: "Transaction recorded",
            type: validated.type,
            amount: validated.amount.toFixed(2),
            description: validated.description,
            categoryId: validated.categoryId,
          }),
          performedBy: auth.user.userId,
        },
      });

      return transaction;
    });

    return successResponse(
      {
        ...created,
        amount: Number(created.amount),
      },
      "Transaction recorded successfully.",
      { status: 201, rateLimit }
    );
  } catch (err) {
    return handleApiError(err, "Failed to create transaction.", { rateLimit });
  }
}
