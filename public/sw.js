const CACHE_NAME = 'storymap-pwa-v1';
const API_BASE = 'https://story-api.dicoding.dev/v1';

self.addEventListener('install', event => {
  event.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll([
      '/',
      '/index.html',
      '/bundle.js',
      '/public/manifest.json',
      '/public/icons/icon-192.png',
      '/public/icons/logo.png',
      '/styles/styles.css',
      '/styles/favorites.css',
      '/styles/scroll-hide.css',
      '/src/images/logo.png',
      '/src/images/logo.svg'
    ]).catch(e => console.log('SW cache error:', e)).then(() => 
      Promise.all([
        cache.add('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'),
        cache.add('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js')
      ])
    ))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Cache API /stories with staleWhileRevalidate (dynamic content)
  if (url.href.startsWith(API_BASE) && url.pathname.includes('/stories')) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }
  
  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(event.request));
  } else if (url.href.startsWith(API_BASE)) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(networkFirst(event.request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  let response = await cache.match(request);
  if (response) return response;
  try {
    response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (e) {
    return cache.match(request) || new Response('Offline', {status: 503});
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (e) {
    return cache.match(request);
  }
}

// Stale while revalidate for dynamic API data
async function staleWhileRevalidate(request) {
  const cache = await caches.open(`${CACHE_NAME}-api`);
  const cachedResponse = await cache.match(request);
  if (cachedResponse && Date.now() < cachedResponse.headers.get('x-cache-expiry')) {
    fetch(request).then(networkResponse => {
      const clonedResponse = networkResponse.clone();
      const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24h
      const headers = new Headers(clonedResponse.headers);
      headers.set('x-cache-expiry', expiry);
      cache.put(request, clonedResponse);
    }).catch(() => {}); 
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    const expiry = Date.now() + 48 * 60 * 60 * 1000; // 48h
    const headers = new Headers(response.headers);
    headers.set('x-cache-expiry', expiry);
    cache.put(request, response.clone());
    return response;
  } catch (e) {
    return cache.match(request) || new Response('Stories unavailable offline', {status: 503});
  }
}

// Push notifications (Advanced) - Robust data handling for text/JSON
self.addEventListener('push', event => {
  let data = 'Data default notifikasi';
  if (event.data) {
    try {
      // Try parsing as JSON first
      data = event.data.json();
    } catch (e) {
      // Fallback to plain text if not JSON
      data = event.data.text();
    }
  }

  const title = (typeof data === 'object' ? data?.title : data) || 'Story Baru';
  const options = {
    body: (typeof data === 'object' ? (data?.body || data?.description || 'Story baru tersedia!') : data),
    icon: (typeof data === 'object' ? data?.icon : '/icons/logo.png') || '/icons/logo.png',
    badge: '/icons/logo.png',
    image: typeof data === 'object' ? (data?.image || data?.photoUrl) : undefined,
    data: { id: typeof data === 'object' ? data?.id : undefined },
    actions: [{
      action: 'view',
      title: 'Lihat Detail',
      icon: '/icons/logo.png'
    }]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'view' && event.notification.data?.id) {
    event.waitUntil(clients.openWindow(`/ #/story/${event.notification.data.id}`));
  } else {
    event.waitUntil(clients.openWindow('/'));
  }
});
