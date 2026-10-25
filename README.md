# NadaRuang Backend

API backend berbasis Express ES Modules. Daftar lagu dan health check bersifat publik; data personal di endpoint lain memakai identitas `req.user.id` hasil verifikasi token Delcom.

## Persyaratan

- Node.js 20 atau lebih baru (sesuai `engines` di `package.json`)
- Bun (opsional; npm juga didukung)
- Akses jaringan ke Delcom Open API untuk autentikasi token

## Menjalankan secara lokal

```bash
cd backend
bun install
Copy-Item .env.example .env
bun run dev
```

Atur `FRONTEND_ORIGIN` jika frontend berjalan pada origin yang berbeda. Database SQLite dibuat otomatis di `backend/data/app.db`; migrasi tabel dijalankan saat startup, dan lagu beserta lirik di-seed dari `frontend/src/data/songs.js` jika tabel songs masih kosong.

## Deploy ke Render atau Railway

Atur root directory menjadi `backend`, gunakan Node.js 20 atau lebih baru, build/install dengan `npm install`, dan start dengan `npm start`. Layanan menetapkan `PORT`; endpoint health check adalah `GET /api/health`.

Set `FRONTEND_ORIGIN` ke satu origin frontend yang persis, misalnya `https://nama-site.netlify.app`, dan set `DELCOM_BASEURL` ke URL Delcom. Wildcard `*` ditolak; jika origin tidak dikonfigurasi, CORS lintas-origin dinonaktifkan.

SQLite memakai file lokal `backend/data/app.db`. Storage container pada paket gratis bisa ephemeral dan data dapat hilang saat redeploy/restart. Untuk beralih ke Neon atau Supabase PostgreSQL, buat database, atur `DATABASE_URL`, lalu migrasikan tabel, seed, query, dan uji endpoint. **Implementasi sekarang tidak dapat beralih dengan hanya mengubah `src/db.js`**: service menggunakan API sinkron `better-sqlite3` dan sintaks khusus SQLite, sehingga perlu kontrak database netral/asinkron sebelum perubahan satu-file aman dilakukan.

Untuk mode produksi:

```bash
bun start
```

## Endpoint

| Method | Path | Autentikasi | Keterangan |
|---|---|---|---|
| GET | `/api/health` | Tidak | Health check |
| GET | `/api/songs` | Tidak | Daftar lagu dan lirik |
| GET | `/api/songs/:id` | Tidak | Lagu dan lirik |
| GET | `/api/me` | Bearer token Delcom | Pengguna terverifikasi |
| GET, PUT, DELETE | `/api/favorites[/:songId]` | Bearer token Delcom | Favorit pengguna |
| GET, POST | `/api/playlists` | Bearer token Delcom | Daftar/buat playlist |
| PATCH, DELETE | `/api/playlists/:id` | Bearer token Delcom | Ubah/hapus playlist milik sendiri |
| POST, DELETE | `/api/playlists/:id/songs[/:songId]` | Bearer token Delcom | Kelola lagu playlist |
| GET, POST | `/api/recent` | Bearer token Delcom | Riwayat lima pemutaran terbaru |
| GET | `/api/stats` | Bearer token Delcom | Total dan tiga lagu teratas |
| POST | `/api/stats/play` | Bearer token Delcom | Tambah hitungan pemutaran |
| GET, POST, DELETE | `/api/search-history[/:id]` | Bearer token Delcom | Kelola riwayat pencarian |

Endpoint selain `/api/health` dan `/api/songs` pada ruang `/api` memakai middleware autentikasi. Middleware meneruskan token ke `GET {DELCOM_BASEURL}/users/me`, lalu menyimpan identitas terverifikasi pada `req.user`. Hasil verifikasi sukses di-cache dalam memori selama 60 detik. `user_id` dari body atau query ditolak; kepemilikan playlist diverifikasi server dan akses playlist pengguna lain membalas 404.

Contoh request lengkap tersedia di `backend/requests.http` (gunakan REST Client dan ganti nilai token).

## Environment

Salin `.env.example` ke `.env`, lalu sesuaikan `PORT`, `FRONTEND_ORIGIN`, dan `DELCOM_BASEURL`. Jangan commit file `.env`.
