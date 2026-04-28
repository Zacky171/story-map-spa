import { API_BASE } from '../config.js';

export async function login(email, password) {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.message || 'Login failed');
  localStorage.setItem('token', data.loginResult.token);
  return data;
}

export async function register(email, password, name) {
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.message || 'Registration failed');
  return data;
}

export function logout() {
  localStorage.removeItem('token');
}

export function isLoggedIn() {
  return !!localStorage.getItem('token');
}
