# Story Map Backend

Backend Node.js + Express untuk Story Map SPA. Menyediakan REST API yang kompatibel dengan struktur Dicoding Story API, plus Admin Panel.

## Struktur

```
backend/
├── admin/              # Admin panel (HTML/CSS/JS statis)
│   ├── index.html
│   ├── admin.css
│   └── admin.js
├── data/               # JSON "database" (auto-generated)
│   ├── users.json      # Data users + dummy data
│   ├── stories.json    # Data stories + dummy data
│   └── subscriptions.json
├── src/
│   ├── server.js       # Entry point Express
│   ├── config.js       # Konfigurasi (PORT, JWT_SECRET)
│   ├── db.js           # JSON file database helper
│   ├── middleware/
│   │   └── auth.js     # JWT auth & admin middleware
│   └── routes/
│       ├── auth.js     # POST /login, POST /register
│       ├── stories.js  # CRUD /stories
│       ├── admin.js    # Admin CRUD /admin/*
│       └── notifications.js  # Push subscribe
├── uploads/            # Foto yang diupload (auto-created)
├── package.json
└── API_DOCS.md         # Dokumentasi lengkap API
```

## Cara Menjalankan

```bash
# Install dependencies
npm install

# Development (auto-reload)
npm run dev

# Production
npm start
```

Server: `http://localhost:3001`
Admin Panel: `http://localhost:3001/admin`
API: `http://localhost:3001/v1`

## Akun Demo

| Role  | Email                  | Password |
|-------|------------------------|----------|
| Admin | admin@storymap.com     | password |
| User  | budi@example.com       | password |
| User  | siti@example.com       | password |
| User  | andi@example.com       | password |

## Menghubungkan ke Frontend

Edit `src/scripts/config.js`:
```js
export const API_BASE = 'http://localhost:3001/v1';
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

Lihat `API_DOCS.md` untuk dokumentasi lengkap semua endpoint dan parameter.
