import { API_BASE } from '../config.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { 'Authorization': `Bearer ${token}` };
};

// Ambil userId dari JWT token
export function getCurrentUserId() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1])).userId;
  } catch { return null; }
}

export async function getStories() {
  try {
    const token = localStorage.getItem('token');
    let url = `${API_BASE}/stories?page=1&size=50&location=1`;
    if (token) url += `&token=${encodeURIComponent(token)}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.message);
    return data.listStory || [];
  } catch (error) {
    if (error.message.includes('401')) {
      localStorage.removeItem('token');
      window.location.hash = '#/login';
    }
    console.error('Error fetching stories:', error);
    return [];
  }
}

export async function postStory(formData) {
  try {
    const response = await fetch(`${API_BASE}/stories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('Error posting story:', error);
    throw error;
  }
}

export async function deleteStory(id) {
  const response = await fetch(`${API_BASE}/stories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.message);
  return data;
}
