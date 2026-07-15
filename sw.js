// 오프라인 캐시: 앱 셸은 network-first(최신 유지), 사전은 cache-first(용량↑·변화 적음)
const CACHE = 'jp-te-v21';
const ASSETS = ['./', './index.html', './dict.js', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.map(k => k !== CACHE ? caches.delete(k) : null)))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const cacheFirst = url.pathname.endsWith('dict.js') || url.pathname.endsWith('manifest.json');
  if (cacheFirst) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        const c = resp.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return resp;
      }))
    );
  } else {
    // 앱 셸: 항상 네트워크에서 최신을 가져옴(HTTP 캐시 우회) → 배포 즉시 반영
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(resp => {
        const c = resp.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return resp;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
  }
});
