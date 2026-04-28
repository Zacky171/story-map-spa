import { postStory } from '../../data/api.js';
import { MAP } from '../../config.js';
import { isLoggedIn } from '../../utils/auth.js';
import { showSuccess, showConfirm } from '../../utils/alert.js';
import Swal from 'sweetalert2';
import L from 'leaflet';

let addMap, selectedLatLng = null;

function initAddMap() {
  addMap = L.map('add-map').setView(MAP.center, MAP.zoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(addMap);
  
  addMap.on('click', e => {
    selectedLatLng = e.latlng;
    const latLngEl = document.getElementById('lat-lng-display');
    if (latLngEl) latLngEl.textContent = `📍 Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`;
    // Clear marker
    addMap.eachLayer(layer => {
      if (layer instanceof L.Marker) addMap.removeLayer(layer);
    });
    L.marker(e.latlng).addTo(addMap).bindPopup('Lokasi terpilih').openPopup();
  });
}

async function handleSubmit(e) {
  e.preventDefault();
  if (!isLoggedIn()) {
    window.location.hash = '#/login';
    return;
  }
  if (!selectedLatLng) {
    showError('Klik peta untuk memilih lokasi.');
    return;
  }

  // Konfirmasi sebelum publish
  const confirmed = await Swal.fire({
    title: 'Publikasikan Story?',
    text: 'Pastikan foto, deskripsi, dan lokasi sudah benar.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Publikasikan',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#94a3b8',
    reverseButtons: true,
  });
  if (!confirmed.isConfirmed) return;

  // Loading state
  Swal.fire({
    title: 'Mengunggah story...',
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading()
  });

  const formData = new FormData(e.target);
  formData.append('lat', selectedLatLng.lat || '');
  formData.append('lon', selectedLatLng.lng || '');

  try {
    await postStory(formData);
    await Swal.fire({
      icon: 'success',
      title: 'Story Berhasil Ditambahkan',
      text: window.__pushSubscribed
        ? 'Push notification akan dikirim ke subscriber.'
        : 'Story kamu sudah tampil di peta.',
      confirmButtonText: 'Lihat Stories',
      confirmButtonColor: '#3b82f6',
      timer: 3000,
      timerProgressBar: true,
    });
    window.location.hash = '#/stories';
  } catch (error) {
    Swal.close();
    showError('Gagal menambahkan story: ' + error.message + '. Coba gambar lebih kecil (<5MB).');
  }
}


function renderAddPage() {
  const content = document.createElement('section');
  content.classList.add('add-story-page');
  content.innerHTML = `
    <div class="add-header">
      <h1>Tambah Story Baru</h1>
      <p>Klik peta untuk menentukan lokasi cerita Anda</p>
    </div>
    <form id="add-story-form" class="add-form">
      <div class="form-row">
      <label for="image-upload">Gambar</label>
        <div class="form-group">
          <div class="image-inputs">
            <input type="file" id="image-upload" name="photo" accept="image/*" required>
          </div>
          <img id="image-preview" class="image-preview" alt="Preview gambar" style="display:none;">
        </div>
      </div>
      <div class="form-row">
      <label for="description">Deskripsi</label>
        <div class="form-group">
          <textarea id="description" name="description" rows="4" placeholder="Judul singkat pengalaman Anda..." required></textarea>
        </div>
      </div>
      <div class="map-section">
        <label>Pilih Lokasi di Peta (klik peta)</label>
        <div id="lat-lng-display" class="lat-lng">Klik peta untuk memilih lokasi 📍</div>
        <div id="add-map" class="add-map" style="height: 450px; width: 100%; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);"></div>
      </div>
      <div id="add-error" class="error" role="alert" style="display:none;"></div>
      <button type="submit" class="btn btn-primary">Publikasikan Story</button>
    </form>
  `;
  
  const form = content.querySelector('#add-story-form');
  form.onsubmit = handleSubmit;

  // File upload preview
  const fileInput = content.querySelector('#image-upload');
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const preview = content.querySelector('#image-preview');
      preview.src = URL.createObjectURL(file);
      preview.style.display = 'block';
    }
  };
  
  // Cleanup on page leave tidak perlu lagi (kamera sudah dihapus)

  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(content);
  setTimeout(() => {
    content.classList.add('active');
    initAddMap();
  }, 100);
}

function showError(msg) {
  const errorEl = document.getElementById('add-error');
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
  setTimeout(() => errorEl.style.display = 'none', 5000);
}

export default renderAddPage;

