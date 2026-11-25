# CARISAJI — Pencari Restoran Cepat Saji Kota Pangkalpinang

## 1. Persiapan Database di Laragon (MySQL / MariaDB)
1. Buka **Laragon** dan klik **Start All** (pastikan layanan MySQL/MariaDB berjalan di port `3306`).
2. Buka **Database** (HeidiSQL) atau **phpMyAdmin** (`http://localhost/phpmyadmin`).
3. Impor file **`database/carisaji.sql`** (file ini otomatis membuat database `carisaji`, seluruh tabel, 12 restoran Pangkalpinang, 69 menu, 24 ulasan, 5 akun, dan 3 contoh pesanan).

## 2. Menjalankan di VS Code

### Cara A — 1 Terminal (Langsung dari Root Folder)
```bash
npm install
npm run dev
```
Buka browser di **`http://localhost:3000`**.

### Cara B — 2 Terminal Terpisah (`backend/` + `frontend/`)
Terminal 1 (Backend Express + MySQL):
```bash
cd backend
npm install
npm run dev
```
Terminal 2 (Frontend React + Vite):
```bash
cd frontend
npm install
npm run dev
```
Buka browser di **`http://localhost:5173`**.

## 3. Akun Contoh (Sudah Tersedia di `database/carisaji.sql`)
- **Admin (Pengelola Data)**: `admin@carisaji.id` / `admin123`
- **Pengguna**: `rizky.pkp@gmail.com` / `user123`
