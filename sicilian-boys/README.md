# Sicilian Boys

Página web con el mapa real de Sicilia oriental, la posición de Salinero, Braulio y Pomares en tiempo real, los sitios del viaje (Catania y excursiones en coche), que el grupo puede ampliar, la noche y el Match. Se abre desde el móvil con un enlace y se puede añadir a la pantalla de inicio. No pasa por ninguna tienda.

**Enlace para el grupo: https://sicilian-boys.netlify.app/**

Está publicada en Netlify, proyecto `sicilian-boys`, con un pequeño servidor que guarda las posiciones. Los enlaces antiguos (sicilia-en-vivo y GitHub Pages) redirigen a este.

Funciona fuera del visor de claude.ai porque ese visor bloquea la ubicación del móvil y los mapas en vivo. La app del plan (artefacto de claude.ai) enlaza a esta página desde la pestaña Mapa.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La página completa (mapa, posiciones, sitios, noche, match, gastos, coche, tiempo, traductor). |
| `sw.js` | Service worker: guarda la app y el mapa para abrirla sin cobertura y muestra los avisos. |
| `places.js` | Lista de sitios de respaldo, solo para la copia sin servidor. |
| `../netlify/lib/seed-places.mjs` | Los 34 sitios iniciales que el servidor copió al empezar. Los sitios reales se editan desde la app. |
| `../netlify/functions/sync.mjs` | El pequeño servidor que guarda posiciones, sitios, puntuaciones, matches, gastos y el coche del grupo en Netlify. |
| `../netlify/lib/push.mjs` | Los avisos al móvil (Web Push). Las claves las crea el servidor y las guarda en Netlify Blobs. |
| `../netlify/lib/maps.mjs` | El buscador: Google, Foursquare o TomTom si hay clave, si no OpenStreetMap; y lectura de enlaces de Maps. |
| `../netlify.toml`, `../package.json` | Configuración de Netlify y sus dependencias (`@netlify/blobs` y `web-push`). |
| `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png`, `logo-96.png` | Icono de los tres pumas y datos para añadir a la pantalla de inicio. |
| `pumas/` | Ilustraciones de los pumas: botones de la ficha y pantallas vacías. |
| `map-style.js` | Colores del mapa estilo Uber, con calles legibles en claro y en oscuro. |
| `fotos/` | Fotos de Salinero, Braulio y Pomares. Se activan en la lista `TRAVELLERS` de `index.html`; sin foto se ve la inicial. |
| `config.js`, `database.rules.json` | Solo para la alternativa con Firebase. No hacen falta con Netlify. |

## Paso 1: Netlify (ya hecho)

Para quitar la etiqueta "Powered by Netlify" (gratis): en Netlify, proyecto `sicilian-boys` > Project configuration > General > Powered by Netlify badge > apagar y guardar. No hace falta volver a desplegar.

El proyecto `sicilian-boys` de Netlify se creó y desplegó desde este repositorio con el conector de Netlify de Claude. No está enlazado a GitHub, así que un cambio en `main` no se publica solo en Netlify: pídele a Claude que lo despliegue, o enlaza el repositorio en Netlify (Project configuration > Build & deploy > Link repository) para que cada push se publique solo.

Consumo: cada móvil hace una petición cada 6 segundos mientras comparte y cada 12 si solo mira, y se para cuando la web está en segundo plano. Para tres personas durante el viaje son unas decenas de miles de peticiones, muy por debajo del plan gratuito de Netlify.

Privacidad: no hay PIN, así que cualquiera que tenga el enlace puede ver vuestras posiciones mientras compartís. Pasad el enlace solo entre los tres. Las posiciones se borran al apagar el interruptor o cerrar la página, y en cualquier caso a las 6 horas.

## Paso 2: en el móvil

1. Cada uno abre el enlace, toca su nombre (Salinero, Braulio o Pomares) y pulsa Bellaquear. Cada uno tiene su color fijo en el mapa. El móvil lo recuerda y las siguientes veces entra directo; para cambiar de persona, toca el logo de arriba a la izquierda.
2. Activa el interruptor "Compartir mi ubicación" y acepta el permiso de ubicación. Mientras está activado, los otros te ven; al apagarlo o cerrar la página, desapareces.
3. Safari en iPhone: compartir > "Añadir a pantalla de inicio" para tenerla como app con el icono de los pumas. Chrome en Android: menú > "Añadir a pantalla de inicio".

Importante en iPhone: la posición solo se envía mientras la página está abierta en primer plano. Si bloqueas el móvil, deja de actualizarse hasta que vuelvas a abrirla. Es una limitación de iOS para webs, no de la app.

## Cómo se usa

- **Sitios editables**: los sitios ya no son una lista fija. Viven en el servidor (empezaron con los 34 del plan) y cualquiera de los tres puede añadir, editar o eliminar. "Añadir" pide nombre, categoría (Ver, Comer, Noche, Excursión u Otro), ubicación y una nota. La ubicación se elige con "Aquí" (tu posición), "Mapa" (se mueve el mapa bajo un pin rojo fijo y se toca "Usar esta ubicación"; se abre en Catania si estás lejos de Sicilia) o "Buscar" (nombre, dirección o enlace de Google Maps). Para editar o eliminar, abre el sitio y toca el botón de los tres puntos. Los cambios les llegan a los demás en unos segundos.
- **Noche**: el botón morado "Noche" muestra el ranking de locales y los que faltan por puntuar. Cada uno puntúa del 1 al 5 música, ambiente, gente, precio de las copas y cola; la nota es la media del grupo. "Añadir local" crea un sitio de noche nuevo.
- **Casa**: el alojamiento, Dimora Lucia Majorana (Piazza Angelo Majorana 4), está marcado con un pin negro grande. El botón "Casa" de la ficha inferior lo centra y da la ruta de vuelta, andando o en coche según la distancia.
- **Match**: el botón rosa "Match" abre el ranking de la noche de Salinero, Braulio y Pomares (Lío 1, Manuela 3, Sexo 5 puntos) y el historial. "Apuntar match" guarda nombre, Instagram, resultado, noche, foto y nota. Solo quien lo apuntó puede eliminarlo. Ojo: sin PIN, cualquiera con el enlace podría verlo.
- **Botones de la ficha**: Casa, Coche, Noche, Match, Gastos, Tiempo, Traducir y Añadir. La fila se desliza hacia los lados. Debajo de algunos sale un dato: cuántos hay en casa, a qué distancia está el coche, tu saldo de gastos y la temperatura en Catania.
- **Coche**: "Aparqué aquí" guarda dónde está el coche (o "Elegir en el mapa"). Sale un pin azul para los tres y la ficha del coche tiene "Volver al coche" con la ruta en Google Maps. Con la papelera se quita.
- **Gastos**, como Tricount. Pestaña "Gastos": "Mis gastos" (tu parte) y "Total del grupo", y la lista por días. Cada gasto lleva título, importe, fecha, categoría, quién pagó y para quién: a partes iguales (se marcan las personas) o por importes (cada uno su cantidad; la app avisa si no cuadra con el total). También se apuntan transferencias (dinero que uno da a otro). Tocando un gasto se ve el desglose y se puede editar o eliminar. Pestaña "Saldos": quién debe y a quién le deben, con barras, y "Cómo saldar las cuentas" con el mínimo de pagos; "Saldado" apunta la transferencia.
- **Tiempo**: ahora y los próximos días en Catania, el Etna (1.900 m, con la nieve prevista), Taormina y Siracusa. Desde unos 15 días antes muestra en naranja los días del viaje. Datos de Open-Meteo, gratis y sin clave.
- **Avisos**: interruptor "Avisos" en la ficha. Llegan al móvil aunque la app esté cerrada: matches nuevos, gastos y transferencias, el coche aparcado, sitios nuevos y quién llega a casa (a menos de 50 m del alojamiento). Nunca te avisa de lo que haces tú. En iPhone solo funcionan con la app en la pantalla de inicio (iOS 16.4 o posterior): Safari > Compartir > Añadir a pantalla de inicio, abrirla desde el icono y activar el interruptor. En Android, desde Chrome sin más.
- **Sin cobertura**: la app se abre igual. Muestra el mapa de Catania, la costa este y Sicilia (se descarga solo una vez por semana, unos pocos MB, la primera vez que abres la app con conexión), los sitios, los gastos, los matches y el tiempo de la última vez. Lo nuevo que se apunte necesita conexión.
- **Traducir**: el botón del puma con el bocadillo italiano abre el traductor. Toca "Español" o "Italiano", habla, y la app escribe la traducción y la dice en voz alta (conversación por turnos). También se puede escribir o dictar con el micrófono del teclado y tocar "Al italiano" o "Al español". "Mostrar" pone la frase en grande para enseñarla. Debajo hay frases hechas (básico, comer, noche, coche y taxi, urgencias) que funcionan sin conexión, incluida "Llévame a casa" con la dirección del alojamiento. La traducción automática es de MyMemory: gratis, sin clave, unas 100 frases al día por móvil.
- **Quién está en casa**: quien esté a menos de 50 m del alojamiento lleva una casita en su icono, el pin de casa muestra cuántos hay y el botón Casa lo dice.
- **Distancia a cada amigo**: junto a su icono en el mapa, por ejemplo "Braulio · 300 m".
- **Seguirte al andar**: la flecha azul mantiene el mapa centrado en ti y lo gira según hacia dónde miras (en iPhone pide permiso de movimiento la primera vez). Si mueves el mapa con el dedo, deja de seguirte.
- **Apariencia**: el botón redondo de medio círculo, encima de 3D, permite elegir Automático, Claro u Oscuro. Cada móvil recuerda su elección. En Automático la app sigue el tema del móvil y además pasa a oscuro a partir del atardecer en Catania (unas 16:40 en diciembre) y vuelve a claro al amanecer.
- **Buscador** ("Buscar sitios" en la ficha inferior): muestra primero los sitios del grupo y debajo resultados del mapa. Al tocar un resultado sale con un pin rojo y el botón "Añadir al grupo", que abre el formulario ya relleno (nombre, dirección, ubicación y categoría si se puede deducir).
  - Sin configurar nada busca en OpenStreetMap, que tiene monumentos, calles y muchos bares, pero no todos los locales.
  - Para un sitio que no aparezca (por ejemplo, Afrobar): "Buscar en Google Maps", en Google Maps tocar Compartir > Copiar enlace y pegarlo en el buscador. Vale cualquier enlace de Google Maps o Apple Maps, y también coordenadas tipo `37.5027, 15.0873`.
  - Con una clave de TomTom, Foursquare o Google (ver abajo) busca locales dentro de la app, sin pegar enlaces.
- **Ficha inferior**: el interruptor "Compartir mi ubicación" hace que los demás te vean. "Añadir" crea un sitio nuevo para los tres.
- **Al tocar un sitio**, la ficha se convierte en su tarjeta: botón negro "Ir en coche" si está a más de 3 km o "Ir a pie" si está cerca, ambos con la ruta en Google Maps, y "Ver en Maps".
- **Al tocar a un amigo**, en el mapa o en sus iniciales arriba a la derecha, ves hace cuánto se actualizó y un botón para ir hasta él.
- **Botones redondos**: 3D inclina el mapa y levanta los edificios; el de personas encuadra a todos; la flecha te sigue.
- **Filtros arriba**: Ver, Comer, Noche, Excursiones y Otros. Al tocar uno, el mapa encuadra esos sitios.
- El mapa usa el tema claro u oscuro del móvil.

## Buscador: claves opcionales

Sin clave, el buscador usa OpenStreetMap, que no tiene todos los locales (por ejemplo, Afrobar). Con una clave busca en un proveedor comercial dentro de la propia app. Las claves se ponen en Netlify (Project configuration > Environment variables, ámbito Functions) y solo las usa el servidor (`netlify/lib/maps.mjs`). Si hay varias, se prueban en este orden: Google, Foursquare, TomTom. Si una falla, se agota o no encuentra nada, se pasa a la siguiente y al final a OpenStreetMap.

| Variable | Proveedor | Gratis | Tarjeta |
|---|---|---|---|
| `TOMTOM_KEY` | TomTom Search API. Alta en [developer.tomtom.com](https://developer.tomtom.com/), la clave aparece en el panel. | 2.500 búsquedas al mes | No |
| `FOURSQUARE_KEY` | Foursquare Places, muy completo en bares y discotecas. Alta en [foursquare.com/developers](https://foursquare.com/developers/), proyecto nuevo > Service API Key. | 500 búsquedas al mes | No |
| `GOOGLE_MAPS_KEY` | Google Places API (New). Proyecto en [Google Cloud](https://console.cloud.google.com/), activar Places API (New) y crear clave restringida. | 5.000 búsquedas al mes | Sí |

## Si algo falla

- Si "Añadir", Noche o Match dicen "Disponible solo en sicilian-boys.netlify.app", la app se ha abierto desde otra dirección: abre https://sicilian-boys.netlify.app/ (y vuelve a añadirla a la pantalla de inicio si el icono es antiguo). Sin cobertura al abrirla ya no pasa: entra en modo grupo y reintenta sola.

- La ficha dice "Modo individual": estás en una copia de la web sin servidor. Abre el enlace de Netlify.
- "Sin conexión con el grupo, reintentando…": no hay cobertura o Netlify no responde. La web reintenta sola.
- No aparece tu punto azul: el navegador no tiene permiso de ubicación para ese sitio. En iPhone, Ajustes > Safari > Ubicación.
- El mapa no carga: comprueba que hay conexión; las teselas vienen de tiles.openfreemap.org sin clave.

## Alternativa: Firebase

Si algún día no se usa Netlify, la web también puede sincronizar con una Realtime Database de Firebase. Rellena `config.js` con la configuración web del proyecto y pega `database.rules.json` en sus reglas. La web usa Netlify si lo encuentra y, si no, Firebase si `config.js` está relleno.
