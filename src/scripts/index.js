import '../styles/styles.css';
import './utils/index.js';
import App from './pages/app.js';
import { initPWA } from './utils/pwa.js';
import { checkPushSubscriptionStatus } from './utils/push.js';

App();

let deferredPrompt;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // Di development (localhost:3000 dengan webpack-dev-server),
    // unregister semua SW lama supaya tidak loop/refresh terus
    const isDev = location.hostname === 'localhost' && location.port === '3000';

    if (isDev) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
        console.log('SW unregistered (dev mode)');
      }
      // Hapus semua cache lama
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      return; // Jangan register SW baru di dev
    }

    // Production: register SW
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registered', registration);
        initPWA();
        registration.sync?.register('sync-stories').catch(() => {});

        window.swRegistration = registration;
        checkPushSubscriptionStatus(registration).then(subscribed => {
          window.__pushSubscribed = subscribed;
        });

        import('./utils/push.js').then(module => {
          window.togglePushSubscription = module.togglePushSubscription;
        }).catch(console.error);

        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data?.type === 'SYNC_STORIES') {
            import('./utils/sync.js').then(({ syncAllPending }) => {
              syncAllPending();
            }).catch(() => {});
          }
        });
      })
      .catch(error => console.error('SW registration failed', error));
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

window.installApp = () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
  }
};
