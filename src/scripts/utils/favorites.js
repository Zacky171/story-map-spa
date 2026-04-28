// utils/favorites.js - Client-side favorites (IndexedDB wrapper) + Global State Manager

import { getStories } from '../data/api.js';
import { getFavorites, addFavorite, removeFavorite } from './db.js';
import { showSuccess } from './alert.js';

// Global state (accessible from anywhere)
export let globalFavorites = [];
export let globalFavIds = new Set();
export let globalStories = [];  // Cache for toggleFav lookups

// Load global state on init + bersihkan favorites yang sudah tidak ada di backend
async function initGlobalFavorites() {
  globalFavorites = await getFavorites();
  globalFavIds = new Set(globalFavorites.map(f => f.id));
}

// Bersihkan favorites yang storynya sudah dihapus dari backend
export async function cleanupStaleFavorites() {
  try {
    const backendStories = await getStories();
    const backendIds = new Set(backendStories.map(s => String(s.id)));
    const stale = globalFavorites.filter(f => !backendIds.has(String(f.id)));
    for (const f of stale) {
      await removeFavorite(f.id);
      globalFavIds.delete(f.id);
    }
    globalFavorites = globalFavorites.filter(f => backendIds.has(String(f.id)));
    if (stale.length > 0) {
      window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT));
    }
  } catch (e) {
    console.warn('cleanupStaleFavorites error:', e);
  }
}

// Custom event for favorites changes
export const FAVORITES_UPDATED_EVENT = 'favorites-updated';

// Centralized toggleFav function
window.toggleFav = async (id, event) => {
  event?.stopPropagation();

  // Selalu refresh globalStories supaya story baru / milik sendiri selalu ketemu
  globalStories = await getStories();

  const story = globalStories.find(s => String(s.id) === String(id));
  if (!story) {
    console.warn('Story not found for toggleFav:', id);
    return;
  }

  const wasFav = globalFavIds.has(story.id);
  const nowFav = !wasFav;

  try {
    if (wasFav) {
      await removeFavorite(story.id);
      globalFavIds.delete(story.id);
      globalFavorites = globalFavorites.filter(f => f.id !== story.id);
    } else {
      await addFavorite(story);
      globalFavIds.add(story.id);
      globalFavorites = [...globalFavorites, story];
      showSuccess('Ditambahkan ke Favorites!');
    }

    // Update semua tombol like (fav-overlay-btn, fav-btn, action-btn.fav-btn)
    document.querySelectorAll(`[data-id="${story.id}"]`).forEach(btn => {
      const cls = btn.classList;
      if (!cls.contains('fav-overlay-btn') && !cls.contains('fav-btn')) return;
      cls.toggle('active', nowFav);
      btn.textContent = nowFav ? '❤️' : '🤍';
      btn.setAttribute('aria-label', nowFav ? 'Hapus favorit' : 'Tambah favorit');
      btn.title = nowFav ? 'Unlike' : 'Like';
    });

    window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT, {
      detail: { id: story.id, nowFav, favorites: globalFavorites }
    }));

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

