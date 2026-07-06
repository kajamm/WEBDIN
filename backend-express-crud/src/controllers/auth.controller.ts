// [Pertemuan 13 - Bagian 5 & 6] — versi Prisma
// Sebelumnya: db.query("SELECT ... FROM users WHERE email = ?")
// Sekarang:   prisma.user.findUnique({ where: { email } })
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";

// [Pertemuan 13 - Bagian 5: Register User]
// Password TIDAK disimpan apa adanya — selalu di-hash pakai bcrypt.
// Role default saat register publik adalah "viewer" (role lebih tinggi
// hanya dibuat oleh admin lewat endpoint /api/users, lihat user.controller.ts).
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Nama, email, dan password wajib diisi",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password minimal 6 karakter",
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email sudah digunakan" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "viewer" },
    });

    res.status(201).json({ message: "Registrasi berhasil" });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// [Pertemuan 13 - Bagian 6: Login dan Pembuatan JWT]
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email dan password wajib diisi",
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
    );

    res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// [Pertemuan 13 - Bagian 9] JWT bersifat stateless, jadi "logout" di backend
// cuma respons informatif. Penghapusan token sesungguhnya terjadi di frontend.
export const logout = async (req: Request, res: Response) => {
  res.json({ message: "Logout berhasil. Hapus token di frontend." });
};
