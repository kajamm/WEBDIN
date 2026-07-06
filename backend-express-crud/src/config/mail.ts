// [Pertemuan 15 - Bagian 8: Pertimbangan SMTP Gmail]
// Dipakai hanya jika kamu mengaktifkan fitur forgot-password via email
// (opsional sesuai Tugas Pertemuan 15 poin terakhir).
//
// Catatan penting:
// - Gunakan App Password Gmail (butuh 2-Step Verification aktif), BUKAN
//   password akun Gmail biasa.
// - Untuk production kampus, sebaiknya pakai SMTP institusi atau layanan
//   transactional email resmi, bukan akun Gmail pribadi.
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const mailer = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 465,
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});
