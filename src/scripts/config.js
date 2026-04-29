// Di production (Railway), frontend dan backend satu domain — pakai relative URL
// Di development, proxy webpack akan forward /v1 ke localhost:3001
export const API_BASE = typeof window !== 'undefined' && window.location.port === '3000'
  ? 'http://localhost:3001/v1'
  : '/v1';

export const MAP = {
  center: [-7.7956, 110.3695], // Default Jogja area
  zoom: 12
};
