/**
 * El idioma en el que se lee la carta.
 *
 * Vive fuera de React a proposito: lo consultan tanto componentes como la
 * funcion `texto()` de aqui abajo, y pasarlo por props desde la carta hasta
 * cada alergeno serian seis niveles de tuberia para un dato que no cambia
 * casi nunca.
 *
 * Se guarda en el navegador: quien lee la carta en ingles y vuelve mañana
 * espera encontrarla en ingles, no tener que buscar la bandera otra vez.
 */

export const IDIOMAS = [
  { codigo: 'es', nombre: 'Español' },
  { codigo: 'en', nombre: 'English' },
  { codigo: 'de', nombre: 'Deutsch' },
];

const CLAVE = 'cobama:idioma';
const POR_DEFECTO = 'es';

const valido = (c) => IDIOMAS.some((i) => i.codigo === c);

export function idiomaGuardado() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (valido(guardado)) return guardado;
  } catch {
    // Navegador con el almacenamiento bloqueado -modo privado, o el usuario
    // lo tiene desactivado-. No es un error: se usa el idioma de la casa.
  }
  return POR_DEFECTO;
}

export function guardarIdioma(codigo) {
  if (!valido(codigo)) return;
  try {
    localStorage.setItem(CLAVE, codigo);
  } catch {
    // Igual que arriba: si no se puede guardar, el idioma dura lo que la
    // visita. Peor seria reventar al elegirlo.
  }
}

/**
 * El texto de un campo en el idioma elegido, con vuelta al castellano.
 *
 *   texto(plato, 'nombre', 'de')  ->  plato.nombre_de, o plato.nombre
 *
 * La vuelta al castellano es campo a campo y no de todo el plato: de los 166
 * platos hay 70 traducidos, y de esos solo 30 tienen descripcion. Sin esto,
 * un plato a medio traducir saldria con el nombre en aleman y la descripcion
 * en blanco, que es peor que verla en castellano.
 *
 * Y nunca deja el hueco vacio: una carta con nombres en blanco no es una
 * carta, y en un sitio donde hay alergenos de por medio, callar es lo unico
 * que no se puede hacer.
 */
export function texto(objeto, campo, idioma) {
  if (!objeto) return '';
  if (idioma && idioma !== 'es') {
    const traducido = objeto[`${campo}_${idioma}`];
    if (traducido) return traducido;
  }
  return objeto[campo] ?? '';
}

/**
 * Los textos de la interfaz que no salen de la base.
 *
 * Van aqui y no repartidos por los componentes para poder ver de un vistazo
 * que falta por traducir: con las cadenas sueltas, el dia que se anada un
 * cuarto idioma hay que recorrer la aplicacion entera buscandolas.
 *
 * Cubren la navegacion, el pie, la ficha del local, la carta y el formulario
 * de reservas: todo lo que un cliente lee para decidir y para reservar.
 *
 * NO cubren los textos legales -aviso legal y politica de privacidad-. Esos
 * se quedan en castellano a proposito: una politica de privacidad mal
 * traducida no es un detalle de estilo, es informacion legal incorrecta. Van
 * con un aviso que dice en que idioma estan y por que.
 */
const UI = {
  'leyenda.titulo': {
    es: 'Qué significa cada icono',
    en: 'What each icon means',
    de: 'Was jedes Symbol bedeutet',
  },
  'leyenda.sinDibujo': {
    es: 'salen escritos en la carta, todavía no tienen dibujo.',
    en: 'are written out in the menu; they have no icon yet.',
    de: 'stehen ausgeschrieben in der Karte; sie haben noch kein Symbol.',
  },
  'precio.media': { es: 'Media ración', en: 'Half portion', de: 'Halbe Portion' },
  'precio.racion': { es: 'Ración', en: 'Full portion', de: 'Ganze Portion' },
  'unidad.kg': { es: 'el kilo', en: 'per kilo', de: 'pro Kilo' },
  'unidad.ud': { es: 'la unidad', en: 'each', de: 'pro Stück' },
  'unidad.persona': { es: 'por persona', en: 'per person', de: 'pro Person' },
  'unidad.minimo': { es: 'mín. {n} personas', en: 'min. {n} people', de: 'mind. {n} Personen' },
  'etiqueta.destacado': { es: 'De la casa', en: "Chef's pick", de: 'Empfehlung' },
  'etiqueta.agotado': { es: 'Hoy no queda', en: 'Sold out today', de: 'Heute aus' },
  'etiqueta.vegano': { es: 'Vegano', en: 'Vegan', de: 'Vegan' },
  'etiqueta.vegetariano': { es: 'Vegetariano', en: 'Vegetarian', de: 'Vegetarisch' },
  'etiqueta.canario': { es: 'Producto canario', en: 'Canarian produce', de: 'Kanarisches Produkt' },
  'nav.locales': { es: 'Nuestros locales', en: 'Our restaurants', de: 'Unsere Lokale' },
  'nav.reservas': { es: 'Reservas', en: 'Bookings', de: 'Reservierungen' },
  'nav.fotos': { es: 'Fotos', en: 'Photos', de: 'Fotos' },
  'nav.siguenos': { es: 'Síguenos', en: 'Follow us', de: 'Folgen Sie uns' },
  'nav.galeriaGrupo': { es: 'Galería del grupo', en: 'Group gallery', de: 'Galerie der Gruppe' },
  'nav.privacidad': { es: 'Privacidad', en: 'Privacy', de: 'Datenschutz' },
  'nav.avisoLegal': { es: 'Aviso legal', en: 'Legal notice', de: 'Impressum' },
  'nav.reservar': { es: 'Reservar', en: 'Book a table', de: 'Reservieren' },
  'nav.fotosDe': { es: 'Fotos de {local}', en: 'Photos of {local}', de: 'Fotos von {local}' },
  'nav.inicio': {
    es: 'Grupo Cobama, ir al inicio',
    en: 'Grupo Cobama, go to the home page',
    de: 'Grupo Cobama, zur Startseite',
  },
  // El texto con el que se abre WhatsApp. Va traducido porque es lo primero
  // que lee el local cuando le entra el mensaje: si escribe un aleman, saber
  // en que idioma va a seguir la conversacion le ahorra el susto.
  'nav.saludoWhatsApp': {
    es: 'Hola, me gustaría hacer una reserva.',
    en: 'Hello, I would like to book a table.',
    de: 'Hallo, ich möchte gerne einen Tisch reservieren.',
  },

  // ---- portada ----
  'home.titulo': {
    es: 'Cocina canaria de siempre, en cuatro casas',
    en: 'Traditional Canarian cooking, in four restaurants',
    de: 'Traditionelle kanarische Küche, in vier Häusern',
  },
  'home.entradilla': {
    es: 'Guamasa, Candelaria, La Laguna y La Orotava. Misma cocina, mismo trato, cuatro sitios distintos donde sentarse a comer.',
    en: 'Guamasa, Candelaria, La Laguna and La Orotava. The same cooking, the same welcome, four different places to sit down and eat.',
    de: 'Guamasa, Candelaria, La Laguna und La Orotava. Dieselbe Küche, dieselbe Herzlichkeit, vier verschiedene Orte zum Essen.',
  },
  'home.galeria': { es: 'Galería', en: 'Gallery', de: 'Galerie' },
  'home.proximamente': { es: 'Próximamente', en: 'Coming soon', de: 'Demnächst' },
  'home.quintaCasa': {
    es: 'la quinta casa del grupo',
    en: "the group's fifth restaurant",
    de: 'das fünfte Haus der Gruppe',
  },
  'home.localesIntro': {
    es: 'Cada casa tiene su carta y su carácter. Elige la que te pille más cerca.',
    en: 'Each restaurant has its own menu and its own character. Pick whichever is closest to you.',
    de: 'Jedes Haus hat seine eigene Karte und seinen eigenen Charakter. Wählen Sie das nächstgelegene.',
  },
  // "Cocina ininterrumpida" no se traduce literal: en ingles y aleman lo que
  // se entiende es que la cocina no cierra por la tarde, no que sea continua.
  'home.jornadaTitular': {
    es: 'Cocina ininterrumpida',
    en: 'Kitchen open all day',
    de: 'Durchgehend warme Küche',
  },
  'home.jornadaDetalle': {
    es: 'No cerramos entre la comida y la cena, en las cuatro casas',
    en: 'We do not close between lunch and dinner, in any of the four restaurants',
    de: 'Wir schließen zwischen Mittag- und Abendessen nicht, in allen vier Häusern',
  },
  'home.cargandoLocales': {
    es: 'Cargando locales...',
    en: 'Loading restaurants...',
    de: 'Lokale werden geladen...',
  },

  // ---- fotos de la portada ----
  // Copiados de los mismos platos en la carta: dos nombres distintos para el
  // mismo plato en la misma web es peor que no traducirlo.
  'portada.papas': {
    es: 'Papas arrugadas con mojos',
    en: 'Canarian wrinkled potatoes with mojo sauces',
    de: 'Kanarische Runzelkartoffeln mit Mojo-Saucen',
  },
  'portada.queso': {
    es: 'Queso asado con mojo',
    en: 'Grilled cheese with mojo sauce',
    de: 'Gegrillter Käse mit Mojo-Sauce',
  },
  'portada.cabra': {
    es: 'Carne cabra',
    en: 'Goat stew',
    de: 'Ziegenragout',
  },

  // ---- tarjeta de cada local ----
  'tarjeta.reservar': { es: 'Reservar', en: 'Book', de: 'Reservieren' },
  'tarjeta.llamar': { es: 'Llamar', en: 'Call', de: 'Anrufen' },

  // ---- carrusel ----
  'carrusel.anteriores': { es: 'Ver {que} anteriores', en: 'See previous {que}', de: 'Vorherige {que} ansehen' },
  'carrusel.siguientes': { es: 'Ver {que} siguientes', en: 'See next {que}', de: 'Nächste {que} ansehen' },
  'carrusel.recomendaciones': { es: 'recomendaciones', en: 'recommendations', de: 'Empfehlungen' },
  'carrusel.fotos': { es: 'fotos', en: 'photos', de: 'Fotos' },
  'carrusel.elementos': { es: 'elementos', en: 'items', de: 'Elemente' },

  // ---- reservas ----
  //
  // El aviso de proteccion de datos del formulario SI se traduce, al reves
  // que las paginas legales enteras. El consentimiento tiene que entenderlo
  // quien lo da: una casilla en castellano delante de alguien que lee la web
  // en aleman no es un consentimiento informado. El texto largo sigue estando
  // solo en castellano, y el enlace lleva alli.
  'res.titulo': { es: 'Reservar mesa', en: 'Book a table', de: 'Tisch reservieren' },
  'res.entradilla': {
    es: 'Dinos cuándo y cuántos sois. El local te confirma en cuanto lo vea. Si es para dentro de un rato, llama mejor por teléfono.',
    en: 'Tell us when and how many of you. The restaurant confirms as soon as it sees the request. If it is for very soon, better to call.',
    de: 'Sagen Sie uns wann und für wie viele. Das Lokal bestätigt, sobald es die Anfrage sieht. Für sehr kurzfristige Reservierungen rufen Sie besser an.',
  },
  'res.local': { es: 'Local', en: 'Restaurant', de: 'Lokal' },
  'res.eligeLocal': { es: 'Elige un local', en: 'Choose a restaurant', de: 'Lokal auswählen' },
  'res.fuera': {
    es: '{local} lleva sus reservas en su propio sistema. Se abre en otra pestaña y esta página se queda aquí.',
    en: '{local} handles its bookings in its own system. It opens in another tab and this page stays here.',
    de: '{local} verwaltet seine Reservierungen in einem eigenen System. Es öffnet sich in einem neuen Tab, diese Seite bleibt bestehen.',
  },
  'res.reservarEn': { es: 'Reservar en {local}', en: 'Book at {local}', de: 'Bei {local} reservieren' },
  'res.oLlama': {
    es: 'Si prefieres, llama al {telefono}.',
    en: 'If you prefer, call {telefono}.',
    de: 'Wenn Sie möchten, rufen Sie {telefono} an.',
  },
  'res.dia': { es: 'Día', en: 'Date', de: 'Datum' },
  'res.hora': { es: 'Hora', en: 'Time', de: 'Uhrzeit' },
  'res.eligePrimeroLocal': {
    es: 'Elige primero el local',
    en: 'Choose the restaurant first',
    de: 'Zuerst das Lokal wählen',
  },
  'res.cargando': { es: 'Cargando...', en: 'Loading...', de: 'Wird geladen...' },
  'res.diaCerrado': { es: 'Ese día está cerrado', en: 'Closed that day', de: 'An diesem Tag geschlossen' },
  'res.sinHoras': {
    es: 'No quedan horas ese día',
    en: 'No times left that day',
    de: 'Keine Zeiten mehr an diesem Tag',
  },
  'res.eligeHora': { es: 'Elige una hora', en: 'Choose a time', de: 'Uhrzeit wählen' },
  'res.comensales': { es: 'Comensales', en: 'Diners', de: 'Personen' },
  'res.cierraEseDia': {
    es: '{local} cierra ese día. Prueba otra fecha u otro local.',
    en: '{local} is closed that day. Try another date or another restaurant.',
    de: '{local} ist an diesem Tag geschlossen. Versuchen Sie ein anderes Datum oder ein anderes Lokal.',
  },
  'res.huecoConAntes': {
    es: 'Ese día la última mesa a mediodía es a las {ultima}, y volvemos a reservar a partir de las {primera}.',
    en: 'That day the last lunchtime table is at {ultima}, and we take bookings again from {primera}.',
    de: 'An diesem Tag ist der letzte Mittagstisch um {ultima}, ab {primera} nehmen wir wieder Reservierungen an.',
  },
  'res.huecoSinAntes': {
    es: 'Ese día no cogemos reservas hasta las {primera}.',
    en: 'That day we do not take bookings until {primera}.',
    de: 'An diesem Tag nehmen wir erst ab {primera} Reservierungen an.',
  },
  'res.huecoMotivo': {
    es: 'La cocina está abierta: esas mesas las guardamos para quien llega sin reservar. Puedes venirte igual, o reservar antes o después.',
    en: 'The kitchen is open: we keep those tables for walk-ins. You are welcome to come anyway, or book before or after.',
    de: 'Die Küche ist geöffnet: Diese Tische halten wir für Gäste ohne Reservierung frei. Kommen Sie gerne trotzdem, oder reservieren Sie davor oder danach.',
  },
  'res.nombre': { es: 'Nombre de la reserva', en: 'Name for the booking', de: 'Name für die Reservierung' },
  'res.nombrePista': { es: 'A nombre de...', en: 'Under the name of...', de: 'Auf den Namen...' },
  'res.telefono': { es: 'Teléfono', en: 'Phone', de: 'Telefon' },
  'res.telefonoPista': { es: 'Para avisarte', en: 'So we can reach you', de: 'Damit wir Sie erreichen' },
  'res.email': { es: 'Email', en: 'Email', de: 'E-Mail' },
  'res.opcional': { es: '(opcional)', en: '(optional)', de: '(optional)' },
  'res.emailPista': {
    es: 'Para mandarte la confirmación',
    en: 'To send you the confirmation',
    de: 'Für die Bestätigung',
  },
  'res.observaciones': {
    es: 'Algo que debamos saber',
    en: 'Anything we should know',
    de: 'Etwas, das wir wissen sollten',
  },
  'res.observacionesPista': {
    es: 'Alergias, trona, celebración, si venís con perro...',
    en: 'Allergies, high chair, a celebration, if you are bringing a dog...',
    de: 'Allergien, Hochstuhl, eine Feier, ob Sie einen Hund mitbringen...',
  },
  'res.consentimiento': {
    es: 'Tus datos los trata {responsable} para gestionar esta reserva y avisarte, porque son necesarios para poder atenderte. Se guardan {meses} meses y los ve el local y {encargado}, que nos lleva el libro de reservas. Puedes acceder a ellos, corregirlos o pedir que los borremos escribiendo a {email}. Lo tienes todo detallado en la {politica}.',
    en: 'Your data is processed by {responsable} to manage this booking and to contact you, because it is needed in order to serve you. It is kept for {meses} months and is seen by the restaurant and by {encargado}, who runs our booking book. You can access it, correct it or ask us to delete it by writing to {email}. It is all set out in the {politica}.',
    de: 'Ihre Daten werden von {responsable} verarbeitet, um diese Reservierung zu verwalten und Sie zu benachrichtigen, denn sie sind nötig, um Sie zu bedienen. Sie werden {meses} Monate gespeichert und sind für das Lokal und für {encargado} einsehbar, das unser Reservierungsbuch führt. Sie können darauf zugreifen, sie berichtigen oder ihre Löschung verlangen, indem Sie an {email} schreiben. Alles Weitere steht in der {politica}.',
  },
  'res.politica': {
    es: 'política de privacidad',
    en: 'privacy policy',
    de: 'Datenschutzerklärung',
  },
  'res.heLeido': {
    es: 'He leído y entiendo la {politica}.',
    en: 'I have read and understand the {politica}.',
    de: 'Ich habe die {politica} gelesen und verstanden.',
  },
  'res.marketing': {
    es: 'Quiero recibir novedades y menús especiales por email.',
    en: 'I would like to receive news and special menus by email.',
    de: 'Ich möchte Neuigkeiten und besondere Menüs per E-Mail erhalten.',
  },
  'res.marketingNota': {
    es: 'Es voluntario, tu reserva funciona igual, y puedes darte de baja cuando quieras.',
    en: 'It is optional, your booking works just the same, and you can unsubscribe whenever you like.',
    de: 'Freiwillig, Ihre Reservierung funktioniert genauso, und Sie können sich jederzeit abmelden.',
  },
  'res.enviando': { es: 'Enviando...', en: 'Sending...', de: 'Wird gesendet...' },
  'res.pedir': { es: 'Pedir la reserva', en: 'Request the booking', de: 'Reservierung anfragen' },
  'res.tambienWhatsApp': {
    es: 'También puedes reservar por WhatsApp al {numero}.',
    en: 'You can also book on WhatsApp at {numero}.',
    de: 'Sie können auch per WhatsApp unter {numero} reservieren.',
  },
  'res.metaDescripcion': {
    es: 'Reserva mesa en cualquiera de los cuatro locales del Grupo Cobama.',
    en: 'Book a table at any of the four Grupo Cobama restaurants.',
    de: 'Reservieren Sie einen Tisch in einem der vier Lokale der Grupo Cobama.',
  },

  // ---- reserva ya enviada ----
  'res.enviada': { es: 'Reserva enviada', en: 'Booking request sent', de: 'Anfrage gesendet' },
  'res.recibido': {
    es: 'Hemos recibido tu solicitud para {local} el {fecha} a las {hora}, para {comensales}.',
    en: 'We have received your request for {local} on {fecha} at {hora}, for {comensales}.',
    de: 'Wir haben Ihre Anfrage für {local} am {fecha} um {hora} für {comensales} erhalten.',
  },
  'res.unaPersona': { es: '{n} persona', en: '{n} person', de: '{n} Person' },
  'res.variasPersonas': { es: '{n} personas', en: '{n} people', de: '{n} Personen' },
  'res.sinConfirmar': {
    es: 'Todavía no está confirmada.',
    en: 'It is not confirmed yet.',
    de: 'Sie ist noch nicht bestätigt.',
  },
  'res.sinConfirmarDetalle': {
    es: 'El local la revisa y te avisa. Si es para dentro de poco, mejor llama por teléfono y lo cerramos al momento.',
    en: 'The restaurant reviews it and lets you know. If it is for very soon, better to call and we settle it there and then.',
    de: 'Das Lokal prüft sie und meldet sich. Für sehr kurzfristige Reservierungen rufen Sie besser an, dann klären wir es sofort.',
  },
  'res.guardaCodigo': {
    es: 'Guarda el código {codigo}: con él te localizamos la reserva si nos llamas.',
    en: 'Keep the code {codigo}: we use it to find your booking if you call us.',
    de: 'Bewahren Sie den Code {codigo} auf: damit finden wir Ihre Reservierung, wenn Sie anrufen.',
  },
  'res.whatsappHecha': {
    es: 'Hola, acabo de reservar con el código {codigo} a nombre de {nombre}.',
    en: 'Hello, I have just booked with code {codigo} under the name {nombre}.',
    de: 'Hallo, ich habe gerade mit dem Code {codigo} auf den Namen {nombre} reserviert.',
  },
  'res.escribirWhatsApp': {
    es: 'Escribir por WhatsApp',
    en: 'Message us on WhatsApp',
    de: 'Über WhatsApp schreiben',
  },
  'res.otraReserva': {
    es: 'Hacer otra reserva',
    en: 'Make another booking',
    de: 'Weitere Reservierung',
  },

  // ---- galeria ----
  'gal.titulo': { es: 'Galería', en: 'Gallery', de: 'Galerie' },
  'gal.meta': {
    es: 'Fotos de los cuatro locales del Grupo Cobama: platos, salas y celebraciones.',
    en: 'Photos of the four Grupo Cobama restaurants: dishes, dining rooms and celebrations.',
    de: 'Fotos der vier Lokale der Grupo Cobama: Gerichte, Räume und Feiern.',
  },
  'gal.introLocal': {
    es: 'Los platos, la sala y lo que se cuece por aquí.',
    en: 'The dishes, the dining room and what goes on here.',
    de: 'Die Gerichte, der Raum und was hier so passiert.',
  },
  'gal.introGrupo': {
    es: 'Las cuatro casas: sus platos, sus salas y sus celebraciones.',
    en: 'The four restaurants: their dishes, their dining rooms and their celebrations.',
    de: 'Die vier Häuser: ihre Gerichte, ihre Räume und ihre Feiern.',
  },
  'gal.cargando': { es: 'Cargando fotos...', en: 'Loading photos...', de: 'Fotos werden geladen...' },
  'gal.vacia': {
    es: 'Todavía no hay fotos publicadas aquí.',
    en: 'No photos have been published here yet.',
    de: 'Hier wurden noch keine Fotos veröffentlicht.',
  },
  'gal.cadaCasa': { es: 'Cada casa tiene la suya:', en: 'Each restaurant has its own:', de: 'Jedes Haus hat seine eigene:' },
  'gal.fotosDe': { es: 'Fotos de {local}', en: 'Photos of {local}', de: 'Fotos von {local}' },
  'gal.metaLocal': {
    es: 'Fotos de {local}: sus platos, el local y sus celebraciones.',
    en: 'Photos of {local}: its dishes, the restaurant and its celebrations.',
    de: 'Fotos von {local}: die Gerichte, das Lokal und die Feiern.',
  },
  'gal.ampliar': { es: 'Ampliar: {que}', en: 'Enlarge: {que}', de: 'Vergrößern: {que}' },
  'gal.foto': { es: 'foto', en: 'photo', de: 'Foto' },
  'gal.todo': { es: 'Todo', en: 'All', de: 'Alle' },
  'gal.cat.plato': { es: 'Platos', en: 'Dishes', de: 'Gerichte' },
  'gal.cat.local': { es: 'El local', en: 'The restaurant', de: 'Das Lokal' },
  'gal.cat.equipo': { es: 'El equipo', en: 'The team', de: 'Das Team' },
  'gal.cat.evento': { es: 'Celebraciones', en: 'Celebrations', de: 'Feiern' },

  // ---- pagina que no existe ----
  'perdido.titulo': {
    es: 'Esta página no existe',
    en: 'This page does not exist',
    de: 'Diese Seite gibt es nicht',
  },
  'perdido.texto': {
    es: 'Puede que el enlace esté mal o que el local haya cambiado de nombre.',
    en: 'The link may be wrong, or the restaurant may have changed its name.',
    de: 'Der Link könnte falsch sein, oder das Lokal hat seinen Namen geändert.',
  },
  'perdido.volver': { es: 'Volver al inicio', en: 'Back to the home page', de: 'Zurück zur Startseite' },

  // ---- ver el plato en la mesa ----
  'mesa.sinModelo': {
    es: 'Este plato todavía no se puede ver en la mesa.',
    en: 'This dish cannot be viewed on your table yet.',
    de: 'Dieses Gericht kann noch nicht auf dem Tisch angesehen werden.',
  },
  'mesa.error': {
    es: 'No se ha podido cargar la vista.',
    en: 'The view could not be loaded.',
    de: 'Die Ansicht konnte nicht geladen werden.',
  },
  'mesa.preparando': {
    es: 'Preparando la vista...',
    en: 'Preparing the view...',
    de: 'Ansicht wird vorbereitet...',
  },
  'mesa.ancho': { es: 'Mide unos {n} cm de ancho', en: 'About {n} cm wide', de: 'Etwa {n} cm breit' },
  'mesa.verPlato': {
    es: 'Ver {plato} en la mesa',
    en: 'See {plato} on your table',
    de: '{plato} auf dem Tisch ansehen',
  },
  'mesa.cerrar': { es: 'Cerrar', en: 'Close', de: 'Schließen' },

  // ---- estados comunes ----
  'estado.cargando': { es: 'Cargando...', en: 'Loading...', de: 'Wird geladen...' },
  'estado.error': {
    es: 'No se han podido cargar los datos.',
    en: 'The data could not be loaded.',
    de: 'Die Daten konnten nicht geladen werden.',
  },

  // ---- menus de celebracion ----
  //
  // Aqui solo el armazon; el CONTENIDO de cada menu -sus secciones y sus
  // lineas- se traduce en la base, no en este diccionario, porque lo escribe
  // cada casa. Ver la migracion 027 y el seed 015.
  //
  // Los nombres de los menus -Clasico, Familiar, Casona, Arrocero- se quedan
  // en castellano a proposito: son como los llama la casa.
  'menus.titulo': {
    es: 'Menús de celebración',
    en: 'Set menus for celebrations',
    de: 'Menüs für Feiern',
  },
  'menus.entradilla': {
    es: 'Menús cerrados para grupos y celebraciones.',
    en: 'Fixed menus for groups and celebrations.',
    de: 'Feste Menüs für Gruppen und Feiern.',
  },
  'menus.minimo': {
    es: 'Mínimo {n} comensales.',
    en: 'Minimum {n} diners.',
    de: 'Mindestens {n} Personen.',
  },
  'menus.tipo': { es: 'Menú celebración', en: 'Set menu', de: 'Feiermenü' },
  'unidad.nino': { es: 'por niño', en: 'per child', de: 'pro Kind' },

  // ---- recomendados ----
  'reco.intro': {
    es: 'Los arroces y las carnes que mejor salen de esta cocina.',
    en: 'The rice dishes and grilled meats this kitchen does best.',
    de: 'Die Reisgerichte und Fleischgerichte, die diese Küche am besten macht.',
  },

  'ficha.donde': { es: 'Dónde estamos', en: 'Where we are', de: 'Wo wir sind' },
  'ficha.horario': { es: 'Horario', en: 'Opening hours', de: 'Öffnungszeiten' },
  'ficha.comoLlegar': { es: 'Cómo llegar', en: 'Get directions', de: 'Anfahrt' },
  'ficha.reservarMesa': { es: 'Reservar mesa', en: 'Book a table', de: 'Tisch reservieren' },
  'ficha.verCarta': { es: 'Ver la carta', en: 'See the menu', de: 'Zur Speisekarte' },
  'ficha.verFotos': { es: 'Ver fotos', en: 'See photos', de: 'Fotos ansehen' },
  'ficha.parking': { es: 'Parking propio', en: 'Own car park', de: 'Eigener Parkplatz' },
  'ficha.sinParking': { es: 'Sin parking propio', en: 'No car park', de: 'Kein Parkplatz' },
  'ficha.abierto': { es: 'Abierto ahora', en: 'Open now', de: 'Jetzt geöffnet' },
  'ficha.cerrado': { es: 'Cerrado ahora', en: 'Closed now', de: 'Jetzt geschlossen' },
  'ficha.recomienda': {
    es: 'Lo que recomienda la casa',
    en: 'What the house recommends',
    de: 'Empfehlungen des Hauses',
  },
  'ficha.verCartaEntera': {
    es: 'Ver la carta entera',
    en: 'See the full menu',
    de: 'Ganze Karte ansehen',
  },
  'ficha.cargando': {
    es: 'Cargando el local...',
    en: 'Loading the restaurant...',
    de: 'Lokal wird geladen...',
  },
  'ficha.whatsappReserva': {
    es: 'Hola, me gustaría reservar mesa en {local}.',
    en: 'Hello, I would like to book a table at {local}.',
    de: 'Hallo, ich möchte gerne einen Tisch im {local} reservieren.',
  },
  'ficha.hoy': { es: 'hoy', en: 'today', de: 'heute' },
  'ficha.cerradoDia': { es: 'Cerrado', en: 'Closed', de: 'Geschlossen' },

  'legal.soloCastellano': {
    es: null,
    en: 'This page is only available in Spanish. It is a legal text, and a rough translation could say something different from what it means.',
    de: 'Diese Seite gibt es nur auf Spanisch. Es ist ein Rechtstext, und eine ungenaue Übersetzung könnte etwas anderes aussagen.',
  },

  // Se ensena cuando la carta de ESTE local no esta traducida al idioma
  // elegido. No hay version castellana porque en castellano estan todas: el
  // aviso solo aparece en el idioma que no se puede servir.
  //
  // Antes no se decia nada y la carta salia mezclada, un plato en ingles
  // entre treinta en castellano. Decirlo cuesta una linea y se lee como una
  // web que sabe lo que tiene, no como una rota.
  'carta.sinTraducir': {
    es: null,
    en: 'This menu has not been translated yet. The dishes are shown in Spanish.',
    de: 'Diese Speisekarte ist noch nicht übersetzt. Die Gerichte erscheinen auf Spanisch.',
  },

  'alergeno.trazas': { es: 'trazas', en: 'traces', de: 'Spuren' },
  'carta.titulo': { es: 'Carta', en: 'Menu', de: 'Speisekarte' },
  'carta.todo': { es: 'Todo', en: 'All', de: 'Alle' },
  'carta.cuenta': { es: '{n} platos', en: '{n} dishes', de: '{n} Gerichte' },
  'filtros.abrir': { es: 'Buscar y filtrar', en: 'Search and filter', de: 'Suchen und filtern' },
  'filtros.buscar': { es: 'Buscar un plato...', en: 'Search for a dish...', de: 'Gericht suchen...' },
  'filtros.ocultar': {
    es: 'Ocultar platos que contengan:',
    en: 'Hide dishes containing:',
    de: 'Gerichte ausblenden mit:',
  },
  'filtros.vacio': {
    es: 'Ningún plato encaja con estos filtros.',
    en: 'No dish matches these filters.',
    de: 'Kein Gericht passt zu diesen Filtern.',
  },
  'filtros.vaciar': {
    es: 'Prueba a quitar alguno.',
    en: 'Try removing one.',
    de: 'Entfernen Sie einen davon.',
  },
  'aviso.alergenos.titulo': {
    es: 'Alergias e intolerancias.',
    en: 'Allergies and intolerances.',
    de: 'Allergien und Unverträglichkeiten.',
  },
  'aviso.alergenos.texto': {
    es: 'La información de alérgenos es orientativa y la cocina es compartida, por lo que no se puede descartar la contaminación cruzada. Consulta siempre con el personal de sala.',
    en: 'Allergen information is provided as guidance. The kitchen is shared, so cross-contamination cannot be ruled out. Please always check with the floor staff.',
    de: 'Die Allergenangaben sind Richtwerte. Die Küche wird gemeinsam genutzt, Kreuzkontamination ist daher nicht auszuschließen. Fragen Sie bitte immer das Servicepersonal.',
  },
};

/**
 * Un texto de la interfaz.
 *
 *   ui('precio.media', 'de')            -> "Halbe Portion"
 *   ui('unidad.minimo', 'en', { n: 2 }) -> "min. 2 people"
 *
 * Si falta la traduccion cae al castellano, igual que `texto()`. Y si falta la
 * clave entera devuelve la clave: se ve raro en pantalla, que es justo lo que
 * hace que alguien lo arregle. Callar dejaria un hueco en blanco que nadie
 * relaciona con un texto que falta.
 */
export function ui(clave, idioma, valores) {
  const entrada = UI[clave];
  if (!entrada) return clave;
  let s = entrada[idioma] ?? entrada.es;
  // Hay claves que a proposito no existen en un idioma: el aviso de "esta
  // pagina solo esta en castellano" no tiene version castellana, porque en
  // castellano no hay nada que avisar. Devuelve null y quien llama decide si
  // pinta algo. Sin esta linea, el replaceAll de abajo reventaria.
  if (s == null) return null;
  if (valores) for (const [k, v] of Object.entries(valores)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

/*
  Las bebidas no cuentan para decidir si una carta esta traducida.

  Sus nombres son casi todos marcas o palabras iguales en los tres idiomas
  -Coca-Cola, Dorada, Rioja-, asi que no traducirlas no se nota. Contarlas si
  hundiria a La Basilica al 54% teniendo la comida al 100%, y le quitaria el
  ingles a la unica carta que lo tiene entero.
*/
const SIN_TRADUCIR_HACE_FALTA = new Set(['refrescos', 'cervezas', 'vinos', 'cafes-licores']);

/*
  Por debajo de esto, ofrecer el idioma hace mas dano que bien.

  El 80% no es simetrico por casualidad: unos pocos platos en castellano dentro
  de una carta en ingles se leen como "esto no esta traducido todavia", pero
  unos pocos en ingles dentro de una carta en castellano se leen como que la
  web esta rota. Y una carta que parece rota no se vuelve a abrir.
*/
const MINIMO = 0.8;

/**
 * Los idiomas que esta carta puede ofrecer de verdad.
 *
 * Se calcula de los platos que se van a ensenar, no de un ajuste que alguien
 * tiene que acordarse de cambiar: el dia que se traduzca una carta, su bandera
 * aparece sola, y si alguien anade treinta platos sin traducir, desaparece
 * sola tambien.
 */
export function idiomasDisponibles(categorias) {
  const platos = (categorias ?? [])
    .filter((c) => !SIN_TRADUCIR_HACE_FALTA.has(c.slug))
    .flatMap((c) => c.platos ?? []);

  // Sin carta cargada todavia, solo el castellano: es preferible que la
  // bandera aparezca un instante despues a que aparezca y se vaya.
  if (platos.length === 0) return ['es'];

  const sirve = (idioma) =>
    platos.filter((p) => p[`nombre_${idioma}`]).length / platos.length >= MINIMO;

  return ['es', ...['en', 'de'].filter(sirve)];
}

/*
  Los dias de la semana, en la convencion del esquema: 0 = domingo.

  Estan aqui y no en la API porque la etiqueta hay que componerla en el idioma
  de quien mira. La API manda "Lunes a jueves" ya montado -lo necesitan el
  panel y el prerenderizado, que van en castellano- y ademas los numeros de
  dia, que es lo que se usa aqui.

  En castellano el segundo dia va en minuscula ("Lunes a jueves"): es un
  nombre comun. En ingles y aleman los dias son nombres propios y van siempre
  en mayuscula.
*/
const DIAS = {
  es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
};

const UNION = {
  es: { y: 'y', a: 'a' },
  en: { y: 'and', a: 'to' },
  de: { y: 'und', a: 'bis' },
};

const conMayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * La etiqueta de un tramo de horario.
 *
 *   etiquetaDias([1, 2, 3, 4], 'de')  ->  "Montag bis Donnerstag"
 *   etiquetaDias([5, 6], 'es')        ->  "Viernes y sábado"
 *   etiquetaDias([0], 'en')           ->  "Sunday"
 *
 * Sin indices devuelve la etiqueta que ya trae la API, que siempre es algo:
 * mas vale el dia en castellano que un hueco donde deberia ir el horario.
 */
export function etiquetaDias(indices, idioma, porDefecto = '') {
  if (!Array.isArray(indices) || indices.length === 0) return porDefecto;
  const nombres = DIAS[idioma] ?? DIAS.es;
  const union = UNION[idioma] ?? UNION.es;

  const primero = conMayuscula(nombres[indices[0]]);
  if (indices.length === 1) return primero;

  // El ultimo se deja como viene en su idioma: en castellano en minuscula,
  // en ingles y aleman ya en mayuscula porque asi estan en la tabla.
  const ultimo = nombres[indices.at(-1)];
  return `${primero} ${indices.length === 2 ? union.y : union.a} ${ultimo}`;
}
