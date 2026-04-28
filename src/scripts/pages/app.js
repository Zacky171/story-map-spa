// Main App Presenter - MVP Pattern
import { initRouter } from '../routes/routes.js';
import { isLoggedIn, logout } from '../utils/auth.js';

export default function App() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => runApp());
  } else {
    runApp();
  }
}

async function initPushToggle() {
  // Wait for SW and push utils to be ready
  const maxWait = 5000;
  const start = Date.now();
  
  while (!window.swRegistration || !window.togglePushSubscription) {
    if (Date.now() - start > maxWait) {
      console.warn('Push utils not ready within timeout');
      return;
    }
    await new Promise(r => setTimeout(r, 100));
  }

  // Create push toggle button inside header nav (far right)
  let header = document.querySelector('header');
  if (!header) return;
  
  let pushBtn = document.getElementById('global-push-toggle');
  if (!pushBtn) {
    pushBtn = document.createElement('button');
    pushBtn.id = 'global-push-toggle';
    pushBtn.className = 'push-toggle-btn header-push-btn';
    pushBtn.innerHTML = '🔔 Subscribe';
    
    let navContainer = document.createElement('div');
    navContainer.className = 'header-push-container';
    navContainer.appendChild(pushBtn);
    header.appendChild(navContainer);
  }

  // Check initial subscription status
  try {
    if (window.__pushSubscribed !== undefined) {
      // Already set by index.js
    } else {
      window.__pushSubscribed = await window.checkPushSubscriptionStatus(window.swRegistration);
    }
  } catch (e) {
    window.__pushSubscribed = false;
  }

  pushBtn.textContent = window.__pushSubscribed ? '🔔 Unsubscribe' : '🔔 Subscribe';
  pushBtn.classList.toggle('subscribed', window.__pushSubscribed);

  // Toggle handler
  pushBtn.onclick = async () => {
    try {
      pushBtn.disabled = true;
      pushBtn.textContent = '⏳ ...';
      
      const result = await window.togglePushSubscription(window.swRegistration);
      const subscribed = result === 'subscribed';
      window.__pushSubscribed = subscribed;
      
      pushBtn.textContent = subscribed ? '🔔 Unsubscribe' : '🔔 Subscribe';
      pushBtn.classList.toggle('subscribed', subscribed);
    } catch (error) {
      alert('Toggle failed: ' + error.message);
      pushBtn.textContent = window.__pushSubscribed ? '🔔 Unsubscribe' : '🔔 Subscribe';
    } finally {
      pushBtn.disabled = false;
    }
  };
}

function runApp() {
  initRouter();
  updateNavAuth();
  initPushToggle();
  
  // Guard routes - check current hash
  guardProtectedRoutes();
}

function guardProtectedRoutes() {
  const protectedHashes = ['#/add', '#/stories'];
  if (!isLoggedIn() && protectedHashes.includes(window.location.hash)) {
    window.location.hash = '#/login';
  }
}


function updateNavAuth() {
  const header = document.querySelector('header');
  const nav = document.querySelector('nav');
  const isAdminRoute = window.location.hash.startsWith('#/admin');

  // Sembunyikan seluruh header saat di halaman admin
  if (header) header.style.display = isAdminRoute ? 'none' : '';
  if (!nav || isAdminRoute) return;

  const ul = nav.querySelector('ul');
  const storiesLi = nav.querySelector('a[href="#/stories"]')?.parentElement;
  const addLi = nav.querySelector('a[href="#/add"]')?.parentElement;
  const loginLi = nav.querySelector('a[href="#/login"]')?.parentElement;
  const registerLi = nav.querySelector('a[href="#/register"]')?.parentElement;
  const homeLi = nav.querySelector('a[href="#/"]')?.parentElement;
  let logoutLi = nav.querySelector('.logout-li');

  const existingPushLi = nav.querySelector('.push-li');
  if (existingPushLi) existingPushLi.remove();

  if (isLoggedIn()) {
    if (homeLi) homeLi.style.display = '';
    if (storiesLi) storiesLi.style.display = '';
    if (addLi) addLi.style.display = '';
    if (loginLi) loginLi.style.display = 'none';
    if (registerLi) registerLi.style.display = 'none';

    if (!logoutLi) {
      logoutLi = document.createElement('li');
      logoutLi.className = 'logout-li';
      const logoutLink = document.createElement('a');
      logoutLink.href = '#';
      logoutLink.className = 'logout-link';
      logoutLink.textContent = 'Logout';
      logoutLink.addEventListener('click', e => {
        e.preventDefault();
        logout();
        window.location.hash = '#/login';
      });
      logoutLi.appendChild(logoutLink);
      if (addLi) addLi.after(logoutLi);
      else ul.appendChild(logoutLi);
    }
    logoutLi.style.display = '';
  } else {
    if (homeLi) homeLi.style.display = '';
    if (storiesLi) storiesLi.style.display = 'none';
    if (addLi) addLi.style.display = 'none';
    if (loginLi) loginLi.style.display = '';
    if (registerLi) registerLi.style.display = '';
    if (logoutLi) logoutLi.remove();
  }
}

// Re-check on route changes
window.addEventListener('hashchange', () => {
  updateNavAuth();
  guardProtectedRoutes();
});

