// Story Map Admin Panel JS
const API = window.location.origin + '/v1';
let adminToken = localStorage.getItem('adminToken');
let adminUser = null;
let adminMap = null;

// ===== AUTH =====
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('login-btn');
  const err = document.getElementById('login-error');
  err.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Masuk...';
  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.error || !data.loginResult) throw new Error(data.message || 'Login gagal');
    if (!data.loginResult.token) throw new Error('Token tidak ditemukan');
    // Verify admin
    const payload = parseJWT(data.loginResult.token);
    if (!payload.isAdmin) throw new Error('Akun ini bukan admin');
    adminToken = data.loginResult.token;
    adminUser = data.loginResult;
    localStorage.setItem('adminToken', adminToken);
    showAdminPanel();
  } catch (error) {
    err.textContent = error.message;
    err.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Masuk';
  }
});

document.getElementById('toggle-pass').addEventListener('click', () => {
  const inp = document.getElementById('password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});

function parseJWT(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch { return {}; }
}

function showAdminPanel() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'flex';
  const payload = parseJWT(adminToken);
  document.getElementById('admin-name').textContent = payload.name || 'Admin';
  navigateTo('dashboard');
}

function logout() {
  localStorage.removeItem('adminToken');
  adminToken = null;
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('login-page').style.display = 'flex';
}

document.getElementById('logout-btn').addEventListener('click', logout);

// ===== NAVIGATION =====
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo(item.dataset.page);
    closeSidebar();
  });
});

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const activeItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (activeItem) activeItem.classList.add('active');
  const titles = { dashboard: 'Dashboard', stories: 'Kelola Stories', users: 'Kelola Users', map: 'Story Map' };
  document.getElementById('page-title').textContent = titles[page] || page;
  const content = document.getElementById('main-content');
  content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  if (page === 'dashboard') renderDashboard();
  else if (page === 'stories') renderStories();
  else if (page === 'users') renderUsers();
  else if (page === 'map') renderMap();
}

// ===== SIDEBAR MOBILE =====
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.add('open');
  getOrCreateOverlay().classList.add('show');
});
document.getElementById('sidebar-close').addEventListener('click', closeSidebar);

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  const ov = document.getElementById('sidebar-overlay');
  if (ov) ov.classList.remove('show');
}

function getOrCreateOverlay() {
  let ov = document.getElementById('sidebar-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'sidebar-overlay';
    ov.className = 'sidebar-overlay';
    ov.addEventListener('click', closeSidebar);
    document.body.appendChild(ov);
  }
  return ov;
}

// ===== API HELPERS =====
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      ...(options.headers || {})
    }
  });
  if (res.status === 401) { logout(); throw new Error('Session expired'); }
  return res.json();
}

// ===== DASHBOARD =====
async function renderDashboard() {
  const content = document.getElementById('main-content');
  try {
    const data = await apiFetch('/admin/stats');
    const s = data.stats;
    content.innerHTML = `
      <div class="page">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-value">${s.totalUsers}</div>
            <div class="stat-label">Total Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📖</div>
            <div class="stat-value">${s.totalStories}</div>
            <div class="stat-label">Total Stories</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🛡️</div>
            <div class="stat-value">${s.totalAdmins}</div>
            <div class="stat-label">Admin</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📍</div>
            <div class="stat-value">${s.storiesWithLocation}</div>
            <div class="stat-label">Stories Berlokasi</div>
          </div>
        </div>
        <div class="table-card" style="margin-top:1.5rem;">
          <div class="table-header">
            <h3>📖 Stories Terbaru</h3>
            <button class="btn btn-sm btn-secondary" onclick="navigateTo('stories')">Lihat Semua</button>
          </div>
          <div id="recent-stories-table"></div>
        </div>
      </div>
    `;
    loadRecentStories();
  } catch (e) {
    content.innerHTML = `<div class="error">${e.message}</div>`;
  }
}

async function loadRecentStories() {
  const container = document.getElementById('recent-stories-table');
  if (!container) return;
  const data = await apiFetch('/admin/stories');
  const stories = (data.stories || []).slice(0, 5);
  if (!stories.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>Belum ada stories</p></div>';
    return;
  }
  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Foto</th><th>Deskripsi</th><th>Author</th><th>Tanggal</th></tr></thead>
        <tbody>
          ${stories.map(s => `
            <tr>
              <td><img src="${s.photoUrl || 'https://via.placeholder.com/50x40'}" class="story-thumb" alt="${s.name}" onerror="this.src='https://via.placeholder.com/50x40'"></td>
              <td>${truncate(s.description, 60)}</td>
              <td>${s.name}</td>
              <td>${formatDate(s.createdAt)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===== STORIES PAGE =====
async function renderStories() {
  const content = document.getElementById('main-content');
  content.innerHTML = `
    <div class="page">
      <div class="table-card">
        <div class="table-header">
          <h3>📖 Semua Stories</h3>
          <div class="search-box">
            <span>🔍</span>
            <input type="search" id="story-search" placeholder="Cari story...">
          </div>
        </div>
        <div id="stories-table"><div class="loading-spinner"><div class="spinner"></div></div></div>
      </div>
    </div>
  `;
  await loadStoriesTable();
  document.getElementById('story-search').addEventListener('input', debounce(filterStories, 300));
}

let allStories = [];

async function loadStoriesTable() {
  const data = await apiFetch('/admin/stories');
  allStories = data.stories || [];
  renderStoriesTable(allStories);
}

function renderStoriesTable(stories) {
  const container = document.getElementById('stories-table');
  if (!container) return;
  if (!stories.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>Tidak ada stories</p></div>';
    return;
  }
  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Foto</th><th>Deskripsi</th><th>Author</th><th>Lokasi</th><th>Tanggal</th><th>Aksi</th></tr></thead>
        <tbody>
          ${stories.map(s => `
            <tr>
              <td><img src="${s.photoUrl || 'https://via.placeholder.com/50x40'}" class="story-thumb" alt="${s.name}" onerror="this.src='https://via.placeholder.com/50x40'"></td>
              <td>${truncate(s.description, 70)}</td>
              <td>${s.name}</td>
              <td>${s.lat && s.lon ? `📍 ${parseFloat(s.lat).toFixed(3)}, ${parseFloat(s.lon).toFixed(3)}` : '—'}</td>
              <td>${formatDate(s.createdAt)}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-sm btn-danger" onclick="deleteStory('${s.id}', '${escapeAttr(s.description)}')">🗑 Hapus</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function filterStories() {
  const q = document.getElementById('story-search').value.toLowerCase();
  renderStoriesTable(allStories.filter(s =>
    s.description.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  ));
}

async function deleteStory(id, desc) {
  if (!confirm(`Hapus story "${truncate(desc, 40)}"?`)) return;
  try {
    const data = await apiFetch(`/admin/stories/${id}`, { method: 'DELETE' });
    if (data.error) throw new Error(data.message);
    showToast('Story berhasil dihapus');
    await loadStoriesTable();
  } catch (e) {
    showToast(e.message, true);
  }
}

// ===== USERS PAGE =====
async function renderUsers() {
  const content = document.getElementById('main-content');
  content.innerHTML = `
    <div class="page">
      <div class="table-card">
        <div class="table-header">
          <h3>👥 Semua Users</h3>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
            <div class="search-box">
              <span>🔍</span>
              <input type="search" id="user-search" placeholder="Cari user...">
            </div>
            <button class="btn btn-sm btn-success" onclick="showAddUserModal()">+ Tambah User</button>
          </div>
        </div>
        <div id="users-table"><div class="loading-spinner"><div class="spinner"></div></div></div>
      </div>
    </div>
  `;
  await loadUsersTable();
  document.getElementById('user-search').addEventListener('input', debounce(filterUsers, 300));
}

let allUsers = [];

async function loadUsersTable() {
  const data = await apiFetch('/admin/users');
  allUsers = data.users || [];
  renderUsersTable(allUsers);
}

function renderUsersTable(users) {
  const container = document.getElementById('users-table');
  if (!container) return;
  if (!users.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">👤</div><p>Tidak ada users</p></div>';
    return;
  }
  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Bergabung</th><th>Aksi</th></tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>${u.name}</td>
              <td>${u.email}</td>
              <td><span class="badge ${u.isAdmin ? 'badge-admin' : 'badge-user'}">${u.isAdmin ? 'Admin' : 'User'}</span></td>
              <td>${formatDate(u.createdAt)}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-sm btn-secondary" onclick="showEditUserModal('${u.id}')">✏️ Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}', '${escapeAttr(u.name)}')">🗑 Hapus</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function filterUsers() {
  const q = document.getElementById('user-search').value.toLowerCase();
  renderUsersTable(allUsers.filter(u =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  ));
}

function showAddUserModal() {
  showModal(`
    <h3>➕ Tambah User Baru</h3>
    <form id="add-user-form">
      <label>Nama</label>
      <div class="form-group"><input type="text" id="u-name" placeholder="Nama lengkap" required></div>
      <label>Email</label>
      <div class="form-group"><input type="email" id="u-email" placeholder="email@example.com" required></div>
      <label>Password</label>
      <div class="form-group"><input type="password" id="u-password" placeholder="Min 6 karakter" minlength="6" required></div>
      <label>Role</label>
      <div class="form-group">
        <select id="u-role" style="width:100%;padding:12px;border-radius:12px;border:1.5px solid rgba(148,163,184,0.3);background:rgba(255,255,255,0.7);font-size:1rem;">
          <option value="false">User</option>
          <option value="true">Admin</option>
        </select>
      </div>
      <div id="add-user-error" class="error" style="display:none;"></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Batal</button>
        <button type="submit" class="btn btn-primary" id="add-user-btn">Simpan</button>
      </div>
    </form>
  `);
  document.getElementById('add-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('add-user-btn');
    const err = document.getElementById('add-user-error');
    btn.disabled = true; btn.textContent = 'Menyimpan...';
    try {
      const data = await apiFetch('/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('u-name').value.trim(),
          email: document.getElementById('u-email').value.trim(),
          password: document.getElementById('u-password').value,
          isAdmin: document.getElementById('u-role').value === 'true'
        })
      });
      if (data.error) throw new Error(data.message);
      closeModal();
      showToast('User berhasil ditambahkan');
      await loadUsersTable();
    } catch (error) {
      err.textContent = error.message; err.style.display = 'block';
    } finally {
      btn.disabled = false; btn.textContent = 'Simpan';
    }
  });
}

async function showEditUserModal(id) {
  const user = allUsers.find(u => u.id === id);
  if (!user) return;
  showModal(`
    <h3>✏️ Edit User</h3>
    <form id="edit-user-form">
      <label>Nama</label>
      <div class="form-group"><input type="text" id="eu-name" value="${user.name}" required></div>
      <label>Email</label>
      <div class="form-group"><input type="email" id="eu-email" value="${user.email}" required></div>
      <label>Password Baru (kosongkan jika tidak diubah)</label>
      <div class="form-group"><input type="password" id="eu-password" placeholder="Password baru..." minlength="6"></div>
      <label>Role</label>
      <div class="form-group">
        <select id="eu-role" style="width:100%;padding:12px;border-radius:12px;border:1.5px solid rgba(148,163,184,0.3);background:rgba(255,255,255,0.7);font-size:1rem;">
          <option value="false" ${!user.isAdmin ? 'selected' : ''}>User</option>
          <option value="true" ${user.isAdmin ? 'selected' : ''}>Admin</option>
        </select>
      </div>
      <div id="edit-user-error" class="error" style="display:none;"></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Batal</button>
        <button type="submit" class="btn btn-primary" id="edit-user-btn">Update</button>
      </div>
    </form>
  `);
  document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('edit-user-btn');
    const err = document.getElementById('edit-user-error');
    btn.disabled = true; btn.textContent = 'Menyimpan...';
    const payload = {
      name: document.getElementById('eu-name').value.trim(),
      email: document.getElementById('eu-email').value.trim(),
      isAdmin: document.getElementById('eu-role').value === 'true'
    };
    const pw = document.getElementById('eu-password').value;
    if (pw) payload.password = pw;
    try {
      const data = await apiFetch(`/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (data.error) throw new Error(data.message);
      closeModal();
      showToast('User berhasil diupdate');
      await loadUsersTable();
    } catch (error) {
      err.textContent = error.message; err.style.display = 'block';
    } finally {
      btn.disabled = false; btn.textContent = 'Update';
    }
  });
}

async function deleteUser(id, name) {
  if (!confirm(`Hapus user "${name}"?`)) return;
  try {
    const data = await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
    if (data.error) throw new Error(data.message);
    showToast('User berhasil dihapus');
    await loadUsersTable();
  } catch (e) {
    showToast(e.message, true);
  }
}

// ===== MAP PAGE =====
async function renderMap() {
  const content = document.getElementById('main-content');
  content.innerHTML = `
    <div class="page">
      <div class="table-card">
        <div class="table-header">
          <h3>🗺️ Peta Semua Stories</h3>
          <span id="map-story-count" style="color:var(--gray-500);font-size:0.9rem;"></span>
        </div>
        <div id="admin-map"></div>
      </div>
    </div>
  `;
  // Small delay to ensure DOM is ready
  setTimeout(async () => {
    if (adminMap) { adminMap.remove(); adminMap = null; }
    adminMap = L.map('admin-map').setView([-2.5, 118], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(adminMap);
    const data = await apiFetch('/admin/stories');
    const stories = data.stories || [];
    const withLoc = stories.filter(s => s.lat && s.lon);
    document.getElementById('map-story-count').textContent = `${withLoc.length} stories berlokasi`;
    withLoc.forEach(s => {
      L.marker([parseFloat(s.lat), parseFloat(s.lon)])
        .addTo(adminMap)
        .bindPopup(`
          <div style="min-width:180px;">
            <img src="${s.photoUrl || ''}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:6px;" onerror="this.style.display='none'">
            <b>${s.name}</b><br>
            <small>${truncate(s.description, 60)}</small><br>
            <small style="color:#94a3b8;">${formatDate(s.createdAt)}</small>
          </div>
        `);
    });
  }, 100);
}

// ===== MODAL =====
function showModal(html) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
}

function closeModal() {
  const existing = document.getElementById('modal-overlay');
  if (existing) existing.remove();
}

// ===== TOAST =====
function showToast(msg, isError = false) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast${isError ? ' error' : ''}`;
  toast.textContent = (isError ? '❌ ' : '✅ ') + msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== UTILS =====
function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '...' : str;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeAttr(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ===== INIT =====
if (adminToken) {
  const payload = parseJWT(adminToken);
  if (payload.isAdmin && payload.exp * 1000 > Date.now()) {
    adminUser = { name: payload.name };
    showAdminPanel();
  } else {
    localStorage.removeItem('adminToken');
  }
}
