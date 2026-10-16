import { PrismaClient, TransactionType, AuditAction } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting deterministic database seeding...");

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create authoritative Demo User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Password123!", salt);

  const demoUser = await prisma.user.create({
    data: {
      email: "demo@arcfield.dev",
      passwordHash,
      fullName: "Alex Mercer",
      defaultCurrency: "USD",
    },
  });

  console.log(`👤 Created Demo User: ${demoUser.email} (${demoUser.id})`);

  // 3. Create canonical System Categories
  const systemCategories = [
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

  for (const cat of systemCategories) {
    await prisma.category.create({
      data: {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
        userId: null, // System default
      },
    });
  }

  console.log(`🏷️  Created ${systemCategories.length} system categories.`);

  // 4. Create 25+ realistic transactions across 6 months (May 2026 - October 2026)
  // Matching TRD Section 3.2 cash flow benchmarks:
  // May 2026: Income 4500, Expenses 1950
  // Jun 2026: Income 4600, Expenses 2100
  // Jul 2026: Income 5200, Expenses 2300
  // Aug 2026: Income 4700, Expenses 1850
  // Sep 2026: Income 5000, Expenses 2200
  // Oct 2026: Income 5200, Expenses 2140.50 (Housing 1100, Groceries 450.50, Utilities 290, Entertainment 300)
  const transactionsData = [
    // --- MAY 2026 ---
    { type: TransactionType.INCOME, amount: 4500.00, categoryId: "cat_salary_01", date: new Date("2026-05-01T09:00:00Z"), description: "Monthly Engineering Salary" },
    { type: TransactionType.EXPENSE, amount: 1100.00, categoryId: "cat_housing_01", date: new Date("2026-05-03T10:00:00Z"), description: "Apartment Rent" },
    { type: TransactionType.EXPENSE, amount: 380.00, categoryId: "cat_groceries_01", date: new Date("2026-05-10T14:30:00Z"), description: "Bi-weekly Groceries Restock" },
    { type: TransactionType.EXPENSE, amount: 270.00, categoryId: "cat_utilities_01", date: new Date("2026-05-15T11:00:00Z"), description: "Electric & Water Bill" },
    { type: TransactionType.EXPENSE, amount: 200.00, categoryId: "cat_entertainment_01", date: new Date("2026-05-22T20:00:00Z"), description: "Concert Tickets & Dinner" },

    // --- JUNE 2026 ---
    { type: TransactionType.INCOME, amount: 4500.00, categoryId: "cat_salary_01", date: new Date("2026-06-01T09:00:00Z"), description: "Monthly Engineering Salary" },
    { type: TransactionType.INCOME, amount: 100.00, categoryId: "cat_freelance_01", date: new Date("2026-06-18T16:00:00Z"), description: "Technical Consulting Hour" },
    { type: TransactionType.EXPENSE, amount: 1100.00, categoryId: "cat_housing_01", date: new Date("2026-06-03T10:00:00Z"), description: "Apartment Rent" },
    { type: TransactionType.EXPENSE, amount: 420.00, categoryId: "cat_groceries_01", date: new Date("2026-06-12T15:00:00Z"), description: "Organic Supermarket Restock" },
    { type: TransactionType.EXPENSE, amount: 300.00, categoryId: "cat_utilities_01", date: new Date("2026-06-15T11:00:00Z"), description: "Power, Internet & Waste" },
    { type: TransactionType.EXPENSE, amount: 280.00, categoryId: "cat_entertainment_01", date: new Date("2026-06-25T19:00:00Z"), description: "Weekend Mountain Trip" },

    // --- JULY 2026 ---
    { type: TransactionType.INCOME, amount: 4500.00, categoryId: "cat_salary_01", date: new Date("2026-07-01T09:00:00Z"), description: "Monthly Engineering Salary" },
    { type: TransactionType.INCOME, amount: 700.00, categoryId: "cat_freelance_01", date: new Date("2026-07-20T17:00:00Z"), description: "Mobile App MVP Design Project" },
    { type: TransactionType.EXPENSE, amount: 1100.00, categoryId: "cat_housing_01", date: new Date("2026-07-03T10:00:00Z"), description: "Apartment Rent" },
    { type: TransactionType.EXPENSE, amount: 480.00, categoryId: "cat_groceries_01", date: new Date("2026-07-11T13:00:00Z"), description: "Monthly Wholesale Restock" },
    { type: TransactionType.EXPENSE, amount: 320.00, categoryId: "cat_utilities_01", date: new Date("2026-07-16T11:00:00Z"), description: "Air Conditioning Surge & Gigabit Fiber" },
    { type: TransactionType.EXPENSE, amount: 400.00, categoryId: "cat_entertainment_01", date: new Date("2026-07-28T21:00:00Z"), description: "Summer Music Festival" },

    // --- AUGUST 2026 ---
    { type: TransactionType.INCOME, amount: 4500.00, categoryId: "cat_salary_01", date: new Date("2026-08-01T09:00:00Z"), description: "Monthly Engineering Salary" },
    { type: TransactionType.INCOME, amount: 200.00, categoryId: "cat_freelance_01", date: new Date("2026-08-14T12:00:00Z"), description: "API Integration Consultation" },
    { type: TransactionType.EXPENSE, amount: 1100.00, categoryId: "cat_housing_01", date: new Date("2026-08-03T10:00:00Z"), description: "Apartment Rent" },
    { type: TransactionType.EXPENSE, amount: 350.00, categoryId: "cat_groceries_01", date: new Date("2026-08-09T14:00:00Z"), description: "Farmers Market Provisions" },
    { type: TransactionType.EXPENSE, amount: 250.00, categoryId: "cat_utilities_01", date: new Date("2026-08-15T11:00:00Z"), description: "Utility Bills & Mobile Plan" },
    { type: TransactionType.EXPENSE, amount: 150.00, categoryId: "cat_entertainment_01", date: new Date("2026-08-23T18:00:00Z"), description: "Cinema & Boardgame Night" },

    // --- SEPTEMBER 2026 ---
    { type: TransactionType.INCOME, amount: 4500.00, categoryId: "cat_salary_01", date: new Date("2026-09-01T09:00:00Z"), description: "Monthly Engineering Salary" },
    { type: TransactionType.INCOME, amount: 500.00, categoryId: "cat_freelance_01", date: new Date("2026-09-19T15:00:00Z"), description: "Performance Optimization Audit" },
    { type: TransactionType.EXPENSE, amount: 1100.00, categoryId: "cat_housing_01", date: new Date("2026-09-03T10:00:00Z"), description: "Apartment Rent" },
    { type: TransactionType.EXPENSE, amount: 460.00, categoryId: "cat_groceries_01", date: new Date("2026-09-12T16:00:00Z"), description: "Pantry Restock & Whole Foods" },
    { type: TransactionType.EXPENSE, amount: 280.00, categoryId: "cat_utilities_01", date: new Date("2026-09-15T11:00:00Z"), description: "Water, Gas, Electricity & Internet" },
    { type: TransactionType.EXPENSE, amount: 360.00, categoryId: "cat_entertainment_01", date: new Date("2026-09-27T20:00:00Z"), description: "Fine Dining & Theatre" },

    // --- OCTOBER 2026 (Active Month: Income 5200, Expenses 2140.50, Net 3059.50) ---
    { type: TransactionType.INCOME, amount: 4500.00, categoryId: "cat_salary_01", date: new Date("2026-10-01T09:00:00Z"), description: "Monthly Engineering Salary" },
    { type: TransactionType.INCOME, amount: 700.00, categoryId: "cat_freelance_01", date: new Date("2026-10-08T14:00:00Z"), description: "Architecture Standard Review Contract" },
    { type: TransactionType.EXPENSE, amount: 1100.00, categoryId: "cat_housing_01", date: new Date("2026-10-02T10:00:00Z"), description: "Apartment Rent (October)" },
    { type: TransactionType.EXPENSE, amount: 215.00, categoryId: "cat_groceries_01", date: new Date("2026-10-05T12:00:00Z"), description: "Weekly Grocery Run #1" },
    { type: TransactionType.EXPENSE, amount: 151.00, categoryId: "cat_groceries_01", date: new Date("2026-10-10T15:30:00Z"), description: "Specialty Market Ingredients" },
    { type: TransactionType.EXPENSE, amount: 84.50, categoryId: "cat_groceries_01", date: new Date("2026-10-15T11:00:00Z"), description: "Weekly grocery restocking" },
    { type: TransactionType.EXPENSE, amount: 180.00, categoryId: "cat_utilities_01", date: new Date("2026-10-12T09:30:00Z"), description: "Electric & Heating" },
    { type: TransactionType.EXPENSE, amount: 110.00, categoryId: "cat_utilities_01", date: new Date("2026-10-14T10:00:00Z"), description: "Fiber Internet Subscription" },
    { type: TransactionType.EXPENSE, amount: 120.00, categoryId: "cat_entertainment_01", date: new Date("2026-10-04T19:00:00Z"), description: "Art Exhibition & Gallery Pass" },
    { type: TransactionType.EXPENSE, amount: 180.00, categoryId: "cat_entertainment_01", date: new Date("2026-10-11T20:30:00Z"), description: "Symphony Orchestra Night" },
  ];

  let seededCount = 0;
  for (const item of transactionsData) {
    const tx = await prisma.transaction.create({
      data: {
        userId: demoUser.id,
        categoryId: item.categoryId,
        type: item.type,
        amount: item.amount,
        date: item.date,
        description: item.description,
        isArchived: false,
      },
    });

    // Create corresponding audit log
    await prisma.auditLog.create({
      data: {
        transactionId: tx.id,
        action: AuditAction.CREATE,
        details: JSON.stringify({
          event: "Transaction recorded during initial seed",
          type: item.type,
          amount: item.amount.toFixed(2),
          description: item.description,
        }),
        performedBy: demoUser.id,
        timestamp: item.date,
      },
    });

    seededCount++;
  }

  console.log(`💳 Seeded ${seededCount} transactions with atomic audit logs.`);
  console.log("✅ Deterministic database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
