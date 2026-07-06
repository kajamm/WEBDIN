"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAuth, getToken } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.push("/mahasiswa");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Login gagal");
        return;
      }

      saveAuth(result.token, result.user);
      router.push("/mahasiswa");
    } catch (err) {
      setError("Terjadi kesalahan jaringan atau server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="center-page">
      <form onSubmit={handleLogin} className="card login-card">
        <p className="eyebrow">Sistem Akademik</p>
        <h1 className="heading-lg">Masuk ke Akun</h1>
        <p className="subtitle" style={{ marginBottom: "1.75rem" }}>
          Kelola data mahasiswa, prodi, dan pengguna kampus.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label className="field-label">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@kampus.ac.id"
            className="field-input"
          />
        </div>

        <div className="field">
          <label className="field-label">Kata Sandi</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="field-input"
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </main>
  );
}