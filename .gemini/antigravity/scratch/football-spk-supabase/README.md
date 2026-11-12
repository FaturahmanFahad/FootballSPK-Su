# ⚽ SPK Football — Sistem Pendukung Keputusan Pemilihan Pemain Utama

> **Metode:** Simple Additive Weighting (SAW) + Rank Order Centroid (ROC)  
> **Stack:** Node.js + Express.js (Backend) · HTML + Tailwind CSS + Vanilla JS (Frontend) · Supabase PostgreSQL (Database)

---

## 📁 Struktur Proyek

```
football-spk-supabase/
├── backend/
│   ├── config/
│   │   └── supabase.js          ← Koneksi Supabase (service role)
│   ├── database/
│   │   ├── schema.sql            ← DDL tabel + seed kriteria C1–C9
│   │   └── seed.js              ← Script seeder (users, players, evaluations)
│   ├── middleware/
│   │   └── auth.js              ← JWT verifyToken + requireRole RBAC
│   ├── routes/
│   │   ├── auth.js              ← POST /login, GET /me
│   │   ├── players.js           ← CRUD pemain + filter eligibility
│   │   ├── criteria.js          ← GET kriteria, PUT urutan ROC
│   │   ├── evaluations.js       ← GET/POST/DELETE evaluasi pemain
│   │   └── spk.js               ← Engine ROC + SAW → GET /calculate
│   ├── .env                     ← Credentials (JANGAN di-commit!)
│   ├── .env.example             ← Template .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js                ← Entry point Express, port 5000
│
└── frontend/
    ├── index.html               ← Halaman Login
    ├── dashboard.html           ← Dashboard + tabel pemain
    ├── players.html             ← CRUD Data Pemain (modal)
    ├── evaluations.html         ← Input Evaluasi + drag-drop ROC
    ├── results.html             ← Hasil SPK (ROC table, SAW matrix, ranking)
    └── js/
        ├── api.js               ← Fetch wrapper, toast, BASE_URL
        ├── auth.js              ← Login check, logout, nav highlight
        ├── dashboard.js         ← Statistik + tabel pemain
        ├── players.js           ← CRUD form & modal
        ├── evaluations.js       ← Drag-drop ROC + input evaluasi
        └── results.js           ← Render tabel ROC, matriks, ranking
```

---

## 🔧 Prasyarat

| Tools | Versi Minimal |
|-------|--------------|
| Node.js | v18+ |
| npm | v9+ |
| Akun Supabase | Free tier cukup |
| VS Code + Live Server | Untuk buka frontend |

---

## 🚀 Setup Langkah demi Langkah

### LANGKAH 1 — Setup Database di Supabase

1. Buka [https://supabase.com](https://supabase.com) dan **Sign In / Sign Up**
2. Klik **"New Project"**, isi nama dan password database
3. Tunggu project selesai dibuat (~1–2 menit)
4. Buka menu **SQL Editor** (ikon di sidebar kiri)
5. Klik **"New Query"**
6. Buka file `backend/database/schema.sql`, **copy seluruh isinya**
7. **Paste** ke SQL Editor, lalu klik **"Run"** (atau Ctrl+Enter)
8. Verifikasi: buka menu **Table Editor** — pastikan ada tabel `users`, `players`, `criteria`, `evaluations`, `weights`

### LANGKAH 2 — Dapatkan Supabase Credentials

1. Di dashboard Supabase, buka **Settings → API**
2. Copy **Project URL** (format: `https://xxxx.supabase.co`)
3. Copy **`service_role`** secret key (**BUKAN `anon` key!**)

### LANGKAH 3 — Setup Backend

Buka terminal, jalankan perintah berikut satu per satu:

```powershell
# 1. Masuk ke folder backend
cd C:\Users\COMPUTER\.gemini\antigravity\scratch\football-spk-supabase\backend

# 2. Install dependencies
npm install

# 3. Edit file .env — ISI dengan credentials Supabase Anda
#    Buka backend/.env dengan text editor, ganti:
#    SUPABASE_URL=https://GANTI_DENGAN_PROJECT_URL_ANDA.supabase.co
#    SUPABASE_SERVICE_KEY=GANTI_DENGAN_SERVICE_ROLE_KEY_ANDA

# 4. Jalankan seeder (tambah user & data dummy)
node database/seed.js

# 5. Jalankan server backend
npm run dev
```

> ✅ Server berjalan di **http://localhost:5000**  
> Anda akan melihat: `🚀 Server SPK Football berjalan di port 5000`

### LANGKAH 4 — Buka Frontend

**Cara 1: VS Code Live Server (Direkomendasikan)**
1. Buka VS Code
2. Buka folder `frontend/` sebagai workspace
3. Klik kanan `index.html` → **"Open with Live Server"**
4. Browser otomatis terbuka di `http://127.0.0.1:5500/index.html`

**Cara 2: Buka langsung di browser**
```
Buka Windows Explorer → navigasi ke frontend/ → double-click index.html
```
> ⚠️ Jika buka langsung (file://), beberapa browser memblokir fetch ke localhost. Gunakan Live Server.

---

## 🔐 Akun Login Default

| Username | Password | Role | Hak Akses |
|----------|----------|------|-----------|
| `admin` | `admin123` | Administrator | Full access: CRUD pemain, bobot, hitung SPK |
| `pelatih` | `pelatih123` | Pelatih | Edit pemain, input evaluasi, bobot ROC |
| `asisten` | `asisten123` | Asisten Pelatih | View only + input evaluasi |

---

## 📡 API Endpoint Backend

Base URL: `http://localhost:5000`

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/auth/login` | ❌ | Login, dapat JWT token |
| GET | `/api/auth/me` | ✅ | Info user saat ini |
| GET | `/api/players` | ✅ | List pemain (filter: position, status, search) |
| GET | `/api/players/:id` | ✅ | Detail 1 pemain |
| POST | `/api/players` | ✅ Admin/Pelatih | Tambah pemain baru |
| PUT | `/api/players/:id` | ✅ Admin/Pelatih | Update pemain |
| DELETE | `/api/players/:id` | ✅ Admin only | Hapus pemain |
| GET | `/api/criteria` | ✅ | List kriteria (urut roc_rank) |
| PUT | `/api/criteria/weights` | ✅ Admin/Pelatih | Update urutan ROC |
| GET | `/api/evaluations/player/:id` | ✅ | Evaluasi 1 pemain |
| POST | `/api/evaluations/bulk` | ✅ Admin/Pelatih | Simpan/update evaluasi (upsert) |
| DELETE | `/api/evaluations/player/:id` | ✅ Admin | Hapus evaluasi pemain |
| GET | `/api/spk/calculate?season=2024/2025` | ✅ | Hitung ROC+SAW, kembalikan ranking |

---

## 🧮 Algoritma yang Digunakan

### Rank Order Centroid (ROC)
Bobot kriteria dihitung berdasarkan urutan prioritas:

$$w_k = \frac{1}{n} \sum_{i=k}^{n} \frac{1}{i}$$

Dimana:
- `n` = jumlah kriteria
- `k` = rank prioritas kriteria (1 = tertinggi)

### Simple Additive Weighting (SAW)
**1. Normalisasi:**
- **Benefit:** `r_ij = x_ij / max(x_j)`
- **Cost:** `r_ij = min(x_j) / x_ij`

**2. Skor akhir:**

$$V_i = \sum_{j=1}^{n} w_j \cdot r_{ij}$$

Pemain dengan `V_i` tertinggi masuk **Starting XI** (11 besar).

---

## 🎯 Alur Penggunaan Aplikasi

```
1. Login      →  Masuk dengan akun admin/pelatih/asisten
2. Dashboard  →  Lihat ringkasan data pemain & statistik
3. Data Pemain →  Kelola daftar pemain (tambah/edit/hapus + status)
4. Input Evaluasi:
   a. Panel kiri  → Drag-drop urutan kriteria untuk bobot ROC
   b. Panel kanan → Pilih pemain, isi nilai per kriteria, simpan
5. Hasil SPK  →  Klik "Hitung SPK" → lihat bobot, matriks, peringkat
```

---

## 🔧 Kriteria Penilaian (C1–C9)

| Kode | Nama Kriteria | Dimensi | Atribut | Satuan |
|------|--------------|---------|---------|--------|
| C1 | Jumlah Gol | Teknis | Benefit | Gol |
| C2 | Jumlah Assist | Teknis | Benefit | Assist |
| C3 | Akurasi Passing | Teknis | Benefit | % |
| C4 | Tekel Sukses | Teknis | Benefit | Tekel |
| C5 | Jarak Lari Per Match | Fisik | Benefit | Km |
| C6 | Jumlah Pelanggaran | Taktis | Cost | Pelanggaran |
| C7 | Kartu Kuning | Taktis | Cost | Kartu |
| C8 | Kartu Merah | Taktis | Cost | Kartu |
| C9 | Tingkat Kebugaran Fisik | Fisik | Benefit | % |

---

## 🛠️ Troubleshooting

### ❌ "Koneksi ke server gagal. Pastikan backend berjalan di port 5000."
→ Backend belum dijalankan. Pastikan `npm run dev` sudah berjalan di terminal.

### ❌ "Invalid API key" atau error Supabase di terminal backend
→ Periksa `backend/.env`:
- `SUPABASE_URL` harus format `https://xxxx.supabase.co`
- `SUPABASE_SERVICE_KEY` harus **service_role** key (bukan anon key)

### ❌ Tabel tidak ditemukan / "relation does not exist"
→ Belum menjalankan `schema.sql` di Supabase SQL Editor. Ulangi **Langkah 1**.

### ❌ Seed gagal: "duplicate key value violates unique constraint"
→ Data sudah ada. Hapus dulu via Supabase Table Editor, atau edit seed.js menjadi upsert.

### ❌ Login gagal meski username/password benar
→ Seed belum dijalankan. Jalankan: `node database/seed.js`

### ❌ CORS error di browser console
→ Pastikan `CORS_ORIGIN=*` di `.env`, dan backend sudah direstart setelah edit `.env`.

### ❌ "Tidak ada pemain eligible" saat Hitung SPK
→ Pastikan ada pemain dengan status **"Aktif"** dan sudah diinput evaluasinya untuk musim yang dipilih.

---

## 📝 Catatan Keamanan

> ⚠️ Proyek ini dibuat untuk **keperluan akademik/demo**. Untuk production:
> - Ganti `JWT_SECRET` dengan string random yang kuat (min. 32 karakter)
> - Jangan gunakan `CORS_ORIGIN=*` — batasi ke domain frontend
> - Aktifkan Row Level Security (RLS) di Supabase
> - Jangan expose `service_role` key di frontend

---

## 👨‍💻 Teknologi

| Kategori | Library/Tool | Versi |
|---------|-------------|-------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.18 |
| Database | Supabase (PostgreSQL) | v2 |
| Auth | jsonwebtoken + bcryptjs | - |
| Dev Server | nodemon | 3.x |
| Frontend CSS | Tailwind CSS CDN | 3.x |
| Frontend JS | Vanilla ES6+ | - |
| Font | Google Fonts (Inter) | - |
