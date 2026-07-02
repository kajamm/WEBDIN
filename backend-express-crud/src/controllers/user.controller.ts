import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database';

// Helper to generate a random alphanumeric temporary password
const generateTemporaryPassword = (length = 10): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

// 1. GET ALL USERS (Ordered by id DESC)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY id DESC'
    );

    return res.status(200).json({
      success: true,
      message: 'Daftar user berhasil diambil',
      data: rows
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil daftar user'
    });
  }
};

// 2. CREATE USER
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Validasi input wajib
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Semua field (name, email, password, role) wajib diisi'
      });
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid'
      });
    }

    // Validasi role yang diizinkan
    const validRoles = ['admin', 'operator', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role harus berupa admin, operator, atau viewer'
      });
    }

    // Validasi email unik
    const [existingUser]: any = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar, silakan gunakan email lain'
      });
    }

    // Hash password menggunakan bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru ke database
    const [result]: any = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    return res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      data: {
        id: result.insertId,
        name,
        email,
        role
      }
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat membuat user'
    });
  }
};

// 3. UPDATE USER (name, email, role)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    // Validasi input wajib
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Semua field (name, email, role) wajib diisi'
      });
    }

    // Validasi role yang diizinkan
    const validRoles = ['admin', 'operator', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role harus berupa admin, operator, atau viewer'
      });
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid'
      });
    }

    // Cek apakah user ada di database
    const [userExists]: any = await pool.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (userExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Validasi email unik (tidak boleh kembar dengan user lain)
    const [emailInUse]: any = await pool.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, id]
    );

    if (emailInUse.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah digunakan oleh user lain'
      });
    }

    // Update database (hanya name, email, role)
    await pool.query(
      'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
      [name, email, role, id]
    );

    return res.status(200).json({
      success: true,
      message: 'User berhasil diperbarui',
      data: {
        id: parseInt(id),
        name,
        email,
        role
      }
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat memperbarui user'
    });
  }
};

// 4. DELETE USER
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Cek apakah user ada di database
    const [userExists]: any = await pool.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (userExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Hapus user dari database
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'User berhasil dihapus'
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat menghapus user'
    });
  }
};

// 5. RESET PASSWORD
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Cek apakah user ada di database
    const [userExists]: any = await pool.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (userExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Generate password sementara dan hash
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Update password di database
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    return res.status(200).json({
      message: 'Password berhasil direset',
      temporaryPassword
    });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat mereset password'
    });
  }
};
