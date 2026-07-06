// [Pertemuan 13 - Bagian 10: Integrasi Frontend Login dan Logout]
// Catatan keamanan (dari materi): untuk latihan awal token boleh disimpan di
// localStorage. Untuk production, pertimbangkan HttpOnly Secure Cookie agar
// token tidak mudah diakses JavaScript saat terjadi XSS.

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "operator" | "viewer";
};

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}
