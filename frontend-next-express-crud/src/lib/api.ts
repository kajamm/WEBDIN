// [Pertemuan 12 - Bagian 9: Integrasi Frontend Next.js: Helper API]
// + [Pertemuan 13 - Bagian 10] semua request protected disisipi header
//   Authorization: Bearer <token>
// + [Pertemuan 15 - Bagian 9] helper untuk CRUD user (khusus admin)
import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------- MAHASISWA ----------------

export type Mahasiswa = {
  id: number;
  nim: string;
  nama: string;
  prodi_id: number;
  nama_prodi: string;
  angkatan: number;
  foto?: string | null;
};

export async function getMahasiswa(params: {
  search?: string;
  prodi_id?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();

  if (params.search) query.set("search", params.search);
  if (params.prodi_id) query.set("prodi_id", params.prodi_id);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const response = await fetch(`${API_URL}/mahasiswa?${query.toString()}`, {
    headers: { ...authHeaders() },
  });
  const result = await response.json();

  if (!response.ok) throw new Error(result.message);
  return result;
}

export async function createMahasiswa(formData: FormData) {
  const response = await fetch(`${API_URL}/mahasiswa`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.message);
  return result;
}

export async function updateMahasiswa(id: number, formData: FormData) {
  const response = await fetch(`${API_URL}/mahasiswa/${id}`, {
    method: "PUT",
    headers: { ...authHeaders() },
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.message);
  return result;
}

export async function deleteMahasiswa(id: number) {
  const response = await fetch(`${API_URL}/mahasiswa/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.message);
  return result;
}

// ---------------- PRODI ----------------

export type Prodi = {
  id: number;
  nama_prodi: string;
};

export async function getProdi(): Promise<{ data: Prodi[] }> {
  const response = await fetch(`${API_URL}/prodi`, {
    headers: { ...authHeaders() },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message);
  return result;
}

// ---------------- USERS (khusus admin) ----------------
// [Pertemuan 15 - Bagian 9: Frontend Halaman CRUD User]

export type UserAccount = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "operator" | "viewer";
  created_at: string;
};

export async function getUsers(): Promise<{ data: UserAccount[] }> {
  const response = await fetch(`${API_URL}/users`, {
    headers: { ...authHeaders() },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message);
  return result;
}

export async function createUserAccount(payload: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message);
  return result;
}

export async function updateUserAccount(
  id: number,
  payload: { name: string; email: string; role: string }
) {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message);
  return result;
}

export async function deleteUserAccount(id: number) {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message);
  return result;
}

// [Pertemuan 15 - Bagian 5 & 9] Reset password oleh admin
export async function resetUserPassword(id: number) {
  const response = await fetch(`${API_URL}/users/${id}/reset-password`, {
    method: "PATCH",
    headers: { ...authHeaders() },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message);
  return result;
}
