import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import { errorResponse, handleApiError, SECURITY_HEADERS } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-check";

/**
 * Sanitizes a CSV cell against CWE-1236 CSV Formula Injection and formats RFC-4180 escaping
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);

  // CWE-1236 Defense: If string starts with formula characters (=, +, -, @, tab, CR), prefix with single quote
  const formulaTriggers = ["=", "+", "-", "@", "\t", "\r"];
  if (formulaTriggers.some((char) => str.startsWith(char))) {
    str = `'${str}`;
  }

  // RFC-4180 Quoting: If string contains double quotes, commas, or newlines, quote and escape
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export async function GET(req: NextRequest) {
  // GATE 1: Sliding-Window IP Rate Limiter (10 req / min for export)
  const rateLimit = checkRateLimit(req, "export");
  if (!rateLimit.allowed) {
    return errorResponse(
      "RATE_LIMIT_EXCEEDED",
      `Export rate limit reached. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
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
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: auth.user.userId,
        isArchived: false,
      },
      include: {
        category: true,
      },
      orderBy: { date: "desc" },
    });

    const headers = ["ID", "Date", "Type", "Category", "Amount", "Description", "Created At"];
    const rows = transactions.map((tx) => [
      sanitizeCsvCell(tx.id),
      sanitizeCsvCell(tx.date.toISOString().split("T")[0]),
      sanitizeCsvCell(tx.type),
      sanitizeCsvCell(tx.category.name),
      sanitizeCsvCell(Number(tx.amount).toFixed(2)),
      sanitizeCsvCell(tx.description),
      sanitizeCsvCell(tx.createdAt.toISOString()),
    ]);

    // Prepend UTF-8 Byte Order Mark (\uFEFF) for Excel compatibility
    const csvContent =
      "\uFEFF" +
      [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\r\n");

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "text/csv; charset=utf-8");
    responseHeaders.set("Content-Disposition", 'attachment; filename="transactions-export.csv"');
    responseHeaders.set("X-RateLimit-Limit", rateLimit.limit.toString());
    responseHeaders.set("X-RateLimit-Remaining", rateLimit.remaining.toString());

    for (const [key, val] of Object.entries(SECURITY_HEADERS)) {
      responseHeaders.set(key, val);
    }

    return new Response(csvContent, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    return handleApiError(err, "Failed to export transactions.", { rateLimit });
  }
}
