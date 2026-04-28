import { isLoggedIn } from '../../utils/index.js';
import Map from '../../utils/map.js';
import { getStories } from '../../data/api.js';
import { globalFavIds, FAVORITES_UPDATED_EVENT } from '../../utils/favorites.js';

const HOME_PAGE_SIZE = 6;
let homeStories = [];
let homeCurrentPage = 0;
let homeContainer = null;
let homeContent = null;

async function renderHome() {
  const content = document.createElement('section');
  content.classList.add('hero-section', 'text-center');
  content.innerHTML = `
    <div class="hero-container full-width">
      <div class="hero-left">
        <h1 class="hero-title">Selamat Datang di Story Map</h1>
        <p class="hero-subtitle">Bagikan cerita Anda dengan peta interaktif dan foto. Temukan petualangan orang lain di sekitar Anda!</p>
        <div class="hero-buttons">
          <a href="#/login" data-nav class="btn primary" id="cta-btn">Mulai Petualangan</a>
          <a href="#/stories" data-nav class="btn secondary">Lihat Stories</a>
        </div>
        <div class="hero-features">
          <div class="feature">Peta Interaktif</div>
          <div class="feature">Foto Cerita</div>
          <div class="feature">Lokasi Real</div>
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
        <div id="home-pagination" class="pagination-dots"></div>
      </div>
    </section>
  `;

  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(content);

  const recentStoriesEl = content.querySelector('#recent-stories');

  // Skeleton loading
  recentStoriesEl.innerHTML = Array(6).fill(0).map(() => `
    <article class="story-card skeleton skeleton-card">
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text" style="width:60%;"></div>
    </article>
  `).join('');

  const homeMap = await Map.build('#home-map', { zoom: 13, locate: true });

  // Update CTA button berdasarkan status login
  const ctaBtn = content.querySelector('#cta-btn');
  if (ctaBtn) {
    if (isLoggedIn()) {
      ctaBtn.href = '#/add';
      ctaBtn.setAttribute('href', '#/add');
    } else {
      ctaBtn.href = '#/login';
      ctaBtn.setAttribute('href', '#/login');
    }
  }

  if (!isLoggedIn()) {
    recentStoriesEl.innerHTML = `<div class="loading-error" style="grid-column:1/-1;"><p>Login untuk melihat stories</p></div>`;
  } else {
    try {
      homeStories = await getStories();
      if (homeStories.length > 0) {
        homeCurrentPage = 0;
        homeContainer = recentStoriesEl;
        homeContent = content;
        renderHomePage(recentStoriesEl, content);
        homeStories.forEach(story => {
          if (homeMap && story.lat && story.lon) {
            homeMap.addMarker(parseFloat(story.lat), parseFloat(story.lon), `<b>${story.name}</b>`);
          }
        });
      } else {
        recentStoriesEl.innerHTML = '<p style="text-align:center;color:var(--gray-500);grid-column:1/-1;">Belum ada stories. Jadilah yang pertama!</p>';
      }
    } catch (error) {
      console.error('Home page load error:', error);
      recentStoriesEl.innerHTML = `<div class="loading-error" style="grid-column:1/-1;"><p>Gagal memuat stories</p></div>`;
    }
  }

  content.classList.add('active');
}

function renderHomePage(container, content) {
  const start = homeCurrentPage * HOME_PAGE_SIZE;
  const pageItems = homeStories.slice(start, start + HOME_PAGE_SIZE);

  container.innerHTML = pageItems.map(story => {
    const isFav = globalFavIds.has(story.id);
    return `
      <article class="story-card" onclick="window.location.hash='#/story/${story.id}'" style="cursor:pointer;">
        <div class="story-img-wrap">
          ${story.photoUrl
            ? `<img src="${story.photoUrl}" alt="${story.name}" loading="lazy">`
            : `<div class="story-img-placeholder"></div>`
          }
          <button class="fav-overlay-btn ${isFav ? 'active' : ''}" data-id="${story.id}"
            onclick="window.toggleFav('${story.id}', event)"
            aria-label="${isFav ? 'Hapus favorit' : 'Tambah favorit'}"
            title="${isFav ? 'Unlike' : 'Like'}">
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="story-info">
          <h3>${story.name}</h3>
          <p>${story.description || 'No description'}</p>
          <small>${new Date(story.createdAt).toLocaleDateString('id-ID')}</small>
        </div>
      </article>
    `;
  }).join('');

  // Pagination dots — hanya muncul jika > 6
  const paginationEl = content.querySelector('#home-pagination');
  if (!paginationEl) return;
  const totalPages = Math.ceil(homeStories.length / HOME_PAGE_SIZE);
  if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

  paginationEl.innerHTML = Array.from({ length: totalPages }, (_, i) => `
    <button class="dot ${i === homeCurrentPage ? 'active' : ''}" data-page="${i}" aria-label="Halaman ${i + 1}"></button>
  `).join('');

  paginationEl.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      homeCurrentPage = parseInt(dot.dataset.page);
      renderHomePage(container, content);
      const top = container.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// Sync like button saat favorites berubah
window.addEventListener(FAVORITES_UPDATED_EVENT, () => {
  if (!homeContainer || !homeContent) return;
  // Update semua fav-overlay-btn di home tanpa re-render penuh
  homeContainer.querySelectorAll('.fav-overlay-btn').forEach(btn => {
    const id = btn.dataset.id;
    const isFav = globalFavIds.has(id);
    btn.classList.toggle('active', isFav);
    btn.textContent = isFav ? '❤️' : '🤍';
    btn.title = isFav ? 'Unlike' : 'Like';
    btn.setAttribute('aria-label', isFav ? 'Hapus favorit' : 'Tambah favorit');
  });
});

export default renderHome;
