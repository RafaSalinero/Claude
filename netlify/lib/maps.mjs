// Buscador de sitios de la app.
// Usa el primer proveedor con clave en Netlify: GOOGLE_MAPS_KEY (Google Places), FOURSQUARE_KEY
// o TOMTOM_KEY. Si falla o no encuentra nada, prueba el siguiente y al final OpenStreetMap (Photon),
// que no necesita clave. También entiende enlaces de Google Maps y Apple Maps.
const UA = 'SicilianBoys/1.0 (sicilian-boys.netlify.app)';
const COORD = /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/;
// Solo se siguen redirecciones dentro de estos dominios.
const HOSTS = /^(maps\.app\.goo\.gl|goo\.gl|g\.co|(www\.|maps\.)?google\.[a-z]{2,3}(\.[a-z]{2})?|consent\.google\.[a-z]{2,3}|maps\.apple\.com|maps\.apple)$/;

const CAT_RULES = [
  ['noche', /^(\w+_bar|bar|pub|\w*night_?club|nightlife|biergarten|karaoke|lounge|disco\w*|dance_hall|beach_club|music_venue)$/],
  ['comer', /^(restaurant|\w+_restaurant|cafe|coffee_shop|bakery|pastry|confectionery|food|fast_food|meal_takeaway|ice_cream(_shop)?|bar_and_grill|pizzeria|trattoria|osteria|bistro|gelateria|deli)$/],
  ['ver', /^(\w*tourist_attraction|attraction|museum|art_gallery|viewpoint|scenic_\w+|landmark\w*|church|cathedral|basilica|place_of_worship|monument\w*|memorial|castle|ruins|archaeological_site|historic\w*|plaza|square|park|national_park|beach|natural_feature|volcano|peak)$/],
];
// Tipos de cada proveedor en minúsculas y con guiones bajos: "Cocktail Bar" -> cocktail_bar, "Café" -> cafe.
const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/[\s/-]+/g, '_');
// Categoría de la app a partir de los tipos del proveedor, por orden de prioridad.
export function catOf(types) {
  for (const t of types.map(norm)) for (const [cat, re] of CAT_RULES) if (t && re.test(t)) return cat;
  return 'otro';
}

const km = (a, b, c, d) => { const r = Math.PI / 180, x = (d - b) * r * Math.cos((a + c) / 2 * r), y = (c - a) * r; return 6371 * Math.hypot(x, y); };
const tidyAddr = s => String(s || '').replace(/,\s*(Italia|Italy)$/i, '').slice(0, 120);

async function google(key, q, lat, lng) {
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST', signal: AbortSignal.timeout(8000),
    headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types' },
    body: JSON.stringify({ textQuery: q, languageCode: 'es', regionCode: 'IT', pageSize: 8, locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 50000 } } }),
  });
  if (!r.ok) throw new Error('google ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const d = await r.json();
  return (d.places || []).filter(p => p.location).map(p => ({
    name: (p.displayName && p.displayName.text) || '', addr: tidyAddr(p.formattedAddress),
    lat: p.location.latitude, lng: p.location.longitude, cat: catOf([p.primaryType, ...(p.types || [])]), gid: p.id,
  }));
}

async function foursquare(key, q, lat, lng) {
  const u = `https://places-api.foursquare.com/places/search?query=${encodeURIComponent(q)}&ll=${lat},${lng}&radius=100000&limit=8&fields=fsq_place_id,name,latitude,longitude,location,categories`;
  const r = await fetch(u, { headers: { authorization: 'Bearer ' + key, 'x-places-api-version': '2025-06-17', accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('foursquare ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const d = await r.json();
  return (d.results || []).filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number').map(p => {
    const l = p.location || {};
    return { name: p.name || '', addr: tidyAddr(l.formatted_address || [l.address, l.locality].filter(Boolean).join(', ')), lat: p.latitude, lng: p.longitude, cat: catOf((p.categories || []).map(c => c.name)) };
  }).filter(p => p.name);
}

async function tomtom(key, q, lat, lng) {
  const u = `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json?key=${encodeURIComponent(key)}&lat=${lat}&lon=${lng}&limit=8&language=es-ES&countrySet=IT`;
  const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('tomtom ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const d = await r.json();
  return (d.results || []).filter(x => x.position).map(x => {
    const a = x.address || {}, poi = x.poi;
    const street = [a.streetName, a.streetNumber].filter(Boolean).join(' ');
    return {
      name: poi ? poi.name || '' : street || a.freeformAddress || '', addr: tidyAddr(poi ? a.freeformAddress : a.municipality),
      lat: x.position.lat, lng: x.position.lon, cat: poi ? catOf([...(poi.categories || []), ...(poi.classifications || []).map(c => c.code)]) : 'otro',
    };
  }).filter(p => p.name && km(lat, lng, p.lat, p.lng) < 250);
}

async function osm(q, lat, lng) {
  const r = await fetch(`https://photon.komoot.io/api/?limit=12&lat=${lat}&lon=${lng}&q=${encodeURIComponent(q)}`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('photon ' + r.status);
  const d = await r.json(), seen = new Set();
  return (d.features || []).map(f => {
    const p = f.properties || {}, [x, y] = f.geometry.coordinates;
    const street = [p.street, p.housenumber].filter(Boolean).join(' ');
    return { name: p.name || street || p.city || '', addr: [p.name ? street : '', p.city || p.county].filter(Boolean).join(', '), lat: y, lng: x, cat: catOf([p.osm_value, p.osm_key]) };
  }).filter(p => {
    const k = p.name + '|' + p.addr;
    if (!p.name || seen.has(k) || km(lat, lng, p.lat, p.lng) > 250) return false;
    seen.add(k); return true;
  }).slice(0, 8);
}

const PROVIDERS = [['google', 'GOOGLE_MAPS_KEY', google], ['foursquare', 'FOURSQUARE_KEY', foursquare], ['tomtom', 'TOMTOM_KEY', tomtom]];

export async function searchPlaces(q, lat, lng) {
  for (const [src, env, find] of PROVIDERS) {
    const key = process.env[env];
    if (!key) continue;
    try { const results = await find(key, q, lat, lng); if (results.length) return { src, results }; }
    catch (e) { console.warn(e.message); }   // cuota agotada o clave mal: se pasa al siguiente
  }
  return { src: 'osm', results: await osm(q, lat, lng) };
}

function coordsOf(u) {
  let s = u.href;
  try { s = decodeURIComponent(s); } catch { /* enlace con % sueltos: se usa tal cual */ }
  let m = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);       // chincheta del sitio
  if (m) return [+m[1], +m[2]];
  for (const k of ['ll', 'coordinate', 'q', 'query', 'destination', 'daddr', 'center', 'sll']) {
    const v = u.searchParams.get(k); const c = v && v.match(COORD);
    if (c) return [+c[1], +c[2]];
  }
  m = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);                // centro de la vista
  return m ? [+m[1], +m[2]] : null;
}

function textOf(u) {
  let name = u.searchParams.get('name') || '', addr = u.searchParams.get('address') || '';
  if (!name) {
    const m = u.pathname.match(/\/maps\/place\/([^/]+)/);
    let t = '';
    try { t = m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : ''; } catch { t = ''; }
    if (!t) for (const k of ['q', 'query', 'daddr']) { const v = u.searchParams.get(k); if (v && !COORD.test(v) && !/^https?:/i.test(v)) { t = v; break; } }
    const parts = t.split(',').map(x => x.trim()).filter(Boolean);
    name = parts[0] || ''; if (!addr) addr = parts.slice(1).join(', ');
  }
  return { name: name.slice(0, 60), addr: tidyAddr(addr) };
}

// Enlace de Maps -> { name, addr, lat, lng, cat }. Sigue las redirecciones de los enlaces cortos.
export async function resolveLink(raw, lat, lng) {
  let u;
  try { u = new URL(String(raw).trim()); } catch { return null; }
  for (let hop = 0; hop < 6; hop++) {
    if (!/^https?:$/.test(u.protocol) || !HOSTS.test(u.hostname)) return null;
    if (/^(www\.)?google\./.test(u.hostname) && !u.pathname.startsWith('/maps')) return null;
    const cont = /^consent\.google\./.test(u.hostname) && u.searchParams.get('continue');
    if (cont) { try { u = new URL(cont); } catch { return null; } continue; }
    if (coordsOf(u) || textOf(u).name) break;
    const r = await fetch(u, { redirect: 'manual', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(6000) });
    const loc = r.headers.get('location');
    if (!loc) break;
    u = new URL(loc, u);
  }
  const c = coordsOf(u), t = textOf(u);
  if (c) return { name: t.name || 'Sitio de Maps', addr: t.addr, lat: c[0], lng: c[1], cat: 'otro' };
  if (!t.name) return null;
  // Enlace sin coordenadas (solo nombre y dirección): se busca ese texto.
  const { results } = await searchPlaces([t.name, t.addr].filter(Boolean).join(', '), lat, lng);
  const hit = results[0];
  return hit ? { ...hit, name: t.name, addr: t.addr || hit.addr } : null;
}
