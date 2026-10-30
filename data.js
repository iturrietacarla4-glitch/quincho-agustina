/* ==========================================================
   El Quincho de Agustina — DATOS EDITABLES
   Todo el contenido del sitio vive aquí. Los valores marcados
   con null o PENDIENTE no deben inventarse: se muestran como
   "Por confirmar" hasta que Carla los defina.
   ========================================================== */
window.QUINCHO_DATA = {
  /* Supabase: pegar aquí la Project URL y la anon public key (Settings → API).
     La anon key es pública por diseño; la seguridad la dan las reglas RLS de supabase.sql. */
  supabase: { url: 'https://eozncmvlgcckzbyfykmv.supabase.co', anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvem5jbXZsZ2Nja3pieWZ5a212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNDc4OTQsImV4cCI6MjEwODkyMzg5NH0.iOnNB_Udk6GIpiJirgVMtOXNV4AYE7ZMnpYckfpuN_c' },

  negocio: {
    nombre: 'El Quincho de Agustina',
    lema: ['Un día de diversión', 'en la naturaleza'],
    ubicacion: 'El Manzano, Las Dichas, Casablanca',
    direccionExacta: 'El Manzano, Las Dichas, Casablanca',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=El+Manzano+Las+Dichas+Casablanca+Chile', // reemplazar por el pin exacto
    contacto: {
      nombre: 'Carla Iturrieta',
      rol: 'Reservas y eventos',
      whatsapp: '56930660465',
      whatsappTexto: '+56 9 3066 0465',
      email: 'elquincho.agustina@gmail.com'
    },
    redes: {
      instagram: { usuario: '@elquincho.deagustina', url: 'https://www.instagram.com/elquincho.deagustina/' },
      facebook: null,                  // más adelante
      tiktok: null                     // más adelante
    },
    horarios: 'Arriendo normal: 9:30 a 20:00 · Eventos: horario a acordar',
    temporada: 'Disponible todo el año',
    aforoMaximo: 'Eventos en espacio cerrado: hasta 80 personas'
  },

  instalaciones: [
    { id: 'piscina', ico: 'm-pool', tone: 'blue', img: 'assets/ico/piscina.webp', svg: 'i-waves', corto: 'Piscina', icono: '🏊', titulo: 'Piscina', foto: 'assets/piscina.jpg',
      texto: 'Piscina al aire libre con zona de poca profundidad, reposeras y quitasoles.',
      detalles: { 'Medidas / profundidad': null, 'Salvavidas': 'No' } },
    { id: 'cancha', ico: 'm-ball', tone: 'green', img: 'assets/ico/cancha.webp', svg: 'i-ball', corto: 'Cancha', icono: '⚽', titulo: 'Cancha y zona picnic', foto: 'assets/picnic-cancha.jpg',
      texto: 'Cancha de pasto sintético con arcos y mesas de picnic de madera junto a ella.',
      detalles: { 'Tipo de cancha': 'Baby fútbol, pasto sintético', 'Incluida en el arriendo': 'Sí' } },
    { id: 'quincho', ico: 'm-roof', tone: 'peach', img: 'assets/ico/quincho.webp', svg: 'i-roof', corto: 'Quincho techado', icono: '🍖', titulo: 'Quincho y parrillas', foto: 'assets/parrilla.jpg',
      texto: 'Parrilla grande y quincho techado para el asado de toda la familia.',
      detalles: { 'Parrillas': 'Equipadas, incluidas en el arriendo', 'Refrigeradores': 'Incluidos', 'Carbón o leña': 'Se pueden usar ambos' } },
    { id: 'salon', ico: 'm-plate', tone: 'lav', img: 'assets/ico/instalaciones.webp', svg: 'i-plate', corto: 'Salón y terraza', icono: '🍽️', titulo: 'Salón y terraza', foto: 'assets/salon-montaje.jpg',
      texto: 'Salón revestido en madera y terraza techada, con montaje de mesas para almuerzos y eventos.',
      detalles: { 'Capacidad para eventos': 'Hasta 80 personas', 'Loza': 'Incluida en el arriendo', 'Mantelería': 'A solicitud del evento' } },
    { id: 'juegos', ico: 'm-castle', tone: 'pink', img: 'assets/ico/inflables.webp', svg: 'i-balloon', corto: 'Inflables', icono: '🎈', titulo: 'Juegos inflables', foto: 'assets/inflable-tobogan.jpg',
      texto: 'Gran tobogán inflable de colores para que los niños disfruten todo el día.',
      detalles: { 'Incluido en el arriendo': 'No, se cotiza aparte' } },
    { id: 'cama', ico: 'm-jump', tone: 'yellow', img: 'assets/ico/inflables.webp', svg: 'i-jump', corto: 'Cama elástica', icono: '🤸', titulo: 'Cama elástica y columpios', foto: 'assets/cama-elastica.jpg',
      texto: 'Cama elástica con malla de protección y columpios, bajo toldos de sombra.',
      detalles: {} },
    { id: 'sombra', ico: 'm-relax', tone: 'mint', img: 'assets/ico/descanso.webp', svg: 'i-umb', corto: 'Zonas de descanso', icono: '⛱️', titulo: 'Áreas de sombra', foto: 'assets/juegos-piscina.jpg',
      texto: 'Toldos tensados y quitasoles alrededor de la piscina para descansar del sol.',
      detalles: { 'Mesas disponibles': 'Sí', 'Reposeras': 'Sí' } },
    { id: 'foodtruck', ico: 'm-truck', tone: 'coral', img: 'assets/ico/foodtruck.webp', svg: 'i-truck', corto: 'Food truck', icono: '🌮', titulo: 'Food truck', foto: 'assets/foodtruck.jpg',
      texto: 'Carro de comida en el recinto para picar algo rico sin salir del quincho.',
      detalles: { 'Menú': 'A solicitud del evento', 'Días de atención': 'Cuando se solicite para el evento' } }
  ],

  /* Tipos de actividad del formulario de reserva */
  actividades: [
    { id: 'familiar', ico: 'm-users', tone: 'pink', img: 'assets/ico/familia.webp', svg: 'i-users', color: '#ff1493', titulo: 'Uso familiar', sub: 'Día de piscina, reuniones familiares' },
    { id: 'celebracion', ico: 'm-cake', tone: 'lav', img: 'assets/ico/cumpleanos.webp', icono: '🥂', titulo: 'Celebración', sub: 'Cumpleaños, bautizos, aniversarios' },
    { id: 'curso', ico: 'm-bus', tone: 'yellow', img: 'assets/ico/bus.webp', icono: '🎒', titulo: 'Paseo de curso', sub: 'Colegios y jardines' },
    { id: 'privado', ico: 'm-case', tone: 'teal', img: 'assets/ico/empresa.webp', icono: '💼', titulo: 'Evento privado', sub: 'Empresas, instituciones' },
    { id: 'otro', ico: 'm-star', tone: 'sky', img: 'assets/ico/estrella.webp', icono: '💬', titulo: 'Otro', sub: 'Consultas especiales' }
  ],

  /* Carrusel de la pantalla de inicio */
  promos: [
    { t1: 'Celebraciones', t2: 'inolvidables', foto: 'assets/evento-noche.jpg', link: '#eventos' },
    { t1: 'Matrimonios', t2: 'al aire libre', foto: 'assets/matrimonio-entrada.jpg', link: '#eventos' },
    { t1: 'Cumpleaños', t2: 'llenos de alegría', foto: 'assets/cumple-almuerzo.jpg', link: '#eventos' },
    { t1: 'Tu día de piscina', t2: 'en familia', foto: 'assets/piscina.jpg', link: '#reservas' }
  ],

  /* cat: recinto | familia | eventos  (se usa para los filtros de la galería) */
  galeria: [
    { titulo: 'Vista aérea del recinto', src: 'assets/aerea.jpg', cat: 'recinto', nota: 'Imagen editada con logo' },
    { titulo: 'El Quincho de noche', src: 'assets/evento-noche.jpg', cat: 'eventos' },
    { titulo: 'Piscina en familia', src: 'assets/piscina.jpg', cat: 'familia' },
    { titulo: 'Tobogán inflable', src: 'assets/inflable-tobogan.jpg', cat: 'familia' },
    { titulo: 'Inflable desde el aire', src: 'assets/inflable-aereo.jpg', cat: 'recinto' },
    { titulo: 'Cama elástica', src: 'assets/cama-elastica.jpg', cat: 'familia' },
    { titulo: 'Asado a la parrilla', src: 'assets/parrilla.jpg', cat: 'recinto' },
    { titulo: 'Zona picnic junto a la cancha', src: 'assets/picnic-cancha.jpg', cat: 'familia' },
    { titulo: 'Montaje del salón', src: 'assets/salon-montaje.jpg', cat: 'eventos' },
    { titulo: 'Almuerzo de cumpleaños', src: 'assets/cumple-almuerzo.jpg', cat: 'eventos' },
    { titulo: 'Juegos en la piscina', src: 'assets/juegos-piscina.jpg', cat: 'eventos' },
    { titulo: 'Glitter Room', src: 'assets/glitter-room.jpg', cat: 'eventos' },
    { titulo: 'Graduación', src: 'assets/graduacion.jpg', cat: 'eventos' },
    { titulo: 'Fiesta de graduación', src: 'assets/graduacion-baile.jpg', cat: 'eventos' },
    { titulo: 'Ceremonia de matrimonio', src: 'assets/matrimonio-ceremonia.jpg', cat: 'eventos' },
    { titulo: 'Novios junto a la piscina', src: 'assets/matrimonio-novios.jpg', cat: 'eventos' },
    { titulo: 'Entrada de los novios', src: 'assets/matrimonio-entrada.jpg', cat: 'eventos' },
    { titulo: 'Food truck', src: 'assets/foodtruck.jpg', cat: 'recinto' }
  ],

  eventos: {
    tipos: ['Día de piscina en familia', 'Paseo de curso', 'Cumpleaños', 'Bautizo', 'Matrimonio', 'Graduación 4° medio', 'Gala', 'Conmemoración', 'Celebración familiar', 'Evento de empresa', 'Otro evento'],
    servicios: ['Gastronomía', 'Montaje y mantelería', 'Animación', 'DJ y música', 'Personajes / shows', 'Glitter Room', 'Decoración', 'Fotografía'],
    destacados: [
      { ico: 'm-cake', tone: 'pink', titulo: 'Cumpleaños', texto: 'Piscina, inflables y almuerzo para festejar en grande.', foto: 'assets/cumple-almuerzo.jpg', tipo: 'Cumpleaños', act: 'celebracion' },
      { ico: 'm-rings', tone: 'peach', titulo: 'Matrimonios', texto: 'Ceremonias al aire libre junto a la piscina.', foto: 'assets/matrimonio-entrada.jpg', tipo: 'Matrimonio', act: 'celebracion' },
      { ico: 'm-cap', tone: 'lav', titulo: 'Graduaciones', texto: 'Fiestas nocturnas con luces, DJ y pista.', foto: 'assets/graduacion-baile.jpg', tipo: 'Graduación 4° medio', act: 'celebracion' },
      { ico: 'm-bus', tone: 'yellow', titulo: 'Paseos de curso', texto: 'Un día completo de piscina y juegos para el curso.', foto: 'assets/juegos-piscina.jpg', tipo: 'Paseo de curso', act: 'curso' },
      { ico: 'm-case', tone: 'teal', titulo: 'Eventos privados', texto: 'Empresas e instituciones con salón y asado.', foto: 'assets/salon-montaje.jpg', tipo: 'Evento de empresa', act: 'privado' },
      { ico: 'm-sparkle', tone: 'sky', titulo: 'Otras celebraciones', texto: 'Bautizos, aniversarios y lo que quieras celebrar.', foto: 'assets/evento-noche.jpg', tipo: 'Otro evento', act: 'otro' }
    ]
  },

  /* Modalidades de arriendo. precio: null = "Por confirmar" */
  modalidades: {
    exclusive:  { nombre: 'Arriendo exclusivo por día', precio: null,
      mostrarPrecios: false,   // los valores se consultan por WhatsApp
      incluye: [
        { icono: '🪑', texto: 'Mesas y sillas' },
        { icono: '⛱️', texto: 'Quincho y terraza' },
        { icono: '🍖', texto: 'Parrillas equipadas' },
        { icono: '🧊', texto: 'Refrigeradores' },
        { icono: '⚽', texto: 'Cancha de baby fútbol' },
        { icono: '🍽️', texto: 'Loza y todo lo necesario' }
      ],
      ideal: 'tu día de piscina en familia · Paseos de curso · Cumpleaños · Bautizos · Matrimonios'
    },
    individual: { nombre: 'Entrada individual (fechas especiales)', precioAdulto: null, precioNino: null }
  },

  /* Acceso a administración (#admin): correo + clave. Se guarda solo el hash SHA-256 de
     'quincho-agustina|' + correo + '|' + clave; ni los correos ni la clave quedan en el código. */
  administradores: [{"nombre": "Carla", "h": "04449c7e229b15b4eed225a1327a465d188e90bd43efe383fc176c58f1930434"}, {"nombre": "Matías", "h": "9d2bd0c2391d852cfc4e36e0b6307f0e618ae4144310de738f3f7bf6a56c68b2"}],

  /* Calendario público. Solo fechas, sin datos de clientes.
     Copiadas de la "Agenda El Quincho de Agustina" (actualizar al tomar reservas nuevas). */
  disponibilidadPorDefecto: 'exclusive',   // días futuros no reservados = disponibles para arriendo
  fechasReservadas: [
    '2026-09-05', '2026-09-26',
    '2026-10-10', '2026-10-11', '2026-10-17',
    '2026-11-21', '2026-11-28',
    '2026-12-05', '2026-12-06', '2026-12-12', '2026-12-13', '2026-12-17', '2026-12-19', '2026-12-25',
    '2027-01-03'
  ],

  /* Condiciones de reserva. Agregar más líneas aquí (cancelación, alcohol, mascotas, piscina…) */
  politicas: [
    { icono: '💳', texto: 'Para reservar se requiere un abono. Carla te confirma el monto por WhatsApp según tu reserva.' },
    { icono: '🏊', texto: 'Uso de piscina según el horario contratado.' },
    { icono: '📞', texto: 'Para cancelaciones, contacta a Carla por WhatsApp.' },
    { icono: '🐶', texto: 'Se admiten mascotas.' }
  ]
};
