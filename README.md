# 🌍 Story Map SPA - PWA with Maps & Stories

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build](https://img.shields.io/badge/build-prod-green.svg)](https://github.com/username/story-map-spa/actions)

Progressive Web App untuk berbagi cerita lokasi dengan peta interaktif (Leaflet), auth, favorites, push notifications, & offline support.

## ✨ Fitur
- 📍 **Peta Interaktif** - Leaflet maps dengan marker stories
- 📱 **PWA Full** - Installable, offline-first (SW + IDB)
- 🔐 **Auth** - Login/Register (Dicoding API)
- 💾 **Offline** - Cache API, sync background
- 🔔 **Push Notifications**
- ❤️ **Favorites** - Offline favorites (IndexedDB)
- ⚡ **SPA Routing** - Hash-based + View Transitions API
- 📊 **Proxy Dev** - Webpack devServer proxy API

## 🛠 Tech Stack
- **Frontend**: ES6+, CSS Grid/Flex, View Transitions
- **Build**: Webpack 5 (dev/prod), Babel
- **API**: [Dicoding Story API](https://story-api.dicoding.dev/v1)
- **Map**: Leaflet 1.9
- **PWA**: Workbox SW, Manifest
- **Storage**: IndexedDB (idb lib)

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev  # http://localhost:3000/
```

### Production
```bash
npm run build
npm run deploy  # gh-pages
```

### Windows PowerShell (fix && error)
```powershell
npm run build; npm run deploy
```

## 📁 Struktur
```
src/
├── index.html       # Entry + manifest
├── scripts/         # SPA logic
│   ├── config.js    # API_BASE (dev: /api → proxy)
│   ├── data/api.js  # Fetch wrappers
│   ├── pages/       # Route components
│   ├── utils/       # Auth, DB, Map, SW
│   └── routes/      # Hash router
├── styles/          # CSS modules
└── sw.js           # PWA Service Worker
docs/               # gh-pages build
```

## 🔧 Environment
- **Dev**: localhost → `/api` proxy (no CORS)
- **Prod**: `https://story-api.dicoding.dev/v1`
- SW auto-detects via `location.hostname`

## 🧪 Testing
1. Dev server: `npm run dev`
2. Stories: #/stories (login → list/map)
3. Detail: Click story (single fetch + fallback)
4. Add: #/add (camera/location/post)
5. Offline: Network throttle → cached stories
6. Install PWA → push toggle

## 📱 Screenshots
![Home](docs/screenshots/home-1280x720.png)
![Stories](docs/screenshots/stories-1280x720.png)
![Add](docs/screenshots/add-1280x720.png)

## ⚠️ Known
- Bundle warning: Normal for full PWA (minified prod OK)
- Single-story API optional (graceful fallback)

## 🤝 Contributing
1. Fork & PR
2. `npm i && npm run dev`

## 📄 License
MIT - Free to use/fork.

**Built with ❤️ for Dicoding submission.**

