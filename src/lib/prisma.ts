import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma 7 connects through a driver adapter rather than a schema `url`.
 *
 * The pool settings matter on Neon: it closes idle server-side connections
 * after a few minutes, and a long-running server that holds one past that
 * point fails the next query with "Connection terminated unexpectedly". Retiring
 * our own connections well before Neon does keeps the pool healthy.
 */
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  // Recycle idle connections long before Neon's own idle cutoff.
  idleTimeoutMillis: 30_000,
  // Fail fast on a dead socket instead of hanging a request.
  connectionTimeoutMillis: 10_000,
  // Serverless platforms run many short-lived instances; a small pool per
  // instance avoids exhausting the project's connection budget.
  max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  keepAlive: true,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Reuse the client across HMR reloads in development so we don't leak pools.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
