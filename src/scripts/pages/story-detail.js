import { getStories } from '../data/api.js';
import Map from '../utils/map.js';
import { isLoggedIn } from '../utils/auth.js';
import { toggleFav, FAVORITES_UPDATED_EVENT, globalFavIds } from '../utils/favorites.js';
import { showSuccess } from '../utils/alert.js';


let stories = [];
let favIds = new Set();

async function renderStoryDetail(id) {
  const app = document.getElementById('app');
  const content = document.createElement('section');
  content.innerHTML = `
    <header>
      <h1>Story Detail</h1>
      <button onclick="window.history.back()">← Back</button>
    </header>
    <div class="loading">Loading...</div>
  `;

  app.innerHTML = '';
  app.appendChild(content);

  if (!isLoggedIn()) {
    content.innerHTML = '<div class="loading-error">Please login to view story details.</div>';
    window.location.hash = '#/login';
    return;
  }

  try {
    stories = await getStories();

    const story = stories.find(s => s.id == id);
    if (!story) {
      content.innerHTML = '<p>Story not found</p>';
      return;
    }

    const isFav = globalFavIds.has(story.id);
    favIds = new Set(globalFavIds);

content.innerHTML = `
      <div class="story-detail">
        <div class="story-detail-card">
          <img src="${story.photoUrl || ''}" alt="${story.name}" class="cover">
          <div class="content">
            <h2>${story.name}</h2>
            <p class="location">📍 ${story.lat && story.lon ? `Lat: ${story.lat}, Lng: ${story.lon}` : 'No location'}</p>
            <p class="date">${new Date(story.createdAt).toLocaleDateString('id-ID')}</p>
            ${story.description ? `<p style="margin-top: 10px;">${story.description}</p>` : ''}
            ${story.story ? `<div class="story-content" style="margin-top: 15px;">${story.story}</div>` : ''}
          </div>
          ${story.lat && story.lon ? `
            <div class="map-container">
              <div id="map"></div>
              <button id="likeBtn" onclick="window.toggleFav('${story.id}', event)" class="fav-btn ${isFav ? 'active' : ''}" data-id="${story.id}">
                ${isFav ? '❤️ ' : '🤍 '}
              </button>
            </div>
          ` : `
            <div class="map-container">
              <button id="likeBtn" onclick="window.toggleFav('${story.id}', event)" class="fav-btn ${isFav ? 'active' : ''}" data-id="${story.id}">
                ${isFav ? '❤️ ' : '🤍 '}
              </button>
            </div>
          `}
        </div>
      </div>
    `;

    if (story.lat && story.lon) {
      Map.build('#map', { center: [parseFloat(story.lat), parseFloat(story.lon)], zoom: 15 })
        .then(map => map.addMarker(parseFloat(story.lat), parseFloat(story.lon), story.name));
    }
  } catch (error) {
    content.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

// Listen for global favorites updates
window.addEventListener(FAVORITES_UPDATED_EVENT, () => {
  // Sync local favIds with global
  Object.assign(favIds, globalFavIds);
  console.log('Story detail: favorites synced globally');
});

export default renderStoryDetail;
