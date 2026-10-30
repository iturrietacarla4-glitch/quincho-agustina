# El Quincho de Agustina — sitio web

Sitio web estático (HTML, CSS y JavaScript, sin dependencias) de **El Quincho de Agustina**, El Manzano, Las Dichas, Casablanca.
Desarrollado por **FLUVA** · Tecnología que fluye contigo.

## Publicar en GitHub Pages
1. Crea un repositorio nuevo en GitHub (por ejemplo `quincho-agustina`).
2. Sube **todo el contenido de esta carpeta** a la raíz del repositorio (botón *Add file → Upload files*, arrastra los archivos y la carpeta `assets`).
3. Ve a **Settings → Pages**, en *Source* elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guarda.
4. En 1–2 minutos el sitio queda en `https://TU-USUARIO.github.io/quincho-agustina/`.

## Estructura
- `index.html` — estructura de la página
- `style.css` — diseño (colores del logo, responsive móvil/escritorio)
- `data.js` — **datos editables**: contacto, horarios, instalaciones, galería, eventos, condiciones
- `app.js` — lógica: calendarios, formularios a WhatsApp, galería, panel demo
- `assets/` — logo y fotografías optimizadas

## Editar contenido
Casi todo se cambia en `data.js` (textos, fotos, condiciones de reserva). Los valores en `null` se muestran como «Por confirmar».

## Importante
Es una versión demostrativa sin servidor: las solicitudes se envían a Carla por WhatsApp y **no confirman la fecha ni pagos**. El panel de administración guarda datos solo en el navegador que lo usa; no es privado ni seguro. Para gestionar reservas reales se necesita un backend con autenticación y base de datos.

Pendiente: pin exacto de Google Maps, más condiciones de reserva (cancelación, piscina, alcohol, mascotas), detalles de cada instalación.
