import { PrismaClient } from "@/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaLogLevels = process.env.NODE_ENV === "production" ? ["warn", "error"] : ["query", "info", "warn", "error"]

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: prismaLogLevels as ("query" | "info" | "warn" | "error")[] })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
