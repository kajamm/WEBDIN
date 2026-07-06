# Modul 3 WEBDIN — Penguatan CRUD, Auth, Role, dan Manajemen User (versi Prisma)

Project ini adalah versi **Prisma** dari Modul 3 (Pertemuan 12-15). Setiap
bagian kode diberi komentar `// [Pertemuan X - Bagian Y]` yang mengacu ke
materi, plus catatan "versi Prisma" di bagian yang tadinya raw SQL (mysql2).

## Struktur

```
backend-express-crud/       -> Express.js + TypeScript + Prisma
  prisma/schema.prisma       -> Model Prodi, Mahasiswa, User, PasswordResetToken
  prisma/seed.ts             -> Seed data prodi + akun uji admin/operator/viewer
frontend-next-express-crud/ -> Next.js (App Router) — TIDAK berubah dari versi
                                sebelumnya, karena frontend hanya konsumsi REST
                                API, tidak peduli backend-nya pakai Prisma atau
                                mysql2 langsung.
```

## Kenapa Prisma di sini beda dari SQL manual?

| Sebelumnya (mysql2) | Sekarang (Prisma) |
|---|---|
| `db.query("SELECT * FROM users WHERE email = ?", [email])` | `prisma.user.findUnique({ where: { email } })` |
| `JOIN prodi p ON m.prodi_id = p.id` manual | `include: { prodi: true }` otomatis |
| `sql/schema.sql` dijalankan manual | `npx prisma migrate dev` men-generate & apply migration otomatis |
| Nama kolom bebas (snake_case di query) | Model pakai camelCase (`namaProdi`, `prodiId`), tapi di-`@map` ke kolom snake_case di database, dan controller di-map balik ke snake_case saat response JSON supaya frontend tidak perlu diubah |

## Cara Menjalankan

### 1. Backend

```bash
cd backend-express-crud
npm install
copy .env.example .env      # Windows (atau: cp .env.example .env)
```

Edit `.env`, sesuaikan `DATABASE_URL` dengan kredensial MySQL/XAMPP kamu:
```
DATABASE_URL="mysql://root:@localhost:3306/db_kampus"
```
(Buat database `db_kampus` dulu di phpMyAdmin kalau belum ada — kosong saja,
Prisma yang akan bikin semua tabelnya lewat migrate.)

Generate & apply migration (ini otomatis membuat semua tabel dari
`prisma/schema.prisma`):
```bash
npx prisma migrate dev --name init
```

Isi data awal (prodi + 3 akun uji):
```bash
npm run seed
```

Jalankan server:
```bash
npm run dev
```

Backend berjalan di `http://localhost:3000`.

**Akun uji setelah seed:**
| Role | Email | Password |
|---|---|---|
| admin | admin@kampus.ac.id | admin123 |
| operator | operator@kampus.ac.id | operator123 |
| viewer | viewer@kampus.ac.id | viewer123 |

### 2. Frontend

```bash
cd frontend-next-express-crud
npm install
copy .env.local.example .env.local
npm run dev
```

Frontend berjalan di `http://localhost:3001`.

## Catatan Kompatibilitas MariaDB (XAMPP)

Kalau kamu pernah mengalami error `JSON_ARRAYAGG does not exist` atau drift
aneh di Prisma Studio/migrate sebelumnya (biasa terjadi di XAMPP + Prisma 7),
`package.json` project ini sudah dikunci ke **Prisma v6.19.3**, versi yang
lebih stabil dengan MariaDB bawaan XAMPP.

## Testing Role (Pertemuan 14)

1. **admin** → semua fitur (tambah/edit/hapus mahasiswa, kelola user)
2. **operator** → bisa tambah & edit mahasiswa, tombol Hapus tidak muncul,
   dan backend membalas 403 kalau endpoint DELETE dipaksa lewat Postman
3. **viewer** → hanya bisa melihat data

## Troubleshooting

- **`Cannot find module '@prisma/client'`** → jalankan `npx prisma generate`
- **Error drift saat `migrate dev`** → kalau database masih kosong/baru, coba
  drop database lewat phpMyAdmin, buat ulang kosong, lalu `migrate dev` lagi
- **401 Unauthorized terus** → cek token belum expired dan header
  `Authorization: Bearer <token>` terkirim
- **403 Forbidden sebagai operator/viewer saat hapus data** → ini perilaku
  yang benar sesuai matriks role Pertemuan 14, bukan bug
