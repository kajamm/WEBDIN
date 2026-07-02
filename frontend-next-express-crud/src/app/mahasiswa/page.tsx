'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MahasiswaForm from '../../components/MahasiswaForm';
import { 
  getMahasiswa, 
  deleteMahasiswa, 
  getProdiList, 
  Mahasiswa, 
  Prodi,
  MetaData
} from '../../lib/api';
import { logout, getUser, getToken } from '../../lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function MahasiswaPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  // Main Data States
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa[]>([]);
  const [prodiList, setProdiList] = useState<Prodi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter States
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProdiId, setSelectedProdiId] = useState('');

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit] = useState(8); // items per page
  const [meta, setMeta] = useState<MetaData>({
    page: 1,
    limit: 8,
    total: 0,
    totalPage: 1
  });

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMahasiswa, setEditingMahasiswa] = useState<Mahasiswa | null>(null);

  // Cek autentikasi di client-side
  useEffect(() => {
    setIsClient(true);
    const token = getToken();
    const currentUser = getUser();
    if (!token || !currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
    }
  }, [router]);

  // Load Program Studi dynamically from Express API
  const fetchProdiData = async () => {
    try {
      const res = await getProdiList();
      if (res.success) {
        setProdiList(res.data || []);
      }
    } catch (err: any) {
      console.error('Koneksi backend gagal saat memuat prodi:', err);
      if (err.message?.includes('Token') || err.message?.includes('expired') || err.message?.includes('Unauthorized') || err.message?.includes('Akses ditolak')) {
        logout();
        router.push('/login');
      }
    }
  };

  // Fetch Mahasiswa list using API Helper
  const fetchMahasiswaData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMahasiswa({
        page,
        limit,
        search: searchQuery,
        prodi_id: selectedProdiId
      });
      if (res.success) {
        setMahasiswa(res.data || []);
        if (res.meta) {
          setMeta(res.meta);
        }
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Terjadi kesalahan saat menghubungi backend API.');
      if (err.message?.includes('Token') || err.message?.includes('expired') || err.message?.includes('Unauthorized') || err.message?.includes('Akses ditolak')) {
        logout();
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load initial references hanya jika sudah terautentikasi
  useEffect(() => {
    if (getToken()) {
      fetchProdiData();
    }
  }, []);

  // Fetch student data on changes to page, searchQuery, selectedProdiId hanya jika sudah terautentikasi
  useEffect(() => {
    if (getToken()) {
      fetchMahasiswaData();
    }
  }, [page, searchQuery, selectedProdiId]);

  // Reset to first page when search keyword is cleared
  useEffect(() => {
    if (!searchKeyword) {
      setSearchQuery('');
      setPage(1);
    }
  }, [searchKeyword]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchKeyword);
    setPage(1);
  };

  // Handle Prodi Filter Change
  const handleProdiFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProdiId(e.target.value);
    setPage(1);
  };

  // Handle Edit Action
  const handleEditClick = (item: Mahasiswa) => {
    setEditingMahasiswa(item);
    setIsFormOpen(true);
  };

  // Handle Add Action
  const handleAddClick = () => {
    setEditingMahasiswa(null);
    setIsFormOpen(true);
  };

  // Handle Delete Action
  const handleDeleteClick = async (item: Mahasiswa) => {
    const id = item.id;
    if (!id) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus data mahasiswa "${item.nama}" (NIM: ${item.nim})?`)) {
      return;
    }

    try {
      const res = await deleteMahasiswa(id);
      if (res.success) {
        fetchMahasiswaData();
      }
    } catch (err: any) {
      console.error('Error deleting student:', err);
      alert(`Gagal Menghapus: ${err.message}`);
    }
  };

  // Helper to build full image URL from backend static path with placeholder fallback
  const getFullImageUrl = (fotoPath: string | null) => {
    if (!fotoPath) return '/avatar-placeholder.png';
    if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://') || fotoPath.startsWith('data:')) {
      return fotoPath;
    }
    const cleanPath = fotoPath.replace(/\\/g, '/');
    return `${BACKEND_URL}/${cleanPath.replace(/^\/?/, '')}`;
  };

  const handleLogoutClick = () => {
    if (typeof window !== 'undefined') {
      const isConfirmed = window.confirm('Apakah Anda yakin ingin logout?');
      if (isConfirmed) {
        logout();
        router.push('/login');
      }
    }
  };

  // Jangan render konten jika belum selesai check auth di client-side
  if (!isClient || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 font-sans text-slate-800 dark:text-slate-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              Kelola Data Mahasiswa
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sistem CRUD Next.js & Express.js untuk data Mahasiswa.
            </p>
            {user && (
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                Login sebagai: <strong className="text-slate-600 dark:text-slate-300">{user.name}</strong> ({user.email}) - <span className="uppercase text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 font-bold">{user.role}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && user.role === 'admin' && (
              <button
                onClick={() => router.push('/users')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl shadow-sm transition-all duration-200 focus:outline-none cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Kelola User
              </button>
            )}
            <button
              onClick={handleAddClick}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Mahasiswa
            </button>
            <button
              onClick={handleLogoutClick}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold rounded-xl border border-rose-100 dark:border-rose-900/30 transition-all duration-200 focus:outline-none cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013-3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="w-full md:max-w-md flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center pl-1 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Cari NIM atau Nama..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:border-blue-500 focus:outline-none text-sm transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-sm transition-all focus:outline-none"
            >
              Cari
            </button>
          </form>

          {/* Program Studi Filter */}
          <div className="w-full md:w-72 flex items-center gap-2">
            <label htmlFor="filter-prodi" className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Prodi:
            </label>
            <select
              id="filter-prodi"
              value={selectedProdiId}
              onChange={handleProdiFilterChange}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:border-blue-500 focus:outline-none transition-all"
            >
              <option value="">Semua Program Studi</option>
              {prodiList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama_prodi}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Section (Table, Loading, Error, Empty states) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Gagal Memuat Data</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto text-sm">{error}</p>
              <button
                onClick={fetchMahasiswaData}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all"
              >
                Coba Lagi
              </button>
            </div>
          ) : loading ? (
            /* Table Loading Skeletons */
            <div className="p-6 space-y-4">
              <div className="animate-pulse flex space-x-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 py-3">
                  <div className="rounded-full bg-slate-200 dark:bg-slate-800 h-10 w-10"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : mahasiswa.length === 0 ? (
            /* Empty Data State */
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Tidak Ada Data Mahasiswa</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                {searchQuery || selectedProdiId
                  ? 'Tidak ada data yang cocok dengan kriteria pencarian/filter Anda.'
                  : 'Silakan tambah data mahasiswa baru menggunakan tombol di atas.'}
              </p>
              {(searchQuery || selectedProdiId) && (
                <button
                  onClick={() => {
                    setSearchKeyword('');
                    setSearchQuery('');
                    setSelectedProdiId('');
                    setPage(1);
                  }}
                  className="mt-4 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            /* Table Data */
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Foto</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">NIM</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Lengkap</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Program Studi</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Angkatan</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mahasiswa.map((item) => (
                    <tr
                      key={item.nim}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors duration-150"
                    >
                      {/* Foto Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative w-10 h-10 overflow-hidden rounded-full border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                          <img
                            src={getFullImageUrl(item.foto)}
                            alt={item.nama}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/avatar-placeholder.png';
                            }}
                          />
                        </div>
                      </td>

                      {/* NIM Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold font-mono text-slate-600 dark:text-slate-300">
                        {item.nim}
                      </td>

                      {/* Nama Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {item.nama}
                      </td>

                      {/* Prodi Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-550/10 text-blue-700 dark:bg-blue-900/35 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                          {item.nama_prodi || 'Tidak Diketahui'}
                        </span>
                      </td>

                      {/* Angkatan Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-350">
                        {item.angkatan || '-'}
                      </td>

                      {/* Action Buttons Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="inline-flex items-center justify-center p-1.5 text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Navigation */}
          {!loading && !error && mahasiswa.length > 0 && (
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Halaman <span className="font-semibold text-slate-800 dark:text-slate-200">{page}</span> dari <span className="font-semibold text-slate-800 dark:text-slate-200">{meta.totalPage || 1}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1}
                  className="px-3.5 py-1.5 border border-slate-350 dark:border-slate-700 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, meta.totalPage))}
                  disabled={page >= meta.totalPage}
                  className="px-3.5 py-1.5 border border-slate-350 dark:border-slate-700 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reusable Form Modal */}
      <MahasiswaForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMahasiswa(null);
        }}
        onSuccess={fetchMahasiswaData}
        editingMahasiswa={editingMahasiswa}
      />
    </main>
  );
}
