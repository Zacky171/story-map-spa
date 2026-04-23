// Simple transition utilities
export function fadeTransition(content) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(content);
  content.style.opacity = '0';
  content.style.transition = 'opacity 0.5s ease-in-out';
  setTimeout(() => content.style.opacity = '1', 50);
}

export function slideTransition(content, direction = 'left') {
  const app = document.getElementById('app');
  app.innerHTML = '';
  content.style.transform = `translateX(${direction === 'left' ? '100%' : '-100%'})`;
  app.appendChild(content);
  content.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  setTimeout(() => content.style.transform = 'translateX(0)', 50);
}

