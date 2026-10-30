/* ==========================================================
   El Quincho de Agustina — DATOS EDITABLES
   Todo el contenido del sitio vive aquí. Los valores marcados
   con null o PENDIENTE no deben inventarse: se muestran como
   "Por confirmar" hasta que Carla los defina.
   ========================================================== */
window.QUINCHO_DATA = {
  negocio: {
    nombre: 'El Quincho de Agustina',
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
      facebook: null,                  // PENDIENTE
      tiktok: null                     // PENDIENTE
    },
    horarios: 'Arriendo normal: 9:30 a 20:00 · Eventos: horario a acordar',
    temporada: 'Disponible todo el año',
    aforoMaximo: 'Eventos en espacio cerrado: hasta 80 personas'
  },

  instalaciones: [
    { id: 'piscina', icono: '🏊', titulo: 'Piscina', foto: 'assets/piscina.jpg',
      texto: 'Piscina al aire libre con zona de poca profundidad, reposeras y quitasoles.',
      detalles: { 'Medidas / profundidad': null, 'Salvavidas': null, 'Horario de piscina': null } },
    { id: 'cancha', icono: '⚽', titulo: 'Cancha y zona picnic', foto: 'assets/picnic-cancha.jpg',
      texto: 'Cancha de pasto sintético con arcos y mesas de picnic de madera junto a ella.',
      detalles: { 'Tipo de cancha': 'Baby fútbol, pasto sintético', 'Incluida en el arriendo': 'Sí', 'Medidas': null } },
    { id: 'quincho', icono: '🍖', titulo: 'Quincho y parrillas', foto: 'assets/parrilla.jpg',
      texto: 'Parrilla grande y quincho techado para el asado de toda la familia.',
      detalles: { 'Parrillas': 'Equipadas, incluidas en el arriendo', 'Refrigeradores': 'Incluidos', 'Carbón / leña': null } },
    { id: 'salon', icono: '🍽️', titulo: 'Salón y terraza', foto: 'assets/salon-montaje.jpg',
      texto: 'Salón revestido en madera y terraza techada, con montaje de mesas para almuerzos y eventos.',
      detalles: { 'Capacidad para eventos': 'Hasta 80 personas', 'Loza': 'Incluida en el arriendo', 'Mantelería': null } },
    { id: 'juegos', icono: '🎈', titulo: 'Juegos inflables', foto: 'assets/inflable-tobogan.jpg',
      texto: 'Gran tobogán inflable de colores para que los niños disfruten todo el día.',
      detalles: { 'Edades recomendadas': null, 'Incluido en el arriendo': null } },
    { id: 'cama', icono: '🤸', titulo: 'Cama elástica y columpios', foto: 'assets/cama-elastica.jpg',
      texto: 'Cama elástica con malla de protección y columpios, bajo toldos de sombra.',
      detalles: { 'Edades recomendadas': null, 'Supervisión': null } },
    { id: 'sombra', icono: '⛱️', titulo: 'Áreas de sombra', foto: 'assets/juegos-piscina.jpg',
      texto: 'Toldos tensados y quitasoles alrededor de la piscina para descansar del sol.',
      detalles: { 'Mesas disponibles': null, 'Reposeras': null } },
    { id: 'foodtruck', icono: '🌮', titulo: 'Food truck', foto: 'assets/foodtruck.jpg',
      texto: 'Carro de comida en el recinto para picar algo rico sin salir del quincho.',
      detalles: { 'Menú': null, 'Días de atención': null } }
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
      { icono: '🎂', titulo: 'Cumpleaños', texto: 'Piscina, inflables, almuerzo y juegos para festejar en grande.', foto: 'assets/cumple-almuerzo.jpg' },
      { icono: '💍', titulo: 'Matrimonios', texto: 'Ceremonias al aire libre con arco floral junto a la piscina.', foto: 'assets/matrimonio-entrada.jpg' },
      { icono: '🎓', titulo: 'Graduaciones y galas', texto: 'Fiestas nocturnas con luces, DJ y pista al aire libre.', foto: 'assets/graduacion-baile.jpg' },
      { icono: '🏢', titulo: 'Empresas y grupos', texto: 'Paseos de fin de año con salón, asado y piscina.', foto: 'assets/salon-montaje.jpg' }
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

  /* Acceso a administración (#admin). Se guarda el hash SHA-256 de 'quincho-agustina|' + PIN, nunca el PIN. */
  administradores: [{"nombre": "Carla", "pin": "f7b52ec8317b8d420d0997f61d93dc469becdaceff20e0f67174fe69fc59fa8a"}, {"nombre": "Matías", "pin": "2527f2f0abee9bfd7b2fb225b043f27d7da463a0db11f06999bc675fdce67237"}],

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
    { icono: '💳', texto: 'Para reservar se requiere un abono. Carla te confirma el monto por WhatsApp según tu reserva.' }
  ]
};
