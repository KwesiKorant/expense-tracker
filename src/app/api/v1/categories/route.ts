import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-check";
import { createCategorySchema } from "@/lib/validations/category";

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

  // GATE 3: Session Authentication
  const auth = await requireAuth(req);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const json = await req.json();
    const validated = createCategorySchema.parse(json);

    // Duplicate check: verify no system or user category with same name & type
    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: validated.name, mode: "insensitive" },
        type: validated.type,
        OR: [{ userId: null }, { userId: auth.user.userId }],
      },
    });

    if (existing) {
      return errorResponse(
        "CONFLICT",
        `A ${validated.type.toLowerCase()} category named "${validated.name}" already exists.`,
        409,
        undefined,
        { rateLimit }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        type: validated.type,
        color: validated.color || (validated.type === "INCOME" ? "#22c55e" : "#6366f1"),
        icon: validated.icon || "tag",
        userId: auth.user.userId,
      },
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
      { category },
      "Category created successfully.",
      { rateLimit, status: 201 }
    );
  } catch (err) {
    return handleApiError(err, "Failed to create category.", { rateLimit });
  }
}
