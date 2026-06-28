'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  getProdiList, 
  createMahasiswa, 
  updateMahasiswa, 
  Mahasiswa, 
  Prodi 
} from '@/lib/api';

interface MahasiswaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingMahasiswa: Mahasiswa | null;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function MahasiswaForm({
  isOpen,
  onClose,
  onSuccess,
  editingMahasiswa
}: MahasiswaFormProps) {
  const [nim, setNim] = useState('');
  const [nama, setNama] = useState('');
  const [prodiId, setProdiId] = useState<string>('');
  const [angkatan, setAngkatan] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prodiList, setProdiList] = useState<Prodi[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to build full image URL from backend static path
  const getFullImageUrl = (fotoPath: string) => {
    if (!fotoPath) return '';
    if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://') || fotoPath.startsWith('data:')) {
      return fotoPath;
    }
    const cleanPath = fotoPath.replace(/\\/g, '/');
    return `${BACKEND_URL}/${cleanPath.replace(/^\/?/, '')}`;
  };

  // Sync state with editingMahasiswa & Load Prodi list
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);

      // Fetch Prodi dynamically from backend for dropdown
      getProdiList()
        .then((res) => {
          if (res.success) {
            setProdiList(res.data || []);
          }
        })
        .catch((err) => {
          console.error('Gagal mengambil data prodi:', err);
        });

      if (editingMahasiswa) {
        setNim(editingMahasiswa.nim);
        setNama(editingMahasiswa.nama);
        setProdiId(editingMahasiswa.prodi_id.toString());
        setAngkatan(editingMahasiswa.angkatan || '');
        setFoto(null);
        setPreviewUrl(editingMahasiswa.foto ? getFullImageUrl(editingMahasiswa.foto) : null);
      } else {
        setNim('');
        setNama('');
        setProdiId('');
        setAngkatan('');
        setFoto(null);
        setPreviewUrl(null);
      }
    }
  }, [isOpen, editingMahasiswa]);

  // Clean up object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran file foto maksimal adalah 2MB');
      return;
    }

    // Check type limit
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('File harus berupa gambar (JPG, PNG, WebP)');
      return;
    }

    setErrorMsg(null);
    setFoto(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Simple validation
    if (!nim || !nama || !prodiId || !angkatan) {
      setErrorMsg('Semua field (NIM, Nama, Prodi, Angkatan) wajib diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('nim', nim.trim());
      formData.append('nama', nama.trim());
      formData.append('prodi_id', prodiId);
      formData.append('angkatan', angkatan.trim());
      if (foto) {
        formData.append('foto', foto);
      }

      const isEdit = !!editingMahasiswa;
      const id = editingMahasiswa?.id;

      if (isEdit && id) {
        await updateMahasiswa(id, formData);
      } else {
        await createMahasiswa(formData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat menghubungi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg overflow-hidden transition-all transform bg-white rounded-2xl shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 flex justify-between items-center text-white">
          <h3 className="text-lg font-semibold tracking-wide">
            {editingMahasiswa ? 'Edit Data Mahasiswa' : 'Tambah Mahasiswa Baru'}
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-white/80 hover:text-white transition-colors duration-200 focus:outline-none text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-sm rounded-r-lg dark:bg-rose-950/30 dark:text-rose-200">
              <span className="font-semibold">Gagal:</span> {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            {/* NIM Field */}
            <div>
              <label htmlFor="nim" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                NIM (Nomor Induk Mahasiswa)
              </label>
              <input
                id="nim"
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={isSubmitting}
                readOnly={!!editingMahasiswa}
                placeholder="Masukkan NIM (contoh: 0112523010)"
                className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800 dark:text-white ${
                  editingMahasiswa
                    ? 'bg-slate-100 dark:bg-slate-805 border-slate-200 dark:border-slate-700 cursor-not-allowed text-slate-500'
                    : 'border-slate-300 dark:border-slate-700 focus:border-blue-500'
                }`}
                required
              />
              {editingMahasiswa && (
                <p className="mt-1 text-xs text-slate-400">NIM tidak dapat diubah setelah disimpan.</p>
              )}
            </div>

            {/* Nama Field */}
            <div>
              <label htmlFor="nama" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Nama Lengkap
              </label>
              <input
                id="nama"
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                disabled={isSubmitting}
                placeholder="Masukkan nama lengkap"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800 dark:text-white text-sm focus:outline-none transition-all duration-200"
                required
              />
            </div>

            {/* Prodi Field */}
            <div>
              <label htmlFor="prodi" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Program Studi
              </label>
              <select
                id="prodi"
                value={prodiId}
                onChange={(e) => setProdiId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-855 dark:text-white text-sm focus:outline-none transition-all duration-200"
                required
              >
                <option value="" disabled>-- Pilih Program Studi --</option>
                {prodiList.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama_prodi}</option>
                ))}
              </select>
            </div>

            {/* Angkatan Field */}
            <div>
              <label htmlFor="angkatan" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Angkatan
              </label>
              <input
                id="angkatan"
                type="text"
                value={angkatan}
                onChange={(e) => setAngkatan(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={isSubmitting}
                placeholder="Masukkan tahun angkatan (contoh: 2023)"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800 dark:text-white text-sm focus:outline-none transition-all duration-200"
                required
              />
            </div>

            {/* Foto Upload Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Foto Mahasiswa
              </label>
              <div className="flex items-center gap-4 p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                {previewUrl ? (
                  <div className="relative w-20 h-20 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 flex-shrink-0 group">
                    <img 
                      src={previewUrl} 
                      alt="Preview Foto" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFoto(null);
                        setPreviewUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium text-xs cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isSubmitting}
                    className="hidden"
                    id="foto-upload"
                  />
                  <label
                    htmlFor="foto-upload"
                    className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-all focus:outline-none"
                  >
                    Pilih File Foto
                  </label>
                  <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                    Format: JPG, PNG, WebP (Maksimal 2MB).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-sm font-semibold rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-855 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 focus:outline-none"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg disabled:bg-blue-400 disabled:shadow-none transition-all duration-150 focus:outline-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Menyimpan...
                </>
              ) : (
                'Simpan Data'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
