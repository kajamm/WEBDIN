// [Prisma] Menggantikan mysql2 pool (config/database.ts versi lama).
// Semua controller sekarang import `prisma` dari sini, lalu pakai method
// seperti prisma.mahasiswa.findMany(), prisma.user.create(), dst — bukan
// db.query("SELECT ...") lagi.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
