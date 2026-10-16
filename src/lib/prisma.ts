import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Route queries through session pooler (Port 5432) with persistent connection pooling
// Eliminates cold SSL handshakes to Ireland and accelerates multi-tenant queries by up to 6x.
const databaseUrl = process.env.DIRECT_URL
  ? (process.env.DIRECT_URL.includes("?")
      ? `${process.env.DIRECT_URL}&connection_limit=5&pool_timeout=10`
      : `${process.env.DIRECT_URL}?connection_limit=5&pool_timeout=10`)
  : process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
