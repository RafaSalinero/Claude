// Servidor del mapa en vivo: guarda posiciones, sitios, puntuaciones y matches del grupo en Netlify Blobs.
// Una sola ruta, /api/sync. Cada teléfono hace una petición cada pocos segundos:
// envía su posición (si comparte) y recibe la de los demás y los pines.
import { getStore } from '@netlify/blobs';
import SEED from '../lib/seed-places.mjs';
import { searchPlaces, resolveLink } from '../lib/maps.mjs';

const GROUP = /^[a-f0-9]{24}$/;          // hash del PIN, calculado en el teléfono
const ID = /^[A-Za-z0-9_-]{1,40}$/;
const STALE_MS = 6 * 3600e3;             // posiciones de hace más de 6 h se borran
const LEVELS = ['charla', 'beso', 'lio', 'otro'];
const DAYS = ['04', '05', '06'];
const MAX_PHOTO = 1_500_000;             // bytes de la foto ya comprimida en el móvil
const PLACE_CATS = ['ver', 'comer', 'noche', 'ruta', 'otro'];
const CRIT = ['musica', 'ambiente', 'gente', 'precio', 'cola'];
const GID = /^[A-Za-z0-9_-]{10,300}$/;     // id de sitio de Google Maps
const CATANIA = [37.5045, 15.0862];

// Sitios del grupo: uno por clave en `${g}/pl/<id>`. `${g}/plv` guarda la versión de la lista,
// que el móvil recibe en cada sincronización para saber cuándo volver a pedirla.
async function placesVersion(store, g) {
  const v = await store.get(`${g}/plv`, { type: 'json' });
  if (v) return v.v;
  // Primera vez: se copian los sitios iniciales y los pines antiguos (como "otro").
  await Promise.all(SEED.map(p => store.setJSON(`${g}/pl/${p.id}`, { ...p, by: '', t: 0 })));
  const old = await readPrefix(store, `${g}/pin/`, 0);
  await Promise.all(Object.entries(old).map(([id, p]) => store.setJSON(`${g}/pl/${id}`, { id, cat: 'otro', name: p.name, note: p.note || '', addr: '', lat: p.lat, lng: p.lng, by: p.by || '', t: p.t || 0 })));
  return bumpPlaces(store, g);
}
async function bumpPlaces(store, g) { const v = Date.now(); await store.setJSON(`${g}/plv`, { v }); return v; }

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const num = v => typeof v === 'number' && Number.isFinite(v);
const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

async function readPrefix(store, prefix, now) {
  const { blobs } = await store.list({ prefix });
  const out = {};
  await Promise.all(blobs.map(async ({ key }) => {
    const v = await store.get(key, { type: 'json' });
    if (!v) return;
    if (now && now - (v.t || 0) > STALE_MS) { await store.delete(key); return; }
    out[key.slice(prefix.length)] = v;
  }));
  return out;
}

async function photo(req, store) {
  const u = new URL(req.url);
  const g = u.searchParams.get('g') || '', id = u.searchParams.get('id') || '';
  if (!GROUP.test(g) || !ID.test(id)) return new Response('bad request', { status: 400 });
  const buf = await store.get(`${g}/mp/${id}`, { type: 'arrayBuffer' });
  if (!buf) return new Response('not found', { status: 404 });
  return new Response(buf, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=86400' } });
}

export async function handle(req, store) {
  if (req.method === 'GET' && new URL(req.url).pathname === '/api/photo') return photo(req, store);
  if (req.method === 'GET') return json({ ok: true });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let b;
  try { b = await req.json(); } catch { return json({ error: 'json' }, 400); }
  const g = b && b.group;
  if (!GROUP.test(g || '')) return json({ error: 'group' }, 400);
  const now = Date.now();

  if (b.action === 'leave') {
    if (ID.test(b.id || '')) await store.delete(`${g}/p/${b.id}`);
    return json({ ok: true });
  }
  if (b.action === 'addPin') {
    const p = b.pin || {};
    const name = str(p.name, 40);
    if (!name || !num(p.lat) || !num(p.lng)) return json({ error: 'pin' }, 400);
    const id = now.toString(36) + Math.random().toString(36).slice(2, 6);
    await store.setJSON(`${g}/pin/${id}`, { id, name, note: str(p.note, 120), lat: p.lat, lng: p.lng, by: str(p.by, 18), t: now });
    return json({ ok: true, id });
  }
  if (b.action === 'delPin') {
    if (ID.test(b.id || '')) await store.delete(`${g}/pin/${b.id}`);
    return json({ ok: true });
  }
  // Marcador de la noche: matches de cada uno, con foto opcional guardada aparte.
  if (b.action === 'matches') return json({ now, matches: await readPrefix(store, `${g}/m/`, 0) });
  if (b.action === 'addMatch') {
    const m = b.match || {};
    if (!ID.test(m.by || '') || !LEVELS.includes(m.level) || !DAYS.includes(m.day)) return json({ error: 'match' }, 400);
    const name = str(m.name, 40);
    if (!name) return json({ error: 'name' }, 400);
    const id = now.toString(36) + Math.random().toString(36).slice(2, 6);
    let hasPhoto = false;
    if (typeof m.photo === 'string' && m.photo.startsWith('data:image/jpeg;base64,')) {
      const bytes = Buffer.from(m.photo.slice(23), 'base64');
      if (bytes.length > MAX_PHOTO) return json({ error: 'photo' }, 413);
      await store.set(`${g}/mp/${id}`, bytes);
      hasPhoto = true;
    }
    await store.setJSON(`${g}/m/${id}`, { id, by: m.by, name, ig: str(m.ig, 40).replace(/^@/, ''), level: m.level, day: m.day, note: str(m.note, 200), photo: hasPhoto, t: now });
    return json({ ok: true, id });
  }
  if (b.action === 'delMatch') {
    if (!ID.test(b.id || '') || !ID.test(b.by || '')) return json({ error: 'id' }, 400);
    const m = await store.get(`${g}/m/${b.id}`, { type: 'json' });
    if (m && m.by !== b.by) return json({ error: 'not-yours' }, 403);
    await Promise.all([store.delete(`${g}/m/${b.id}`), store.delete(`${g}/mp/${b.id}`)]);
    return json({ ok: true });
  }
  // Sitios editables por el grupo.
  if (b.action === 'places') { const plv = await placesVersion(store, g); return json({ now, plv, places: await readPrefix(store, `${g}/pl/`, 0) }); }
  if (b.action === 'savePlace') {
    const p = b.place || {};
    const name = str(p.name, 60);
    if (!name || !PLACE_CATS.includes(p.cat) || !num(p.lat) || !num(p.lng) || Math.abs(p.lat) > 90 || Math.abs(p.lng) > 180) return json({ error: 'place' }, 400);
    if (p.id && !ID.test(p.id)) return json({ error: 'id' }, 400);
    const id = p.id || ('p' + now.toString(36) + Math.random().toString(36).slice(2, 5));
    await placesVersion(store, g);
    await store.setJSON(`${g}/pl/${id}`, { id, cat: p.cat, name, addr: str(p.addr, 120), note: str(p.note, 240), lat: p.lat, lng: p.lng, gid: GID.test(p.gid || '') ? p.gid : '', by: str(b.by, 18), t: now });
    const plv = await bumpPlaces(store, g);
    return json({ ok: true, id, plv });
  }
  if (b.action === 'delPlace') {
    if (!ID.test(b.id || '')) return json({ error: 'id' }, 400);
    const { blobs } = await store.list({ prefix: `${g}/r/${b.id}/` });
    await Promise.all([store.delete(`${g}/pl/${b.id}`), ...blobs.map(x => store.delete(x.key))]);
    const plv = await bumpPlaces(store, g);
    return json({ ok: true, plv });
  }
  // Buscador: Google Maps si hay clave, si no OpenStreetMap; y enlaces de Maps pegados.
  if (b.action === 'search' || b.action === 'resolve') {
    const [lat, lng] = num(b.lat) && num(b.lng) ? [b.lat, b.lng] : CATANIA;
    try {
      if (b.action === 'resolve') { const result = await resolveLink(str(b.url, 2000), lat, lng); return result ? json({ result }) : json({ error: 'link' }, 404); }
      const q = str(b.q, 120);
      if (q.length < 2) return json({ error: 'q' }, 400);
      return json(await searchPlaces(q, lat, lng));
    } catch (e) { console.warn(e); return json({ error: 'search' }, 502); }
  }
  // Puntuaciones de la noche: una por persona y local en `${g}/r/<lugar>/<persona>`.
  if (b.action === 'ratings') return json({ now, ratings: await readPrefix(store, `${g}/r/`, 0) });
  if (b.action === 'rate') {
    if (!ID.test(b.place || '') || !ID.test(b.by || '')) return json({ error: 'id' }, 400);
    const sc = {};
    for (const k of CRIT) { const v = b.scores && b.scores[k]; if (Number.isInteger(v) && v >= 1 && v <= 5) sc[k] = v; }
    if (!Object.keys(sc).length) return json({ error: 'scores' }, 400);
    await store.setJSON(`${g}/r/${b.place}/${b.by}`, { ...sc, t: now });
    return json({ ok: true });
  }
  if (b.action !== 'sync') return json({ error: 'action' }, 400);

  const me = b.me;
  if (me && ID.test(me.id || '') && num(me.lat) && num(me.lng)) {
    await store.setJSON(`${g}/p/${me.id}`, { name: str(me.name, 18) || '?', lat: me.lat, lng: me.lng, acc: num(me.acc) ? Math.round(me.acc) : null, t: now });
  }
  const [people, pins, plv] = await Promise.all([readPrefix(store, `${g}/p/`, now), b.v >= 2 ? {} : readPrefix(store, `${g}/pin/`, 0), placesVersion(store, g)]);
  return json({ now, people, pins, plv });
}

export default async (req) => handle(req, getStore({ name: 'sicilia-en-vivo', consistency: 'strong' }));

export const config = { path: ['/api/sync', '/api/photo'] };
