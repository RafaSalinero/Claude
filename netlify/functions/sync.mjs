// Servidor del mapa en vivo: guarda posiciones y pines del grupo en Netlify Blobs.
// Una sola ruta, /api/sync. Cada teléfono hace una petición cada pocos segundos:
// envía su posición (si comparte) y recibe la de los demás y los pines.
import { getStore } from '@netlify/blobs';

const GROUP = /^[a-f0-9]{24}$/;          // hash del PIN, calculado en el teléfono
const ID = /^[A-Za-z0-9_-]{1,40}$/;
const STALE_MS = 6 * 3600e3;             // posiciones de hace más de 6 h se borran
const LEVELS = ['charla', 'beso', 'lio', 'otro'];
const DAYS = ['04', '05', '06'];
const MAX_PHOTO = 1_500_000;             // bytes de la foto ya comprimida en el móvil

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
  if (b.action !== 'sync') return json({ error: 'action' }, 400);

  const me = b.me;
  if (me && ID.test(me.id || '') && num(me.lat) && num(me.lng)) {
    await store.setJSON(`${g}/p/${me.id}`, { name: str(me.name, 18) || '?', lat: me.lat, lng: me.lng, acc: num(me.acc) ? Math.round(me.acc) : null, t: now });
  }
  const [people, pins] = await Promise.all([readPrefix(store, `${g}/p/`, now), readPrefix(store, `${g}/pin/`, 0)]);
  return json({ now, people, pins });
}

export default async (req) => handle(req, getStore({ name: 'sicilia-en-vivo', consistency: 'strong' }));

export const config = { path: ['/api/sync', '/api/photo'] };
