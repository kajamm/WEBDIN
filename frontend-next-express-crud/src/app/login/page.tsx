// [Pertemuan 13 - Bagian 11: Halaman Login Next.js]
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

  // Kalau sudah login, langsung redirect ke halaman mahasiswa
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

      // [Pertemuan 13 - Bagian 10] simpan token & user ke localStorage
      saveAuth(result.token, result.user);
      router.push("/mahasiswa");
    } catch (err) {
      setError("Terjadi kesalahan jaringan atau server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f1f5f9",
        padding: "1rem",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#fff",
          padding: "2rem",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 4 }}>
          Login
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 20 }}>
          Sistem Data Mahasiswa, Prodi &amp; User
        </p>

        {error && (
          <p
            style={{
              color: "#dc2626",
              background: "#fef2f2",
              padding: "0.5rem 0.75rem",
              borderRadius: 8,
              fontSize: "0.85rem",
              marginBottom: 16,
            }}
          >
            {error}
          </p>
        )}

        <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@kampus.ac.id"
          style={inputStyle}
        />

        <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="********"
          style={inputStyle}
        />

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  marginTop: 6,
  marginBottom: 16,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: "0.9rem",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.7rem",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};
