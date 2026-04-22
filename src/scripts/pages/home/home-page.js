import { fadeTransition } from '../../utils/transition.js';
import { isLoggedIn } from '../../utils/index.js';
import Map from '../../utils/map.js';
import { getStories } from '../../data/api.js';

async function renderHome() {
  const content = document.createElement('section');
  content.classList.add('hero-section', 'text-center');
  content.innerHTML = `
    <div class="hero-container full-width">
  <div class="hero-left">
    <h1 class="hero-title">Selamat Datang di Story Map</h1>
    
    <p class="hero-subtitle">
      Bagikan cerita Anda dengan peta interaktif dan foto.
      Temukan petualangan orang lain di sekitar Anda!
    </p>

    <div class="hero-buttons">
      <a href="#/register" data-nav class="btn primary">🚀 Mulai Petualangan</a>
      <a href="#/stories" data-nav class="btn secondary">📍 Lihat Stories</a>
    </div>

    <div class="hero-features">
      <div class="feature">🗺️ Peta Interaktif</div>
      <div class="feature">📸 Foto Cerita</div>
      <div class="feature">🌍 Lokasi Real</div>

    </div>
  </div>

  <div class="hero-right">
    <div id="home-map"></div>
  </div>
</div>

<section class="stories-preview mt-12">
  <div class="container">
    <h2 class="section-title mb-8">Stories Terbaru</h2>
    <div id="recent-stories" class="stories-grid"></div>
  </div>
</section>
  `;
  
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(content);
  
  const recentStoriesEl = content.querySelector('#recent-stories');

  // Enhanced loading with skeletons
  recentStoriesEl.innerHTML = Array(6).fill(0).map(() => `
    <article class="story-card skeleton skeleton-card">
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text" style="width: 60%;"></div>
    </article>
  `).join('') + `
    <div class="loading-container" style="grid-column: 1/-1; padding: 2rem;">
      <div class="loading loading-large"></div>
      <p class="loading-text">Loading recent stories...</p>
    </div>
  `;

  const homeMap = await Map.build('#home-map', { zoom: 13, locate: true });
  
  if (!isLoggedIn()) {
    recentStoriesEl.innerHTML = `
      <div class="loading-error" style="grid-column: 1/-1;">
        <p>Please login to view stories</p>
      </div>
  `;
  } else {
    try {
      const stories = await getStories();
      if (stories.length > 0) {
        recentStoriesEl.innerHTML = stories.slice(0, 6).map(story => `
          <article class="story-card">
            <img src="${story.photoUrl || '/src/images/logo.png'}" alt="${story.name}" loading="lazy">
            <div class="story-info">
              <h3>${story.name}</h3>
              <p>${story.description || 'No description'}</p>
              <small>🕒 ${new Date(story.createdAt).toLocaleDateString('id-ID')}</small>
            </div>
          </article>
        `).join('');
        
        stories.forEach(story => {
          if (homeMap && story.lat && story.lon) {
            homeMap.addMarker(parseFloat(story.lat), parseFloat(story.lon), `<b>${story.name}</b>`);
          }
        });
      } else {
        recentStoriesEl.innerHTML = '<p style="text-align: center; color: var(--gray-500);">No stories yet. Be the first to share!</p>';
      }
    } catch (error) {
      console.error('Home page load error:', error);
      recentStoriesEl.innerHTML = `
        <div class="loading-error" style="grid-column: 1/-1;">
          <p>Couldn't load stories</p>
          <p>Check your connection or try again</p>
        </div>
      `;
    }
  }

  // Global push toggle now in nav, skip home button
  // setupPushToggle(content); // Moved to nav

  content.classList.add('active');
}

async function setupPushToggle(content) {
  const toggleBtn = content.querySelector('#push-toggle');
  if (!toggleBtn || !('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const isSubscribed = window.__pushSubscribed ?? false;
  
  toggleBtn.textContent = isSubscribed ? '🔔 Unsubscribe' : '🔔 Subscribe';
  toggleBtn.classList.toggle('subscribed', isSubscribed);

  // Load push utils globally if not loaded
  if (!window.togglePushSubscription) {
    const pushModule = await import('../../utils/push.js');
    window.togglePushSubscription = pushModule.togglePushSubscription;
  }

toggleBtn.onclick = async () => {
    if (!isLoggedIn()) {
      alert('Please login to manage push notifications');
      return;
    }
    try {
      toggleBtn.disabled = true;
      toggleBtn.textContent = '⏳ ...';
      
      const result = await window.togglePushSubscription(registration);
      const nowSubscribed = result === 'subscribed';
      
      window.__pushSubscribed = nowSubscribed;
      toggleBtn.textContent = nowSubscribed ? '🔔 Unsubscribe' : '🔔 Subscribe';
      toggleBtn.classList.toggle('subscribed', nowSubscribed);
      
    } catch (error) {
      console.error('Push toggle failed:', error);
      alert('Gagal mengubah pengaturan push: ' + error.message);
      toggleBtn.textContent = isSubscribed ? '🔔 Unsubscribe' : '🔔 Subscribe';
    } finally {
      toggleBtn.disabled = false;
    }
  };
}

export default renderHome;
