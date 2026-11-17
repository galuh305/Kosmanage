# KosManage

Sistem manajemen rumah kos berbasis web. Calon penyewa bisa melihat kamar dan mengajukan pemesanan, owner mengelola kamar, pemesanan, pembayaran, dan keluhan, sedangkan tenant (penghuni) memantau kamar, tagihan, pembayaran, dan keluhan dari portal sendiri.

## Fitur

**Publik**
- Melihat daftar kamar, detail kamar (foto, tipe, harga, fasilitas), dan ketersediaannya
- Mengajukan pemesanan kamar tanpa harus punya akun

**Owner**
- Dashboard ringkasan: status kamar, pemesanan, pendapatan, dan grafik pendapatan bulanan
- Manajemen kamar, tipe kamar, dan fasilitas (termasuk upload foto kamar)
- Menyetujui atau menolak pemesanan. Saat disetujui, sistem otomatis membuat akun tenant, kontrak sewa, dan tagihan bulanan
- Verifikasi pembayaran transfer bank manual (lihat bukti transfer, setujui, atau tolak dengan alasan)
- Menangani keluhan/perbaikan dari tenant
- Meninjau pengajuan **perpanjangan sewa** dan **pindah lebih awal**

**Tenant**
- Aktivasi akun lewat token, lalu wajib mengganti password
- Melihat informasi kamar dan masa sewa
- Melihat tagihan dan mengunggah bukti transfer
- Mengajukan keluhan beserta foto
- Mengajukan perpanjangan sewa atau pindah/berhenti lebih awal
- Pengaturan akun (ganti password)

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Backend | Node.js, [Hono](https://hono.dev), TypeScript |
| Database | MySQL/MariaDB lewat [Prisma ORM](https://www.prisma.io) (adapter `@prisma/adapter-mariadb`) |
| Autentikasi | JWT (`jose`), password di-hash dengan `bcryptjs` |
| Frontend | React, TypeScript, Vite, React Router, Tailwind CSS, `lucide-react` |

> Arsip project yang saya terima tidak berisi `package.json`, jadi daftar teknologi di atas disimpulkan dari kode (`import` yang dipakai). Sesuaikan jika ada perbedaan.

## Struktur Folder

```
kos/
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Skema database
│   │   └── migrations/            # Riwayat migrasi
│   ├── uploads/                   # File upload (foto kamar, bukti transfer, foto keluhan)
│   └── src/
│       ├── index.ts               # Entry point server (port 3000)
│       ├── routes/                # Definisi endpoint
│       ├── controllers/           # Validasi request dan format response
│       ├── services/              # Logika bisnis
│       ├── middleware/            # Autentikasi dan pengecekan role
│       ├── lib/                   # Prisma client, JWT, upload
│       ├── scripts/create-owner.ts# Skrip membuat akun owner pertama
│       └── generated/prisma/      # Prisma Client hasil generate
└── Frontend/
    └── src/
        ├── pages/
        │   ├── public/            # Home, detail kamar, form pemesanan
        │   ├── owner/             # Halaman owner
        │   └── tenant/            # Halaman tenant
        ├── components/            # Layout dan komponen
        ├── services/              # Pemanggilan API
        ├── routes/                # Routing dan proteksi halaman per role
        └── config/api.ts          # URL API
```

## Menjalankan Secara Lokal

### Prasyarat
- Node.js 20 atau lebih baru
- MySQL atau MariaDB yang berjalan di `localhost:3306`, dengan database bernama `kosmanage`

### 1. Backend

```bash
cd Backend
npm install
```

Buat file `.env` di folder `Backend`:

```env
JWT_SECRET=isi_dengan_string_acak_yang_panjang
DB_USER=root
DB_PASSWORD=
OWNER_PASSWORD=minimal_8_karakter
```

| Variabel | Keterangan |
| --- | --- |
| `JWT_SECRET` | **Wajib.** Server tidak akan berjalan tanpa ini |
| `DB_USER`, `DB_PASSWORD` | Kredensial database. Default: `root` dan kosong |
| `OWNER_PASSWORD` | Hanya dipakai skrip pembuatan akun owner (minimal 8 karakter) |

Host (`localhost`), port (`3306`), dan nama database (`kosmanage`) saat ini ditulis langsung di `src/lib/prisma.ts`.

Terapkan migrasi dan generate Prisma Client:

```bash
npx prisma migrate deploy
npx prisma generate
```

> Koneksi untuk Prisma CLI diatur di konfigurasi Prisma milik Anda (mis. `prisma.config.ts` atau `.env`), yang tidak ada di arsip project.

Buat akun owner pertama (`owner@kosmanage.com`) dengan menjalankan `src/scripts/create-owner.ts`, misalnya:

```bash
npx tsx src/scripts/create-owner.ts
```

Jalankan server (sesuaikan dengan script di `package.json` Anda, misalnya `npm run dev`). Server berjalan di **http://localhost:3000**.

### 2. Frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend berjalan di **http://localhost:5173**. Alamat ini juga yang diizinkan oleh CORS di backend (`src/index.ts`).

Secara default frontend memanggil `http://localhost:3000/api`. Untuk mengubahnya, buat `Frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Rekening bank

Nomor rekening tujuan transfer yang tampil di halaman pembayaran tenant ada di `Frontend/src/data/bankAccounts.ts`. Nilai bawaannya masih placeholder, **ganti dengan rekening asli sebelum dipakai**.

## Alur Utama

### Pemesanan sampai menjadi tenant

1. Calon penyewa mengisi form pemesanan (status `PENDING`).
2. Owner menyetujui pemesanan. Sistem otomatis:
   - membuat akun tenant (jika email belum terdaftar) beserta **token aktivasi**,
   - membuat kontrak sewa (`Lease`),
   - membuat tagihan bulanan sepanjang masa sewa,
   - mengubah status kamar menjadi `RESERVED` atau `OCCUPIED`.
3. Owner menyalin token aktivasi dari halaman Pemesanan dan memberikannya kepada tenant. Token berlaku 24 jam.
4. Tenant membuka halaman `/activate`, mengaktifkan akun, dan mengganti password.

### Pembayaran (transfer manual)

1. Tenant mengunggah bukti transfer (JPG/PNG/WebP, maksimal 5 MB) untuk sebuah tagihan.
2. Owner memeriksa bukti dan menyetujui atau menolak. Jika disetujui, tagihan menjadi `PAID`. Jika ditolak, tenant bisa mengunggah ulang.

### Perpanjangan sewa

1. Tenant mengajukan perpanjangan 1–12 bulan. Pengajuan bisa dibuat mulai **30 hari sebelum** sewa berakhir sampai **7 hari sesudahnya**.
2. Owner menyetujui. Sistem membuat satu tagihan (harga bulanan × jumlah bulan).
3. Setelah pembayaran tagihan itu disetujui owner, tanggal berakhir sewa otomatis bergeser.
4. Sistem menolak pengajuan jika kamar sudah dipesan pihak lain pada periode perpanjangan.

### Pindah / berhenti lebih awal

1. Tenant mengajukan tanggal pindah (harus sebelum akhir sewa) dan alasan.
2. Owner menyetujui dan boleh mengubah tanggal pindah, serta mencatat nominal pengembalian dan potongan.
3. Tanggal berakhir sewa dimajukan ke tanggal pindah, tagihan belum dibayar setelah tanggal itu dibatalkan, dan kamar kembali tersedia. Pada tanggal pindah, sewa berstatus `TERMINATED`.
4. Nominal pengembalian dan potongan hanya **dicatat**. Transfer pengembalian dilakukan manual oleh owner.

### Sinkronisasi otomatis

Saat server menyala dan setiap 60 detik, backend:
- menutup sewa yang sudah berakhir (`COMPLETED`) setelah masa tenggang perpanjangan,
- menyelesaikan pindah lebih awal yang tanggalnya sudah tiba (`TERMINATED`),
- menyesuaikan status kamar (`AVAILABLE`, `RESERVED`, `OCCUPIED`). Kamar berstatus `MAINTENANCE` tidak diubah.

## Status Data

| Entitas | Status |
| --- | --- |
| Kamar | `AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE` |
| Pemesanan | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| Sewa | `ACTIVE`, `COMPLETED`, `CANCELLED`, `TERMINATED` |
| Tagihan | `UNPAID`, `PAID`, `OVERDUE`, `CANCELLED` |
| Pembayaran | `PENDING_VERIFICATION`, `APPROVED`, `REJECTED` |
| Keluhan | `PENDING`, `PROCESSING`, `COMPLETED`, `REJECTED` |
| Perpanjangan / Pindah | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED` |

## Ringkasan API

Semua endpoint berawalan `/api`. Endpoint yang membutuhkan login memakai header `Authorization: Bearer <token>`. Response berisi `pesan` dan (jika ada) `data`.

| Area | Endpoint | Akses |
| --- | --- | --- |
| Auth | `POST /auth/login`, `POST /auth/register`, `POST /auth/activate` | Publik |
| | `GET /auth/me`, `PATCH /auth/change-password` | Login (ganti password: tenant) |
| Kamar | `GET /rooms`, `GET /rooms/:id` | Publik |
| | `POST /rooms`, `PATCH /rooms/:id`, `PATCH /rooms/:id/status`, `PUT /rooms/:id/facilities` | Owner |
| Tipe kamar | `GET /room-types` / `POST /room-types` | Publik / Owner |
| Fasilitas | `GET /facilities` / `POST /facilities` | Publik / Owner |
| Pemesanan | `POST /bookings` | Publik |
| | `GET /bookings`, `GET /bookings/:id`, `PATCH /bookings/:id/status` | Owner |
| Tenant | `GET /tenant/dashboard`, `GET /tenant/invoices` | Tenant |
| Pembayaran | `POST /payments` | Tenant |
| | `GET /payments`, `GET /payments/:id/proof`, `PATCH /payments/:id/approve`, `PATCH /payments/:id/reject` | Owner |
| Keluhan | `POST /maintenance`, `GET /maintenance/tenant` | Tenant |
| | `GET /maintenance`, `PATCH /maintenance/:id/status` | Owner |
| Sewa | `POST /leases/:leaseId/extensions`, `POST /leases/:leaseId/terminations` | Tenant |
| | `PATCH /leases/extensions/:id/cancel`, `PATCH /leases/terminations/:id/cancel` | Tenant |
| | `GET /leases/requests` | Owner |
| | `PATCH /leases/extensions/:id/approve` dan `/reject` | Owner |
| | `PATCH /leases/terminations/:id/approve` dan `/reject` | Owner |
| Dashboard | `GET /dashboard` | Owner |

File upload dilayani statis dari `/uploads/*`. Bukti transfer tidak dibuka langsung, melainkan lewat endpoint owner `GET /payments/:id/proof`.

## Catatan Pengembangan

- **Model data:** satu `Booking` yang disetujui menghasilkan satu `Lease`. Satu `Lease` punya banyak `Invoice`, `LeaseExtension`, `LeaseTermination`, dan `MaintenanceRequest`.
- **Zona waktu:** perhitungan tanggal sewa memakai UTC. Helper-nya ada di `Backend/src/services/lease-dates.ts`.
- **Aturan perpanjangan** (30 hari sebelum, 7 hari sesudah, maksimal 12 bulan) ada di `lease-dates.ts`. Nilai yang sama juga ditulis di `Frontend/src/components/tenant/LeaseActions.tsx`, jadi ubah di kedua tempat.
- **Pembayaran** saat ini hanya transfer bank manual. Tabel `PaymentNotification` sudah ada di skema untuk integrasi payment gateway di masa depan, tetapi belum dipakai.
- **Belum ada:** halaman pengaturan owner (menu sudah ada di sidebar, rutenya belum), pengiriman email aktivasi (token masih diserahkan manual oleh owner), dan deposit.
