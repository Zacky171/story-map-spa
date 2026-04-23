import { isLoggedIn } from '../utils/auth.js';
import { getStories } from './api.js';

export async function getStory(id) {
  if (!isLoggedIn()) {
    return null;
  }
  try {
    const stories = await getStories();
    return stories.find(s => s.id == id);
  } catch {
    return null;
  }
}
