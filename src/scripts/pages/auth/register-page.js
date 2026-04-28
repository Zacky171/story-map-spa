import { fadeTransition } from '../../utils/transition.js';
import { register } from '../../utils/auth.js';

function getPasswordStrength(password) {
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.match(/[a-z]/)) strength++;
  if (password.match(/[A-Z]/)) strength++;
  if (password.match(/[0-9]/)) strength++;
  if (password.match(/[^a-zA-Z0-9]/)) strength++;
  return strength;
}

function updatePasswordStrength(passwordInput) {
  const password = passwordInput.value;
  const strengthBar = passwordInput.parentElement.querySelector('.password-strength');
  if (!strengthBar) return;
  const strength = getPasswordStrength(password);
  strengthBar.innerHTML = '<div class="password-strength-fill"></div>';
  const fill = strengthBar.querySelector('.password-strength-fill');
  fill.className = `password-strength-fill strength-${strength < 2 ? 'weak' : strength < 4 ? 'medium' : 'strong'}`;
}

function togglePasswordVisibility(btn, inputId) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.title = 'Hide password';
  } else {
    input.type = 'text';
    input.type = 'password';
    btn.title = 'Show password';

  }
}

function renderRegisterForm() {
  const content = document.createElement('section');
  content.classList.add('card', 'auth-container');
  content.innerHTML = `
    <h1>Daftar Akun Baru</h1>
    <p class="subtitle">Buat akun untuk mulai berbagi cerita dengan peta</p>
    <form id="register-form">
    <label for="reg-name">Nama Lengkap</label>
      <div class="form-group">
        <input type="text" id="reg-name" autocomplete="name" placeholder="Masukkan nama lengkap Anda" required minlength="2">
      </div>
      <label for="reg-email">Email</label>
      <div class="form-group">
        <input type="email" id="reg-email" autocomplete="email" placeholder="example@email.com" required>
      </div>
      <label for="reg-password">Password</label>
      <div class="form-group">
        <input type="password" id="reg-password" autocomplete="new-password" placeholder="Buat password (min 6 karakter)" minlength="6" required>
        <div class="password-strength"></div>
        <button type="button" class="password-toggle" id="toggle-password" title="Show password"></button>
      </div>
      <label for="reg-confirm-password">Konfirmasi Password</label>
      <div class="form-group">
        <input type="password" id="reg-confirm-password" autocomplete="new-password" placeholder="Ulangi password Anda" required minlength="6">
        <button type="button" class="password-toggle" id="toggle-confirm-password" title="Show password"></button>
      </div>
      <div id="reg-error" class="error" role="alert" aria-live="polite" style="display:none;"></div>
      <button type="submit" class="btn btn-primary large-btn" id="register-btn">
        Buat Akun Saya
      </button>
    </form>
    <div class="auth-footer">
      <p>Sudah memiliki akun? <a href="#/login" data-nav class="link-btn">Masuk sekarang</a></p>
    </div>
  `;
  
  // Event listeners
  const passwordInput = content.querySelector('#reg-password');
  passwordInput.addEventListener('input', () => updatePasswordStrength(passwordInput));
  
  const togglePassBtn = content.querySelector('#toggle-password');
  togglePassBtn.addEventListener('click', () => togglePasswordVisibility(togglePassBtn, 'reg-password'));
  
  const toggleConfirmBtn = content.querySelector('#toggle-confirm-password');
  toggleConfirmBtn.addEventListener('click', () => togglePasswordVisibility(toggleConfirmBtn, 'reg-confirm-password'));
  
  const form = content.querySelector('#register-form');
  const submitBtn = content.querySelector('#register-btn');
  const errorEl = content.querySelector('#reg-error');
  
  form.addEventListener('submit', async e => {
    e.preventDefault();
    
    const name = content.querySelector('#reg-name').value.trim();
    const email = content.querySelector('#reg-email').value.trim();
    const password = content.querySelector('#reg-password').value;
    const confirmPassword = content.querySelector('#reg-confirm-password').value;
    
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    startLoadingDots(submitBtn, 'Membuat akun');
    
    // Client-side validations first
    if (name.length < 2) {
      errorEl.textContent = 'Nama minimal 2 karakter';
      errorEl.style.display = 'block';
      resetForm();
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorEl.textContent = 'Format email tidak valid';
      errorEl.style.display = 'block';
      resetForm();
      return;
    }
    
    if (password.length < 6) {
      errorEl.textContent = 'Password minimal 6 karakter';
      errorEl.style.display = 'block';
      resetForm();
      return;
    }
    
    if (password !== confirmPassword) {
      errorEl.textContent = 'Password konfirmasi tidak cocok';
      errorEl.style.display = 'block';
      resetForm();
      return;
    }
    
    try {
      await register(email, password, name);
      window.location.hash = '#/login';
    } catch (error) {
      errorEl.textContent = error.message || 'Registrasi gagal. Email mungkin sudah digunakan.';
      errorEl.style.display = 'block';
    } finally {
      resetForm();
    }
  });
  
  function resetForm() {
    submitBtn.disabled = false;
    stopLoadingDots(submitBtn);
    submitBtn.textContent = 'Buat Akun Saya';
  }
  
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(content);
  setTimeout(() => content.classList.add('active'), 100);
}

function startLoadingDots(btn, baseText) {
  btn.dataset.baseText = baseText;
  btn.dataset.dots = 0;
  const interval = setInterval(() => {
    const dots = (btn.dataset.dots % 4);
    btn.textContent = baseText + '.'.repeat(dots);
    btn.dataset.dots = dots + 1;
  }, 400);
  btn.dataset.intervalId = interval;
}

function stopLoadingDots(btn) {
  if (btn.dataset.intervalId) {
    clearInterval(btn.dataset.intervalId);
    delete btn.dataset.intervalId;
    delete btn.dataset.dots;
    delete btn.dataset.baseText;
  }
}

export default renderRegisterForm;

