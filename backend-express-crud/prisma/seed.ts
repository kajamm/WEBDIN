// [Pertemuan 12 - Bagian 1] seed data Prodi
// [Pertemuan 14 - Bagian 5: Membuat Akun Uji] seed akun admin/operator/viewer
// Jalankan dengan: npm run seed  (atau otomatis lewat `npx prisma migrate dev`)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Mulai seeding...");

  // --- PRODI ---
  const namaProdiList = [
    "Informatika",
    "Sistem Informasi",
    "Teknik Elektro",
    "Manajemen",
    "Akuntansi",
  ];

  for (const namaProdi of namaProdiList) {
    await prisma.prodi.upsert({
      where: { namaProdi },
      update: {},
      create: { namaProdi },
    });
  }
  console.log(`✅ ${namaProdiList.length} Prodi dibuat`);

  // --- AKUN UJI (Pertemuan 14 - Bagian 5) ---
  const akun = [
    { name: "Admin Kampus", email: "admin@kampus.ac.id", password: "admin123", role: "admin" as const },
    { name: "Operator Kampus", email: "operator@kampus.ac.id", password: "operator123", role: "operator" as const },
    { name: "Viewer Kampus", email: "viewer@kampus.ac.id", password: "viewer123", role: "viewer" as const },
  ];

  for (const user of akun) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
      },
    });
    console.log(`✅ Akun ${user.role} disiapkan: ${user.email} / ${user.password}`);
  }

  console.log("🎉 Seeding selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
