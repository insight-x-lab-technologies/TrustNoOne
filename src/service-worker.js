const CACHE_VERSION = 'mimimania-pwa-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './themes.css',
  './script.js',
  './manifest.webmanifest',
  './favicon.ico',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-512.png',
  './assets/player-default.svg',
  './assets/background/cosmic_desktop_bg_home.png',
  './assets/background/cosmic_mobile_bg_home.png',
  './assets/background/cosmic_desktop_bg_app.png',
  './assets/background/trustnoone_cosmic_desktop_bg_home.png',
  './assets/background/trustnoone_cosmic_mobile_bg_home.png',
  './shared/audio.js',
  './shared/ui.js',
  './games/mission/mission-main.js',
  './games/mission/mission-multidevice.js',
  './games/mission/mission-cpu.js',
  './games/mission/mission-validation.js',
  './games/mission/mission-engine.js',
  './games/mission/mission-state.js',
  './games/mission/mission-content.js',
  './games/mission/mission-logs.js',
  './games/mission/mission-roles.js',
  './games/mission/mission-rooms.js',
  './games/mission/mission-actions.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => !key.startsWith(CACHE_VERSION))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isLocalAsset(requestUrl) {
  return requestUrl.origin === self.location.origin;
}

function shouldRuntimeCache(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (!isLocalAsset(url)) return false;
  return /\.(?:png|jpg|jpeg|svg|webp|mp3|css|js|json|webmanifest)$/i.test(url.pathname);
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(APP_SHELL_CACHE);
      cache.put('./index.html', response.clone());
    }
    return response;
  } catch (error) {
    return caches.match('./index.html');
  }
}

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (shouldRuntimeCache(request)) {
    event.respondWith(cacheFirst(request));
  }
});
