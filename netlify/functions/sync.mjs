// Servidor del mapa en vivo: guarda posiciones, sitios, puntuaciones, matches, gastos y el coche del grupo
// en Netlify Blobs, y manda los avisos al móvil. Una sola ruta, /api/sync. Cada teléfono hace una petición
// cada pocos segundos: envía su posición (si comparte) y recibe la de los demás.
import { getStore } from '@netlify/blobs';
import SEED from '../lib/seed-places.mjs';
import { searchPlaces, resolveLink } from '../lib/maps.mjs';
import { vapidKeys, saveSub, dropSub, notify, notifyOne } from '../lib/push.mjs';

const GROUP = /^[a-f0-9]{24}$/;          // hash del PIN, calculado en el teléfono
const ID = /^[A-Za-z0-9_-]{1,40}$/;
const STALE_MS = 6 * 3600e3;             // posiciones de hace más de 6 h se borran
const LEVELS = { lio: ['Lío', 1], manuela: ['Manuela', 3], sexo: ['Sexo', 5] };
const DAYS = ['04', '05', '06'];
const MAX_PHOTO = 1_500_000;             // bytes de la foto ya comprimida en el móvil
const PLACE_CATS = ['ver', 'comer', 'noche', 'ruta', 'otro'];
const CRIT = ['musica', 'ambiente', 'gente', 'precio', 'cola'];
const GID = /^[A-Za-z0-9_-]{10,300}$/;     // id de sitio de Google Maps
const CATANIA = [37.5045, 15.0862];
const HOME = { lat: 37.50528, lng: 15.09368 };   // Dimora Lucia Majorana
const metres = (a, b) => { const r = Math.PI / 180, x = (b.lng - a.lng) * r * Math.cos((a.lat + b.lat) / 2 * r), y = (b.lat - a.lat) * r; return 6371e3 * Math.hypot(x, y); };
const nameOf = id => { const n = String(id || '').replace(/^u-/, ''); return n ? n[0].toUpperCase() + n.slice(1) : 'Alguien'; };
const eur = c => (c / 100).toFixed(2).replace('.', ',') + ' €';
const EXP_CATS = ['comida', 'copas', 'coche', 'casa', 'entradas', 'compras', 'otros'];
const newId = (p, now) => p + now.toString(36) + Math.random().toString(36).slice(2, 6);

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

// `later` recibe tareas que pueden terminar después de responder (los avisos).
export async function handle(req, store, later = p => p.catch(e => console.warn(e))) {
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
    if (!ID.test(m.by || '') || !Object.hasOwn(LEVELS, m.level) || !DAYS.includes(m.day)) return json({ error: 'match' }, 400);
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
    const [label, pts] = LEVELS[m.level];
    later(notify(store, g, m.by, { title: 'Nuevo match', body: `${nameOf(m.by)} ha apuntado un match: ${label} (+${pts})`, tag: 'match' }));
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
    if (!p.id) later(notify(store, g, str(b.actor, 40), { title: 'Sitio nuevo', body: `${str(b.by, 18) || 'Alguien'} ha añadido ${name}`, tag: 'sitio' }));
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
  // Coche del grupo: dónde está aparcado.
  if (b.action === 'setCar') {
    const c = b.car || {};
    if (!num(c.lat) || !num(c.lng) || Math.abs(c.lat) > 90 || Math.abs(c.lng) > 180) return json({ error: 'car' }, 400);
    const car = { lat: c.lat, lng: c.lng, by: str(b.by, 18), t: now };
    await store.setJSON(`${g}/car`, car);
    later(notify(store, g, str(b.actor, 40), { title: 'Coche', body: `${car.by || 'Alguien'} ha aparcado el coche`, tag: 'coche' }));
    return json({ ok: true, car });
  }
  if (b.action === 'clearCar') { await store.delete(`${g}/car`); return json({ ok: true }); }
  // Gastos compartidos, como Tricount: quién pagó, cuánto (en céntimos) y la parte exacta de cada uno.
  // Una "transferencia" (kind 'pago') es dinero que uno da a otro para saldar deudas.
  if (b.action === 'expenses') return json({ now, expenses: await readPrefix(store, `${g}/x/`, 0) });
  if (b.action === 'saveExpense') {
    const x = b.expense || {};
    const shares = {}; let sum = 0;
    if (x.shares && typeof x.shares === 'object') {
      for (const [id, v] of Object.entries(x.shares).slice(0, 10)) {
        if (!ID.test(id) || !Number.isInteger(v) || v < 0 || v > 10_000_000) return json({ error: 'shares' }, 400);
        if (v > 0) shares[id] = v;
        sum += v;
      }
    }
    if (!ID.test(x.by || '') || !Number.isInteger(x.amount) || x.amount < 1 || x.amount > 10_000_000 || !Object.keys(shares).length || sum !== x.amount) return json({ error: 'expense' }, 400);
    if (x.id && !ID.test(x.id)) return json({ error: 'id' }, 400);
    const kind = x.kind === 'pago' ? 'pago' : 'gasto';
    const id = x.id || newId('x', now);
    const prev = x.id ? await store.get(`${g}/x/${id}`, { type: 'json' }) : null;
    const rec = {
      id, by: x.by, amount: x.amount, kind, shares,
      desc: str(x.desc, 60) || (kind === 'pago' ? 'Transferencia' : 'Gasto'),
      cat: kind === 'pago' ? 'pago' : (EXP_CATS.includes(x.cat) ? x.cat : 'otros'),
      mode: x.mode === 'amounts' ? 'amounts' : 'equal',
      date: /^\d{4}-\d{2}-\d{2}$/.test(x.date || '') ? x.date : new Date(now).toISOString().slice(0, 10),
      t: prev ? prev.t : now, ...(prev ? { edited: now } : {}),
    };
    await store.setJSON(`${g}/x/${id}`, rec);
    if (!prev) later(notify(store, g, str(b.actor, 40), kind === 'pago'
      ? { title: 'Transferencia', body: `${nameOf(x.by)} ha pagado ${eur(x.amount)} a ${Object.keys(shares).map(nameOf).join(', ')}`, tag: 'gasto' }
      : { title: 'Gasto nuevo', body: `${nameOf(x.by)} pagó ${eur(x.amount)} · ${rec.desc}`, tag: 'gasto' }));
    return json({ ok: true, id, expense: rec });
  }
  if (b.action === 'delExpense') {
    if (!ID.test(b.id || '')) return json({ error: 'id' }, 400);
    await store.delete(`${g}/x/${b.id}`);
    return json({ ok: true });
  }
  // Avisos: clave pública para suscribirse, alta, baja y aviso de prueba.
  if (b.action === 'vapid') return json({ key: (await vapidKeys(store)).publicKey });
  if (b.action === 'subscribe') return (await saveSub(store, g, str(b.by, 40), b.sub)) ? json({ ok: true }) : json({ error: 'sub' }, 400);
  if (b.action === 'unsubscribe') { if (typeof b.endpoint === 'string') await dropSub(store, g, b.endpoint); return json({ ok: true }); }
  if (b.action === 'testPush') return json({ ok: await notifyOne(store, g, b.endpoint, { title: 'Avisos activados', body: 'Así te llegarán los matches, los gastos y quién llega a casa.', tag: 'prueba' }) });
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
    // Llegada a casa con margen: entra a 50 m y no vuelve a salir hasta pasar de 120 m, para que el GPS
    // no mande avisos repetidos. Sin posición anterior (acaba de empezar a compartir) no se avisa.
    const key = `${g}/p/${me.id}`, prev = await store.get(key, { type: 'json' });
    const d = metres(me, HOME), precise = !num(me.acc) || me.acc <= 80, name = str(me.name, 18) || '?';
    let home = prev ? !!prev.home : d <= 50, arrived = false;
    if (prev && precise) { if (!prev.home && d <= 50) { home = true; arrived = true; } else if (prev.home && d > 120) home = false; }
    await store.setJSON(key, { name, lat: me.lat, lng: me.lng, acc: num(me.acc) ? Math.round(me.acc) : null, home, t: now });
    if (arrived) later(notify(store, g, me.id, { title: 'En casa', body: `${name} ha llegado a casa`, tag: 'casa-' + me.id }));
  }
  const [people, pins, plv, car] = await Promise.all([readPrefix(store, `${g}/p/`, now), b.v >= 2 ? {} : readPrefix(store, `${g}/pin/`, 0), placesVersion(store, g), store.get(`${g}/car`, { type: 'json' })]);
  return json({ now, people, pins, plv, car: car || null });
}

export default async (req, ctx) => {
  const jobs = [];
  const res = await handle(req, getStore({ name: 'sicilia-en-vivo', consistency: 'strong' }), p => { jobs.push(p.catch(e => console.warn('later', e))); });
  if (jobs.length) { const all = Promise.all(jobs); if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(all); else await all; }
  return res;
};

export const config = { path: ['/api/sync', '/api/photo'] };
