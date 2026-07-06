// [Pertemuan 15 - Bagian 9: Frontend Halaman CRUD User]
// Halaman ini hanya boleh diakses admin. Backend juga sudah membatasi lewat
// authMiddleware + allowRoles("admin") di user.route.ts, jadi ini lapisan UX
// kedua saja (bukan satu-satunya proteksi).
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getUsers,
  createUserAccount,
  updateUserAccount,
  deleteUserAccount,
  resetUserPassword,
  UserAccount,
} from "../../lib/api";
import { getToken, getUser } from "../../lib/auth";

export default function UsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getUser>>(null);

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "viewer" });
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    if (currentUser?.role !== "admin") { router.push("/mahasiswa"); return; }
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = async () => {
    try {
      const result = await getUsers();
      setUsers(result.data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openCreateForm = () => {
    setEditing(null);
    setFormData({ name: "", email: "", password: "", role: "viewer" });
    setShowForm(true);
  };

  const openEditForm = (item: UserAccount) => {
    setEditing(item);
    setFormData({ name: item.name, email: item.email, password: "", role: item.role });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await updateUserAccount(editing.id, { name: formData.name, email: formData.email, role: formData.role });
      } else {
        await createUserAccount(formData);
      }
      setShowForm(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus user ini?")) return;
    try {
      await deleteUserAccount(id);
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (id: number) => {
    try {
      const result = await resetUserPassword(id);
      setTempPassword(result.temporaryPassword);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="page">
      <div className="page-content">
        <div className="topbar">
          <div>
            <p className="eyebrow">Administrasi</p>
            <h1 className="heading-lg">Kelola User</h1>
            <p className="subtitle">Khusus role admin</p>
          </div>
          <div className="topbar-actions">
            <a href="/mahasiswa" className="btn btn-secondary">← Kembali</a>
            <button onClick={openCreateForm} className="btn btn-primary" style={{ width: "auto" }}>
              + Tambah User
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {tempPassword && (
          <div className="alert alert-note">
            Password sementara: <strong>{tempPassword}</strong> — catat sekarang, pesan ini tidak akan muncul lagi.{" "}
            <button onClick={() => setTempPassword(null)} className="btn btn-sm btn-secondary" style={{ marginLeft: 8 }}>
              Tutup
            </button>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Dibuat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td><span className={`badge badge-${item.role}`}>{item.role}</span></td>
                  <td>{new Date(item.created_at).toLocaleDateString("id-ID")}</td>
                  <td>
                    <button onClick={() => openEditForm(item)} className="btn btn-secondary btn-sm" style={{ marginRight: 6 }}>Edit</button>
                    <button onClick={() => handleResetPassword(item.id)} className="btn btn-secondary btn-sm" style={{ marginRight: 6 }}>Reset Password</button>
                    <button onClick={() => handleDelete(item.id)} className="btn btn-danger btn-sm">Hapus</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="empty-row">Tidak ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="modal-overlay">
            <form onSubmit={handleSubmit} className="modal">
              <h2 className="heading-lg" style={{ fontSize: "1.2rem", marginBottom: "1.1rem" }}>
                {editing ? "Edit User" : "Tambah User"}
              </h2>

              <div className="field">
                <label className="field-label">Nama</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="field-input" />
              </div>

              <div className="field">
                <label className="field-label">Email</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="field-input" />
              </div>

              {!editing && (
                <div className="field">
                  <label className="field-label">Password</label>
                  <input required type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="field-input" />
                </div>
              )}

              <div className="field">
                <label className="field-label">Role</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="field-input">
                  <option value="admin">admin</option>
                  <option value="operator">operator</option>
                  <option value="viewer">viewer</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ width: "auto" }}>Simpan</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}