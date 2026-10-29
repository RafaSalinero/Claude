# Sicilia en vivo

Página web con el mapa real de Sicilia oriental, la posición de Salinero, Braulio y Pomares en tiempo real, los sitios del viaje (Catania y excursiones en coche) y pines que añadís sobre la marcha. Se abre desde el móvil con un enlace y se puede añadir a la pantalla de inicio. No pasa por ninguna tienda.

**Enlace para el grupo: https://sicilia-en-vivo.netlify.app/sicilia-en-vivo/**

Está publicada en Netlify, proyecto `sicilia-en-vivo`, con un pequeño servidor que guarda las posiciones. La copia antigua de GitHub Pages redirige a esta.

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

## Paso 1: Netlify (ya hecho)

El proyecto `sicilia-en-vivo` de Netlify se creó y desplegó desde este repositorio con el conector de Netlify de Claude. No está enlazado a GitHub, así que un cambio en `main` no se publica solo en Netlify: pídele a Claude que lo despliegue, o enlaza el repositorio en Netlify (Project configuration > Build & deploy > Link repository) para que cada push se publique solo.

Consumo: cada móvil hace una petición cada 6 segundos mientras comparte y cada 12 si solo mira, y se para cuando la web está en segundo plano. Para tres personas durante el viaje son unas decenas de miles de peticiones, muy por debajo del plan gratuito de Netlify.

Privacidad: no hay PIN, así que cualquiera que tenga el enlace puede ver vuestras posiciones mientras compartís. Pasad el enlace solo entre los tres. Las posiciones se borran al apagar el interruptor o cerrar la página, y en cualquier caso a las 6 horas.

## Paso 2: en el móvil

1. Cada uno abre el enlace de Netlify y toca su nombre: Salinero, Braulio o Pomares. Cada uno tiene su color fijo en el mapa. El móvil lo recuerda y las siguientes veces entra directo; para cambiar de persona, toca el logo de arriba a la izquierda.
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

- La ficha dice "Modo individual": estás en una copia de la web sin servidor. Abre el enlace de Netlify.
- "Sin conexión con el grupo, reintentando…": no hay cobertura o Netlify no responde. La web reintenta sola.
- No aparece tu punto azul: el navegador no tiene permiso de ubicación para ese sitio. En iPhone, Ajustes > Safari > Ubicación.
- El mapa no carga: comprueba que hay conexión; las teselas vienen de tiles.openfreemap.org sin clave.

## Alternativa: Firebase

Si algún día no se usa Netlify, la web también puede sincronizar con una Realtime Database de Firebase. Rellena `config.js` con la configuración web del proyecto y pega `database.rules.json` en sus reglas. La web usa Netlify si lo encuentra y, si no, Firebase si `config.js` está relleno.
