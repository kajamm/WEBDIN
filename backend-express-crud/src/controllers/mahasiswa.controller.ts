import { Request, Response } from 'express';
import pool from '../config/database';
import fs from 'fs';
import path from 'path';

// Helper to delete uploaded files on errors or replacements
const deleteFile = (filePath: string) => {
  try {
    const fullPath = path.resolve(filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error('Error deleting file:', err);
  }
};

// READ ALL (PAGINATED, FILTERABLE, SEARCHABLE)
export const getMahasiswa = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const prodiId = req.query.prodi_id as string;

    let query = `
      SELECT m.*, p.nama_prodi 
      FROM mahasiswa m 
      JOIN prodi p ON m.prodi_id = p.id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM mahasiswa m 
      JOIN prodi p ON m.prodi_id = p.id
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    const countParams: any[] = [];

    // Search filter (NIM or Name)
    if (search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      query += ` AND (m.nama LIKE ? OR m.nim LIKE ?)`;
      countQuery += ` AND (m.nama LIKE ? OR m.nim LIKE ?)`;
      queryParams.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }

    // Prodi filter
    if (prodiId) {
      query += ` AND m.prodi_id = ?`;
      countQuery += ` AND m.prodi_id = ?`;
      queryParams.push(parseInt(prodiId));
      countParams.push(parseInt(prodiId));
    }

    // Ordering and Pagination
    query += ` ORDER BY m.id DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [rows]: any = await pool.query(query, queryParams);
    const [countRows]: any = await pool.query(countQuery, countParams);
    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      message: 'Data mahasiswa berhasil diambil',
      data: rows,
      meta: {
        page,
        limit,
        total: totalItems,
        totalPage: totalPages
      }
    });
  } catch (error: any) {
    console.error('Error fetching mahasiswa:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal mengambil data mahasiswa'
    });
  }
};

// CREATE
export const createMahasiswa = async (req: Request, res: Response) => {
  const file = req.file;
  try {
    const { nim, nama, prodi_id, angkatan } = req.body;

    if (!nim || !nama || !prodi_id || !angkatan) {
      if (file) deleteFile(file.path);
      return res.status(400).json({
        success: false,
        message: 'NIM, nama, prodi_id, dan angkatan wajib diisi'
      });
    }

    // Check NIM uniqueness
    const [existingNimRows]: any = await pool.query('SELECT id FROM mahasiswa WHERE nim = ?', [nim.trim()]);
    if (existingNimRows.length > 0) {
      if (file) deleteFile(file.path);
      return res.status(400).json({
        success: false,
        message: 'NIM sudah terdaftar'
      });
    }

    // Verify Prodi existence
    const [prodiRows]: any = await pool.query('SELECT id FROM prodi WHERE id = ?', [parseInt(prodi_id)]);
    if (prodiRows.length === 0) {
      if (file) deleteFile(file.path);
      return res.status(400).json({
        success: false,
        message: 'Program Studi tidak ditemukan'
      });
    }

    const fotoPath = file ? `uploads/mahasiswa/${file.filename}` : null;

    const [result]: any = await pool.query(
      'INSERT INTO mahasiswa (nim, nama, prodi_id, angkatan, foto) VALUES (?, ?, ?, ?, ?)',
      [nim.trim(), nama.trim(), parseInt(prodi_id), angkatan.trim(), fotoPath]
    );

    return res.status(201).json({
      success: true,
      message: 'Mahasiswa berhasil ditambahkan',
      data: {
        id: result.insertId,
        nim: nim.trim(),
        nama: nama.trim(),
        prodi_id: parseInt(prodi_id),
        angkatan: angkatan.trim(),
        foto: fotoPath
      }
    });
  } catch (error: any) {
    console.error('Error creating mahasiswa:', error);
    if (file) deleteFile(file.path);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal menambahkan mahasiswa'
    });
  }
};

// UPDATE
export const updateMahasiswa = async (req: Request, res: Response) => {
  const file = req.file;
  try {
    const idOrNim = req.params.id;
    const { nim, nama, prodi_id, angkatan } = req.body;

    // Fetch existing record
    const [existingRows]: any = await pool.query(
      'SELECT * FROM mahasiswa WHERE id = ? OR nim = ?',
      [idOrNim, idOrNim]
    );

    if (existingRows.length === 0) {
      if (file) deleteFile(file.path);
      return res.status(404).json({
        success: false,
        message: 'Mahasiswa tidak ditemukan'
      });
    }

    const currentM = existingRows[0];
    const mId = currentM.id;

    if (!nim || !nama || !prodi_id || !angkatan) {
      if (file) deleteFile(file.path);
      return res.status(400).json({
        success: false,
        message: 'NIM, nama, prodi_id, dan angkatan wajib diisi'
      });
    }

    // Check NIM collision
    const [nimCollisionRows]: any = await pool.query(
      'SELECT id FROM mahasiswa WHERE nim = ? AND id != ?',
      [nim.trim(), mId]
    );
    if (nimCollisionRows.length > 0) {
      if (file) deleteFile(file.path);
      return res.status(400).json({
        success: false,
        message: 'NIM sudah digunakan oleh mahasiswa lain'
      });
    }

    // Verify Prodi existence
    const [prodiRows]: any = await pool.query('SELECT id FROM prodi WHERE id = ?', [parseInt(prodi_id)]);
    if (prodiRows.length === 0) {
      if (file) deleteFile(file.path);
      return res.status(400).json({
        success: false,
        message: 'Program Studi tidak ditemukan'
      });
    }

    let fotoPath = currentM.foto;
    if (file) {
      // Delete old photo if it exists
      if (currentM.foto) {
        deleteFile(currentM.foto);
      }
      fotoPath = `uploads/mahasiswa/${file.filename}`;
    }

    await pool.query(
      'UPDATE mahasiswa SET nim = ?, nama = ?, prodi_id = ?, angkatan = ?, foto = ? WHERE id = ?',
      [nim.trim(), nama.trim(), parseInt(prodi_id), angkatan.trim(), fotoPath, mId]
    );

    return res.status(200).json({
      success: true,
      message: 'Mahasiswa berhasil diperbarui',
      data: {
        id: mId,
        nim: nim.trim(),
        nama: nama.trim(),
        prodi_id: parseInt(prodi_id),
        angkatan: angkatan.trim(),
        foto: fotoPath
      }
    });
  } catch (error: any) {
    console.error('Error updating mahasiswa:', error);
    if (file) deleteFile(file.path);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal memperbarui data mahasiswa'
    });
  }
};

// DELETE
export const deleteMahasiswa = async (req: Request, res: Response) => {
  try {
    const idOrNim = req.params.id;

    // Fetch existing record
    const [existingRows]: any = await pool.query(
      'SELECT * FROM mahasiswa WHERE id = ? OR nim = ?',
      [idOrNim, idOrNim]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mahasiswa tidak ditemukan'
      });
    }

    const currentM = existingRows[0];

    // Delete photo file if it exists
    if (currentM.foto) {
      deleteFile(currentM.foto);
    }

    await pool.query('DELETE FROM mahasiswa WHERE id = ?', [currentM.id]);

    return res.status(200).json({
      success: true,
      message: 'Mahasiswa berhasil dihapus'
    });
  } catch (error: any) {
    console.error('Error deleting mahasiswa:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal menghapus data mahasiswa'
    });
  }
};
