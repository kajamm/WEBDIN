import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeymahasiswa123';

// Buat interface kustom untuk request yang terautentikasi agar TypeScript tidak error
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // 1. Cek keberadaan header Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak, token tidak disediakan'
    });
  }

  // 2. Ambil token dari string "Bearer <token>"
  const token = authHeader.split(' ')[1];

  try {
    // 3. Verifikasi JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      role: string;
    };

    // 4. Simpan hasil decode (payload) ke req.user
    req.user = decoded;

    // 5. Lanjutkan request
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau telah expired'
    });
  }
};
