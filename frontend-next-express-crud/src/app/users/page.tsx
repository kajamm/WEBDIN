'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  resetUserPassword, 
  UserData 
} from '../../lib/api';
import { logout, getUser, getToken } from '../../lib/auth';

export default function UsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchKeyword, setSearchKeyword] = useState('');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'viewer',
    password: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset Password Modal State
  const [resetPwdResult, setResetPwdResult] = useState<{
    name: string;
    temporaryPassword: string;
  } | null>(null);

  // Auth checking
  useEffect(() => {
    setIsClient(true);
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      router.push('/login');
    } else if (user.role !== 'admin') {
      // Forbidden: Not an admin
      setCurrentUser(user);
      setLoading(false);
    } else {
      setCurrentUser(user);
      fetchUsersData();
    }
  }, [router]);

  const fetchUsersData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUsers();
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data user.');
      if (err.message?.includes('Token') || err.message?.includes('expired') || err.message?.includes('Unauthorized') || err.message?.includes('Akses ditolak')) {
        logout();
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'viewer',
      password: ''
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '' // PUT endpoint doesn't modify password
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const { name, email, role, password } = formData;

    if (!name || !email || !role || (!editingUser && !password)) {
      setFormError('Semua field wajib diisi');
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingUser) {
        // Edit User
        const res = await updateUser(editingUser.id!, { name, email, role });
        if (res.success) {
          setIsFormOpen(false);
          fetchUsersData();
        }
      } else {
        // Add User
        const res = await createUser({ name, email, role, password });
        if (res.success) {
          setIsFormOpen(false);
          fetchUsersData();
        }
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      setFormError(err.message || 'Gagal menyimpan data user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: UserData) => {
    if (!user.id) return;
    if (user.id === currentUser?.id) {
      alert('Anda tidak bisa menghapus akun Anda sendiri.');
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${user.name}" (${user.email})?`)) {
      return;
    }

    try {
      const res = await deleteUser(user.id);
      if (res.success) {
        fetchUsersData();
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert(`Gagal menghapus user: ${err.message}`);
    }
  };

  const handleResetPassword = async (user: UserData) => {
    if (!user.id) return;
    if (!confirm(`Apakah Anda yakin ingin mereset password untuk user "${user.name}"?`)) {
      return;
    }

    try {
      const res = await resetUserPassword(user.id);
      setResetPwdResult({
        name: user.name,
        temporaryPassword: res.temporaryPassword
      });
    } catch (err: any) {
      console.error('Error resetting password:', err);
      alert(`Gagal mereset password: ${err.message}`);
    }
  };

  const handleLogoutClick = () => {
    console.log('Logout button clicked');
    if (typeof window !== 'undefined') {
      const isConfirmed = window.confirm('Apakah Anda yakin ingin logout?');
      if (isConfirmed) {
        logout();
        router.push('/login');
      }
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const term = searchKeyword.toLowerCase().trim();
    if (!term) return true;
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Guard: if logged in but not admin
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-955 flex items-center justify-center p-6 text-slate-800 dark:text-slate-200">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 text-rose-500 dark:bg-rose-955/20 dark:text-rose-455 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold">Akses Ditolak (403)</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Halaman ini hanya dapat diakses oleh administrator. Anda masuk sebagai role <strong className="uppercase">{currentUser.role}</strong>.
          </p>
          <div className="pt-2 flex gap-3 justify-center">
            <button
              onClick={() => router.push('/mahasiswa')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
            >
              Kembali ke Mahasiswa
            </button>
            <button
              onClick={handleLogoutClick}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm font-semibold transition-all cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-955 p-6 md:p-10 font-sans text-slate-800 dark:text-slate-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              Kelola Akun User
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sistem manajemen hak akses (RBAC) dan keamanan pengguna.
            </p>
            {currentUser && (
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                Login sebagai: <strong className="text-slate-600 dark:text-slate-300">{currentUser.name}</strong> - <span className="uppercase text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 font-bold">{currentUser.role}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/mahasiswa')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl shadow-sm transition-all duration-200 focus:outline-none cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Kelola Mahasiswa
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Tambah User
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
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 left-3 flex items-center pl-1 text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Cari user berdasarkan nama atau email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:border-blue-500 focus:outline-none text-sm transition-all"
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 text-rose-500 dark:bg-rose-955/20 dark:text-rose-455 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Gagal Memuat Data</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto text-sm">{error}</p>
              <button
                onClick={fetchUsersData}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all"
              >
                Coba Lagi
              </button>
            </div>
          ) : loading ? (
            <div className="p-6 space-y-4">
              <div className="animate-pulse flex space-x-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
              </div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 py-3">
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Tidak Ada Data User</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                {searchKeyword ? 'Tidak ada data user yang sesuai dengan pencarian Anda.' : 'Silakan tambah user baru.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Terdaftar Pada</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold font-mono text-slate-400">
                        {item.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-350">
                        {item.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          item.role === 'admin' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/35 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : item.role === 'operator'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleResetPassword(item)}
                            className="inline-flex items-center justify-center px-2.5 py-1 text-xs bg-amber-50 hover:bg-amber-100 dark:bg-amber-955/20 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 rounded-lg transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(item)}
                            disabled={item.id === currentUser?.id}
                            className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-colors ${
                              item.id === currentUser?.id
                                ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                : 'text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer'
                            }`}
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
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingUser ? 'Perbarui Data User' : 'Tambah User Baru'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              {/* Form Error Alert */}
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/50 flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{formError}</p>
                </div>
              )}

              {/* Name Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama lengkap..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus:border-blue-550 focus:outline-none transition-all dark:text-white"
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nama@email.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus:border-blue-500 focus:outline-none transition-all dark:text-white"
                />
              </div>

              {/* Password Field (Only when creating) */}
              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimal 6 karakter..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus:border-blue-550 focus:outline-none transition-all dark:text-white"
                  />
                </div>
              )}

              {/* Role Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Role Akses
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus:border-blue-550 focus:outline-none transition-all dark:text-white"
                >
                  <option value="viewer">Viewer (Hanya Melihat)</option>
                  <option value="operator">Operator (Ubah Mahasiswa)</option>
                  <option value="admin">Admin (Akses Penuh)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-355 text-sm font-semibold rounded-xl transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Result Dialog */}
      {resetPwdResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 text-center space-y-4 transform transition-all">
            
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-955/20 dark:text-amber-400 shadow-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m-5-4v1a3 3 0 00-3 3v1M6 21h12a2 2 0 002-2V9a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Password Berhasil Direset
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Password sementara untuk user <strong>{resetPwdResult.name}</strong> telah berhasil dibuat.
              </p>
            </div>

            {/* Display Temporary Password box */}
            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl space-y-1">
              <span className="block text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                Password Sementara
              </span>
              <span className="block text-lg font-mono font-bold tracking-widest text-slate-800 dark:text-slate-200 select-all selection:bg-amber-100">
                {resetPwdResult.temporaryPassword}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-[10px] text-slate-500 text-left flex gap-2">
              <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>PENTING:</strong> Catat password ini sekarang. Informasi ini hanya ditampilkan satu kali saja dan tidak dapat diakses kembali.
              </span>
            </div>

            <button
              onClick={() => setResetPwdResult(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-md"
            >
              Saya Sudah Mencatatnya
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
