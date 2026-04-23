import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { API_BASE } from './scripts/config';

const CACHE_NAME = 'storymap-pwa-v1';

// Do precaching
precacheAndRoute(self.__WB_MANIFEST);

// Runtime caching: Google Fonts
registerRoute(
  ({ url }) => {
    return url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com';
  },
  new CacheFirst({
    cacheName: 'google-fonts',
  }),
);

// Runtime caching: Font Awesome / CDN
registerRoute(
  ({ url }) => {
    return url.origin === 'https://cdnjs.cloudflare.com' || url.origin.includes('fontawesome');
  },
  new CacheFirst({
    cacheName: 'fontawesome',
  }),
);

// Runtime caching: Avatar image API
registerRoute(
  ({ url }) => {
    return url.origin === 'https://ui-avatars.com';
  },
  new CacheFirst({
    cacheName: 'avatars-api',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);

// Runtime caching: Story API non-image JSON
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(API_BASE);
    return baseUrl.origin === url.origin && request.destination !== 'image';
  },
  new NetworkFirst({
    cacheName: 'story-api',
  }),
);

// Runtime caching: Story API images
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(API_BASE);
    return baseUrl.origin === url.origin && request.destination === 'image';
  },
  new StaleWhileRevalidate({
    cacheName: 'story-api-images',
  }),
);

// Runtime caching: Map tile / geocoding provider
registerRoute(
  ({ url }) => {
    return url.origin.includes('maptiler') || url.origin.includes('mapbox') || url.origin.includes('openstreetmap');
  },
  new CacheFirst({
    cacheName: 'map-provider-api',
  }),
);

// Push notification
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { title: 'Story Baru', body: event.data?.text?.() || 'Ada pembaruan story terbaru.' };
  }

  const options = {
    body: data.body || data.description || '',
    icon: '/icons/logo.png',
    badge: '/icons/logo.png',
    image: data.photoUrl || data.image || '',
    data: { id: data.id || data.storyId || '' },
    actions: [{ action: 'view', title: 'Lihat Detail' }, { action: 'dismiss', title: 'Tutup' }],
    vibrate: [200, 100, 200],
    tag: 'story-notification',
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Story Map', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const storyId = event.notification.data?.id || '';
  const targetUrl = storyId ? `/#/story/${storyId}` : '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        const matchedClient = windowClients.find((client) => 'focus' in client);

        if (matchedClient && 'navigate' in matchedClient) {
          return matchedClient.navigate(targetUrl).then(() => matchedClient.focus());
        }

        return clients.openWindow(targetUrl);
      })
      .catch(() => clients.openWindow(targetUrl)),
  );
});
