// Service Worker - Production only
// Di development mode, SW ini tidak di-copy (dikecualikan di webpack.dev.js)
// File ini hanya dipakai saat npm run build (production)

const CACHE_NAME = 'storymap-pwa-v2';

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['/index.html']).catch(() => {});
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Hanya cache GET request
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Jangan cache API calls
  if (url.pathname.startsWith('/v1')) return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = { title: 'Story Baru', body: event.data?.text?.() || '' }; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Story Map', {
      body: data.body || data.description || '',
      icon: '/icons/logo.png',
      badge: '/icons/logo.png',
      data: { id: data.id || '' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const id = event.notification.data?.id;
  event.waitUntil(clients.openWindow(id ? `/#/story/${id}` : '/'));
});
