// Planning inicial del viaje (viernes 4 a domingo 6 de diciembre de 2026). El servidor lo copia una sola vez;
// después se edita desde la app. `place` es el id de un sitio del grupo o 'casa'.
const ZTL = 'Aparcad fuera de la ZTL (zona de tráfico limitado).';

export const PLAN_PLACES = [
  { id: 'templo-apolo', cat: 'ruta', name: 'Siracusa: Templo de Apolo', addr: 'Largo XXV Luglio, Siracusa', note: 'Restos de uno de los templos dóricos más antiguos de Sicilia, a la entrada de Ortigia.', lat: 37.06403, lng: 15.29302 },
  { id: 'piazza-archimede', cat: 'ruta', name: 'Siracusa: Piazza Archimede y Fuente de Diana', addr: 'Piazza Archimede, Siracusa', note: '', lat: 37.06127, lng: 15.29387 },
  { id: 'fonte-aretusa', cat: 'ruta', name: 'Siracusa: Fuente Aretusa', addr: 'Largo Aretusa, Siracusa', note: 'Fuente natural junto al mar, famosa por sus papiros.', lat: 37.05727, lng: 15.29291 },
  { id: 'lungomare-ortigia', cat: 'ruta', name: 'Siracusa: paseo marítimo de Ortigia', addr: 'Lungomare Alfeo, Siracusa', note: '', lat: 37.0590, lng: 15.2919 },
  { id: 'corso-umberto', cat: 'ruta', name: 'Taormina: Corso Umberto', addr: 'Corso Umberto, Taormina', note: 'La calle principal, con tiendas y restaurantes.', lat: 37.8520, lng: 15.2866 },
  { id: 'piazza-ix-aprile', cat: 'ruta', name: 'Taormina: Piazza IX Aprile', addr: 'Piazza IX Aprile, Taormina', note: 'Mirador sobre el mar y el Etna.', lat: 37.85159, lng: 15.28579 },
  { id: 'villa-comunale', cat: 'ruta', name: 'Taormina: Villa Comunale', addr: 'Via Bagnoli Croci, Taormina', note: 'Jardines con vistas al mar.', lat: 37.85095, lng: 15.28999 },
  { id: 'duomo-taormina', cat: 'ruta', name: 'Taormina: Duomo', addr: 'Piazza Duomo, Taormina', note: '', lat: 37.85102, lng: 15.28301 },
];

// [día, hora, fin, tipo, título, sitio, nota]
const ROWS = [
  ['04', '09:00', '10:00', 'vuelo', 'Llegada al aeropuerto de Catania', 'aeropuerto', 'Recoger maletas y coche de alquiler.'],
  ['04', '10:00', '11:15', 'coche', 'Salida hacia Siracusa', 'ortigia', 'Unos 1 h 15 min en coche. ' + ZTL],
  ['04', '11:15', '11:35', 'ver', 'Templo de Apolo', 'templo-apolo', 'Primer monumento al entrar en Ortigia.'],
  ['04', '11:35', '11:55', 'ver', 'Piazza Archimede y Fuente de Diana', 'piazza-archimede', ''],
  ['04', '11:55', '12:40', 'ver', 'Piazza del Duomo y Catedral', 'ortigia', 'Una de las plazas más bonitas de Sicilia.'],
  ['04', '12:40', '13:10', 'ver', 'Fuente Aretusa', 'fonte-aretusa', ''],
  ['04', '13:10', '14:00', 'ver', 'Paseo marítimo de Ortigia', 'lungomare-ortigia', 'Costa, callejuelas y rincones con vistas al mar.'],
  ['04', '14:00', '15:00', 'comer', 'Comida en Ortigia', 'ortigia', 'Pasta con marisco, pasta alla Norma o pescado fresco.'],
  ['04', '15:00', '16:15', 'coche', 'Salida hacia Aci Castello', 'aci-castello', 'Unos 1 h 15 min en coche.'],
  ['04', '16:15', '17:15', 'ver', 'Aci Castello', 'aci-castello', 'Castillo normando sobre la roca volcánica y paseo junto al mar. Comprobad el horario del castillo. ' + ZTL],
  ['04', '17:30', '20:00', 'ver', 'Aci Trezza', 'aci-trezza', 'Puerto pesquero, Faraglioni dei Ciclopi, paseo marítimo y aperitivo frente al mar.'],
  ['04', '20:00', '21:00', 'comer', 'Cena en Aci Trezza', 'aci-trezza', ''],
  ['04', '21:00', '', 'coche', 'Regreso a Catania', 'casa', ''],

  ['05', '08:00', '09:00', 'coche', 'Salida hacia el Etna', 'etna', 'Catania a Rifugio Sapienza, 1 h aprox. Comprobad antes las condiciones del volcán.'],
  ['05', '09:00', '12:30', 'ver', 'Monte Etna', 'etna', 'Cráteres Silvestri y paisajes de lava. Teleférico y 4x4 si están operativos (mejor con reserva). Calzado con buena suela y abrigo.'],
  ['05', '12:30', '13:30', 'comer', 'Comida en la zona del Etna', 'etna', ''],
  ['05', '14:30', '15:30', 'coche', 'Salida hacia Taormina', 'taormina', '1 h aprox. ' + ZTL],
  ['05', '15:30', '16:30', 'ver', 'Teatro Griego de Taormina', 'taormina', 'Vistas al mar y al Etna.'],
  ['05', '16:30', '17:15', 'ver', 'Corso Umberto', 'corso-umberto', ''],
  ['05', '17:15', '17:45', 'ver', 'Piazza IX Aprile', 'piazza-ix-aprile', 'Parada para tomar algo y hacer fotos.'],
  ['05', '17:45', '18:30', 'ver', 'Villa Comunale y Duomo', 'villa-comunale', 'Paseo por los jardines y el casco histórico.'],
  ['05', '18:45', '20:00', 'ver', 'Isola Bella', 'isola-bella', 'Ver la isla y pasear por la playa.'],
  ['05', '20:30', '22:00', 'comer', 'Cena en Taormina', 'taormina', ''],
  ['05', '22:00', '', 'coche', 'Regreso a Catania', 'casa', ''],

  ['06', '07:30', '08:00', 'comer', 'Desayuno siciliano', '', 'Granita con brioche.'],
  ['06', '08:00', '08:40', 'ver', 'Piazza del Duomo', 'duomo', 'Fuente del Elefante y Catedral de Santa Ágata.'],
  ['06', '08:40', '09:15', 'ver', 'Mercado de La Pescheria', 'pescheria', 'En domingo puede haber puestos cerrados.'],
  ['06', '09:15', '09:45', 'ver', 'Via Etnea', 'via-etnea', 'Último paseo y compras.'],
  ['06', '10:00', '10:30', 'otro', 'Recoger maletas', 'casa', 'Salir hacia el aeropuerto con margen.'],
  ['06', '10:30', '11:00', 'coche', 'Devolver el coche', 'aeropuerto', ''],
  ['06', '14:00', '', 'vuelo', 'Vuelo de regreso', 'aeropuerto', ''],
];

export const PLAN = ROWS.map(([day, time, end, kind, title, place, note], i) => ({ id: 's' + String(i + 1).padStart(2, '0'), day, time, end, kind, title, place, note }));
