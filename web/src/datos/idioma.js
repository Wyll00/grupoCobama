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
  { codigo: 'es', nombre: 'Espanol' },
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
 * Solo estan los de la CARTA, que es donde vive el selector de idioma y a
 * donde llega un turista con el QR de la mesa. El resto de la web sigue en
 * castellano: traducir a medias el formulario de reservas seria peor, porque
 * ahi hay que entenderlo todo -incluida la politica de privacidad- y no solo
 * la mitad.
 */
const UI = {
  'leyenda.titulo': {
    es: 'Que significa cada icono',
    en: 'What each icon means',
    de: 'Was jedes Symbol bedeutet',
  },
  'leyenda.sinDibujo': {
    es: 'salen escritos en la carta, todavia no tienen dibujo.',
    en: 'are written out in the menu; they have no icon yet.',
    de: 'stehen ausgeschrieben in der Karte; sie haben noch kein Symbol.',
  },
  'precio.media': { es: 'Media racion', en: 'Half portion', de: 'Halbe Portion' },
  'precio.racion': { es: 'Racion', en: 'Full portion', de: 'Ganze Portion' },
  'unidad.kg': { es: 'el kilo', en: 'per kilo', de: 'pro Kilo' },
  'unidad.ud': { es: 'la unidad', en: 'each', de: 'pro Stück' },
  'unidad.persona': { es: 'por persona', en: 'per person', de: 'pro Person' },
  'unidad.minimo': { es: 'min. {n} personas', en: 'min. {n} people', de: 'mind. {n} Personen' },
  'etiqueta.destacado': { es: 'De la casa', en: "Chef's pick", de: 'Empfehlung' },
  'etiqueta.agotado': { es: 'Hoy no queda', en: 'Sold out today', de: 'Heute aus' },
  'etiqueta.vegano': { es: 'Vegano', en: 'Vegan', de: 'Vegan' },
  'etiqueta.vegetariano': { es: 'Vegetariano', en: 'Vegetarian', de: 'Vegetarisch' },
  'etiqueta.canario': { es: 'Producto canario', en: 'Canarian produce', de: 'Kanarisches Produkt' },
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
    es: 'Ningun plato encaja con estos filtros.',
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
    de: 'Allergien und Unvertraglichkeiten.',
  },
  'aviso.alergenos.texto': {
    es: 'La informacion de alergenos es orientativa y la cocina es compartida, por lo que no se puede descartar la contaminacion cruzada. Consulta siempre con el personal de sala.',
    en: 'Allergen information is provided as guidance. The kitchen is shared, so cross-contamination cannot be ruled out. Please always check with the floor staff.',
    de: 'Die Allergenangaben sind Richtwerte. Die Kuche wird gemeinsam genutzt, Kreuzkontamination ist daher nicht auszuschliessen. Fragen Sie bitte immer das Servicepersonal.',
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
  if (valores) for (const [k, v] of Object.entries(valores)) s = s.replaceAll(`{${k}}`, v);
  return s;
}
