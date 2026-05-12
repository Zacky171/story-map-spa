# 🚀 Deployment Guide - Railway + Neon

Panduan lengkap deploy Story Map SPA ke Railway dengan PostgreSQL (Neon).

**🌐 Live Demo:** https://story-map-spa-production.up.railway.app/

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    USER / BROWSER                       │
│              (https://story-map-spa...app)              │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS Request
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  RAILWAY (Hosting)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Frontend (SPA)          Backend (Node.js)       │  │
│  │  - HTML/CSS/JS           - Express API           │  │
│  │  - Service Worker        - JWT Auth              │  │
│  │  - PWA                   - File Upload           │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ SQL Query (SSL)
                     ↓
┌─────────────────────────────────────────────────────────┐
│              NEON (PostgreSQL Cloud)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Database: neondb                                │  │
│  │  - users (8 rows)                                │  │
│  │  - stories (9 rows)                              │  │
│  │  - subscriptions (0 rows)                        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**✅ Benefits:**
- Frontend & Backend di satu domain (no CORS issues)
- Database terpisah (scalable & secure)
- Auto SSL/HTTPS
- Auto-deploy dari Git

---

## ⚡ Quick Start (TL;DR)

Sudah familiar dengan Railway & Neon? Ikuti langkah cepat ini:

```bash
# 1. Setup Neon
# - Login ke https://console.neon.tech
# - Create project → Copy connection string

# 2. Deploy ke Railway
# - Connect GitHub repo
# - Set variables: DATABASE_URL, JWT_SECRET, PORT
# - Auto-deploy

# 3. Init database
railway run npm run init-db --dir backend

# 4. Done!
# Open: https://your-app.railway.app
```

**Butuh panduan detail?** Lanjut baca di bawah! 👇

---

## 📋 Prerequisites

- ✅ Akun GitHub (untuk push code)
- ✅ Akun Railway (https://railway.app) - Free tier
- ✅ Akun Neon (https://neon.tech) - Free tier
- ✅ Railway CLI (optional, untuk init database)

---

## 🗄️ Step 1: Setup Neon Database

### 1.1 Create Neon Project

1. Login ke https://console.neon.tech
2. Klik **"Create a project"**
3. Isi detail:
   - **Project name:** `storymap-db` (atau nama lain)
   - **Region:** Pilih terdekat (Singapore/Tokyo untuk Indonesia)
   - **PostgreSQL version:** 16 (default)
4. Klik **"Create project"**

### 1.2 Get Connection String

Setelah project dibuat, Anda akan melihat dashboard dengan **Connection String**:

```
postgresql://neondb_owner:npg_xxxxx@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require
```

**Copy connection string ini!** Akan digunakan di Railway.

### 1.3 Neon Free Tier Info

- ✅ 0.5 GB storage
- ✅ Unlimited queries
- ✅ Auto-suspend setelah 5 menit idle (hemat resource)
- ✅ Auto-resume saat ada query (instant)
- ✅ Connection pooling built-in

---

## 🚂 Step 2: Setup Railway

### 2.1 Create Railway Project

1. Login ke https://railway.app
2. Klik **"New Project"**
3. Pilih **"Deploy from GitHub repo"**
4. Connect GitHub account Anda
5. Pilih repository `story-map-spa`
6. Railway akan auto-detect dan deploy

### 2.2 Set Environment Variables

Setelah project dibuat:

1. Klik project → Tab **"Variables"**
2. Tambahkan variable berikut:

```env
DATABASE_URL=postgresql://neondb_owner:npg_xxxxx@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=storymap-production-secret-key-2026-change-this
JWT_EXPIRES_IN=7d
PORT=3001
```

**PENTING:**
- `DATABASE_URL` → Paste connection string dari Neon
- `JWT_SECRET` → Ganti dengan random string yang aman (min 32 karakter)
- Generate JWT_SECRET aman: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

3. Klik **"Add"** untuk setiap variable
4. Railway akan auto-redeploy setelah variable ditambahkan

### 2.3 Configure Build & Start Command

Railway biasanya auto-detect, tapi pastikan:

**Build Command:**
```bash
cd backend && npm install && cd .. && npm install && npm run build
```

**Start Command:**
```bash
cd backend && npm start
```

Cek di **Settings** → **Deploy** untuk memastikan command benar.

---

## 🔧 Step 3: Initialize Database

Setelah Railway deploy sukses, Anda perlu create tables dan migrate data.

### Option A: Via Railway CLI (Recommended)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login:
```bash
railway login
```

3. Link ke project:
```bash
railway link
```

4. Run init database:
```bash
railway run npm run init-db --dir backend
```

### Option B: Via Railway Dashboard

1. Buka Railway dashboard
2. Klik project → Tab **"Deployments"**
3. Klik deployment terbaru → **"View Logs"**
4. Klik **"Run Command"** (icon terminal)
5. Jalankan:
```bash
cd backend && npm run init-db
```

### Option C: Via Local dengan Remote Database

1. Copy `DATABASE_URL` dari Railway
2. Edit `backend/.env` di local:
```env
DATABASE_URL=postgresql://... (dari Railway/Neon)
```
3. Jalankan:
```bash
cd backend
npm run init-db
```

---

## ✅ Step 4: Verify Deployment

### 4.1 Check Health Endpoint

Railway memberikan URL deployment:
```
https://story-map-spa-production.up.railway.app
```

Test health check:
```bash
curl https://story-map-spa-production.up.railway.app/health
```

**Expected Response:**
```json
{"status":"ok","time":"2026-05-12T..."}
```

---

### 4.2 Test API Login

```bash
curl -X POST https://story-map-spa-production.up.railway.app/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@storymap.com","password":"password"}'
```

**Expected Response:**
```json
{
  "error": false,
  "message": "Login berhasil",
  "loginResult": {
    "userId": "admin-001",
    "name": "Admin Story Map",
    "token": "eyJhbGci..."
  }
}
```

---

### 4.3 Test Frontend

Buka browser dan akses:

**🏠 Homepage:**
```
https://story-map-spa-production.up.railway.app
```

**👤 Login dengan akun demo:**
- Email: `admin@storymap.com`
- Password: `password`

**🔧 Admin Panel:**
```
https://story-map-spa-production.up.railway.app/admin
```

**✅ Checklist Testing:**
- [ ] Homepage loading
- [ ] Login berhasil
- [ ] Lihat stories
- [ ] Tambah story baru
- [ ] Admin panel accessible
- [ ] Map menampilkan markers

---

## 🔄 Step 5: Update Frontend Config

Aplikasi sudah otomatis detect environment, tapi kalau perlu manual update:

### **Option 1: Auto-Detection (Recommended)**

Edit `src/scripts/config.js`:

```javascript
// Auto-detect environment
export const API_BASE = 
  window.location.hostname === 'localhost'
    ? 'http://localhost:3001/v1'
    : `${window.location.origin}/v1`;
```

Dengan ini, aplikasi otomatis pakai:
- **Local:** `http://localhost:3001/v1`
- **Production:** `https://story-map-spa-production.up.railway.app/v1`

---

### **Option 2: Manual Configuration**

Edit `src/scripts/config.js`:

```javascript
// Development
// export const API_BASE = 'http://localhost:3001/v1';

// Production
export const API_BASE = 'https://story-map-spa-production.up.railway.app/v1';
```

Commit dan push:
```bash
git add .
git commit -m "Update API base URL for production"
git push
```

Railway akan auto-redeploy dalam 1-2 menit.

---

## 🔐 Security Checklist

- ✅ `JWT_SECRET` menggunakan random string yang kuat
- ✅ `.env` tidak di-commit ke Git (sudah ada di `.gitignore`)
- ✅ Database connection menggunakan SSL (`sslmode=require`)
- ✅ Password di database sudah di-hash dengan bcrypt
- ✅ CORS configured dengan benar

---

## 📊 Monitoring & Logs

### Railway Logs

1. Buka Railway dashboard
2. Klik project → Tab **"Deployments"**
3. Klik deployment → **"View Logs"**

### Neon Monitoring

1. Buka Neon dashboard
2. Klik project → Tab **"Monitoring"**
3. Lihat:
   - Active connections
   - Query performance
   - Storage usage

---

## 🐛 Troubleshooting

### Error: "Connection refused"

**Penyebab:** DATABASE_URL salah atau Neon database suspended (free tier auto-suspend setelah 5 menit idle)

**Solusi:**
1. Cek DATABASE_URL di Railway variables (pastikan benar)
2. Buka Neon dashboard → Database akan auto-resume dalam 1-2 detik
3. Refresh halaman atau hit API lagi
4. Kalau masih error, redeploy Railway

---

### Error: "relation does not exist"

**Penyebab:** Tables belum dibuat di database

**Solusi:**
```bash
# Via Railway CLI
railway run npm run init-db --dir backend

# Atau via Railway Dashboard
# Deployments → View Logs → Run Command → cd backend && npm run init-db
```

---

### Error: "JWT malformed" / "Invalid token"

**Penyebab:** JWT_SECRET berbeda antara generate token dan verify token

**Solusi:**
1. Pastikan JWT_SECRET sama di Railway variables
2. Logout dari aplikasi
3. Login ulang untuk generate token baru
4. Kalau masih error, clear browser cache/cookies

---

### Error: "Port already in use"

**Penyebab:** Railway menggunakan dynamic port assignment

**Solusi:**
Pastikan `backend/src/config.js` menggunakan `process.env.PORT`:
```javascript
PORT: process.env.PORT || 3001
```
Railway akan inject PORT otomatis (biasanya 3000 atau random).

---

### Error: "CORS policy blocked"

**Penyebab:** Frontend dan backend di domain berbeda (seharusnya tidak terjadi di Railway)

**Solusi:**
1. Pastikan frontend dan backend di-deploy di project Railway yang sama
2. Cek `backend/src/server.js` ada `app.use(cors({ origin: '*' }))`
3. Kalau pakai custom domain, update CORS config

---

### Error: "Failed to fetch" / "Network error"

**Penyebab:** API_BASE URL salah atau backend tidak running

**Solusi:**
1. Cek `src/scripts/config.js` → API_BASE harus sesuai Railway URL
2. Test health endpoint: `curl https://story-map-spa-production.up.railway.app/health`
3. Cek Railway logs untuk error backend
4. Pastikan backend deployment success (tidak crash)

---

### Database Suspended (Neon Free Tier)

**Gejala:** Request pertama lambat (3-5 detik), lalu normal

**Penyebab:** Neon free tier auto-suspend setelah 5 menit idle

**Solusi:**
- ✅ Ini normal behavior (bukan error!)
- ✅ Database auto-resume saat ada request
- ✅ Request berikutnya akan cepat
- ✅ Upgrade ke paid plan kalau butuh always-on

---

## 🎯 Production Best Practices

### 1. Database Backup

Neon free tier sudah include auto-backup. Untuk manual backup:

```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Import database
psql $DATABASE_URL < backup.sql
```

### 2. Environment Variables

Jangan hardcode credentials! Selalu gunakan environment variables.

### 3. Error Handling

Semua routes sudah include try-catch dan error logging.

### 4. Rate Limiting (Optional)

Install express-rate-limit untuk production:

```bash
npm install express-rate-limit
```

Edit `backend/src/server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/v1', limiter);
```

---

## 📚 Resources

- **Railway Docs:** https://docs.railway.app
- **Neon Docs:** https://neon.tech/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs
- **Express.js Docs:** https://expressjs.com
- **Live Demo:** https://story-map-spa-production.up.railway.app

---

## 🎉 Done!

Aplikasi Anda sekarang sudah live di production dengan:

- ✅ **Backend:** Node.js + Express di Railway
- ✅ **Database:** PostgreSQL di Neon (serverless)
- ✅ **Frontend:** SPA served dari Railway
- ✅ **SSL/HTTPS:** Automatic (secure)
- ✅ **Auto-deploy:** Dari Git push

---

### 🌐 **Production URLs:**

| Service | URL |
|---------|-----|
| **Homepage** | https://story-map-spa-production.up.railway.app |
| **API Base** | https://story-map-spa-production.up.railway.app/v1 |
| **Admin Panel** | https://story-map-spa-production.up.railway.app/admin |
| **Health Check** | https://story-map-spa-production.up.railway.app/health |

---

### 👤 **Demo Accounts:**

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@storymap.com | password |
| **User** | budi@example.com | password |
| **User** | siti@example.com | password |

---

### 📱 **Features:**

- ✅ User authentication (JWT)
- ✅ CRUD stories with photos
- ✅ Interactive map (Leaflet)
- ✅ Admin dashboard
- ✅ PWA (installable app)
- ✅ Responsive design
- ✅ Offline support (Service Worker)

---

### 🔄 **Update Deployment:**

Setiap kali push ke Git, Railway otomatis deploy:

```bash
git add .
git commit -m "Update feature"
git push
```

Railway akan:
1. Detect changes
2. Build aplikasi
3. Deploy otomatis
4. Update live URL

**Deployment time:** ~2-3 menit

---

**Selamat! Aplikasi Anda sudah production-ready!** 🚀🎉

---

## ❓ FAQ (Frequently Asked Questions)

### **Q: Apakah Railway dan Neon gratis?**
**A:** Ya! Keduanya punya free tier:
- **Railway:** 500 jam/bulan, $5 credit gratis
- **Neon:** 0.5 GB storage, unlimited queries

### **Q: Berapa lama deployment?**
**A:** ~2-3 menit untuk build + deploy otomatis setiap push ke Git.

### **Q: Apakah bisa pakai custom domain?**
**A:** Ya! Railway support custom domain. Setting di Railway dashboard → Domains.

### **Q: Database Neon lambat?**
**A:** Request pertama mungkin lambat (3-5 detik) karena auto-suspend. Request berikutnya cepat. Ini normal untuk free tier.

### **Q: Bagaimana cara update aplikasi?**
**A:** Tinggal `git push`! Railway otomatis detect changes dan redeploy.

### **Q: Apakah data aman?**
**A:** Ya! Password di-hash (bcrypt), koneksi pakai SSL/HTTPS, JWT authentication.

### **Q: Bisa diakses dari HP?**
**A:** Bisa! Aplikasi responsive dan PWA (bisa di-install seperti app native).

### **Q: Bagaimana cara backup database?**
**A:** Neon auto-backup. Manual: `pg_dump $DATABASE_URL > backup.sql`

### **Q: Kalau Railway/Neon down gimana?**
**A:** Railway uptime 99.9%. Neon punya redundancy. Tapi untuk production critical, consider paid plan.

### **Q: Bisa deploy di tempat lain (Vercel, Heroku)?**
**A:** Bisa! Tapi Railway paling mudah karena support backend + frontend sekaligus.

---

## 📞 Support

**Butuh bantuan?**
- 📖 Baca dokumentasi lengkap di `backend/README.md` dan `backend/API_DOCS.md`
- 🐛 Ada bug? Create issue di GitHub
- 💬 Diskusi? Join Railway/Neon Discord community

---

**Happy Deploying!** 🎉
