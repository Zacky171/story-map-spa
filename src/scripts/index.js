import '../styles/styles.css';
import './utils/index.js';
import App from './pages/app.js';
import { initPWA } from './utils/pwa.js';
import { checkPushSubscriptionStatus } from './utils/push.js';

App();

// PWA Service Worker & Install
let deferredPrompt;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registered', registration);
        initPWA();

        // Sync pending stories on service worker startup
        registration.sync?.register('sync-stories').catch(() => {});

        // Check push subscription status
        const swRegistration = registration;
        window.swRegistration = swRegistration;
        
        checkPushSubscriptionStatus(swRegistration).then(subscribed => {
          window.__pushSubscribed = subscribed;
        });

        // Load push utils globally
        import('./utils/push.js').then(module => {
          window.togglePushSubscription = module.togglePushSubscription;
        }).catch(console.error);

        // Listen for messages from service worker (sync events)
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data?.type === 'SYNC_STORIES') {
            import('./utils/sync.js').then(({ syncAllPending }) => {
              syncAllPending();
            }).catch(() => {});
          }
        });
      })
      .catch(error => {
        console.error('SW registration failed', error);
      });
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('Install prompt ready - add btn to UI if needed');
});

// Global install function for UI btn
window.installApp = () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      console.log('Install choice', choiceResult.outcome);
      deferredPrompt = null;
    });
  }
};

