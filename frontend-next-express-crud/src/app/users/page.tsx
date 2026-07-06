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
  const currentUser = getUser();

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer",
  });
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    // Proteksi UX: kalau bukan admin, jangan tampilkan halaman ini
    if (currentUser?.role !== "admin") {
      router.push("/mahasiswa");
      return;
    }
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
        await updateUserAccount(editing.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });
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

  // [Pertemuan 15 - Bagian 5 & 9] Reset password -> tampilkan temporary password sekali
  const handleResetPassword = async (id: number) => {
    try {
      const result = await resetUserPassword(id);
      setTempPassword(result.temporaryPassword);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Kelola User</h1>
          <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Khusus role admin</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/mahasiswa" style={secondaryButtonStyle}>
            ← Kembali ke Mahasiswa
          </a>
          <button onClick={openCreateForm} style={buttonStyle}>
            + Tambah User
          </button>
        </div>
      </div>

      {error && <p style={{ color: "#dc2626", marginBottom: 12 }}>{error}</p>}

      {/* [Pertemuan 15 - Prinsip keamanan] password baru ditampilkan sekali saja, bukan disimpan di UI */}
      {tempPassword && (
        <div
          style={{
            background: "#fefce8",
            border: "1px solid #fde047",
            padding: "0.75rem 1rem",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: "0.85rem",
          }}
        >
          Password sementara: <strong>{tempPassword}</strong> — catat sekarang,
          pesan ini tidak akan muncul lagi.{" "}
          <button
            onClick={() => setTempPassword(null)}
            style={{ marginLeft: 8, border: "none", background: "none", cursor: "pointer" }}
          >
            Tutup
          </button>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
            <th style={thStyle}>Nama</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Dibuat</th>
            <th style={thStyle}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users.map((item) => (
            <tr key={item.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={tdStyle}>{item.name}</td>
              <td style={tdStyle}>{item.email}</td>
              <td style={tdStyle}>{item.role}</td>
              <td style={tdStyle}>{new Date(item.created_at).toLocaleDateString("id-ID")}</td>
              <td style={tdStyle}>
                <button onClick={() => openEditForm(item)} style={smallButtonStyle}>
                  Edit
                </button>
                <button
                  onClick={() => handleResetPassword(item.id)}
                  style={{ ...smallButtonStyle, background: "#0891b2" }}
                >
                  Reset Password
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{ ...smallButtonStyle, background: "#dc2626" }}
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                Tidak ada data
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showForm && (
        <div style={modalOverlayStyle}>
          <form onSubmit={handleSubmit} style={modalStyle}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>
              {editing ? "Edit User" : "Tambah User"}
            </h2>

            <label style={labelStyle}>Nama</label>
            <input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
            />

            <label style={labelStyle}>Email</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle}
            />

            {!editing && (
              <>
                <label style={labelStyle}>Password</label>
                <input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={inputStyle}
                />
              </>
            )}

            <label style={labelStyle}>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={inputStyle}
            >
              <option value="admin">admin</option>
              <option value="operator">operator</option>
              <option value="viewer">viewer</option>
            </select>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="submit" style={buttonStyle}>
                Simpan
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={secondaryButtonStyle}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.7rem",
  marginTop: 4,
  marginBottom: 12,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: "0.85rem",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.78rem",
  fontWeight: 600,
};

const buttonStyle: React.CSSProperties = {
  padding: "0.55rem 1rem",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.85rem",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#e2e8f0",
  color: "#1e293b",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};

const smallButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  padding: "0.35rem 0.6rem",
  fontSize: "0.78rem",
  marginRight: 6,
};

const thStyle: React.CSSProperties = {
  padding: "0.6rem",
  fontWeight: 600,
  fontSize: "0.8rem",
};

const tdStyle: React.CSSProperties = {
  padding: "0.6rem",
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: "1.5rem",
  width: "100%",
  maxWidth: 420,
};
