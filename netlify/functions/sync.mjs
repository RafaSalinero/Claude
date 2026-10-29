// Servidor del mapa en vivo: guarda posiciones y pines del grupo en Netlify Blobs.
// Una sola ruta, /api/sync. Cada teléfono hace una petición cada pocos segundos:
// envía su posición (si comparte) y recibe la de los demás y los pines.
import { getStore } from '@netlify/blobs';

const GROUP = /^[a-f0-9]{24}$/;          // hash del PIN, calculado en el teléfono
const ID = /^[A-Za-z0-9_-]{1,40}$/;
const STALE_MS = 6 * 3600e3;             // posiciones de hace más de 6 h se borran

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

export async function handle(req, store) {
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
  if (b.action !== 'sync') return json({ error: 'action' }, 400);

  const me = b.me;
  if (me && ID.test(me.id || '') && num(me.lat) && num(me.lng)) {
    await store.setJSON(`${g}/p/${me.id}`, { name: str(me.name, 18) || '?', lat: me.lat, lng: me.lng, acc: num(me.acc) ? Math.round(me.acc) : null, t: now });
  }
  const [people, pins] = await Promise.all([readPrefix(store, `${g}/p/`, now), readPrefix(store, `${g}/pin/`, 0)]);
  return json({ now, people, pins });
}

export default async (req) => handle(req, getStore({ name: 'sicilia-en-vivo', consistency: 'strong' }));

export const config = { path: '/api/sync' };
