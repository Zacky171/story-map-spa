import { API_BASE } from '../../config.js';
import Swal from 'sweetalert2';
import L from 'leaflet';

// ===== AUTH HELPERS =====
function getToken() { return localStorage.getItem('adminToken'); }
function parseJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return {}; }
}
function isAdminLoggedIn() {
  const t = getToken();
  if (!t) return false;
  const p = parseJWT(t);
  return p.isAdmin && p.exp * 1000 > Date.now();
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Authorization': `Bearer ${getToken()}`, ...(options.headers || {}) }
  });
  if (res.status === 401) { adminLogout(); throw new Error('Session expired'); }
  return res.json();
}

function adminLogout() {
  localStorage.removeItem('adminToken');
  renderAdminPage();
}

// ===== MAIN RENDER =====
export default function renderAdminPage() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  if (!isAdminLoggedIn()) {
    renderAdminLogin(app);
  } else {
    renderAdminPanel(app);
  }
}

// ===== LOGIN =====
function renderAdminLogin(app) {
  const el = document.createElement('section');
  el.className = 'admin-login-wrap';
  el.innerHTML = `
    <div class="admin-login-card card">
      <h1>Admin Panel</h1>
      <p class="subtitle">Masuk dengan akun admin</p>
      <form id="admin-login-form">
        <label>Email</label>
        <div class="form-group">
          <input type="email" id="adm-email" placeholder="admin@storymap.com" required autocomplete="email">
        </div>
        <label>Password</label>
        <div class="form-group">
          <input type="password" id="adm-pass" placeholder="Password" required autocomplete="current-password">
        </div>
        <div id="adm-err" class="error" style="display:none;"></div>
        <button type="submit" class="btn btn-primary large-btn" id="adm-login-btn">Masuk</button>
      </form>
      <p style="text-align:center;margin-top:1.5rem;font-size:0.85rem;color:var(--gray-400);">
        Hanya akun dengan role admin yang bisa masuk
      </p>
    </div>
  `;
  app.appendChild(el);
  setTimeout(() => el.classList.add('active'), 50);

  el.querySelector('#admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = el.querySelector('#adm-login-btn');
    const err = el.querySelector('#adm-err');
    err.style.display = 'none';
    btn.disabled = true; btn.textContent = 'Masuk...';
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: el.querySelector('#adm-email').value.trim(), password: el.querySelector('#adm-pass').value })
      });
      const data = await res.json();
      if (data.error || !data.loginResult) throw new Error(data.message || 'Login gagal');
      const payload = parseJWT(data.loginResult.token);
      if (!payload.isAdmin) throw new Error('Akun ini bukan admin');
      localStorage.setItem('adminToken', data.loginResult.token);
      renderAdminPage();
    } catch (error) {
      err.textContent = error.message; err.style.display = 'block';
    } finally {
      btn.disabled = false; btn.textContent = 'Masuk';
    }
  });
}

// ===== PANEL =====
let currentAdminPage = 'dashboard';

function renderAdminPanel(app) {
  const payload = parseJWT(getToken());
  const el = document.createElement('div');
  el.className = 'admin-panel';
  el.innerHTML = `
    <aside class="admin-sidebar" id="admin-sidebar">
      <div class="admin-sidebar-header">
        <span class="admin-sidebar-title">Story Map Admin</span>
        <button class="admin-sidebar-close" id="adm-close">✕</button>
      </div>
      <nav class="admin-sidebar-nav">
        <a href="#" class="admin-nav-item active" data-adm-page="dashboard">Dashboard</a>
        <a href="#" class="admin-nav-item" data-adm-page="users">Users</a>
        <a href="#" class="admin-nav-item" data-adm-page="stories">Stories</a>
        <a href="#" class="admin-nav-item" data-adm-page="map">Peta</a>
      </nav>
      <div class="admin-sidebar-footer">
        <button class="admin-logout-btn" id="adm-logout">Logout</button>
      </div>
    </aside>
    <div class="admin-main">
      <header class="admin-topbar">
        <button class="admin-menu-toggle" id="adm-menu">☰</button>
        <h2 class="admin-topbar-title" id="adm-page-title">Dashboard</h2>
        <span class="admin-topbar-user">${payload.name || 'Admin'}</span>
      </header>
      <main class="admin-content" id="adm-content">
        <div class="loading-container"><div class="loading loading-large"></div></div>
      </main>
    </div>
    <div class="admin-overlay" id="adm-overlay"></div>
  `;
  app.appendChild(el);

  // Nav
  el.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateAdmin(item.dataset.admPage, el);
      closeSidebar(el);
    });
  });

  el.querySelector('#adm-logout').addEventListener('click', () => {
    adminLogout();
  });

  el.querySelector('#adm-menu').addEventListener('click', () => {
    el.querySelector('#admin-sidebar').classList.add('open');
    el.querySelector('#adm-overlay').classList.add('show');
  });

  el.querySelector('#adm-close').addEventListener('click', () => closeSidebar(el));
  el.querySelector('#adm-overlay').addEventListener('click', () => closeSidebar(el));

  navigateAdmin('dashboard', el);
}

function closeSidebar(el) {
  el.querySelector('#admin-sidebar').classList.remove('open');
  el.querySelector('#adm-overlay').classList.remove('show');
}

function navigateAdmin(page, el) {
  currentAdminPage = page;
  el.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
  el.querySelector(`[data-adm-page="${page}"]`)?.classList.add('active');
  const titles = { dashboard: 'Dashboard', users: 'Kelola Users', stories: 'Kelola Stories', map: 'Peta Stories' };  el.querySelector('#adm-page-title').textContent = titles[page] || page;
  const content = el.querySelector('#adm-content');
  content.innerHTML = '<div class="loading-container"><div class="loading loading-large"></div></div>';
  if (page === 'dashboard') renderDashboard(content);
  else if (page === 'users') renderUsers(content);
  else if (page === 'stories') renderStories(content);
  else if (page === 'map') renderMap(content);
}

// ===== DASHBOARD =====
async function renderDashboard(content) {
  const data = await apiFetch('/admin/stats');
  const s = data.stats;
  content.innerHTML = `
    <div class="adm-stats-grid">
      <div class="adm-stat-card">
        <div class="adm-stat-value">${s.totalUsers}</div>
        <div class="adm-stat-label">Total Users</div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-value">${s.totalStories}</div>
        <div class="adm-stat-label">Total Stories</div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-value">${s.totalAdmins}</div>
        <div class="adm-stat-label">Admin</div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-value">${s.storiesWithLocation}</div>
        <div class="adm-stat-label">Berlokasi</div>
      </div>
    </div>
    <div class="adm-table-card" style="margin-top:1.5rem;">
      <div class="adm-table-header"><h3>Stories Terbaru</h3></div>
      <div id="adm-recent-stories"></div>
    </div>
  `;
  const d2 = await apiFetch('/admin/stories');
  const stories = (d2.stories || []).slice(0, 5);
  const el = content.querySelector('#adm-recent-stories');
  el.innerHTML = `<div class="adm-table-wrap"><table>
    <thead><tr><th>Foto</th><th>Deskripsi</th><th>Author</th><th>Tanggal</th></tr></thead>
    <tbody>${stories.map(s => `<tr>
      <td><img src="${s.photoUrl || ''}" class="adm-thumb" onerror="this.style.display='none'" alt=""></td>
      <td>${trunc(s.description, 60)}</td><td>${s.name}</td><td>${fmtDate(s.createdAt)}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

// ===== USERS =====
let allUsers = [];
async function renderUsers(content) {
  content.innerHTML = `
    <div class="adm-table-card">
      <div class="adm-table-header">
        <h3>Semua Users</h3>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;">
          <div class="adm-search-box"><input type="search" id="adm-user-search" placeholder="Cari..."></div>          <button class="btn btn-primary" style="padding:8px 18px;font-size:.85rem;border-radius:20px;" onclick="window.admAddUser()">+ Tambah</button>
        </div>
      </div>
      <div id="adm-users-table"><div class="loading-container"><div class="loading"></div></div></div>
    </div>
  `;
  const data = await apiFetch('/admin/users');
  allUsers = data.users || [];
  renderUsersTable(content);
  content.querySelector('#adm-user-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderUsersTable(content, allUsers.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
  });
}

function renderUsersTable(content, users = allUsers) {
  const el = content.querySelector('#adm-users-table');
  if (!el) return;
  if (!users.length) { el.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--gray-400);">Tidak ada users</p>'; return; }
  el.innerHTML = `<div class="adm-table-wrap"><table>
    <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Bergabung</th><th>Aksi</th></tr></thead>
    <tbody>${users.map(u => `<tr>
      <td>${u.name}</td><td>${u.email}</td>
      <td><span class="adm-badge ${u.isAdmin ? 'adm-badge-admin' : 'adm-badge-user'}">${u.isAdmin ? 'Admin' : 'User'}</span></td>
      <td>${fmtDate(u.createdAt)}</td>
      <td><div class="adm-actions">
        <button class="adm-btn-edit" onclick="window.admEditUser('${u.id}')">Edit</button>
        <button class="adm-btn-del" onclick="window.admDeleteUser('${u.id}','${u.name.replace(/'/g,"\\'")}')">Hapus</button>
      </div></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

window.admAddUser = () => {
  showAdmModal(`
    <h3>Tambah User</h3>
    <form id="adm-add-user-form">
      <label>Nama</label><div class="form-group"><input type="text" id="au-name" required placeholder="Nama lengkap"></div>
      <label>Email</label><div class="form-group"><input type="email" id="au-email" required placeholder="email@example.com"></div>
      <label>Password</label><div class="form-group"><input type="password" id="au-pass" required minlength="6" placeholder="Min 6 karakter"></div>
      <label>Role</label><div class="form-group"><select id="au-role" style="width:100%;padding:12px;border-radius:12px;border:1.5px solid rgba(148,163,184,0.3);font-size:1rem;">
        <option value="false">User</option><option value="true">Admin</option>
      </select></div>
      <div id="au-err" class="error" style="display:none;"></div>
      <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.5rem;">
        <button type="button" class="btn" style="background:var(--gray-200);color:var(--gray-700);box-shadow:none;" onclick="closeAdmModal()">Batal</button>
        <button type="submit" class="btn btn-primary" style="padding:10px 24px;">Simpan</button>
      </div>
    </form>
  `);
  document.getElementById('adm-add-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('au-err');
    try {
      const d = await apiFetch('/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: document.getElementById('au-name').value.trim(), email: document.getElementById('au-email').value.trim(),
          password: document.getElementById('au-pass').value, isAdmin: document.getElementById('au-role').value === 'true' }) });
      if (d.error) throw new Error(d.message);
      closeAdmModal();
      showAdmToast('User berhasil ditambahkan');
      const content = document.getElementById('adm-content');
      if (content) renderUsers(content);
    } catch (ex) { err.textContent = ex.message; err.style.display = 'block'; }
  });
};

window.admEditUser = (id) => {
  const u = allUsers.find(x => x.id === id);
  if (!u) return;
  showAdmModal(`
    <h3>Edit User</h3>
    <form id="adm-edit-user-form">
      <label>Nama</label><div class="form-group"><input type="text" id="eu-name" value="${u.name}" required></div>
      <label>Email</label><div class="form-group"><input type="email" id="eu-email" value="${u.email}" required></div>
      <label>Password Baru (kosongkan jika tidak diubah)</label><div class="form-group"><input type="password" id="eu-pass" minlength="6" placeholder="Password baru..."></div>
      <label>Role</label><div class="form-group"><select id="eu-role" style="width:100%;padding:12px;border-radius:12px;border:1.5px solid rgba(148,163,184,0.3);font-size:1rem;">
        <option value="false" ${!u.isAdmin ? 'selected' : ''}>User</option><option value="true" ${u.isAdmin ? 'selected' : ''}>Admin</option>
      </select></div>
      <div id="eu-err" class="error" style="display:none;"></div>
      <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.5rem;">
        <button type="button" class="btn" style="background:var(--gray-200);color:var(--gray-700);box-shadow:none;" onclick="closeAdmModal()">Batal</button>
        <button type="submit" class="btn btn-primary" style="padding:10px 24px;">Update</button>
      </div>
    </form>
  `);
  document.getElementById('adm-edit-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('eu-err');
    const payload = { name: document.getElementById('eu-name').value.trim(), email: document.getElementById('eu-email').value.trim(),
      isAdmin: document.getElementById('eu-role').value === 'true' };
    const pw = document.getElementById('eu-pass').value;
    if (pw) payload.password = pw;
    try {
      const d = await apiFetch(`/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (d.error) throw new Error(d.message);
      closeAdmModal(); showAdmToast('User diperbarui');
      const content = document.getElementById('adm-content');
      if (content) renderUsers(content);
    } catch (ex) { err.textContent = ex.message; err.style.display = 'block'; }
  });
};

window.admDeleteUser = async (id, name) => {
  const ok = await Swal.fire({ title: `Hapus "${name}"?`, text: 'Tidak bisa dikembalikan.', icon: 'warning',
    showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444', cancelButtonColor: '#94a3b8', reverseButtons: true });
  if (!ok.isConfirmed) return;
  const d = await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
  if (d.error) return showAdmToast(d.message, true);
  showAdmToast('User dihapus');
  const content = document.getElementById('adm-content');
  if (content) renderUsers(content);
};

// ===== STORIES =====
let allStories = [];
async function renderStories(content) {
  content.innerHTML = `
    <div class="adm-table-card">
      <div class="adm-table-header">
        <h3>Semua Stories</h3>
        <div class="adm-search-box"><input type="search" id="adm-story-search" placeholder="Cari..."></div>
      </div>
      <div id="adm-stories-table"><div class="loading-container"><div class="loading"></div></div></div>
    </div>
  `;
  const data = await apiFetch('/admin/stories');
  allStories = data.stories || [];
  renderStoriesTable(content);
  content.querySelector('#adm-story-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderStoriesTable(content, allStories.filter(s => s.description?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q)));
  });
}

function renderStoriesTable(content, stories = allStories) {
  const el = content.querySelector('#adm-stories-table');
  if (!el) return;
  if (!stories.length) { el.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--gray-400);">Tidak ada stories</p>'; return; }
  el.innerHTML = `<div class="adm-table-wrap"><table>
    <thead><tr><th>Foto</th><th>Deskripsi</th><th>Author</th><th>Lokasi</th><th>Tanggal</th><th>Aksi</th></tr></thead>
    <tbody>${stories.map(s => `<tr>
      <td><img src="${s.photoUrl || ''}" class="adm-thumb" onerror="this.style.display='none'" alt=""></td>
      <td>${trunc(s.description, 60)}</td><td>${s.name}</td>
      <td>${s.lat && s.lon ? `${parseFloat(s.lat).toFixed(3)}, ${parseFloat(s.lon).toFixed(3)}` : '—'}</td>
      <td>${fmtDate(s.createdAt)}</td>
      <td><div class="adm-actions">
        <button class="adm-btn-edit" onclick="window.admEditStory('${s.id}')">Edit</button>
        <button class="adm-btn-del" onclick="window.admDeleteStory('${s.id}','${trunc(s.description,30).replace(/'/g,"\\'")}')">Hapus</button>
      </div></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

let editStoryMap = null;
let editStoryLatLng = null;

window.admEditStory = (id) => {
  const s = allStories.find(x => x.id === id);
  if (!s) return;
  editStoryLatLng = s.lat && s.lon ? { lat: parseFloat(s.lat), lng: parseFloat(s.lon) } : null;

  showAdmModal(`
    <h3>Edit Story</h3>
    <form id="adm-edit-story-form">
      <label>Deskripsi</label>
      <div class="form-group">
        <textarea id="es-desc" rows="3" style="width:100%;padding:12px;border-radius:12px;border:1.5px solid rgba(148,163,184,0.3);font-size:.95rem;resize:vertical;">${s.description || ''}</textarea>
      </div>
      <label>Lokasi (klik peta untuk ubah)</label>
      <div id="es-latlng" style="font-size:.85rem;padding:.6rem 1rem;border-radius:10px;background:rgba(59,130,246,.07);border:1px dashed rgba(59,130,246,.3);margin-bottom:.75rem;color:var(--gray-600);">
        ${s.lat && s.lon ? `Lat: ${parseFloat(s.lat).toFixed(5)}, Lng: ${parseFloat(s.lon).toFixed(5)}` : 'Belum ada lokasi — klik peta'}
      </div>
      <div id="es-map" style="height:280px;border-radius:14px;margin-bottom:1rem;"></div>
      <div id="es-err" class="error" style="display:none;"></div>
      <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1rem;">
        <button type="button" class="btn" style="background:var(--gray-200);color:var(--gray-700);box-shadow:none;" onclick="closeAdmModal()">Batal</button>
        <button type="submit" class="btn btn-primary" style="padding:10px 24px;">Simpan</button>
      </div>
    </form>
  `);

  // Init peta setelah modal muncul
  setTimeout(() => {
    if (editStoryMap) { editStoryMap.remove(); editStoryMap = null; }
    const center = editStoryLatLng ? [editStoryLatLng.lat, editStoryLatLng.lng] : [-7.7956, 110.3695];
    editStoryMap = L.map('es-map').setView(center, editStoryLatLng ? 13 : 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(editStoryMap);

    let marker = null;
    if (editStoryLatLng) {
      marker = L.marker([editStoryLatLng.lat, editStoryLatLng.lng]).addTo(editStoryMap);
    }

    editStoryMap.on('click', (e) => {
      editStoryLatLng = e.latlng;
      if (marker) editStoryMap.removeLayer(marker);
      marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(editStoryMap).bindPopup('Lokasi baru').openPopup();
      const el = document.getElementById('es-latlng');
      if (el) el.textContent = `Lat: ${e.latlng.lat.toFixed(5)}, Lng: ${e.latlng.lng.toFixed(5)}`;
    });
  }, 150);

  document.getElementById('adm-edit-story-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('es-err');
    const fd = new FormData();
    fd.append('description', document.getElementById('es-desc').value.trim());
    if (editStoryLatLng) {
      fd.append('lat', editStoryLatLng.lat);
      fd.append('lon', editStoryLatLng.lng);
    }
    try {
      const d = await fetch(`${API_BASE}/stories/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: fd
      }).then(r => r.json());
      if (d.error) throw new Error(d.message);
      if (editStoryMap) { editStoryMap.remove(); editStoryMap = null; }
      closeAdmModal();
      showAdmToast('Story diperbarui');
      const content = document.getElementById('adm-content');
      if (content) renderStories(content);
    } catch (ex) { err.textContent = ex.message; err.style.display = 'block'; }
  });
};

window.admDeleteStory = async (id, desc) => {
  const ok = await Swal.fire({ title: 'Hapus story?', text: `"${desc}"`, icon: 'warning',
    showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444', cancelButtonColor: '#94a3b8', reverseButtons: true });
  if (!ok.isConfirmed) return;
  const d = await apiFetch(`/admin/stories/${id}`, { method: 'DELETE' });
  if (d.error) return showAdmToast(d.message, true);
  showAdmToast('Story dihapus');
  const content = document.getElementById('adm-content');
  if (content) renderStories(content);
};

// ===== MAP =====
let admMap = null;
async function renderMap(content) {
  content.innerHTML = `
    <div class="adm-table-card">
      <div class="adm-table-header"><h3>Peta Semua Stories</h3><span id="adm-map-count" style="color:var(--gray-400);font-size:.9rem;"></span></div>
      <div id="adm-map" style="height:500px;border-radius:16px;"></div>
    </div>
  `;
  setTimeout(async () => {
    if (admMap) { admMap.remove(); admMap = null; }
    admMap = L.map('adm-map').setView([-2.5, 118], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(admMap);
    const data = await apiFetch('/admin/stories');
    const stories = (data.stories || []).filter(s => s.lat && s.lon);
    document.getElementById('adm-map-count').textContent = `${stories.length} stories berlokasi`;
    stories.forEach(s => {
      L.marker([parseFloat(s.lat), parseFloat(s.lon)]).addTo(admMap)
        .bindPopup(`<div style="min-width:160px;">
          <img src="${s.photoUrl || ''}" style="width:100%;height:70px;object-fit:cover;border-radius:8px;margin-bottom:6px;" onerror="this.style.display='none'">
          <b>${s.name}</b><br><small>${trunc(s.description, 50)}</small>
        </div>`);
    });
  }, 100);
}

// ===== MODAL =====
function showAdmModal(html) {
  closeAdmModal();
  const ov = document.createElement('div');
  ov.id = 'adm-modal-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);z-index:9999;display:flex;justify-content:center;align-items:center;padding:1rem;';
  ov.innerHTML = `<div class="card" style="max-width:480px;width:100%;max-height:90vh;overflow-y:auto;animation:slideUp .3s ease;">${html}</div>`;
  ov.addEventListener('click', (e) => { if (e.target === ov) closeAdmModal(); });
  document.body.appendChild(ov);
}
window.closeAdmModal = () => { document.getElementById('adm-modal-overlay')?.remove(); };

// ===== TOAST =====
function showAdmToast(msg, isError = false) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:2rem;right:2rem;z-index:99999;background:rgba(255,255,255,.95);backdrop-filter:blur(20px);border-radius:16px;padding:1rem 1.5rem;box-shadow:0 20px 50px rgba(0,0,0,.15);border-left:4px solid ${isError ? '#ef4444' : '#10b981'};animation:slideUp .3s ease;max-width:300px;font-weight:500;`;
  t.textContent = (isError ? 'Gagal: ' : 'Berhasil: ') + msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ===== UTILS =====
function trunc(str, n) { if (!str) return ''; return str.length > n ? str.slice(0, n) + '...' : str; }
function fmtDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }
