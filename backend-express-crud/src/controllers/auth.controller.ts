import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeymahasiswa123';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validasi input
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Semua field (name, email, password, role) wajib diisi'
      });
    }

    // 2. Validasi email format (sederhana)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid'
      });
    }

    // 3. Validasi minimal password 6 karakter
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal harus 6 karakter'
      });
    }

    // 4. Validasi role yang diizinkan
    const validRoles = ['admin', 'operator', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role harus berupa admin, operator, atau viewer'
      });
    }

    // 5. Cek apakah email sudah terdaftar (Email tidak boleh duplikat)
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

    // 6. Hash password menggunakan bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 7. Simpan user baru ke database
    const [result]: any = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        id: result.insertId,
        name,
        email,
        role
      }
    });
  } catch (error: any) {
    console.error('Error during register:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat registrasi'
    });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Validasi input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi'
      });
    }

    // 2. Cari user berdasarkan email
    const [users]: any = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    const user = users[0];

    // 3. Bandingkan password menggunakan bcrypt.compare()
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // 4. Generate JWT Token
    // Payload berisi: id, email, role
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat login'
    });
  }
};
