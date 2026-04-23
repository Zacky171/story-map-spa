import { fadeTransition } from '../../utils/transition.js';
import { login } from '../../utils/auth.js';

function togglePasswordVisibility(btn, inputId) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.title = 'Hide password';
  } else {
    input.type = 'password';
    btn.title = 'Show password';
  }
}

function renderLoginForm() {
  const content = document.createElement('section');
  content.classList.add('card', 'auth-container');
  content.innerHTML = `
    <h1>Selamat Datang Kembali</h1>
    <p class="subtitle">Masuk untuk melanjutkan petualangan cerita Anda</p>
    <form id="login-form">
    <label for="email">Email</label>
      <div class="form-group">
        <input type="email" id="email" autocomplete="email" placeholder="Masukkan email Anda" required aria-describedby="email-error">
      </div>
    <label for="password">Password</label>
      <div class="form-group">
        <input type="password" id="password" autocomplete="current-password" placeholder="Masukkan password" required aria-describedby="pass-error">
        <button type="button" class="password-toggle" id="toggle-login-password" title="Show password"></button>
      </div>
      <div id="login-error" class="error" role="alert" aria-live="polite"></div>
      <button type="submit" class="btn btn-primary large-btn" id="login-btn">
        Masuk Sekarang
      </button>
    </form>
    <div class="auth-footer">
      <p>Belum punya akun? <a href="#/register" data-nav class="link-btn">Buat akun baru</a></p>
    </div>
  `;
  
  // Password toggle
  const togglePassBtn = content.querySelector('#toggle-login-password');
  togglePassBtn.addEventListener('click', () => togglePasswordVisibility(togglePassBtn, 'password'));
  
  const form = content.querySelector('#login-form');
  const submitBtn = content.querySelector('#login-btn');
  const errorEl = content.querySelector('#login-error');
  
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = content.querySelector('#email').value.trim();
    const password = content.querySelector('#password').value;
    
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    startLoadingDots(submitBtn, 'Masuk');
    
    try {
      await login(email, password);
      window.location.hash = '#/stories';
    } catch (error) {
      errorEl.textContent = 'Email atau password salah. Coba lagi.';
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      stopLoadingDots(submitBtn);
      submitBtn.textContent = 'Masuk Sekarang';
    }
  });
  
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

export default renderLoginForm;

