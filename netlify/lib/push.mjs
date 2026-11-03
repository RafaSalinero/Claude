// Avisos al móvil (Web Push). Las claves VAPID las crea el propio servidor la primera vez y las guarda
// en Netlify Blobs: la privada no sale nunca del servidor y no hay que configurar nada.
import webpush from 'web-push';
import { createHash } from 'node:crypto';

const SUBJECT = 'https://sicilian-boys.netlify.app';
// Solo se envía a los servicios de push de los navegadores (Chrome, Firefox, Safari, Edge).
const PUSH_HOSTS = /(^|\.)(fcm\.googleapis\.com|push\.services\.mozilla\.com|push\.apple\.com|notify\.windows\.com)$/;

let keys = null;
export async function vapidKeys(store) {
  if (keys) return keys;
  let k = await store.get('vapid', { type: 'json' });
  if (!k) {
    const fresh = webpush.generateVAPIDKeys();
    const r = await store.setJSON('vapid', fresh, { onlyIfNew: true });
    // Si otra petición la creó a la vez, gana la que ya está guardada.
    k = r && r.modified === false ? await store.get('vapid', { type: 'json' }) : fresh;
  }
  return (keys = k);
}

const subKey = (g, endpoint) => `${g}/sub/${createHash('sha256').update(endpoint).digest('hex').slice(0, 24)}`;

function validSub(sub) {
  if (!sub || typeof sub.endpoint !== 'string' || sub.endpoint.length > 1000) return false;
  let u;
  try { u = new URL(sub.endpoint); } catch { return false; }
  const host = process.env.PUSH_TEST_HOST;       // solo en las pruebas locales
  if (!(u.protocol === 'https:' && (PUSH_HOSTS.test(u.hostname) || (host && u.hostname === host)))) return false;
  const k = sub.keys || {};
  return typeof k.p256dh === 'string' && typeof k.auth === 'string' && k.p256dh.length < 200 && k.auth.length < 100;
}

export async function saveSub(store, g, by, sub) {
  if (!validSub(sub)) return false;
  await store.setJSON(subKey(g, sub.endpoint), { by, sub: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }, t: Date.now() });
  return true;
}
export const dropSub = (store, g, endpoint) => store.delete(subKey(g, endpoint));

async function send(store, key, rec, payload) {
  const k = await vapidKeys(store);
  try {
    await webpush.sendNotification(rec.sub, JSON.stringify(payload), { vapidDetails: { subject: SUBJECT, publicKey: k.publicKey, privateKey: k.privateKey }, TTL: 6 * 3600 });
    return true;
  } catch (e) {
    if (e.statusCode === 404 || e.statusCode === 410) await store.delete(key);   // suscripción caducada
    else console.warn('push', e.statusCode || e.message);
    return false;
  }
}

// Envía el aviso a todos los móviles suscritos del grupo menos a los de quien hizo la acción.
export async function notify(store, g, actor, payload) {
  const { blobs } = await store.list({ prefix: `${g}/sub/` });
  const sent = await Promise.all(blobs.map(async ({ key }) => {
    const rec = await store.get(key, { type: 'json' });
    return rec && rec.by !== actor ? send(store, key, rec, payload) : false;
  }));
  return sent.filter(Boolean).length;
}

// Aviso de prueba solo al móvil que lo pide, al activar los avisos.
export async function notifyOne(store, g, endpoint, payload) {
  if (typeof endpoint !== 'string') return false;
  const key = subKey(g, endpoint), rec = await store.get(key, { type: 'json' });
  return rec ? send(store, key, rec, payload) : false;
}
