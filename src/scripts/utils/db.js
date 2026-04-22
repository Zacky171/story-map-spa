import { openDB } from 'idb';

const DB_NAME = 'storydb';
const DB_VERSION = 2;
const STORE_STORIES = 'stories';
const STORE_PENDING = 'pendingSyncs';
const STORE_FAVORITES = 'favorites';

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_STORIES)) {
        db.createObjectStore(STORE_STORIES, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        db.createObjectStore(STORE_PENDING, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_FAVORITES)) {
        db.createObjectStore(STORE_FAVORITES, { keyPath: 'id' });
      }
    },
  });
}

export async function getAllStories() {
  const db = await getDB();
  return db.getAll(STORE_STORIES);
}

export async function putStory(story) {
  const db = await getDB();
  return db.put(STORE_STORIES, story);
}

export async function deleteStory(id) {
  const db = await getDB();
  return db.delete(STORE_STORIES, id);
}

export async function addPending(postData) {
  const db = await getDB();
  const timestamp = Date.now();
  return db.add(STORE_PENDING, { ...postData, timestamp });
}

export async function getPending() {
  const db = await getDB();
  return db.getAll(STORE_PENDING);
}

export async function deletePending(id) {
  const db = await getDB();
  return db.delete(STORE_PENDING, id);
}

export async function clearPending() {
  const db = await getDB();
  const pendings = await getPending();
  await Promise.all(pendings.map(p => deletePending(p.id)));
}

// Favorites functions
export async function getFavorites() {
  const db = await getDB();
  return db.getAll(STORE_FAVORITES);
}

export async function addFavorite(story) {
  const db = await getDB();
  return db.put(STORE_FAVORITES, story);
}

export async function removeFavorite(id) {
  const db = await getDB();
  return db.delete(STORE_FAVORITES, id);
}

export async function searchFavorites(query) {
  const favorites = await getFavorites();
  return favorites.filter(f => 
    f.name.toLowerCase().includes(query.toLowerCase()) ||
    f.description.toLowerCase().includes(query.toLowerCase())
  );
}

export async function sortFavorites(favorites, sortBy = 'date', direction = 'desc') {
  return [...favorites].sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}
