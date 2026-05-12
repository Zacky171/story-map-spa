# Story Map Backend

Backend Node.js + Express untuk Story Map SPA dengan **PostgreSQL (Neon)** database. Menyediakan REST API yang kompatibel dengan struktur Dicoding Story API, plus Admin Panel.

## 🗄️ Database

Aplikasi ini menggunakan **PostgreSQL** yang di-host di **Neon** (serverless PostgreSQL). Data sebelumnya menggunakan JSON files, sekarang sudah di-migrate ke database production-ready.

## Struktur

```
backend/
├── admin/              # Admin panel (HTML/CSS/JS statis)
│   ├── index.html
│   ├── admin.css
│   └── admin.js
├── data/               # JSON backup (tidak digunakan lagi)
│   ├── users.json
│   ├── stories.json
│   └── subscriptions.json
├── src/
│   ├── server.js       # Entry point Express
│   ├── config.js       # Konfigurasi (PORT, JWT_SECRET)
│   ├── db.js           # PostgreSQL connection pool
│   ├── init-db.js      # Database initialization & migration
│   ├── middleware/
│   │   └── auth.js     # JWT auth & admin middleware
│   └── routes/
│       ├── auth.js     # POST /login, POST /register
│       ├── stories.js  # CRUD /stories
│       ├── admin.js    # Admin CRUD /admin/*
│       └── notifications.js  # Push subscribe
├── uploads/            # Foto yang diupload (auto-created)
├── .env                # Environment variables (JANGAN COMMIT!)
├── .env.example        # Template environment variables
├── package.json
└── API_DOCS.md         # Dokumentasi lengkap API
```

## 🚀 Setup & Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` ke `.env` dan isi dengan credentials Anda:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d
PORT=3001
```

**Cara dapat DATABASE_URL dari Neon:**
1. Login ke https://console.neon.tech
2. Create New Project (atau gunakan existing)
3. Copy **Connection String** dari dashboard
4. Paste ke `.env`

### 3. Initialize Database

Jalankan script untuk create tables dan migrate data:

```bash
npm run init-db
```

Script ini akan:
- ✅ Create tables (users, stories, subscriptions)
- ✅ Create indexes untuk performa
- ✅ Migrate data dari JSON files (jika ada)
- ✅ Tampilkan summary data

### 4. Start Server

**Development (auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server: `http://localhost:3001`  
Admin Panel: `http://localhost:3001/admin`  
API: `http://localhost:3001/v1`

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Stories Table
```sql
CREATE TABLE stories (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,
  lat DECIMAL(10, 8),
  lon DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Akun Demo

| Role  | Email                  | Password |
|-------|------------------------|----------|
| Admin | admin@storymap.com     | password |
| User  | budi@example.com       | password |
| User  | siti@example.com       | password |
| User  | andi@example.com       | password |

## 🌐 Deploy ke Railway

### 1. Push Code ke Git

```bash
git add .
git commit -m "Migrate to PostgreSQL (Neon)"
git push
```

### 2. Set Environment Variables di Railway

Buka Railway dashboard → Variables → Tambahkan:

```
DATABASE_URL=postgresql://... (dari Neon)
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
PORT=3001
```

### 3. Deploy

Railway akan auto-deploy. Setelah deploy, jalankan init database:

```bash
railway run npm run init-db
```

Atau via Railway CLI di local:
```bash
railway link
railway run npm run init-db
```

## Menghubungkan ke Frontend

Edit `src/scripts/config.js`:
```js
export const API_BASE = 'http://localhost:3001/v1';
// atau production:
export const API_BASE = 'https://your-app.railway.app/v1';
```

Lalu jalankan frontend di terminal terpisah:
```bash
npm run dev
```

## Fitur Admin Panel

- Login dengan akun admin
- Dashboard dengan statistik (total users, stories, dll)
- CRUD Users (tambah, edit, hapus, set role admin)
- Lihat & hapus semua Stories
- Peta interaktif (Leaflet) semua stories berlokasi

## 🔧 Troubleshooting

**Error: "Connection refused"**
- Pastikan DATABASE_URL benar
- Cek apakah Neon database aktif (free tier auto-suspend setelah 5 menit idle)

**Error: "relation does not exist"**
- Jalankan `npm run init-db` untuk create tables

**Error: "JWT malformed"**
- Pastikan JWT_SECRET di `.env` sama dengan yang digunakan saat generate token

## 📚 Dokumentasi API

Lihat `API_DOCS.md` untuk dokumentasi lengkap semua endpoint dan parameter.

## 🎯 Migration Notes

- ✅ Data dari JSON files sudah di-migrate ke PostgreSQL
- ✅ Semua endpoint API tetap kompatibel (no breaking changes)
- ✅ File JSON tetap ada sebagai backup
- ✅ Performance improvement dengan indexing
- ✅ Data integrity dengan foreign keys & constraints
