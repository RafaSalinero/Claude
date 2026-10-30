# Sicilian Boys

Página web con el mapa real de Sicilia oriental, la posición de Salinero, Braulio y Pomares en tiempo real, los sitios del viaje (Catania y excursiones en coche), que el grupo puede ampliar, la noche y el Match. Se abre desde el móvil con un enlace y se puede añadir a la pantalla de inicio. No pasa por ninguna tienda.

**Enlace para el grupo: https://sicilian-boys.netlify.app/**

Está publicada en Netlify, proyecto `sicilian-boys`, con un pequeño servidor que guarda las posiciones. Los enlaces antiguos (sicilia-en-vivo y GitHub Pages) redirigen a este.

Funciona fuera del visor de claude.ai porque ese visor bloquea la ubicación del móvil y los mapas en vivo. La app del plan (artefacto de claude.ai) enlaza a esta página desde la pestaña Mapa.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La página completa (mapa, posiciones, pines). |
| `places.js` | Lista de sitios de respaldo, solo para la copia sin servidor. |
| `../netlify/lib/seed-places.mjs` | Los 34 sitios iniciales que el servidor copió al empezar. Los sitios reales se editan desde la app. |
| `../netlify/functions/sync.mjs` | El pequeño servidor que guarda posiciones, sitios, puntuaciones y matches del grupo en Netlify. |
| `../netlify/lib/maps.mjs` | El buscador: Google, Foursquare o TomTom si hay clave, si no OpenStreetMap; y lectura de enlaces de Maps. |
| `../netlify.toml`, `../package.json` | Configuración de Netlify y su única dependencia. |
| `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png`, `logo-96.png` | Icono de los tres pumas y datos para añadir a la pantalla de inicio. |
| `pumas/` | Ilustraciones de los pumas: botones Casa, Noche, Match y Añadir, y pantallas vacías. |
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
- **Quién está en casa**: quien esté a menos de 50 m del alojamiento lleva una casita en su icono, el pin de casa muestra cuántos hay y el botón Casa lo dice.
- **Distancia a cada amigo**: junto a su icono en el mapa, por ejemplo "Braulio · 300 m".
- **Seguirte al andar**: la flecha azul mantiene el mapa centrado en ti y lo gira según hacia dónde miras (en iPhone pide permiso de movimiento la primera vez). Si mueves el mapa con el dedo, deja de seguirte.
- **Apariencia**: el botón redondo de medio círculo, encima de 3D, permite elegir Automático, Claro u Oscuro. Cada móvil recuerda su elección. En Automático la app sigue el tema del móvil y además pasa a oscuro a partir del atardecer en Catania (unas 16:40 en diciembre) y vuelve a claro al amanecer.
- **Buscador** ("Buscar sitios" en la ficha inferior): muestra primero los sitios del grupo y debajo resultados del mapa. Al tocar un resultado sale con un pin rojo y el botón "Añadir al grupo", que abre el formulario ya relleno (nombre, dirección, ubicación y categoría si se puede deducir).
  - Sin configurar nada busca en OpenStreetMap, que tiene monumentos, calles y muchos bares, pero no todos los locales.
  - Para un sitio que no aparezca (por ejemplo, Afro Bar): "Buscar en Google Maps", en Google Maps tocar Compartir > Copiar enlace y pegarlo en el buscador. Vale cualquier enlace de Google Maps o Apple Maps, y también coordenadas tipo `37.5027, 15.0873`.
  - Con una clave de TomTom, Foursquare o Google (ver abajo) busca locales dentro de la app, sin pegar enlaces.
- **Ficha inferior**: el interruptor "Compartir mi ubicación" El interruptor "Compartir mi ubicación" hace que los demás te vean. "Añadir" crea un sitio nuevo para los tres.
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
