# Story Map PWA 🚀

Modern Progressive Web App untuk berbagi cerita lokasi dengan peta interaktif.

## ✨ Fitur

- 📍 **Story Map** - Lihat cerita di peta interaktif
- ➕ **Tambah Story** - Upload foto + lokasi + cerita
- ❤️ **Favorites** - Simpan story favorit (IndexedDB)
- 🔐 **Authentication** - Login/Register dengan token auth
- 📱 **PWA Ready** - Installable, offline-first
- 📲 **Push Notifications** - Notifikasi story baru
- 🗺️ **Leaflet Maps** - Peta geolocation-aware
- ⚡ **Hash Router** - SPA navigation
- 🎨 **Modern UI** - Glassmorphism + gradients

## 🚀 Quick Start

```bash
npm install
npm start
```

Buka [http://localhost:8080](http://localhost:8080)

## 📁 Struktur Project

```
starter-project-with-webpack/
├── src/
│   ├── scripts/
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Shared utilities (auth, map, db)
│   │   ├── data/          # API calls
│   │   └── routes/        # Hash router
│   ├── styles/            # Modern CSS
│   └── index.html
├── public/
│   ├── sw.js             # Service Worker
│   └── manifest.json     # PWA manifest
├── webpack.*.js          # Webpack configs
└── package.json
```

## 🛠 Tech Stack

| Tech | Purpose |
|------|---------|
| **Webpack 5** | Bundling + dev server |
| **Leaflet** | Interactive maps |
| **IndexedDB** | Offline favorites |
| **Service Worker** | Caching + Push |
| **localStorage** | Auth tokens |
| **async/await** | Modern JS |

## 🔐 Authentication Flow

1. User visits `/stories` → **Guard redirects** to `/login`
2. Login → Token saved to `localStorage`
3. Protected pages now send `Authorization: Bearer <token>`
4. **No 401 errors** - all API calls guarded

## 📱 PWA Features

- ✅ **Offline favorites** (IndexedDB)
- ✅ **Install prompt**
- ✅ **Push ready** (stubbed server calls)
- ✅ **Network-first** API caching  
- ✅ **Cache-first** assets

## 🎮 Demo Flow

```
Home → Login → Stories Map → Add Story → Detail → Favorites
```

## 🧪 Testing

```
npm start  # Dev server
npm run build  # Production build
```

**Test Cases:**
- [x] Unauth → stories = redirect ✓
- [x] Auth → stories = 200 OK ✓  
- [x] Offline = cached assets ✓
- [x] SW no 401 interference ✓

## 📄 License

MIT - Free to use/modify
