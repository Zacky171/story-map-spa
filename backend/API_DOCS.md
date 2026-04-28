# Story Map Backend - API Documentation

Base URL: `http://localhost:3001/v1`

Admin Panel: `http://localhost:3001/admin`

---

## Authentication

Semua endpoint yang dilindungi memerlukan header:
```
Authorization: Bearer <token>
```
Token didapat dari endpoint `/login`.

---

## Akun Demo

| Role  | Email                  | Password |
|-------|------------------------|----------|
| Admin | admin@storymap.com     | password |
| User  | budi@example.com       | password |
| User  | siti@example.com       | password |
| User  | andi@example.com       | password |

---

## Endpoints

### Auth

#### POST /register
Daftarkan akun baru.

**Body (JSON):**
| Parameter | Tipe   | Wajib | Keterangan              |
|-----------|--------|-------|-------------------------|
| name      | string | ✅    | Nama lengkap (min 2 karakter) |
| email     | string | ✅    | Alamat email valid      |
| password  | string | ✅    | Password (min 6 karakter) |

**Response 201:**
```json
{
  "error": false,
  "message": "Registrasi berhasil"
}
```

**Response 400:**
```json
{
  "error": true,
  "message": "Email sudah terdaftar"
}
```

---

#### POST /login
Login dan dapatkan token JWT.

**Body (JSON):**
| Parameter | Tipe   | Wajib | Keterangan   |
|-----------|--------|-------|--------------|
| email     | string | ✅    | Email akun   |
| password  | string | ✅    | Password     |

**Response 200:**
```json
{
  "error": false,
  "message": "Login berhasil",
  "loginResult": {
    "userId": "user-001",
    "name": "Budi Santoso",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response 401:**
```json
{
  "error": true,
  "message": "Email atau password salah"
}
```

---

### Stories

#### GET /stories
Ambil daftar stories. **Memerlukan token.**

**Query Parameters:**
| Parameter | Tipe    | Default | Keterangan                        |
|-----------|---------|---------|-----------------------------------|
| page      | integer | 1       | Halaman (pagination)              |
| size      | integer | 10      | Jumlah item per halaman           |
| location  | integer | 0       | `1` = sertakan lat/lon di response |

**Response 200:**
```json
{
  "error": false,
  "message": "Stories fetched",
  "listStory": [
    {
      "id": "story-001",
      "name": "Budi Santoso",
      "userId": "user-001",
      "description": "Sunrise di Gunung Bromo",
      "photoUrl": "/uploads/abc123.jpg",
      "lat": -7.9425,
      "lon": 112.9530,
      "createdAt": "2026-04-01T05:30:00.000Z"
    }
  ]
}
```

---

#### GET /stories/:id
Ambil detail satu story. **Memerlukan token.**

**Path Parameter:**
| Parameter | Tipe   | Keterangan  |
|-----------|--------|-------------|
| id        | string | ID story    |

**Response 200:**
```json
{
  "error": false,
  "story": { ... }
}
```

---

#### POST /stories
Tambah story baru. **Memerlukan token.**

**Body (multipart/form-data):**
| Parameter   | Tipe   | Wajib | Keterangan                    |
|-------------|--------|-------|-------------------------------|
| photo       | file   | ❌    | Gambar (max 5MB)              |
| description | string | ✅    | Deskripsi / judul story       |
| lat         | number | ❌    | Latitude lokasi               |
| lon         | number | ❌    | Longitude lokasi              |

**Response 201:**
```json
{
  "error": false,
  "message": "Story berhasil ditambahkan",
  "story": { ... }
}
```

---

#### PUT /stories/:id
Update story. **Memerlukan token (owner atau admin).**

**Body (multipart/form-data):**
| Parameter   | Tipe   | Wajib | Keterangan              |
|-------------|--------|-------|-------------------------|
| photo       | file   | ❌    | Gambar baru             |
| description | string | ❌    | Deskripsi baru          |
| lat         | number | ❌    | Latitude baru           |
| lon         | number | ❌    | Longitude baru          |

**Response 200:**
```json
{
  "error": false,
  "message": "Story updated",
  "story": { ... }
}
```

---

#### DELETE /stories/:id
Hapus story. **Memerlukan token (owner atau admin).**

**Response 200:**
```json
{
  "error": false,
  "message": "Story deleted"
}
```

---

### Notifications (Push)

#### POST /notifications/subscribe
Subscribe push notification. **Memerlukan token.**

**Body (JSON):**
| Parameter | Tipe   | Wajib | Keterangan                    |
|-----------|--------|-------|-------------------------------|
| endpoint  | string | ✅    | Push subscription endpoint    |
| keys      | object | ✅    | `{ p256dh: string, auth: string }` |

**Response 200:**
```json
{
  "error": false,
  "message": "Subscribed successfully"
}
```

---

#### DELETE /notifications/subscribe
Unsubscribe push notification. **Memerlukan token.**

**Body (JSON):**
| Parameter | Tipe   | Wajib | Keterangan                 |
|-----------|--------|-------|----------------------------|
| endpoint  | string | ✅    | Endpoint yang di-unsubscribe |

---

### Admin (Memerlukan token Admin)

#### GET /admin/stats
Statistik ringkasan.

**Response 200:**
```json
{
  "error": false,
  "stats": {
    "totalUsers": 4,
    "totalStories": 8,
    "totalAdmins": 1,
    "storiesWithLocation": 8
  }
}
```

---

#### GET /admin/users
Daftar semua users.

**Response 200:**
```json
{
  "error": false,
  "users": [
    {
      "id": "admin-001",
      "name": "Admin Story Map",
      "email": "admin@storymap.com",
      "isAdmin": true,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### POST /admin/users
Buat user baru (admin).

**Body (JSON):**
| Parameter | Tipe    | Wajib | Keterangan          |
|-----------|---------|-------|---------------------|
| name      | string  | ✅    | Nama user           |
| email     | string  | ✅    | Email user          |
| password  | string  | ✅    | Password            |
| isAdmin   | boolean | ❌    | `true` = admin role |

---

#### PUT /admin/users/:id
Update user.

**Body (JSON):** Sama seperti POST, semua field opsional.

---

#### DELETE /admin/users/:id
Hapus user.

---

#### GET /admin/stories
Daftar semua stories (tanpa pagination).

---

#### DELETE /admin/stories/:id
Hapus story manapun (admin privilege).

---

## Error Responses

Semua error mengikuti format:
```json
{
  "error": true,
  "message": "Pesan error"
}
```

| HTTP Code | Keterangan                        |
|-----------|-----------------------------------|
| 400       | Bad Request - parameter tidak valid |
| 401       | Unauthorized - token tidak ada/expired |
| 403       | Forbidden - bukan admin/owner     |
| 404       | Not Found - resource tidak ditemukan |
| 500       | Internal Server Error             |

---

## Cara Menjalankan

```bash
# Masuk ke folder backend
cd backend

# Install dependencies
npm install

# Jalankan development server (auto-reload)
npm run dev

# Atau jalankan production
npm start
```

Server berjalan di: `http://localhost:3001`

---

## Menghubungkan Frontend

Edit `src/scripts/config.js` di frontend:

```js
// Ganti dari Dicoding API ke local backend
export const API_BASE = 'http://localhost:3001/v1';
```

Lalu jalankan frontend:
```bash
npm run dev
```
