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

  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const role = user?.role;

  useEffect(() => {
    setUser(getUser());
  }, []);
  const canCreate = role === "admin" || role === "operator";
  const canEdit = role === "admin" || role === "operator";
  const canDelete = role === "admin";

  useEffect(() => {
    if (!getToken()) router.push("/login");
  }, [router]);

  const loadMahasiswa = async () => {
    try {
      const result = await getMahasiswa({ search, prodi_id: prodiId, page, limit });
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
    <main className="page">
      <div className="page-content">
        <div className="topbar">
          <div>
            <p className="eyebrow">Data Akademik</p>
            <h1 className="heading-lg">Data Mahasiswa</h1>
            <p className="subtitle">
              {user?.name} · <span className={`badge badge-${role}`}>{role}</span>
            </p>
          </div>
          <div className="topbar-actions">
            {role === "admin" && (
              <a href="/users" className="btn btn-secondary">Kelola User</a>
            )}
            <button onClick={logout} className="btn btn-secondary">Logout</button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="toolbar">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari NIM atau nama"
            className="field-input"
          />
          <select
            value={prodiId}
            onChange={(e) => setProdiId(e.target.value)}
            className="field-input"
          >
            <option value="">Semua Prodi</option>
            {prodi.map((item) => (
              <option key={item.id} value={item.id}>{item.nama_prodi}</option>
            ))}
          </select>
          <button onClick={handleSearch} className="btn btn-secondary">Cari</button>
          {canCreate && (
            <button onClick={openCreateForm} className="btn btn-primary" style={{ marginLeft: "auto", width: "auto" }}>
              + Tambah Mahasiswa
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Foto</th>
                <th>NIM</th>
                <th>Nama</th>
                <th>Prodi</th>
                <th>Angkatan</th>
                {(canEdit || canDelete) && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {mahasiswa.map((item) => (
                <tr key={item.id}>
                  <td>
                    <img
                      src={item.foto ? `${BACKEND_URL}/uploads/mahasiswa/${item.foto}` : "/avatar-placeholder.png"}
                      alt={item.nama}
                      width={36}
                      height={36}
                      className="avatar"
                    />
                  </td>
                  <td>{item.nim}</td>
                  <td>{item.nama}</td>
                  <td>{item.nama_prodi}</td>
                  <td>{item.angkatan}</td>
                  {(canEdit || canDelete) && (
                    <td>
                      {canEdit && (
                        <button onClick={() => openEditForm(item)} className="btn btn-secondary btn-sm" style={{ marginRight: 6 }}>
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(item.id)} className="btn btn-danger btn-sm">
                          Hapus
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {mahasiswa.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">Tidak ada data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-secondary btn-sm">
            Previous
          </button>
          <span>Halaman {page} dari {totalPage}</span>
          <button disabled={page >= totalPage} onClick={() => setPage(page + 1)} className="btn btn-secondary btn-sm">
            Next
          </button>
        </div>

        {showForm && (
          <div className="modal-overlay">
            <form onSubmit={handleSubmit} className="modal">
              <h2 className="heading-lg" style={{ fontSize: "1.2rem", marginBottom: "1.1rem" }}>
                {editing ? "Edit Mahasiswa" : "Tambah Mahasiswa"}
              </h2>

              <div className="field">
                <label className="field-label">NIM</label>
                <input required value={formData.nim} onChange={(e) => setFormData({ ...formData, nim: e.target.value })} className="field-input" />
              </div>

              <div className="field">
                <label className="field-label">Nama</label>
                <input required value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="field-input" />
              </div>

              <div className="field">
                <label className="field-label">Prodi</label>
                <select required value={formData.prodi_id} onChange={(e) => setFormData({ ...formData, prodi_id: e.target.value })} className="field-input">
                  <option value="">Pilih Prodi</option>
                  {prodi.map((item) => (
                    <option key={item.id} value={item.id}>{item.nama_prodi}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label">Angkatan</label>
                <input required type="number" value={formData.angkatan} onChange={(e) => setFormData({ ...formData, angkatan: e.target.value })} className="field-input" />
              </div>

              <div className="field">
                <label className="field-label">Foto (JPG/PNG/WEBP, maks 2MB)</label>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFotoFile(e.target.files?.[0] || null)} />
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