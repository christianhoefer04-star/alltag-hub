const CACHE = 'alltag-hub-v7';
const ASSETS = ['./', './index.html', './manifest.json', './icon.png', './version.txt'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fuer das HTML-Dokument: ZUERST das Netz, Cache nur als Rueckfall.
// Vorher galt ueberall cache-first - das ist offline ideal, sorgte nach einem
// Update aber dafuer, dass beim naechsten Start noch die ALTE Fassung kam und
// die neue erst im Hintergrund geladen wurde. Genau diese Verzoegerung hat
// mehrfach so ausgesehen, als sei ein Deploy nicht angekommen.
// Uebrige Dateien (Icon, Manifest) bleiben cache-first, die aendern sich kaum.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isDoc = e.request.mode === 'navigate' ||
    (e.request.destination === 'document') ||
    (e.request.headers.get('accept') || '').includes('text/html');

  if (isDoc) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
