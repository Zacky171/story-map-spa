import { slideTransition } from '../../utils/transition.js';
import L from 'leaflet';
import { postStory } from '../../data/api.js';
import { MAP } from '../../config.js';
import { isLoggedIn } from '../../utils/auth.js';


let addMap, selectedLatLng = null;
let cameraStream = null;

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
  const formData = new FormData(e.target);
  formData.append('lat', selectedLatLng.lat || '');
  formData.append('lon', selectedLatLng.lng || '');
  
  try {
    const newStoryId = await postStory(formData);
    const pushMsg = window.__pushSubscribed 
      ? 'Story berhasil ditambahkan! Push notification akan dikirim.' 
      : 'Story berhasil ditambahkan!';
    alert(pushMsg);
    window.location.hash = '#/stories';
  } catch (error) {
    showError('Gagal menambahkan story: ' + error.message + '. Coba gambar lebih kecil (<5MB).');
  }
}


function getCameraStream() {
  if (cameraStream) {
    stopCamera();
  }
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      cameraStream = stream;
      const video = document.getElementById('camera-preview');
      video.srcObject = stream;
      video.style.display = 'block';
      document.getElementById('capture').style.display = 'block';
      const capture = document.getElementById('capture');
      capture.onclick = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const imageFile = canvas.toDataURL('image/jpeg', 0.8);
        // Set to input or img preview
        document.getElementById('image-preview').src = imageFile;
        // Note: For FormData, need to convert dataURL to Blob
        const byteString = atob(imageFile.split(',')[1]);
        const mimeString = imageFile.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], {type: mimeString});
        const file = new File([blob], 'captured.jpg', { type: mimeString });
        const dt = new DataTransfer();
        dt.items.add(file);
        document.querySelector('input[name="photo"]').files = dt.files;
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          const imageFile = new File([blob], 'captured.jpg', { type: 'image/jpeg' });
          const dt = new DataTransfer();
          dt.items.add(imageFile);
          document.querySelector('input[name="photo"]').files = dt.files;
          const preview = document.getElementById('image-preview');
          preview.src = URL.createObjectURL(blob);
          preview.style.display = 'block';
        }, 'image/jpeg', 0.8);
        stopCamera();
      };
    })
    .catch(err => console.error('Camera error:', err));
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  const video = document.getElementById('camera-preview');
  if (video) {
    video.srcObject = null;
    video.style.display = 'none';
  }
  const captureBtn = document.getElementById('capture');
  if (captureBtn) {
    captureBtn.style.display = 'none';
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
            <button type="button" id="camera-btn" class="btn-secondary">📷 Kamera</button>
          </div>
          <video id="camera-preview" class="camera-preview" style="display:none;"></video>
          <canvas id="canvas" style="display:none;"></canvas>
          <img id="image-preview" class="image-preview" alt="Preview gambar">
          <button type="button" id="capture" class="btn btn-secondary" style="display:none;">Capture</button>
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
      <button type="submit" class="btn btn-primary">📍 Publikasikan Story</button>
    </form>
  `;
  
  const form = content.querySelector('#add-story-form');
  form.onsubmit = handleSubmit;
  content.querySelector('#camera-btn').onclick = getCameraStream;
  
  // File upload preview
  const fileInput = content.querySelector('#image-upload');
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const preview = document.getElementById('image-preview');
      preview.src = URL.createObjectURL(file);
      preview.style.display = 'block';
      stopCamera(); // Stop camera if file selected
    }
  };
  
  // Cleanup on page leave
  const cleanup = () => stopCamera();
  window.addEventListener('hashchange', cleanup);
  window.addEventListener('beforeunload', cleanup);
  
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(content);
  setTimeout(() => {
    content.classList.add('active');
    initAddMap();
  }, 100);
  
  // Cleanup function for external use
  window.stopAddCamera = stopCamera;
}

function showError(msg) {
  const errorEl = document.getElementById('add-error');
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
  setTimeout(() => errorEl.style.display = 'none', 5000);
}

export default renderAddPage;

