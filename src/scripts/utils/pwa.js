let deferredPrompt;

export function initPWA() {
  // Install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPromotion();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallPromotion();
  });

  // Offline UI
  window.addEventListener('offline', updateOnlineStatus);
  window.addEventListener('online', updateOnlineStatus);
}

function showInstallPromotion() {
  const btn = document.createElement('button');
  btn.id = 'install-app-btn';
  btn.textContent = 'Install App';
  btn.ariaLabel = 'Install Story Map as PWA';
  btn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1000; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 50px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); cursor: pointer;';
  document.body.appendChild(btn);
  btn.addEventListener('click', installApp);
}

function hideInstallPromotion() {
  const btn = document.getElementById('install-app-btn');
  if (btn) btn.remove();
}

function updateOnlineStatus() {
  const bar = document.getElementById('offline-status');
  if (navigator.onLine) {
    if (bar) bar.remove();
  } else {
    let bar = document.getElementById('offline-status');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'offline-status';
      bar.textContent = '📴 Offline - Some features limited';
      bar.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #ef4444; color: white; padding: 12px; text-align: center; z-index: 10000; font-weight: bold;';
      document.body.appendChild(bar);
    }
  }
}

export async function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt = null;
      hideInstallPromotion();
    }
  }
}
