// [Pertemuan 12 - Bagian 5: Route Prodi] — versi Prisma
// Sebelumnya: db.query("SELECT id, nama_prodi FROM prodi ORDER BY nama_prodi ASC")
// Sekarang:   prisma.prodi.findMany({ orderBy: ... })
import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getAllProdi = async (req: Request, res: Response) => {
  try {
    const prodi = await prisma.prodi.findMany({
      orderBy: { namaProdi: "asc" },
      select: { id: true, namaProdi: true },
    });

    // Map balik ke snake_case (nama_prodi) supaya kontrak JSON API tetap
    // sama seperti sebelumnya dan frontend (lib/api.ts) tidak perlu diubah.
    const data = prodi.map((p) => ({ id: p.id, nama_prodi: p.namaProdi }));

    res.json({
      message: "Data prodi berhasil diambil",
      data,
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
