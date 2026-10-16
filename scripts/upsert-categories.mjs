import { PrismaClient, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { id: "cat_salary_01", name: "Salary", type: TransactionType.INCOME, color: "#22c55e", icon: "wallet" },
  { id: "cat_freelance_01", name: "Freelance", type: TransactionType.INCOME, color: "#3b82f6", icon: "laptop" },
  { id: "cat_investments_01", name: "Investments", type: TransactionType.INCOME, color: "#14b8a6", icon: "trending-up" },
  { id: "cat_other_income_01", name: "Other Income", type: TransactionType.INCOME, color: "#84cc16", icon: "plus-circle" },
  { id: "cat_housing_01", name: "Housing", type: TransactionType.EXPENSE, color: "#6366f1", icon: "home" },
  { id: "cat_groceries_01", name: "Groceries", type: TransactionType.EXPENSE, color: "#10b981", icon: "shopping-cart" },
  { id: "cat_dining_01", name: "Dining & Food", type: TransactionType.EXPENSE, color: "#f97316", icon: "utensils" },
  { id: "cat_transport_01", name: "Transportation", type: TransactionType.EXPENSE, color: "#06b6d4", icon: "car" },
  { id: "cat_utilities_01", name: "Utilities", type: TransactionType.EXPENSE, color: "#f59e0b", icon: "zap" },
  { id: "cat_healthcare_01", name: "Healthcare", type: TransactionType.EXPENSE, color: "#ef4444", icon: "activity" },
  { id: "cat_shopping_01", name: "Shopping", type: TransactionType.EXPENSE, color: "#8b5cf6", icon: "shopping-bag" },
  { id: "cat_entertainment_01", name: "Entertainment", type: TransactionType.EXPENSE, color: "#ec4899", icon: "film" },
  { id: "cat_subscriptions_01", name: "Subscriptions", type: TransactionType.EXPENSE, color: "#64748b", icon: "refresh-cw" },
  { id: "cat_education_01", name: "Education", type: TransactionType.EXPENSE, color: "#0ea5e9", icon: "book-open" },
];

async function main() {
  console.log("Upserting enriched standard system categories...");
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
      },
      create: {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
        userId: null,
      },
    });
    console.log(`✓ ${cat.name} (${cat.type})`);
  }
  console.log("All standard categories upserted successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
