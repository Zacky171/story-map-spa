// utils/favorites.js - Client-side favorites (IndexedDB wrapper) + Global State Manager

import { getStories } from '../data/api.js';
import { getFavorites, addFavorite, removeFavorite } from './db.js';
import { showSuccess } from './alert.js';

// Global state (accessible from anywhere)
export let globalFavorites = [];
export let globalFavIds = new Set();
export let globalStories = [];  // Cache for toggleFav lookups

// Load global state on init
async function initGlobalFavorites() {
  globalFavorites = await getFavorites();
  globalFavIds = new Set(globalFavorites.map(f => f.id));
}

// Custom event for favorites changes
export const FAVORITES_UPDATED_EVENT = 'favorites-updated';

// Centralized toggleFav function
window.toggleFav = async (id, event) => {
  event?.stopPropagation();
  
  // Ensure globalStories loaded for story lookup
  if (!globalStories.length) {
    globalStories = await getStories();
  }
  
  const story = globalStories.find(s => s.id == id);
  if (!story) {
    console.warn('Story not found for toggleFav:', id);
    return;
  }

  const wasFav = globalFavIds.has(id);
  const nowFav = !wasFav;

  try {
    if (wasFav) {
      await removeFavorite(id);
      globalFavIds.delete(id);
      globalFavorites = globalFavorites.filter(f => f.id !== id);
    } else {
      await addFavorite(story);
      globalFavIds.add(id);
      globalFavorites = [...globalFavorites, story];
      showSuccess('Ditambahkan ke Favorites!');
    }

    // Update ALL buttons globally
    const allButtons = document.querySelectorAll(`.fav-btn[data-id="${id}"]`);
    allButtons.forEach(btn => {
      btn.classList.toggle('active', nowFav);
      btn.textContent = nowFav ? '❤️ ' : '🤍 ';
      btn.setAttribute('aria-label', nowFav ? 'Remove favorite' : 'Add favorite');
      btn.title = nowFav ? 'Unlike' : 'Like';
    });

    // Dispatch event for other pages to react
    window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT, { 
      detail: { id, nowFav, favorites: globalFavorites } 
    }));

    console.log(`Favorites ${nowFav ? 'added' : 'removed'}:`, id, 'Total:', globalFavorites.length);

  } catch (error) {
    console.error('Toggle favorite failed:', error);
  }
};

// Listen for IndexedDB changes via storage event (cross-tab sync)
window.addEventListener('storage', (e) => {
  if (e.key === 'favorites') {
    initGlobalFavorites().then(() => {
      window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT));
    });
  }
});

// Auto-init when favorites.js loaded
initGlobalFavorites().catch(console.error);

// Re-exports
export { getFavorites, addFavorite, removeFavorite, searchFavorites, sortFavorites } from './db.js';

