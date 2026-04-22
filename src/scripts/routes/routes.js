 // MVP Router with hash routing
import { fadeTransition, slideTransition } from '../utils/index.js';
import { isLoggedIn } from '../utils/index.js';
import LoginPage from '../pages/auth/login-page.js';
import RegisterPage from '../pages/auth/register-page.js';
import StoriesPage from '../pages/stories/stories-page.js';
import AddStoryPage from '../pages/add/add-story-page.js';
import HomePage from '../pages/home/home-page.js';
import StoryDetail from '../pages/story-detail.js';

const routes = {
  '/': HomePage,
  '/stories': StoriesPage,
  '/add': AddStoryPage,
  '/login': LoginPage,
  '/register': RegisterPage
};

let isViewTransitionRunning = false;

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('load', handleRoute);
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const hash = link.getAttribute('href');
      window.location.hash = hash;
    });
  });
}

function handleRoute() {
  if (!document.getElementById('app')) return;

  const app = document.getElementById('app') || document.querySelector('#app');
  const oldSection = app.querySelector('section');
  if (oldSection) oldSection.classList.remove('active');

  const path = window.location.hash.slice(1) || '/';

  const renderNewPage = () => {
    if (path.startsWith('/story/')) {
      const id = path.split('/')[2];
      StoryDetail(id);
    } else {
      const PageComponent = routes[path] || HomePage;
      PageComponent();
    }
    requestAnimationFrame(() => {
      const newSection = app.querySelector('section');
      if (newSection) newSection.classList.add('active');
    });
  };

  if (!document.startViewTransition) {
    renderNewPage();
    return;
  }

  if (isViewTransitionRunning) {
    renderNewPage();
    return;
  }

  isViewTransitionRunning = true;

  try {
    const transition = document.startViewTransition(() => {
      renderNewPage();
    });

    transition.finished
      .catch(() => {})
      .finally(() => {
        isViewTransitionRunning = false;
      });
  } catch (error) {
    isViewTransitionRunning = false;
    renderNewPage();
  }
}
