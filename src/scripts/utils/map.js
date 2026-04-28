import { map, tileLayer, marker, popup } from 'leaflet';
 
export default class Map {
  #zoom = 5;
  #map = null;
 
  static isGeolocationAvailable() {
    return 'geolocation' in navigator;
  }
 
  static getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!Map.isGeolocationAvailable()) {
        reject('Geolocation API unsupported');
        return;
      }
 
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }
 
  static async build(selector, options = {}) {
    if ('center' in options && options.center) {
      return new Map(selector, options);
    }
 
    const jakartaCoordinate = [-6.2, 106.816666];
 
    if ('locate' in options && options.locate) {
      try {
        const position = await Map.getCurrentPosition();
        const coordinate = [position.coords.latitude, position.coords.longitude];
 
        return new Map(selector, {
          ...options,
          center: coordinate,
        });
      } catch (error) {
        console.error('build: error:', error);
 
        return new Map(selector, {
          ...options,
          center: jakartaCoordinate,
        });
      }
    }
 
    return new Map(selector, {
      ...options,
      center: jakartaCoordinate,
    });
  }
 
  constructor(selector, options = {}) {
    this.#zoom = options.zoom ?? this.#zoom;

    const container = document.querySelector(selector);
    if (!container) {
      throw new Error(`Map container not found for selector: ${selector}`);
    }
 
    const tileOsm = tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    });
 
    this.#map = map(container, {
      zoom: this.#zoom,
      scrollWheelZoom: true,
      layers: [tileOsm],
      ...options,
    });
  }

  addMarker(lat, lng, popupContent) {
    if (!this.#map) return;
    const m = marker([lat, lng]).addTo(this.#map);
    if (popupContent) m.bindPopup(popupContent);
    return m;
  }
}

