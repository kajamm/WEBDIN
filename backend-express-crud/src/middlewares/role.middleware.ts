import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Cek apakah req.user di-populate oleh authMiddleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak, silakan login terlebih dahulu'
      });
    }

    // 2. Cek apakah role user diizinkan
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Anda tidak memiliki akses untuk resource ini'
      });
    }

    // 3. Lanjutkan request
    next();
  };
};
