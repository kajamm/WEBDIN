import "./globals.css";

export const metadata = {
  title: "Sistem Data Mahasiswa - Modul 3",
  description: "Modul 3 WEBDIN: CRUD, Auth, Role, dan Manajemen User",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}