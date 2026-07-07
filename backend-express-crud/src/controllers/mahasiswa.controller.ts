// [Pertemuan 12 - Bagian 6 & 7] — versi Prisma
// Sebelumnya: JOIN manual pakai SQL ("JOIN prodi p ON m.prodi_id = p.id")
// Sekarang:   relasi otomatis lewat `include: { prodi: true }`
import { Request, Response } from "express";
import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

// [Pertemuan 12 - Bagian 6: Query Mahasiswa dengan Relasi, Search, Filter, Pagination]
export const getAllMahasiswa = async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search || "");
    const prodiId = req.query.prodi_id ? Number(req.query.prodi_id) : null;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);

    // [Prisma] Pengganti string WHERE dinamis: object `where` yang disusun
    // bertahap. Prisma otomatis melakukan parameterized query di balik
    // layar, jadi aman dari SQL injection tanpa perlu placeholder manual.
    const where: Prisma.MahasiswaWhereInput = {};
    
    // Query search: mencari NIM atau nama yang MENGANDUNG kata kunci
    // (bukan harus sama persis), makanya pakai "contains".
    // Contoh: cari "budi" akan menemukan "Budi Santoso" dan "Budiman".
    if (search) {
      where.OR = [
        { nim: { contains: search } },
        { nama: { contains: search } },
      ];
    }

    if (prodiId) {
      where.prodiId = prodiId;
    }

    const [total, rows] = await Promise.all([
      prisma.mahasiswa.count({ where }),
      prisma.mahasiswa.findMany({
        where,
        include: { prodi: { select: { id: true, namaProdi: true } } },
        orderBy: { id: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Map balik ke bentuk JSON yang sama seperti versi mysql2 sebelumnya
    // (field flat: prodi_id, nama_prodi), supaya frontend tidak perlu diubah.
    const data = rows.map((m) => ({
      id: m.id,
      nim: m.nim,
      nama: m.nama,
      angkatan: m.angkatan,
      foto: m.foto,
      prodi_id: m.prodi.id,
      nama_prodi: m.prodi.namaProdi,
    }));

    res.json({
      message: "Data mahasiswa berhasil diambil",
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data,
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// [Pertemuan 12 - Bagian 7: Create dan Update Mahasiswa dengan Foto]
export const createMahasiswa = async (req: Request, res: Response) => {
  try {
    const { nim, nama, prodi_id, angkatan } = req.body;
    const foto = req.file ? req.file.filename : null;

    if (!nim || !nama || !prodi_id || !angkatan) {
      return res.status(400).json({
        message: "NIM, nama, prodi, dan angkatan wajib diisi",
      });
    }

    const existing = await prisma.mahasiswa.findUnique({ where: { nim } });
    if (existing) {
      return res.status(400).json({ message: "NIM sudah digunakan" });
    }

    const created = await prisma.mahasiswa.create({
      data: {
        nim,
        nama,
        prodiId: Number(prodi_id),
        angkatan: Number(angkatan),
        foto,
      },
    });

    res.status(201).json({
      message: "Mahasiswa berhasil ditambahkan",
      data: created,
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

export const updateMahasiswa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nim, nama, prodi_id, angkatan } = req.body;

    const data: Prisma.MahasiswaUpdateInput = {
      nim,
      nama,
      prodi: { connect: { id: Number(prodi_id) } },
      angkatan: Number(angkatan),
    };

    // Foto bersifat opsional saat update — hanya diganti jika ada file baru
    if (req.file) {
      data.foto = req.file.filename;
    }

    const updated = await prisma.mahasiswa
      .update({ where: { id: Number(id) }, data })
      .catch(() => null);

    if (!updated) {
      return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
    }

    res.json({ message: "Mahasiswa berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

export const deleteMahasiswa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await prisma.mahasiswa
      .delete({ where: { id: Number(id) } })
      .catch(() => null);

    if (!deleted) {
      return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
    }

    res.json({ message: "Mahasiswa berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
