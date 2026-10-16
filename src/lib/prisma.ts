import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// In serverless environments (Vercel), prioritize DATABASE_URL (Port 6543, Transaction mode with ?pgbouncer=true).
// Transaction mode immediately releases connections back to the pool after each query,
// preventing (EMAXCONNSESSION) connection exhaustion under parallel traffic.
// Supabase & Prisma officially recommend connection_limit=1 per serverless instance.
const baseDatabaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || "";

function formatDatabaseUrl(url: string): string {
  if (!url) return url;
  const separator = url.includes("?") ? "&" : "?";
  let formatted = url;
  if (!formatted.includes("connection_limit")) {
    formatted = `${formatted}${separator}connection_limit=1&pool_timeout=10`;
  }
  return formatted;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: formatDatabaseUrl(baseDatabaseUrl),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Cache instance globally in both development and production to prevent connection leaks across warm lambdas
globalForPrisma.prisma = prisma;

export default prisma;
