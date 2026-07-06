// [Pertemuan 12 - Bagian 3: Konfigurasi Static Folder untuk File Upload]
import express from "express";
import cors from "cors";
import path from "path";
import mahasiswaRoutes from "./routes/mahasiswa.route";
import prodiRoutes from "./routes/prodi.route";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";

const app = express();

// Sesuaikan origin dengan port frontend Next.js kamu
app.use(cors({
  origin: process.env.APP_URL || "http://localhost:3001",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// Agar file di folder uploads bisa diakses oleh frontend
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// [Pertemuan 13 - Bagian 9] Route auth: /api/auth/register, /login, /logout
app.use("/api/auth", authRoutes);

app.use("/api/prodi", prodiRoutes);
app.use("/api/mahasiswa", mahasiswaRoutes);

// [Pertemuan 15 - Bagian 6] Route user khusus admin: /api/users
app.use("/api/users", userRoutes);

export default app;
