import { getStories, deleteStory, getCurrentUserId } from '../data/api.js';
import { API_BASE } from '../config.js';
import Map from '../utils/map.js';
import L from 'leaflet';
import { isLoggedIn } from '../utils/auth.js';
import { toggleFav, FAVORITES_UPDATED_EVENT, globalFavIds } from '../utils/favorites.js';
import { showConfirm } from '../utils/alert.js';
import Swal from 'sweetalert2';

let stories = [];
let favIds = new Set();

async function renderStoryDetail(id) {
  const app = document.getElementById('app');
  const content = document.createElement('section');
  content.innerHTML = `<div class="loading-container"><div class="loading loading-large"></div></div>`;
  app.innerHTML = '';
  app.appendChild(content);

  if (!isLoggedIn()) {
    window.location.hash = '#/login';
    return;
  }

  try {
    stories = await getStories();
    const story = stories.find(s => s.id == id);
    if (!story) { content.innerHTML = '<p style="text-align:center;padding:2rem;">Story tidak ditemukan</p>'; return; }

    const isFav = globalFavIds.has(story.id);
    favIds = new Set(globalFavIds);
    const currentUserId = getCurrentUserId();
    const isOwner = currentUserId && story.userId && story.userId === currentUserId;

    content.innerHTML = `
      <div class="story-detail">
        <div class="story-detail-card">
          <button class="detail-back-btn" onclick="window.history.back()">← Kembali</button>
          <img src="${story.photoUrl || ''}" alt="${story.name}" class="cover">
          <div class="content">
            <h2>${story.name}</h2>
            <p class="location">${story.lat && story.lon ? `${parseFloat(story.lat).toFixed(5)}, ${parseFloat(story.lon).toFixed(5)}` : 'Tidak ada lokasi'}</p>
            <p class="date">${new Date(story.createdAt).toLocaleDateString('id-ID')}</p>
            ${story.description ? `<p style="margin-top:10px;">${story.description}</p>` : ''}
          </div>
          ${story.lat && story.lon ? `<div class="map-container"><div id="map"></div></div>` : ''}
          <div class="detail-actions">
            <button class="fav-overlay-btn ${isFav ? 'active' : ''}" id="detail-fav-btn" data-id="${story.id}"
              onclick="window.toggleFav('${story.id}', event)"
              title="${isFav ? 'Unlike' : 'Like'}">
              ${isFav ? '❤️' : '🤍'}
            </button>
            ${isOwner ? `
            <button class="action-btn edit-btn" id="detail-edit-btn"
              onclick="window.editDetailStory('${story.id}', event)" title="Edit story">✎</button>
            <button class="action-btn delete-btn" id="detail-delete-btn"
              onclick="window.deleteDetailStory('${story.id}', event)" title="Hapus story">✕</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    if (story.lat && story.lon) {
      Map.build('#map', { center: [parseFloat(story.lat), parseFloat(story.lon)], zoom: 15 })
        .then(m => m.addMarker(parseFloat(story.lat), parseFloat(story.lon), story.name));
    }

    // Edit handler
    window.editDetailStory = async (sid, ev) => {
      ev?.stopPropagation();
      let editLatLng = story.lat && story.lon
        ? { lat: parseFloat(story.lat), lng: parseFloat(story.lon) }
        : null;

      const result = await Swal.fire({
        title: 'Edit Story',
        html: `
          <div style="text-align:left;">
            <label style="font-weight:600;font-size:.9rem;color:#475569;display:block;margin-bottom:.4rem;">Deskripsi</label>
            <textarea id="swal-det-desc" rows="3" style="width:100%;padding:12px;border-radius:12px;border:1.5px solid rgba(148,163,184,0.3);font-size:.95rem;resize:vertical;margin-bottom:1rem;">${story.description || ''}</textarea>
            <label style="font-weight:600;font-size:.9rem;color:#475569;display:block;margin-bottom:.4rem;">Lokasi (klik peta untuk ubah)</label>
            <div id="swal-det-latlng" style="font-size:.82rem;padding:.5rem .9rem;border-radius:10px;background:rgba(59,130,246,.07);border:1px dashed rgba(59,130,246,.3);margin-bottom:.75rem;color:#475569;">
              ${editLatLng ? `Lat: ${editLatLng.lat.toFixed(5)}, Lng: ${editLatLng.lng.toFixed(5)}` : 'Belum ada lokasi — klik peta'}
            </div>
            <div id="swal-det-map" style="height:260px;border-radius:14px;"></div>
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
          const center = editLatLng ? [editLatLng.lat, editLatLng.lng] : [-7.7956, 110.3695];
          const swalMap = L.map('swal-det-map').setView(center, editLatLng ? 13 : 5);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(swalMap);
          let marker = editLatLng ? L.marker([editLatLng.lat, editLatLng.lng]).addTo(swalMap) : null;
          swalMap.on('click', (e) => {
            editLatLng = e.latlng;
            if (marker) swalMap.removeLayer(marker);
            marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(swalMap).bindPopup('Lokasi baru').openPopup();
            const el = document.getElementById('swal-det-latlng');
            if (el) el.textContent = `Lat: ${e.latlng.lat.toFixed(5)}, Lng: ${e.latlng.lng.toFixed(5)}`;
          });
          Swal.getPopup()._detMap = swalMap;
        },
        willClose: () => {
          Swal.getPopup()?._detMap?.remove();
        },
        preConfirm: () => {
          const desc = document.getElementById('swal-det-desc')?.value.trim();
          if (!desc) { Swal.showValidationMessage('Deskripsi tidak boleh kosong'); return false; }
          return desc;
        }
      });

      if (!result.isConfirmed || !result.value) return;
      const newDesc = result.value;

      Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
      try {
        const fd = new FormData();
        fd.append('description', newDesc);
        if (editLatLng) { fd.append('lat', editLatLng.lat); fd.append('lon', editLatLng.lng); }
        const res = await fetch(`${API_BASE}/stories/${sid}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: fd
        });
        const data = await res.json();
        if (data.error) throw new Error(data.message);
        story.description = newDesc;
        if (editLatLng) { story.lat = editLatLng.lat; story.lon = editLatLng.lng; }
        Swal.fire({ icon: 'success', title: 'Berhasil diperbarui', timer: 1800, timerProgressBar: true, showConfirmButton: false });
        // Re-render halaman detail
        renderStoryDetail(sid);
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, confirmButtonColor: '#ef4444' });
      }
    };

    // Delete handler
    window.deleteDetailStory = async (sid, ev) => {
      ev?.stopPropagation();
      const confirmed = await showConfirm('Hapus Story?', 'Story yang dihapus tidak bisa dikembalikan.');
      if (!confirmed) return;
      Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
      try {
        await deleteStory(sid);
        await Swal.fire({ icon: 'success', title: 'Story Dihapus', timer: 1800, timerProgressBar: true, showConfirmButton: false });
        window.location.hash = '#/stories';
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, confirmButtonColor: '#ef4444' });
      }
    };

  } catch (error) {
    content.innerHTML = `<p style="text-align:center;padding:2rem;color:#ef4444;">Error: ${error.message}</p>`;
  }
}

window.addEventListener(FAVORITES_UPDATED_EVENT, () => {
  Object.assign(favIds, globalFavIds);
});

export default renderStoryDetail;
