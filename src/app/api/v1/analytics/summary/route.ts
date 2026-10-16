import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-check";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

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
    const targetMonthQuery = searchParams.get("month"); // e.g. "2026-10"

    // Fetch all active transactions for the user (lean projection)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: auth.user.userId,
        isArchived: false,
      },
      select: {
        id: true,
        date: true,
        amount: true,
        type: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // 1. Group transactions by Year-Month key ("YYYY-MM")
    const monthlyAggregates = new Map<
      string,
      {
        monthLabel: string;
        income: number;
        expenses: number;
        categoryExpenses: Map<string, { name: string; amount: number; color: string }>;
      }
    >();

    for (const tx of transactions) {
      const year = tx.date.getUTCFullYear();
      const monthIdx = tx.date.getUTCMonth();
      const monthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
      const monthLabel = `${MONTH_NAMES[monthIdx]} ${year}`;

      if (!monthlyAggregates.has(monthKey)) {
        monthlyAggregates.set(monthKey, {
          monthLabel,
          income: 0,
          expenses: 0,
          categoryExpenses: new Map(),
        });
      }

      const bucket = monthlyAggregates.get(monthKey)!;
      const amount = Number(tx.amount);

      if (tx.type === "INCOME") {
        bucket.income += amount;
      } else {
        bucket.expenses += amount;

        const catName = tx.category.name;
        const catColor = tx.category.color;
        const currentCat = bucket.categoryExpenses.get(catName) || {
          name: catName,
          amount: 0,
          color: catColor,
        };
        currentCat.amount += amount;
        bucket.categoryExpenses.set(catName, currentCat);
      }
    }

    // Determine target active month:
    // User requested month, or latest month present in records, or current month
    const sortedMonthKeys = Array.from(monthlyAggregates.keys()).sort();
    let activeMonthKey = targetMonthQuery;

    if (!activeMonthKey || !monthlyAggregates.has(activeMonthKey)) {
      activeMonthKey = sortedMonthKeys.length > 0
        ? sortedMonthKeys[sortedMonthKeys.length - 1]
        : `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;
    }

    const activeBucket = monthlyAggregates.get(activeMonthKey) || {
      monthLabel: "",
      income: 0,
      expenses: 0,
      categoryExpenses: new Map(),
    };

    // Calculate active month KPIs
    const totalIncome = Number(activeBucket.income.toFixed(2));
    const totalExpenses = Number(activeBucket.expenses.toFixed(2));
    const netBalance = Number((totalIncome - totalExpenses).toFixed(2));
    const savingsRate =
      totalIncome > 0
        ? Number((((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(2))
        : 0;

    // 2. Build 6-Month Cash Flow History
    // Take up to last 6 distinct months
    const recentMonthKeys = sortedMonthKeys.slice(-6);
    const cashFlowHistory = recentMonthKeys.map((key) => {
      const b = monthlyAggregates.get(key)!;
      return {
        month: b.monthLabel,
        income: Number(b.income.toFixed(2)),
        expenses: Number(b.expenses.toFixed(2)),
      };
    });

    // 3. Build Category Distribution for Expenses in active month
    const categoryDistribution = Array.from(activeBucket.categoryExpenses.values())
      .map((cat) => ({
        category: cat.name,
        amount: Number(cat.amount.toFixed(2)),
        percentage:
          totalExpenses > 0
            ? Number(((cat.amount / totalExpenses) * 100).toFixed(2))
            : 0,
        color: cat.color,
      }))
      .sort((a, b) => b.amount - a.amount);

    return successResponse(
      {
        metrics: {
          totalIncome,
          totalExpenses,
          netBalance,
          savingsRate,
          activeMonth: activeBucket.monthLabel,
        },
        cashFlowHistory,
        categoryDistribution,
      },
      "Analytics summary computed successfully.",
      { rateLimit }
    );
  } catch (err) {
    return handleApiError(err, "Failed to compute analytics summary.", { rateLimit });
  }
}
