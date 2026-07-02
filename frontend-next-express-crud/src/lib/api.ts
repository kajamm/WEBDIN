import { getToken } from './auth';

export interface Mahasiswa {
  id?: number;
  nim: string;
  nama: string;
  prodi_id: number;
  nama_prodi?: string;
  angkatan: string;
  foto: string | null;
}

export interface Prodi {
  id: number;
  nama_prodi: string;
  created_at?: string;
}

export interface MetaData {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: MetaData;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Helper untuk menambahkan header Authorization
function getAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function getMahasiswa(params: {
  search?: string;
  prodi_id?: string | number;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<Mahasiswa[]>> {
  const urlParams = new URLSearchParams();
  if (params.page) urlParams.append('page', params.page.toString());
  if (params.limit) urlParams.append('limit', params.limit.toString());
  if (params.search?.trim()) urlParams.append('search', params.search.trim());
  if (params.prodi_id) urlParams.append('prodi_id', params.prodi_id.toString());

  const response = await fetch(`${BACKEND_URL}/api/mahasiswa?${urlParams.toString()}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal memuat data mahasiswa dari server');
  }
  return response.json();
}

export async function createMahasiswa(formData: FormData): Promise<ApiResponse<Mahasiswa>> {
  const response = await fetch(`${BACKEND_URL}/api/mahasiswa`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal menambahkan data mahasiswa');
  }
  return response.json();
}

export async function updateMahasiswa(id: number | string, formData: FormData): Promise<ApiResponse<Mahasiswa>> {
  const response = await fetch(`${BACKEND_URL}/api/mahasiswa/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal memperbarui data mahasiswa');
  }
  return response.json();
}

export async function deleteMahasiswa(id: number | string): Promise<ApiResponse<null>> {
  const response = await fetch(`${BACKEND_URL}/api/mahasiswa/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal menghapus data mahasiswa');
  }
  return response.json();
}

export async function getProdiList(): Promise<ApiResponse<Prodi[]>> {
  const response = await fetch(`${BACKEND_URL}/api/prodi`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal memuat data program studi');
  }
  return response.json();
}

export interface UserData {
  id?: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

export async function getUsers(): Promise<ApiResponse<UserData[]>> {
  const response = await fetch(`${BACKEND_URL}/api/users`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal memuat data user dari server');
  }
  return response.json();
}

export async function createUser(data: Omit<UserData, 'id' | 'created_at'> & { password?: string }): Promise<ApiResponse<UserData>> {
  const response = await fetch(`${BACKEND_URL}/api/users`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal menambahkan user');
  }
  return response.json();
}

export async function updateUser(id: number | string, data: Omit<UserData, 'id' | 'created_at'>): Promise<ApiResponse<UserData>> {
  const response = await fetch(`${BACKEND_URL}/api/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal memperbarui user');
  }
  return response.json();
}

export async function deleteUser(id: number | string): Promise<ApiResponse<null>> {
  const response = await fetch(`${BACKEND_URL}/api/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal menghapus user');
  }
  return response.json();
}

export async function resetUserPassword(id: number | string): Promise<{ message: string; temporaryPassword: string }> {
  const response = await fetch(`${BACKEND_URL}/api/users/${id}/reset-password`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal mereset password');
  }
  return response.json();
}

