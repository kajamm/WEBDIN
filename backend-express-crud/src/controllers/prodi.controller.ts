import { Request, Response } from 'express';
import pool from '../config/database';

export const getAllProdi = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM prodi ORDER BY nama_prodi ASC');
    return res.status(200).json({
      success: true,
      message: 'Data prodi berhasil diambil',
      data: rows
    });
  } catch (error: any) {
    console.error('Error fetching prodi:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal mengambil data prodi'
    });
  }
};
