import { openDB } from 'idb';

const DB_NAME = 'storymap-v1';
const FAV_STORE = 'favorites';
const SYNC_STORE = 'pendingSync';

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(FAV_STORE)) {
        db.createObjectStore(FAV_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SYNC_STORE)) {
        db.createObjectStore(SYNC_STORE, { autoIncrement: true });
      }
    }
  });
}

export async function addFavorite(story) {
  const db = await getDB();
  story.favTimestamp = Date.now();
  await db.put(FAV_STORE, story);
  if (!navigator.onLine) {
    await db.add(SYNC_STORE, {
      action: 'addFav',
      storyId: story.id,
      timestamp: Date.now()
    });
  }
}

export async function removeFavorite(id) {
  const db = await getDB();
  await db.delete(FAV_STORE, id);
}

export async function getFavorites() {
  const db = await getDB();
  return await db.getAll(FAV_STORE);
}

export async function searchFavorites(query) {
  const favorites = await getFavorites();
  query = query.toLowerCase();
  return favorites.filter(story => 
    story.name.toLowerCase().includes(query) ||
    story.description.toLowerCase().includes(query)
  );
}

export async function sortFavorites(favorites, sortBy = 'date', direction = 'desc') {
  return [...favorites].sort((a, b) => {
    if (sortBy === 'name') {
      return direction === 'desc' 
        ? b.name.localeCompare(a.name) 
        : a.name.localeCompare(b.name);
    }
    return direction === 'desc' 
      ? b.favTimestamp - a.favTimestamp 
      : a.favTimestamp - b.favTimestamp;
  });
}

export async function getPendingSync() {
  const db = await getDB();
  return await db.getAll(SYNC_STORE);
}

export async function syncPendingStories() {
  const db = await getDB();
  const pending = await getPendingSync();
  for (const item of pending) {
    try {
      // Mock sync logic - in real app, sync to server
      // For demo, mark as synced by updating timestamp
      const story = await db.get(FAV_STORE, item.storyId);
      if (story) {
        story.syncedTimestamp = Date.now();
        await db.put(FAV_STORE, story);
      }
      await db.delete(SYNC_STORE, item.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

// Auto sync when online
window.addEventListener('online', syncPendingStories);

