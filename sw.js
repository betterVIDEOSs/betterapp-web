/* betterAPP – Service Worker der ausgelagerten Oberfläche (Umzug, Phase 1).
   Hält nur die Seite selbst (die „Hülle“ der App) auf dem Gerät, damit sie ohne Wartezeit öffnet. Daten gehen immer direkt an
   den Server und werden hier nie zwischengespeichert. Neue Version: Der Build schreibt eine neue Kennung (1e347dcfbe2a) in diese
   Datei – der Browser lädt dann die neue Hülle im Hintergrund und nimmt sie beim nächsten Öffnen. */
const VER = '1e347dcfbe2a', CACHE = 'betterapp-' + VER;
const SHELL = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.indexOf('betterapp-') === 0 && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // Server-Aufrufe (script.google.com) nie anfassen
  // Nur die App selbst (Startseite) kommt vom Gerät. Andere Seiten derselben Adresse – z. B. der Unterschrift-Link für Kunden
  // (…/exec?sign=…) oder die Fotoerlaubnis – gehen immer direkt an den Server.
  const root = new URL('./', self.location).pathname;
  if (url.pathname !== root && url.pathname !== root + 'index.html' && SHELL.indexOf(url.pathname.slice(root.length)) < 0) return;
  if (req.mode === 'navigate') {
    // Seite: sofort vom Gerät (Zugangslink-Parameter spielen dafür keine Rolle), ohne Gerätestand aus dem Netz
    e.respondWith(caches.match('./', { ignoreSearch: true }).then(hit => hit || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
