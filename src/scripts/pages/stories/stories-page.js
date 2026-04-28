import { getStories, deleteStory, getCurrentUserId } from '../../data/api.js';
import Map from '../../utils/map.js';
import L from 'leaflet';
import { toggleFav, FAVORITES_UPDATED_EVENT, globalFavorites, globalFavIds, searchFavorites, sortFavorites, cleanupStaleFavorites } from '../../utils/favorites.js';
import { isLoggedIn } from '../../utils/auth.js';
import { showConfirm, showSuccess } from '../../utils/alert.js';
import Swal from 'sweetalert2';


let stories = [];
let favorites = [];
let favIds = new Set();
const PAGE_SIZE = 6;
let currentPage = 0; // 0-indexed
let filteredStories = [];

async function renderStoriesPage() {
  const content = document.createElement('section');
  content.innerHTML = `
    <header class="story-header">
      <h1>Story Map</h1>
      <label for="filter" class="search-label">
        🔍 <input type="search" id="filter" placeholder="Cari story..." aria-label="Filter stories">
      </label>
    </header>
    <div id="story-map" style="height: 500px; width: 100%; min-height: 500px; margin-bottom: 2rem;"></div>
    <section class="stories-preview mt-12">
      <div class="container">
        <h2 class="section-title mb-8">Stories Terbaru</h2>
        <div id="recent-stories" class="stories-grid"></div>
        <div id="stories-pagination" class="pagination-dots"></div>
      </div>
    </section>
    <section class="favorites-section mt-12">
      <div class="container">
        <h2 class="section-title mb-8">Favorites</h2>
        <div class="fav-controls">
          <input type="search" id="fav-search" placeholder="Cari favorites..." aria-label="Search favorites">
          <select id="fav-sort">
            <option value="date-desc">Tanggal ↓</option>
            <option value="date-asc">Tanggal ↑</option>
            <option value="name-desc">Nama ↓</option>
            <option value="name-asc">Nama ↑</option>
          </select>
        </div>
        <div id="favorites-grid" class="stories-grid"></div>
        <p id="fav-status" class="status-msg"></p>
      </div>
    </section>
  `;

  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(content);

  // Add loading state immediately
  const recentStoriesEl = content.querySelector('#recent-stories');
  const favGrid = content.querySelector('#favorites-grid');
  const favStatus = content.querySelector('#fav-status');
  const storyMapDiv = content.querySelector('#story-map');
  const favSearch = content.querySelector('#fav-search');
  const favSort = content.querySelector('#fav-sort');

  recentStoriesEl.innerHTML = `
    <div class="loading-container">
      <div class="loading loading-large"></div>
      <p class="loading-text">Loading stories...</p>
    </div>
  `;
  favGrid.innerHTML = `
    <div class="loading-container">
      <div class="loading"></div>
      <p class="loading-text">Loading favorites...</p>
    </div>
  `;

  // Init map (async, shows blank until ready)
  const storiesMap = await Map.build('#story-map', { zoom: 12, locate: true });

  // Load stories
  const loadStories = async () => {
    if (!isLoggedIn()) {
      window.location.hash = '#/login';
      recentStoriesEl.innerHTML = '<div class="loading-error">Please login to view stories.</div>';
      return;
    }
    try {
      const data = await getStories();
      stories = data;
      // Bersihkan favorites yang sudah tidak ada di backend
      await cleanupStaleFavorites();
      renderRecentStories(recentStoriesEl, stories);
      addMarkers(storiesMap, stories);
    } catch (error) {
      if (error.message.includes('401')) {
        localStorage.removeItem('token');
        window.location.hash = '#/login';
        return;
      }
      console.error('Error loading stories:', error);
      recentStoriesEl.innerHTML = '<div class="loading-error">Failed to load stories. Try refreshing.</div>';
      favStatus.textContent = 'Offline: using cached data';
    }
  };


  // Load favorites
  const loadFavorites = async () => {
    try {
      favorites = globalFavorites;
      favIds = new Set(globalFavIds);
      renderFavorites(favGrid, favorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      favGrid.innerHTML = '<div class="loading-error">Failed to load favorites.</div>';
    }
  };

  await loadStories();
  await loadFavorites();
  
  // Auto-scroll a bit down to recent stories after load (task: agak kebawah)
  setTimeout(() => {
    // Scroll a bit further down (agak kebawah more) to middle of recent stories
    window.scrollTo({ 
      top: 850, 
      behavior: 'smooth' 
    });
  }, 1200);

  // Add classes for scroll-hide
  const pageHeader = content.querySelector('header');
  const favControls = content.querySelector('.fav-controls');
  if (pageHeader) pageHeader.classList.add('story-header');
  if (favControls) favControls.classList.add('fav-controls');

  // Scroll hide/show logic
  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateScrollHide() {
    const currentScrollY = window.scrollY;
    if (currentScrollY > 100) {
      if (currentScrollY > lastScrollY + 10) {
        // Scroll down - hide
        pageHeader?.classList.add('hide-scroll');
        favControls?.classList.add('hide-scroll');
      } else if (currentScrollY < lastScrollY - 10) {
        // Scroll up - show
        pageHeader?.classList.remove('hide-scroll');
        favControls?.classList.remove('hide-scroll');
      }
    }
    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollHide);
      ticking = true;
    }
  });

  // Recent filter
  content.querySelector('#filter').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = stories.filter(s =>
      s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)
    );
    currentPage = 0;
    renderRecentStories(recentStoriesEl, filtered);
  });

  // Favorites interactive
  favSearch.addEventListener('input', debounce(renderFavoritesFilter, 300));
  favSort.addEventListener('change', debounce(renderFavoritesFilter, 300));

  function renderFavoritesFilter() {
    const query = favSearch.value;
    let filteredFavs = favorites;
    if (query) {
      filteredFavs = searchFavorites(query);
    }
    const sortValue = favSort.value;
    const [sortBy, direction] = sortValue.split('-');
    filteredFavs = sortFavorites(filteredFavs, sortBy, direction);
    renderFavorites(favGrid, filteredFavs);
    favStatus.textContent = `Showing ${filteredFavs.length} of ${favorites.length} favorites`;
  }

  // Global online/offline
  window.addEventListener('online', loadStories);
}

function renderRecentStories(container, storiesList) {
  filteredStories = storiesList;
  currentPage = 0;
  renderPage(container);
}

function renderPage(container) {
  const start = currentPage * PAGE_SIZE;
  const pageItems = filteredStories.slice(start, start + PAGE_SIZE);
  container.innerHTML = pageItems.map(story => createStoryCard(story)).join('') ||
    '<p style="text-align:center;color:var(--gray-400);padding:2rem;">Tidak ada stories.</p>';

  // Render pagination dots
  const paginationEl = document.getElementById('stories-pagination');
  if (!paginationEl) return;
  const totalPages = Math.ceil(filteredStories.length / PAGE_SIZE);
  if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

  paginationEl.innerHTML = Array.from({ length: totalPages }, (_, i) => `
    <button class="dot ${i === currentPage ? 'active' : ''}" data-page="${i}" aria-label="Halaman ${i + 1}"></button>
  `).join('');

  paginationEl.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentPage = parseInt(dot.dataset.page);
      renderPage(container);
      // Scroll ke grid tanpa trigger hashchange
      const top = container.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

function createStoryCard(story) {
  const isFav = globalFavIds.has(story.id);
  const currentUserId = getCurrentUserId();
  const isOwner = currentUserId && story.userId && story.userId === currentUserId;

  return `
    <article class="story-card" tabindex="0" role="button" onclick="window.location.hash = '#/story/${story.id}'">
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
        ${story.story ? `<p class="story-content"><strong>Story:</strong> ${story.story}</p>` : ''}
        <small>${new Date(story.createdAt).toLocaleDateString('id-ID')}</small>
      </div>
      ${isOwner ? `
      <div class="story-card-actions">
        <button class="action-btn edit-btn" data-id="${story.id}"
          onclick="window.editMyStory('${story.id}', event)"
          title="Edit story" aria-label="Edit story">✎</button>
        <button class="action-btn delete-btn" data-id="${story.id}"
          onclick="window.deleteMyStory('${story.id}', event)"
          title="Hapus story" aria-label="Hapus story">✕</button>
      </div>
      ` : ''}
    </article>
  `;
}

function renderFavorites(container, favList) {
  container.innerHTML = favList.map(story => createStoryCard(story)).join('') || 
    '<p style="display: none;">Tidak ada favorites. Tambahkan dari stories.</p>';
}

function addMarkers(map, storyList) {
  storyList.forEach(s => {
    if (s.lat && s.lon) {
      map.addMarker(parseFloat(s.lat), parseFloat(s.lon), `<b>${s.name}</b>`);
    }
  });
}

// Global favorites listener (sync with central toggleFav)
window.addEventListener(FAVORITES_UPDATED_EVENT, (e) => {
  favorites = globalFavorites;
  Object.assign(favIds, globalFavIds);

  // Update semua fav-overlay-btn secara realtime tanpa re-render
  document.querySelectorAll('.fav-overlay-btn').forEach(btn => {
    const id = btn.dataset.id;
    const isFav = globalFavIds.has(id);
    btn.classList.toggle('active', isFav);
    btn.textContent = isFav ? '❤️' : '🤍';
    btn.title = isFav ? 'Unlike' : 'Like';
    btn.setAttribute('aria-label', isFav ? 'Hapus favorit' : 'Tambah favorit');
  });

  // Re-render favorites grid
  const favGrid = document.querySelector('#favorites-grid');
  const favStatus = document.querySelector('#fav-status');
  if (favGrid && favStatus) {
    renderFavorites(favGrid, favorites);
    favStatus.textContent = `${favorites.length} favorites`;
  }
});

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Global edit handler
window.editMyStory = async (id, event) => {
  event?.stopPropagation();
  const story = stories.find(s => s.id === id);
  if (!story) return;

  let editLatLng = story.lat && story.lon
    ? { lat: parseFloat(story.lat), lng: parseFloat(story.lon) }
    : null;

  const { value: newDesc } = await Swal.fire({
    title: 'Edit Story',
    html: `
      <div style="text-align:left;">
        <label style="font-weight:600;font-size:.9rem;color:#475569;display:block;margin-bottom:.4rem;">Deskripsi</label>
        <textarea id="swal-desc" rows="3" style="width:100%;padding:12px;border-radius:12px;border:1.5px solid rgba(148,163,184,0.3);font-size:.95rem;resize:vertical;margin-bottom:1rem;">${story.description || ''}</textarea>
        <label style="font-weight:600;font-size:.9rem;color:#475569;display:block;margin-bottom:.4rem;">Lokasi (klik peta untuk ubah)</label>
        <div id="swal-latlng" style="font-size:.82rem;padding:.5rem .9rem;border-radius:10px;background:rgba(59,130,246,.07);border:1px dashed rgba(59,130,246,.3);margin-bottom:.75rem;color:#475569;">
          ${editLatLng ? `Lat: ${editLatLng.lat.toFixed(5)}, Lng: ${editLatLng.lng.toFixed(5)}` : 'Belum ada lokasi — klik peta'}
        </div>
        <div id="swal-edit-map" style="height:260px;border-radius:14px;"></div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#94a3b8',
    reverseButtons: true,
    width: '560px',
    didOpen: () => {
      // Init peta di dalam Swal
      const center = editLatLng ? [editLatLng.lat, editLatLng.lng] : [-7.7956, 110.3695];
      const swalMap = L.map('swal-edit-map').setView(center, editLatLng ? 13 : 5);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(swalMap);
      let marker = editLatLng ? L.marker([editLatLng.lat, editLatLng.lng]).addTo(swalMap) : null;
      swalMap.on('click', (e) => {
        editLatLng = e.latlng;
        if (marker) swalMap.removeLayer(marker);
        marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(swalMap).bindPopup('Lokasi baru').openPopup();
        const el = document.getElementById('swal-latlng');
        if (el) el.textContent = `Lat: ${e.latlng.lat.toFixed(5)}, Lng: ${e.latlng.lng.toFixed(5)}`;
      });
      // Simpan referensi untuk cleanup
      Swal.getPopup()._swalMap = swalMap;
    },
    willClose: () => {
      const popup = Swal.getPopup();
      if (popup?._swalMap) { popup._swalMap.remove(); }
    },
    preConfirm: () => {
      const desc = document.getElementById('swal-desc')?.value.trim();
      if (!desc) { Swal.showValidationMessage('Deskripsi tidak boleh kosong'); return false; }
      return desc;
    }
  });

  if (!newDesc) return;

  Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });

  try {
    const { API_BASE } = await import('../../config.js');
    const formData = new FormData();
    formData.append('description', newDesc);
    if (editLatLng) {
      formData.append('lat', editLatLng.lat);
      formData.append('lon', editLatLng.lng);
    }
    const response = await fetch(`${API_BASE}/stories/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData
    });
    const data = await response.json();
    if (data.error) throw new Error(data.message);

    const idx = stories.findIndex(s => s.id === id);
    if (idx >= 0) {
      stories[idx].description = newDesc;
      if (editLatLng) { stories[idx].lat = editLatLng.lat; stories[idx].lon = editLatLng.lng; }
    }

    Swal.fire({ icon: 'success', title: 'Berhasil diperbarui', timer: 1800, timerProgressBar: true, showConfirmButton: false });
    const recentStoriesEl = document.querySelector('#recent-stories');
    if (recentStoriesEl) renderRecentStories(recentStoriesEl, stories);
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, confirmButtonColor: '#ef4444' });
  }
};

// Global delete handler — hanya pemilik yang bisa hapus
window.deleteMyStory = async (id, event) => {
  event?.stopPropagation();
  const confirmed = await showConfirm(
    'Hapus Story?',
    'Story yang dihapus tidak bisa dikembalikan.'
  );
  if (!confirmed) return;

  Swal.fire({
    title: 'Menghapus...',
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    await deleteStory(id);
    stories = stories.filter(s => s.id !== id);
    Swal.fire({
      icon: 'success', title: 'Story Dihapus', text: 'Story berhasil dihapus.',
      timer: 2000, timerProgressBar: true, showConfirmButton: false,
    });
    const recentStoriesEl = document.querySelector('#recent-stories');
    if (recentStoriesEl) renderRecentStories(recentStoriesEl, stories);
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, confirmButtonColor: '#ef4444' });
  }
};

export default renderStoriesPage;
