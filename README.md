# Del-FraudShield AI — Deployable Revision

Del-FraudShield AI adalah platform deteksi dini penipuan digital untuk membantu pengguna memeriksa tautan, menganalisis pesan atau screenshot, bertanya kepada asisten keamanan, serta menemukan rujukan bantuan yang relevan. Versi ini sudah direvisi agar lebih layak dipresentasikan dan disiapkan untuk deployment: tampilan pengguna tidak lagi memakai bahasa teknis yang membingungkan, dashboard dibuat personal per akun, nama pengguna dibuat unik, admin monitor dipisahkan dari tampilan pengguna, dan direktori rujukan bantuan diperluas.



## Konfigurasi Environment Aktif

Paket ini sudah menyertakan dua file environment aktif sehingga pengguna pemula tidak perlu menyalin `file environment template lama` lagi. File pertama adalah `.env.local` di root proyek untuk frontend Next.js. File kedua adalah `backend/.env` untuk layanan backend Python. Jangan mengubah nama kedua file tersebut, dan pastikan Windows tidak menambahkan ekstensi tersembunyi seperti `.txt`.

Nilai lokal yang sudah aktif meliputi `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `PYTHON_BACKEND_URL`, `DATABASE_URL`, `ALLOWED_ORIGINS`, dan `ADMIN_EMAILS`. Nilai yang tetap harus Anda isi sendiri adalah `VIRUSTOTAL_API_KEY` untuk reputasi URL nyata dan `GEMINI_API_KEY` untuk chatbot serta analisis screenshot berbasis AI nyata. `GOOGLE_PLACES_API_KEY` bersifat opsional karena sistem tetap dapat menampilkan direktori bantuan internal dan tautan Maps tanpa key tersebut.

Setelah mengubah `backend/.env`, backend wajib direstart dengan `Ctrl + C`, lalu jalankan ulang `uvicorn app.main:app --reload --app-dir backend`. Setelah mengubah `.env.local`, frontend juga wajib direstart dengan `Ctrl + C`, lalu jalankan ulang `npm run dev`. Status konfigurasi dapat dicek melalui `http://127.0.0.1:8000/health`; target minimal untuk fitur utama adalah `virustotal_configured:true` dan `gemini_configured:true`.

## 1. Ringkasan revisi utama

Perubahan utama pada versi ini adalah pemisahan yang lebih jelas antara pengalaman pengguna, admin, dan konfigurasi sistem. Pengguna umum hanya melihat dashboard pribadi, cek link, analisis pesan/screenshot, asisten keamanan, rujukan bantuan, dan metodologi. Menu Admin Monitor dan Scam Mapping disembunyikan dari pengguna biasa dan hanya dapat diakses oleh akun yang emailnya terdaftar sebagai admin melalui `ADMIN_EMAILS`.

Dashboard pengguna kini bersifat personal. Setiap akun memiliki riwayat analisis dan riwayat chat masing-masing berdasarkan email pengguna. Nama pengguna juga dibuat unik: jika satu nama sudah dipakai oleh akun lain, sistem akan menolak penggunaan nama tersebut untuk mencegah duplikasi dan pencampuran data.

Fitur screenshot pada halaman analisis pesan sudah diperbaiki. Ketika pengguna memilih gambar kedua, preview dan file yang dianalisis akan berganti ke gambar terbaru. Keterangan tambahan pada screenshot bersifat opsional; sistem tetap dapat menganalisis gambar dari file yang diunggah selama layanan AI sudah dikonfigurasi.

Hub Rujukan Bantuan diubah menjadi fitur rujukan, bukan wadah pelaporan. Hasil diurutkan berdasarkan jarak terdekat jika pengguna mengaktifkan lokasi. Jika tidak, sistem tetap menampilkan rujukan nasional dan direktori bantuan. Halaman ini juga menyediakan peta berbasis OpenStreetMap dan tombol buka maps untuk setiap layanan.

## 2. Struktur proyek

```text
.
├── app/                    # Halaman dan API route Next.js
├── backend/                # Layanan inti FastAPI
│   ├── app/                # Model database, schema, pipeline, service finder
│   ├── requirements.txt    # Dependensi Python
│   └── .env.local        # Template environment backend
├── components/             # Komponen UI
├── lib/                    # Helper auth dan komunikasi backend
├── types/                  # Type augmentation NextAuth
├── .env.local            # Template environment frontend
├── package.json
├── package-lock.json
└── README.md
```

Hanya ada satu file dokumentasi utama, yaitu `README.md`, agar struktur file lebih bersih dan siap dipresentasikan.

## 3. Environment frontend

Buat file `.env.local` di root proyek, sejajar dengan `package.json`.

Windows PowerShell:

```powershell
Copy-Item .env.local .env.local
```

Command Prompt:

```cmd
copy .env.local .env.local
```

Mac/Linux/Git Bash:

```bash
cp .env.local .env.local
```

Isi minimal `.env.local`:

```env
NEXTAUTH_SECRET="ganti-dengan-secret-minimum-32-karakter"
NEXTAUTH_URL="http://localhost:3000"
PYTHON_BACKEND_URL="http://127.0.0.1:8000"
ADMIN_EMAILS="admin@fraudshield.local"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

`NEXTAUTH_SECRET` wajib diisi untuk login. Nilainya harus panjang dan acak saat deployment. Untuk lokal, gunakan string minimal 32 karakter. `ADMIN_EMAILS` menentukan email yang dapat membuka `/admin` dan `/trends`. Jika lebih dari satu admin, pisahkan dengan koma, misalnya:

```env
ADMIN_EMAILS="admin@fraudshield.local,dosen@kampus.ac.id"
```

## 4. Environment backend

Buat file `backend/.env` dari template.

Windows PowerShell:

```powershell
Copy-Item backend\.env.local backend\.env
```

Command Prompt:

```cmd
copy backend\.env.local backend\.env
```

Mac/Linux/Git Bash:

```bash
cp backend/.env backend/.env
```

Isi minimal `backend/.env`:

```env
DATABASE_URL=sqlite:///./fraudshield.db
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ADMIN_EMAILS=admin@fraudshield.local

VIRUSTOTAL_API_KEY=
VIRUSTOTAL_POLL_ATTEMPTS=3
VIRUSTOTAL_POLL_SECONDS=2

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

GOOGLE_PLACES_API_KEY=
GOOGLE_PLACES_RADIUS_METERS=25000
```

Untuk pengembangan awal, `DATABASE_URL=sqlite:///./fraudshield.db` sudah cukup. File database akan dibuat otomatis. Untuk deployment produksi, disarankan memakai PostgreSQL dan mengganti `DATABASE_URL` ke koneksi database produksi.

`VIRUSTOTAL_API_KEY` diperlukan agar cek link dapat membaca reputasi eksternal. `GEMINI_API_KEY` diperlukan untuk chatbot dan pembacaan screenshot. `GOOGLE_PLACES_API_KEY` opsional; tanpa key ini, Hub Rujukan tetap berjalan memakai direktori internal dan peta OpenStreetMap.

## 5. Menjalankan proyek secara lokal

Jalankan backend terlebih dahulu di terminal pertama.

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Mac/Linux/Git Bash:

```bash
source .venv/bin/activate
```

Instal dependensi backend:

```bash
pip install -r backend/requirements.txt
```

Jalankan layanan inti:

```bash
uvicorn app.main:app --reload --app-dir backend
```

Cek status:

```text
http://127.0.0.1:8000/health
```

Target minimal:

```json
{
  "status": "ok",
  "service": "fraudshield-core-service",
  "version": "3.0.0"
}
```

Kemudian jalankan frontend di terminal kedua.

```bash
npm install
npm run dev
```

Buka:

```text
http://localhost:3000
```

## 6. Alur login dan akun unik

Pengguna masuk melalui halaman `/login` dengan nama pengguna dan email. Saat login pertama, sistem menyimpan identitas ke database. Jika nama pengguna sudah dipakai oleh email lain, login ditolak agar tidak terjadi duplikasi identitas. Jika email yang sama login kembali, sistem akan membaca riwayat akun yang sama.

Untuk membuat akun admin lokal, gunakan email yang sama dengan `ADMIN_EMAILS`. Contoh jika environment berisi:

```env
ADMIN_EMAILS=admin@fraudshield.local
```

Maka login dengan email berikut akan mendapat menu admin:

```text
admin@fraudshield.local
```

Pengguna biasa tidak melihat menu Admin Monitor dan Scam Mapping. Jika mencoba membuka URL admin secara langsung, akses akan ditolak oleh middleware.

## 7. Fitur pengguna

Halaman `/dashboard` berisi edukasi singkat, akses cepat, statistik pribadi, riwayat analisis, dan riwayat chat milik akun yang sedang login. Data tidak dicampur antar pengguna.

Halaman `/checker` digunakan untuk memeriksa tautan. Tampilan pengguna tidak menyebut detail teknis yang tidak perlu. Pengguna cukup menempelkan link dan membaca skor risiko, alasan deteksi, serta rekomendasi.

Halaman `/analyzer` digunakan untuk menganalisis teks atau screenshot. Pada mode screenshot, pengguna dapat mengunggah gambar dan menambahkan keterangan opsional. File kedua yang dipilih akan menggantikan file pertama, sehingga hasil analisis tidak tertahan pada gambar lama.

Halaman `/chatbot` digunakan untuk bertanya tentang pesan, link, atau kronologi mencurigakan. Output tidak menampilkan nama provider AI kepada pengguna agar pengalaman tetap natural dan tidak membingungkan.

Halaman `/report` adalah Hub Rujukan Bantuan. Fitur ini tidak menerima laporan resmi. Sistem hanya mengarahkan pengguna ke kanal bantuan yang relevan, menampilkan jarak bila lokasi aktif, menyediakan peta, dan memberi tombol untuk membuka maps.

## 8. Fitur admin

Halaman `/admin` menampilkan ringkasan operasional seluruh analisis dan chat. Halaman ini hanya untuk admin.

Halaman `/trends` menampilkan mapping kasus dari database. Halaman ini juga hanya untuk admin agar pengguna umum tidak melihat data operasional sistem.

Admin dapat mengambil export JSON langsung dari layanan inti melalui endpoint backend `/admin/export-json` bila diperlukan untuk evaluasi internal.

## 9. Catatan deployment

Untuk deployment produksi, pisahkan frontend dan backend. Frontend dapat ditempatkan di Vercel atau server Node.js. Backend dapat ditempatkan di VPS, Railway, Render, Fly.io, atau layanan container lain. Setelah backend memiliki domain publik, ubah `PYTHON_BACKEND_URL` pada environment frontend ke alamat backend produksi.

Contoh:

```env
PYTHON_BACKEND_URL="https://api.domain-anda.com"
```

Pada backend, ubah `ALLOWED_ORIGINS` agar hanya menerima domain frontend produksi.

Contoh:

```env
ALLOWED_ORIGINS=https://domain-anda.com
```

Untuk produksi, gunakan database yang persisten seperti PostgreSQL. SQLite cukup untuk pengembangan lokal, tetapi tidak ideal untuk sistem multi-user produksi dengan trafik tinggi.

## 10. Checklist sebelum presentasi

Pastikan dua terminal aktif saat demo lokal:

```text
Terminal 1: uvicorn app.main:app --reload --app-dir backend
Terminal 2: npm run dev
```

Pastikan file berikut sudah dibuat:

```text
.env.local
backend/.env
```

Pastikan login pengguna biasa dan admin diuji dengan email berbeda. Pastikan satu nama pengguna tidak dapat dipakai oleh dua email berbeda. Pastikan `/admin` dan `/trends` hanya muncul untuk akun admin. Pastikan `/dashboard` menampilkan riwayat yang berbeda untuk pengguna berbeda. Pastikan mode screenshot dapat mengganti gambar ketika file kedua dipilih. Pastikan Hub Rujukan menampilkan peta dan mengurutkan layanan berdasarkan jarak saat lokasi diaktifkan.

## 11. Validasi teknis sebelum deployment

Sebelum deployment, jalankan pemeriksaan berikut pada mesin lokal atau server build:

```bash
python -m compileall -q backend/app
npx tsc --noEmit
npm run build
```

Jika ketiganya berhasil, lanjutkan deployment. Jika `npm run build` gagal karena environment variable belum tersedia, pastikan `.env.local` atau environment server sudah memuat `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `PYTHON_BACKEND_URL`, dan `ADMIN_EMAILS`."# Del-FraudShield-AI" 
