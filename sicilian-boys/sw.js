// Service worker de Sicilian Boys: abre la app y el mapa sin cobertura y muestra los avisos del grupo.
const APP = 'sb-app-v1', MAP = 'sb-map-v1';
const PUMAS = ['casa', 'coche', 'noche', 'match', 'gastos', 'tiempo', 'traducir', 'anadir', 'vacio-noche', 'vacio-match', 'vacio-buscar', 'vacio-gastos', 'sin-conexion'];
const SHELL = ['./', 'index.html', 'map-style.js', 'places.js', 'config.js', 'manifest.webmanifest', 'logo-96.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'fotos/salinero.jpg', 'fotos/braulio.jpg', 'fotos/pomares.jpg', ...PUMAS.map(n => 'pumas/' + n + '.webp'),
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js', 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css'];

self.addEventListener('install', e => e.waitUntil(
  caches.open(APP).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== APP && k !== MAP).map(k => caches.delete(k)))).then(() => self.clients.claim())));

const timeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);
async function networkFirst(req, name){
  const c = await caches.open(name);
  try {
    const res = await timeout(fetch(req), 6000);
    if (res.ok) c.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await c.match(req, { ignoreSearch: req.mode === 'navigate' }) || (req.mode === 'navigate' && await c.match('index.html'));
    if (hit) return hit;
    throw e;
  }
}
async function cacheFirst(req, name, max){
  const c = await caches.open(name), hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) { await c.put(req, res.clone()); if (max && Math.random() < .05) trim(c, max); }
  return res;
}
async function staleWhileRevalidate(req, name){
  const c = await caches.open(name), hit = await c.match(req);
  const fresh = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; });
  if (hit) { fresh.catch(() => {}); return hit; }
  return fresh;
}
async function trim(c, max){ const keys = await c.keys(); for (const k of keys.slice(0, Math.max(0, keys.length - max))) await c.delete(k); }

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === location.origin) {
    if (u.pathname === '/api/photo') return e.respondWith(cacheFirst(req, APP));
    if (u.pathname.startsWith('/api/')) return;                                  // datos del grupo: siempre en vivo
    if (req.mode === 'navigate' || u.pathname === '/' || /\.(html|js|css|webmanifest)$/.test(u.pathname)) return e.respondWith(networkFirst(req, APP));
    return e.respondWith(staleWhileRevalidate(req, APP));
  }
  if (u.hostname === 'unpkg.com') return e.respondWith(cacheFirst(req, APP));
  if (u.hostname === 'tiles.openfreemap.org') {
    // Estilos y TileJSON pueden cambiar: red primero. Teselas, fuentes e iconos van versionados: caché primero.
    if (u.pathname.startsWith('/styles/') || /^\/planet\/?$/.test(u.pathname)) return e.respondWith(networkFirst(req, MAP));
    return e.respondWith(cacheFirst(req, MAP, 4000));
  }
  if (u.hostname === 'api.open-meteo.com') return e.respondWith(networkFirst(req, APP));
});

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Sicilian Boys', { body: d.body || '', tag: d.tag, icon: 'icon-192.png', data: { url: d.url || './' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const w of list) if ('focus' in w) return w.focus();
    return self.clients.openWindow((e.notification.data && e.notification.data.url) || './');
  }));
});
