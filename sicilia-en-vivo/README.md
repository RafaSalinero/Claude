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

## Paso 1: activar GitHub Pages (una sola vez, 1 minuto)

Si al abrir el enlace de arriba sale un 404:

1. Entra en https://github.com/RafaSalinero/Claude/settings/pages
2. En "Build and deployment", Source: **Deploy from a branch**.
3. Branch: **main**, carpeta **/ (root)**. Guarda.
4. Espera uno o dos minutos y recarga el enlace.

## Paso 2: Firebase (10 minutos, gratis)

Sin esto el mapa carga y ves los sitios, pero no os veis entre vosotros.

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

## Qué hace cada botón

- **Verde (avión)**: compartir o dejar de compartir tu posición.
- **Personas**: encuadra a todos los que están compartiendo.
- **3D**: inclina la cámara y levanta los edificios.
- **Diana**: centra el mapa en ti.
- **+**: añadir un pin del grupo (toca luego el mapa). Se borra desde su ficha.
- Filtros arriba: Ver, Comer, Noche, Excursiones, Pines del grupo. Al tocar uno, el mapa encuadra esos sitios.
- Cada pin tiene "Ir en coche" si está a más de 3 km, o "Cómo llegar a pie" si está cerca. Ambos abren Google Maps con la ruta desde donde estás.

## Si algo falla

- "Falta configurar Firebase": `config.js` sigue con los valores de ejemplo.
- "Sin conexión con el grupo": las reglas no se publicaron o la `databaseURL` es incorrecta.
- No aparece tu punto azul: el navegador no tiene permiso de ubicación para ese sitio. En iPhone, Ajustes > Safari > Ubicación.
- El mapa no carga: comprueba que hay conexión; las teselas vienen de tiles.openfreemap.org sin clave.
