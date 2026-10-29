# Sicilia en vivo

Página web con el mapa real de Sicilia oriental, tu posición y la de los otros dos en tiempo real, los sitios del viaje (Catania y excursiones en coche) y pines que añadís sobre la marcha. Se abre desde el móvil con un enlace y se puede añadir a la pantalla de inicio. No pasa por ninguna tienda.

Hay dos copias de la web:

- **Netlify (la buena):** tiene el modo grupo, os veis entre vosotros. La URL la da Netlify al conectar el repositorio, ver el paso 1.
- **GitHub Pages:** https://rafasalinero.github.io/Claude/sicilia-en-vivo/ funciona en modo individual: mapa, sitios y tu posición, pero sin ver a los demás.

Funciona fuera del visor de claude.ai porque ese visor bloquea la ubicación del móvil y los mapas en vivo. La app del plan (artefacto de claude.ai) enlaza a esta página desde la pestaña Mapa.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La página completa (mapa, posiciones, pines). |
| `places.js` | Los sitios del viaje: Catania y excursiones. Edítalo si cambias sitios. |
| `../netlify/functions/sync.mjs` | El pequeño servidor que guarda posiciones y pines del grupo en Netlify. |
| `../netlify.toml`, `../package.json` | Configuración de Netlify y su única dependencia. |
| `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png`, `logo-96.png` | Icono de los tres pumas y datos para añadir a la pantalla de inicio. |
| `config.js`, `database.rules.json` | Solo para la alternativa con Firebase. No hacen falta con Netlify. |

## Paso 1: conectar el repositorio a Netlify (5 minutos, una sola vez)

1. Entra en https://app.netlify.com con tu cuenta.
2. Pulsa **Add new site** (o **Add new project**) y luego **Import an existing project**.
3. Elige **GitHub**, autoriza a Netlify si lo pide y selecciona el repositorio **RafaSalinero/Claude**.
4. Deja todo como viene: rama `main`, sin comando de build. Netlify lee el resto de `netlify.toml`. Pulsa **Deploy**.
5. Cuando termine, en uno o dos minutos, abre `https://NOMBRE-DEL-SITIO.netlify.app/sicilia-en-vivo/`. Puedes poner un nombre más fácil en Site configuration > Change site name, por ejemplo `sicilia-pumas`.
6. Pásale el enlace a Claude, o pégalo tú en la app del plan: Ajustes > campo del mapa en vivo.

A partir de ahí, cada cambio que se suba a `main` se publica solo en Netlify y en GitHub Pages.

Consumo: cada móvil hace una petición cada 6 segundos mientras comparte y cada 12 si solo mira, y se para cuando la web está en segundo plano. Para tres personas durante el viaje son unas decenas de miles de peticiones, muy por debajo del plan gratuito de Netlify.

Privacidad: las posiciones se guardan bajo una clave derivada del PIN del grupo, así que sin el PIN no se pueden leer desde la web. Se borran al apagar el interruptor o cerrar la página, y en cualquier caso a las 6 horas. Elegid un PIN que no sea 1234.

## Paso 2: en el móvil

1. Cada uno abre el enlace de Netlify, toca su nombre (Salinero, Braulio o Pomares) y escribe el mismo PIN del grupo. Cada uno tiene su color fijo en el mapa.
2. Activa el interruptor "Compartir mi ubicación" y acepta el permiso de ubicación. Mientras está activado, los otros te ven; al apagarlo o cerrar la página, desapareces.
3. Safari en iPhone: compartir > "Añadir a pantalla de inicio" para tenerla como app con el icono de los pumas. Chrome en Android: menú > "Añadir a pantalla de inicio".

Importante en iPhone: la posición solo se envía mientras la página está abierta en primer plano. Si bloqueas el móvil, deja de actualizarse hasta que vuelvas a abrirla. Es una limitación de iOS para webs, no de la app.

## Cómo se usa

- **Ficha inferior**: "¿A dónde vamos?" abre el buscador de sitios, ordenados por cercanía. El interruptor "Compartir mi ubicación" hace que los demás te vean. "Añadir pin del grupo" y luego toca el mapa para guardar un sitio para los tres.
- **Al tocar un sitio**, la ficha se convierte en su tarjeta: botón negro "Ir en coche" si está a más de 3 km o "Ir andando" si está cerca, ambos con la ruta en Google Maps, y "Ver en Maps".
- **Al tocar a un amigo**, en el mapa o en sus iniciales arriba a la derecha, ves hace cuánto se actualizó y un botón para ir hasta él.
- **Botones redondos**: 3D inclina el mapa y levanta los edificios; el de personas encuadra a todos; la flecha te centra.
- **Filtros arriba**: Ver, Comer, Noche, Excursiones y Pines del grupo. Al tocar uno, el mapa encuadra esos sitios.
- El mapa usa el tema claro u oscuro del móvil.

## Si algo falla

- No aparece el campo del PIN: estás en la copia de GitHub Pages. Abre la de Netlify.
- "Sin conexión con el grupo, reintentando…": no hay cobertura o Netlify no responde. La web reintenta sola.
- No aparece tu punto azul: el navegador no tiene permiso de ubicación para ese sitio. En iPhone, Ajustes > Safari > Ubicación.
- El mapa no carga: comprueba que hay conexión; las teselas vienen de tiles.openfreemap.org sin clave.

## Alternativa: Firebase

Si algún día no se usa Netlify, la web también puede sincronizar con una Realtime Database de Firebase. Rellena `config.js` con la configuración web del proyecto y pega `database.rules.json` en sus reglas. La web usa Netlify si lo encuentra y, si no, Firebase si `config.js` está relleno.
