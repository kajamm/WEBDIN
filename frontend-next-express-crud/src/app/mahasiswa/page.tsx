// Halaman ini menggabungkan:
// - [Pertemuan 12 - Bagian 9, 10, 11] fetch data, tampilkan foto, search/filter/pagination
// - [Pertemuan 13] protected route: redirect ke /login kalau belum ada token
// - [Pertemuan 14 - Bagian 6] tombol Tambah/Edit/Hapus disembunyikan sesuai role
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMahasiswa,
  createMahasiswa,
  updateMahasiswa,
  deleteMahasiswa,
  getProdi,
  Mahasiswa,
  Prodi,
} from "../../lib/api";
import { getToken, getUser, logout } from "../../lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function MahasiswaPage() {
  const router = useRouter();

  const [mahasiswa, setMahasiswa] = useState<Mahasiswa[]>([]);
  const [prodi, setProdi] = useState<Prodi[]>([]);

  // [Pertemuan 12 - Bagian 11] state search, filter, pagination
  const [search, setSearch] = useState("");
  const [prodiId, setProdiId] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPage, setTotalPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Mahasiswa | null>(null);
  const [formData, setFormData] = useState({
    nim: "",
    nama: "",
    prodi_id: "",
    angkatan: "",
  });
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  // [Pertemuan 14 - Bagian 6] role dari user yang login menentukan tombol apa yang tampil
  const user = getUser();
  const role = user?.role;
  const canCreate = role === "admin" || role === "operator";
  const canEdit = role === "admin" || role === "operator";
  const canDelete = role === "admin";

  // [Pertemuan 13] Protected route di sisi frontend: kalau belum login, tendang ke /login
  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
    }
  }, [router]);

  const loadMahasiswa = async () => {
    try {
      const result = await getMahasiswa({
        search,
        prodi_id: prodiId,
        page,
        limit,
      });
      setMahasiswa(result.data);
      setTotalPage(result.meta.totalPage);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadProdi = async () => {
    const result = await getProdi();
    setProdi(result.data);
  };

  useEffect(() => {
    loadProdi();
  }, []);

  useEffect(() => {
    loadMahasiswa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    loadMahasiswa();
  };

  const openCreateForm = () => {
    setEditing(null);
    setFormData({ nim: "", nama: "", prodi_id: "", angkatan: "" });
    setFotoFile(null);
    setShowForm(true);
  };

  const openEditForm = (item: Mahasiswa) => {
    setEditing(item);
    setFormData({
      nim: item.nim,
      nama: item.nama,
      prodi_id: String(item.prodi_id),
      angkatan: String(item.angkatan),
    });
    setFotoFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const data = new FormData();
    data.append("nim", formData.nim);
    data.append("nama", formData.nama);
    data.append("prodi_id", formData.prodi_id);
    data.append("angkatan", formData.angkatan);
    if (fotoFile) data.append("foto", fotoFile);

    try {
      if (editing) {
        await updateMahasiswa(editing.id, data);
      } else {
        await createMahasiswa(data);
      }
      setShowForm(false);
      loadMahasiswa();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      await deleteMahasiswa(id);
      loadMahasiswa();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Data Mahasiswa</h1>
          <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Login sebagai: {user?.name} ({role})
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {role === "admin" && (
            <a href="/users" style={linkButtonStyle}>
              Kelola User
            </a>
          )}
          <button onClick={logout} style={secondaryButtonStyle}>
            Logout
          </button>
        </div>
      </div>

      {error && <p style={{ color: "#dc2626", marginBottom: 12 }}>{error}</p>}

      {/* [Pertemuan 12 - Bagian 11] Search, filter, pagination */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari NIM atau nama"
          style={{ ...inputStyle, maxWidth: 220 }}
        />

        <select
          value={prodiId}
          onChange={(e) => setProdiId(e.target.value)}
          style={{ ...inputStyle, maxWidth: 200 }}
        >
          <option value="">Semua Prodi</option>
          {prodi.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nama_prodi}
            </option>
          ))}
        </select>

        <button onClick={handleSearch} style={buttonStyle}>
          Cari
        </button>

        {/* [Pertemuan 14 - Bagian 6] tombol Tambah hanya untuk admin/operator */}
        {canCreate && (
          <button onClick={openCreateForm} style={{ ...buttonStyle, marginLeft: "auto" }}>
            + Tambah Mahasiswa
          </button>
        )}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
            <th style={thStyle}>Foto</th>
            <th style={thStyle}>NIM</th>
            <th style={thStyle}>Nama</th>
            <th style={thStyle}>Prodi</th>
            <th style={thStyle}>Angkatan</th>
            {(canEdit || canDelete) && <th style={thStyle}>Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {mahasiswa.map((item) => (
            <tr key={item.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={tdStyle}>
                {/* [Pertemuan 12 - Bagian 10] Menampilkan Foto di DataTable */}
                <img
                  src={
                    item.foto
                      ? `${BACKEND_URL}/uploads/mahasiswa/${item.foto}`
                      : "/avatar-placeholder.png"
                  }
                  alt={item.nama}
                  width={40}
                  height={40}
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
              </td>
              <td style={tdStyle}>{item.nim}</td>
              <td style={tdStyle}>{item.nama}</td>
              <td style={tdStyle}>{item.nama_prodi}</td>
              <td style={tdStyle}>{item.angkatan}</td>
              {(canEdit || canDelete) && (
                <td style={tdStyle}>
                  {canEdit && (
                    <button onClick={() => openEditForm(item)} style={smallButtonStyle}>
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ ...smallButtonStyle, background: "#dc2626" }}
                    >
                      Hapus
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
          {mahasiswa.length === 0 && (
            <tr>
              <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                Tidak ada data
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* [Pertemuan 12 - Bagian 11] Pagination */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={smallButtonStyle}>
          Previous
        </button>
        <span style={{ fontSize: "0.85rem" }}>
          Halaman {page} dari {totalPage}
        </span>
        <button
          disabled={page >= totalPage}
          onClick={() => setPage(page + 1)}
          style={smallButtonStyle}
        >
          Next
        </button>
      </div>

      {/* Form tambah/edit mahasiswa - hanya dirender kalau showForm true */}
      {showForm && (
        <div style={modalOverlayStyle}>
          <form onSubmit={handleSubmit} style={modalStyle}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>
              {editing ? "Edit Mahasiswa" : "Tambah Mahasiswa"}
            </h2>

            <label style={labelStyle}>NIM</label>
            <input
              required
              value={formData.nim}
              onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
              style={inputStyle}
            />

            <label style={labelStyle}>Nama</label>
            <input
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              style={inputStyle}
            />

            <label style={labelStyle}>Prodi</label>
            <select
              required
              value={formData.prodi_id}
              onChange={(e) => setFormData({ ...formData, prodi_id: e.target.value })}
              style={inputStyle}
            >
              <option value="">Pilih Prodi</option>
              {prodi.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama_prodi}
                </option>
              ))}
            </select>

            <label style={labelStyle}>Angkatan</label>
            <input
              required
              type="number"
              value={formData.angkatan}
              onChange={(e) => setFormData({ ...formData, angkatan: e.target.value })}
              style={inputStyle}
            />

            <label style={labelStyle}>Foto (JPG/PNG/WEBP, maks 2MB)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
              style={{ marginBottom: 16 }}
            />

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" style={buttonStyle}>
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={secondaryButtonStyle}
              >
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
};

const linkButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
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
