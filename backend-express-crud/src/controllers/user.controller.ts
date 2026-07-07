// [Pertemuan 15] — versi Prisma
// Semua endpoint di sini dibatasi khusus admin lewat middleware
// authMiddleware + allowRoles("admin") di routes/user.route.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "../config/prisma";
import { mailer } from "../config/mail";

// [Pertemuan 15 - Bagian 2: Read Daftar User]
// Prinsip keamanan: JANGAN pernah `select` kolom password ke frontend.
// Read: lihat semua user
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { id: "desc" },
    });

    // Map created_at (snake_case) supaya konsisten dengan kontrak API lama
    const data = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.createdAt,
    }));

    res.json({ message: "Data user berhasil diambil", data });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// [Pertemuan 15 - Bagian 3: Create User oleh Admin]
// Create: tambah user baru
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Nama, email, password, dan role wajib diisi",
      });
    }

    const allowedRoles = ["admin", "operator", "viewer"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Role tidak valid" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });

    res.status(201).json({ message: "User berhasil ditambahkan" });
  } catch (error: any) {
    // P2002 = unique constraint (email) violation
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Email sudah digunakan" });
    }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// [Pertemuan 15 - Bagian 4: Update dan Delete User]
// Update: edit data user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const updated = await prisma.user
      .update({
        where: { id: Number(id) },
        data: { name, email, role },
      })
      .catch(() => null);

    if (!updated) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json({ message: "User berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// Delete: hapus user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await prisma.user
      .delete({ where: { id: Number(id) } })
      .catch(() => null);

    if (!deleted) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json({ message: "User berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// [Pertemuan 15 - Bagian 5: Reset Password oleh Admin]
// Catatan keamanan (dari materi): menampilkan temporaryPassword langsung di
// response HANYA cocok untuk latihan/sistem internal terbatas. Untuk skenario
// lebih baik, kirim link reset password lewat email (lihat requestPasswordReset
// di bawah) dan jangan tampilkan password baru di layar admin.
function generateTemporaryPassword() {
  return Math.random().toString(36).slice(-10);
}

// Reset password (versi manual oleh admin)
export const resetPasswordByAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const updated = await prisma.user
      .update({
        where: { id: Number(id) },
        data: { password: hashedPassword },
      })
      .catch(() => null);

    if (!updated) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json({
      message: "Password berhasil direset",
      temporaryPassword,
      note: "Tampilkan hanya sekali, lalu minta user mengganti password.",
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// [Pertemuan 15 - Bagian 7: Opsi Reset Password via Email] (opsional/bonus)
// Alur: user minta reset -> backend generate token acak -> simpan HASH token
// (bukan token mentah) ke tabel password_reset_tokens -> kirim token mentah
// lewat email sebagai link.
// Reset password (versi kirim email)
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email wajib diisi" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Selalu balas sukses walau email tidak ditemukan, supaya endpoint ini
    // tidak bisa dipakai untuk menebak email mana yang terdaftar.
    if (!user) {
      return res.json({
        message: "Jika email terdaftar, link reset password telah dikirim",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 menit

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    await mailer.sendMail({
      from: `Admin Kampus <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "Reset Password",
      html: `
        <p>Anda meminta reset password.</p>
        <p>Klik link berikut untuk mengganti password:</p>
        <a href="${process.env.APP_URL}/reset-password?token=${rawToken}">
          Reset Password
        </a>
        <p>Link berlaku selama 30 menit.</p>
      `,
    });

    res.json({
      message: "Jika email terdaftar, link reset password telah dikirim",
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
