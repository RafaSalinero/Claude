# Sicilia en vivo

Página web con el mapa real de Sicilia oriental, tu posición y la de los otros dos en tiempo real, los sitios del viaje (Catania y excursiones en coche) y pines que añadís sobre la marcha. Se abre desde el móvil con un enlace y se puede añadir a la pantalla de inicio. No pasa por ninguna tienda.

Está publicada con GitHub Pages en:

**https://rafasalinero.github.io/Claude/sicilia-en-vivo/**

Funciona fuera del visor de claude.ai porque ese visor bloquea la ubicación del móvil y los mapas en vivo. La app del plan (artefacto de claude.ai) enlaza a esta página desde la pestaña Mapa.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La página completa (mapa, posiciones, pines). |
| `config.js` | Credenciales de tu proyecto Firebase. Hay que editarlo una vez. |
| `places.js` | Los sitios del viaje: Catania y excursiones. Edítalo si cambias sitios. |
| `database.rules.json` | Reglas de seguridad para la Realtime Database. |
| `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png`, `logo-96.png` | Icono de los tres pumas y datos para añadir a la pantalla de inicio. |

## Paso 1: GitHub Pages (ya hecho)

La web se publica sola desde la rama `gh-pages`. Cada vez que cambias algo en `main`, una acción de GitHub copia `main` en `gh-pages` y en uno o dos minutos la web se actualiza. Edita siempre en `main`.

Si algún día el enlace diera 404: https://github.com/RafaSalinero/Claude/settings/pages, Source "Deploy from a branch", rama `gh-pages`, carpeta `/ (root)`.

## Paso 2: Firebase (10 minutos, gratis)

Sin esto la web funciona en modo individual: ves el mapa, los sitios y tu posición, pero no os veis entre vosotros.

1. Entra en https://console.firebase.google.com con tu cuenta de Google y crea un proyecto (por ejemplo `sicilia-dic`). Puedes desactivar Analytics.
2. En el menú lateral, Compilación > Realtime Database > Crear base de datos. Elige la región `europe-west1` y empieza en **modo bloqueado**.
3. En la pestaña Reglas, borra lo que haya y pega el contenido de `database.rules.json`. Publica.
4. Configuración del proyecto (rueda dentada) > Tus apps > icono `</>` (web). Ponle un nombre y registra. Copia los valores de `firebaseConfig`.
5. Edita `config.js` directamente en GitHub (abre el archivo, icono del lápiz), pega `apiKey`, `authDomain`, `projectId`, `appId` y la `databaseURL` que aparece en la cabecera de la Realtime Database (termina en `firebasedatabase.app`). Guarda con "Commit changes". En un minuto la web está actualizada.

O pásale esos valores a Claude y lo actualiza él.

Qué protege esto: nadie fuera del grupo puede leer nada salvo que conozca el PIN, porque los datos cuelgan de una clave derivada del PIN. Elegid un PIN que no sea 1234. Las posiciones se borran solas al cerrar la página. Las claves de `config.js` son públicas por diseño en Firebase; la seguridad la dan las reglas y el PIN.

## Paso 3: en el móvil

1. Cada uno abre el enlace, escribe su nombre y el PIN del grupo.
2. Pulsa el botón verde (avión de papel) y acepta el permiso de ubicación. Mientras está en verde, los otros te ven; al apagarlo o cerrar la página, desapareces.
3. Safari en iPhone: compartir > "Añadir a pantalla de inicio" para tenerla como app con el icono de los pumas. Chrome en Android: menú > "Añadir a pantalla de inicio".

Importante en iPhone: la posición solo se envía mientras la página está abierta en primer plano. Si bloqueas el móvil, deja de actualizarse hasta que vuelvas a abrirla. Es una limitación de iOS para webs, no de la app.

## Cómo se usa

- **Ficha inferior**: "¿A dónde vamos?" abre el buscador de sitios, ordenados por cercanía. El interruptor "Compartir mi ubicación" hace que los demás te vean; al apagarlo o cerrar la página desapareces. "Añadir pin del grupo" y luego toca el mapa para guardar un sitio para los tres.
- **Al tocar un sitio**, la ficha se convierte en su tarjeta: botón negro "Ir en coche" si está a más de 3 km o "Ir andando" si está cerca, ambos con la ruta en Google Maps, y "Ver en Maps".
- **Al tocar a un amigo**, en el mapa o en sus iniciales arriba a la derecha, ves hace cuánto se actualizó y un botón para ir hasta él.
- **Botones redondos**: 3D inclina el mapa y levanta los edificios; el de personas encuadra a todos; la flecha te centra.
- **Filtros arriba**: Ver, Comer, Noche, Excursiones y Pines del grupo. Al tocar uno, el mapa encuadra esos sitios.
- El mapa usa el tema claro u oscuro del móvil.

## Si algo falla

- "Falta configurar Firebase": `config.js` sigue con los valores de ejemplo.
- "Sin conexión con el grupo": las reglas no se publicaron o la `databaseURL` es incorrecta.
- No aparece tu punto azul: el navegador no tiene permiso de ubicación para ese sitio. En iPhone, Ajustes > Safari > Ubicación.
- El mapa no carga: comprueba que hay conexión; las teselas vienen de tiles.openfreemap.org sin clave.
