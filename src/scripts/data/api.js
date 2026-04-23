import { API_BASE } from '../config.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return {
    'Authorization': `Bearer ${token}`
  };
};

export async function getStories() {
  try {
    const token = localStorage.getItem('token');
    let url = `${API_BASE}/stories?page=1&size=10&location=1`;
    if (token) url += `&token=${encodeURIComponent(token)}`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
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
