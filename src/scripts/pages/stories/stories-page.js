import { getStories } from '../../data/api.js';
import Map from '../../utils/map.js';
import { toggleFav, FAVORITES_UPDATED_EVENT, globalFavorites, globalFavIds, searchFavorites, sortFavorites } from '../../utils/favorites.js';
import { isLoggedIn } from '../../utils/auth.js';
import { showSuccess } from '../../utils/alert.js';


let stories = [];
let favorites = [];
let favIds = new Set();

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
      </div>
    </section>
    <section class="favorites-section mt-12">
      <div class="container">
        <h2 class="section-title mb-8">Favorites <small>(IndexedDB)</small></h2>
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
    renderRecentStories(recentStoriesEl, filtered.slice(0,6));
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
  container.innerHTML = storiesList.slice(0, 6).map(story => createStoryCard(story)).join('') || 
    '<p style="display: none;">Tidak ada stories.</p>';
}

function createStoryCard(story) {
  const isFav = globalFavIds.has(story.id);
  return `
    <article class="story-card" tabindex="0" role="button" onclick="window.location.hash = '#/story/${story.id}'">
      <img src="${story.photoUrl || ''}" alt="${story.name}" loading="lazy">
      <div class="story-info">
        <h3>${story.name}</h3>
        <p>${story.description || 'No description'}</p>
        ${story.story ? `<p class="story-content"><strong>Story:</strong> ${story.story}</p>` : ''}
        <small>🕒 ${new Date(story.createdAt).toLocaleDateString('id-ID')}</small>
      </div>
<button class="fav-btn ${isFav ? 'active' : ''}" data-id="${story.id}" onclick="window.toggleFav('${story.id}', event)" aria-label="${isFav ? 'Remove favorite' : 'Add favorite'}" title="${isFav ? 'Unlike' : 'Like'}">
        ${isFav ? '❤️ ' : '🤍 '}
      </button>
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
  
  // Re-render favorites if on page
  const favGrid = document.querySelector('#favorites-grid');
  const favStatus = document.querySelector('#fav-status');
  if (favGrid && favStatus) {
    renderFavorites(favGrid, favorites);
    favStatus.textContent = `${favorites.length} favorites`;
  }
  console.log('Stories page: favorites synced globally');
});

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export default renderStoriesPage;
