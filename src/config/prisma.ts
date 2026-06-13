import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "../generated/prisma/client.js";
import { logger } from "../utils/logger.js";
import { env } from "./env.js";

type GlobalPrisma = typeof globalThis & {
  prismaClient?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalPrisma;

const createPrismaClient = (): PrismaClient => {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to initialize Prisma Client.");
  }

  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,

    // Be careful: if you run PM2 cluster with 4 instances and max=10,
    // your app can open up to 40 DB connections.
    max: env.isProduction ? 10 : 5,

    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 300_000,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,

    // Avoid query logs by default. Query logs can expose sensitive data.
    log: env.isDevelopment ? ["warn", "error"] : ["error"],
  });
};

export const prisma: PrismaClient =
  globalForPrisma.prismaClient ?? createPrismaClient();

if (!env.isProduction) {
  globalForPrisma.prismaClient = prisma;
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();

    logger.info("Database connected successfully.");
  } catch (error) {
    logger.fatal({ err: error }, "Failed to connect to database.");

    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();

    logger.info("Database connection closed.");
  } catch (error) {
    logger.error({ err: error }, "Failed to disconnect database cleanly.");

    throw error;
  }
};
