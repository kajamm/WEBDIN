// [Pertemuan 14 - Bagian 2: Middleware Role]
// Dipakai setelah authMiddleware. Membatasi endpoint berdasarkan role
// yang sudah didekode dari JWT (req.user.role).
//
// Matriks akses (Pertemuan 14 - Bagian 3):
// | Endpoint                              | Admin | Operator | Viewer |
// |----------------------------------------|-------|----------|--------|
// | GET    /api/mahasiswa                  |  Ya   |    Ya    |   Ya   |
// | POST   /api/mahasiswa                  |  Ya   |    Ya    |  Tidak |
// | PUT    /api/mahasiswa/:id              |  Ya   |    Ya    |  Tidak |
// | DELETE /api/mahasiswa/:id              |  Ya   |   Tidak  |  Tidak |
// | GET    /api/users                      |  Ya   |   Tidak  |  Tidak |
// | POST   /api/users                      |  Ya   |   Tidak  |  Tidak |
// | PATCH  /api/users/:id/reset-password    |  Ya   |   Tidak  |  Tidak |
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

// Fungsi ini menerima daftar role yang diizinkan (misal: "admin", "operator").
// Cara pakainya: allowRoles("admin") artinya hanya user dengan role admin
// yang boleh lewat middleware ini. Kalau role user tidak cocok dengan
// daftar yang diizinkan, request langsung ditolak dengan status 403
// (Forbidden) sebelum masuk ke controller.
export const allowRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "User belum login" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Anda tidak memiliki akses ke fitur ini",
      });
    }

    next();
  };
};
