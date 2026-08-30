import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { formatearHora, horaAMinutos } from '../utils/horarios.js';

/**
 * Metadatos y datos estructurados de cada pagina publica.
 *
 * Existe porque la web es una SPA: el HTML que sale del servidor es un <div>
 * vacio, y los rastreadores de WhatsApp, Instagram y Facebook NO ejecutan
 * JavaScript. Sin esto, los cuatro locales comparten el mismo titulo generico
 * al compartir el enlace, y Google no sabe que son restaurantes.
 */

const NOMBRE_GRUPO = 'Grupo Cobama';

/** Los dias de la semana como los nombra schema.org. */
const DIA_SCHEMA = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

const base = () => env.webBaseUrl.replace(/\/$/, '');

/**
 * Escapa para meter texto dentro de un atributo HTML. Los datos salen del
 * panel, asi que un nombre de plato con comillas romperia la etiqueta.
 */
export function escaparAtributo(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escapa para meter JSON dentro de <script>: lo unico peligroso es </script>. */
const escaparJson = (objeto) => JSON.stringify(objeto).replace(/</g, '\\u003c');

async function cargarLocal(slug) {
  const [filas] = await pool.execute(
    `SELECT id, slug, nombre, municipio, direccion, telefono, email, lat, lng,
            descripcion, reclamo, imagen_portada
       FROM restaurantes WHERE slug = ? AND activo = 1 LIMIT 1`,
    [slug]
  );
  return filas[0] ?? null;
}

/**
 * Horario en el formato de schema.org, agrupando los dias que coinciden.
 * Un cierre a las 24:00 se emite como 00:00: es la convencion para decir que
 * se cierra pasada la medianoche.
 */
async function horarioSchema(restauranteId) {
  const [filas] = await pool.execute(
    `SELECT dia_semana, hora_apertura, hora_cierre, cerrado
       FROM horarios WHERE restaurante_id = ? AND cerrado = 0
      ORDER BY dia_semana`,
    [restauranteId]
  );

  const porFranja = new Map();
  for (const f of filas) {
    const clave = `${f.hora_apertura}|${f.hora_cierre}`;
    if (!porFranja.has(clave)) porFranja.set(clave, []);
    porFranja.get(clave).push(DIA_SCHEMA[f.dia_semana]);
  }

  return [...porFranja.entries()].map(([clave, dias]) => {
    const [abre, cierra] = clave.split('|');
    return {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: dias,
      opens: formatearHora(abre),
      closes: horaAMinutos(cierra) >= 1440 ? '00:00' : formatearHora(cierra),
    };
  });
}

function fichaRestaurante(local, horarios) {
  const url = `${base()}/${local.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: local.nombre,
    description: local.descripcion ?? local.reclamo ?? undefined,
    servesCuisine: 'Cocina canaria',
    priceRange: '€€',
    url,
    hasMenu: `${url}/carta`,
    telephone: local.telefono ? `+34${local.telefono}` : undefined,
    email: local.email ?? undefined,
    image: local.imagen_portada ? `${base()}${local.imagen_portada}` : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: local.direccion,
      addressLocality: local.municipio,
      addressRegion: 'Santa Cruz de Tenerife',
      addressCountry: 'ES',
    },
    geo:
      local.lat && local.lng
        ? {
            '@type': 'GeoCoordinates',
            latitude: Number(local.lat),
            longitude: Number(local.lng),
          }
        : undefined,
    openingHoursSpecification: horarios,
    acceptsReservations: `${base()}/reservar?local=${local.slug}`,
    parentOrganization: { '@type': 'Organization', name: NOMBRE_GRUPO, url: base() },
  };
}

/**
 * Metadatos de una ruta publica. Devuelve null si la ruta no es una de las
 * que merecen tratamiento propio, y entonces se sirve el HTML tal cual.
 */
export async function metadatosDeRuta(ruta) {
  const limpia = ruta.replace(/\/+$/, '') || '/';

  if (limpia === '/') {
    const [locales] = await pool.execute(
      'SELECT slug, nombre, municipio FROM restaurantes WHERE activo = 1 ORDER BY orden'
    );
    return {
      titulo: `${NOMBRE_GRUPO} · Cocina canaria en Tenerife`,
      descripcion:
        `Cuatro guachinches de cocina canaria en Tenerife: ` +
        locales.map((l) => `${l.nombre} (${l.municipio})`).join(', ') + '.',
      canonica: base(),
      tipo: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: NOMBRE_GRUPO,
        url: base(),
        // Que Google entienda que la organizacion tiene cuatro sedes.
        subOrganization: locales.map((l) => ({
          '@type': 'Restaurant',
          name: l.nombre,
          url: `${base()}/${l.slug}`,
        })),
      },
    };
  }

  if (limpia === '/reservar') {
    return {
      titulo: `Reservar mesa · ${NOMBRE_GRUPO}`,
      descripcion:
        'Reserva mesa en cualquiera de los cuatro locales del Grupo Cobama en Tenerife.',
      canonica: `${base()}/reservar`,
      tipo: 'website',
      jsonLd: null,
    };
  }

  // Las paginas legales tienen que resolver aqui. Si caen en el comodin, el
  // prerenderizador responde 404, y un aviso legal que da 404 a los buscadores
  // es exactamente igual de util que no tenerlo.
  const LEGALES = {
    '/privacidad': {
      titulo: `Politica de privacidad · ${NOMBRE_GRUPO}`,
      descripcion:
        'Que datos tratamos, para que, cuanto tiempo los guardamos y como ejercer tus derechos.',
    },
    '/aviso-legal': {
      titulo: `Aviso legal · ${NOMBRE_GRUPO}`,
      descripcion: 'Titular del sitio, condiciones de uso y responsabilidades.',
    },
  };

  if (LEGALES[limpia]) {
    return {
      ...LEGALES[limpia],
      canonica: `${base()}${limpia}`,
      tipo: 'website',
      jsonLd: null,
    };
  }

  if (limpia === '/galeria') {
    const [[{ fotos }]] = await pool.execute(
      'SELECT COUNT(*) AS fotos FROM galeria WHERE activo = 1'
    );
    return {
      titulo: `Galeria · ${NOMBRE_GRUPO}`,
      descripcion:
        `${fotos} fotos de los cuatro locales del ${NOMBRE_GRUPO} en Tenerife: ` +
        'sus platos, sus salas y sus celebraciones.',
      canonica: `${base()}/galeria`,
      tipo: 'website',
      jsonLd: null,
    };
  }

  const galeriaLocal = limpia.match(/^\/([a-z0-9-]+)\/galeria$/);
  const carta = limpia.match(/^\/([a-z0-9-]+)\/carta$/);
  const ficha = limpia.match(/^\/([a-z0-9-]+)$/);
  const slug = galeriaLocal?.[1] ?? carta?.[1] ?? ficha?.[1];
  if (!slug) return null;

  const local = await cargarLocal(slug);
  if (!local) return null;

  const horarios = await horarioSchema(local.id);
  const restaurante = fichaRestaurante(local, horarios);

  if (galeriaLocal) {
    const [filas] = await pool.execute(
      `SELECT imagen, COUNT(*) OVER () AS total
         FROM galeria
        WHERE activo = 1 AND (restaurante_id = ? OR restaurante_id IS NULL)
        ORDER BY orden LIMIT 1`,
      [local.id]
    );
    const total = filas[0]?.total ?? 0;

    return {
      titulo: `Fotos de ${local.nombre} · ${local.municipio} · ${NOMBRE_GRUPO}`,
      descripcion:
        `${total} fotos de ${local.nombre}, en ${local.municipio}: sus platos, ` +
        'la sala y sus celebraciones.',
      canonica: `${base()}/${local.slug}/galeria`,
      // La primera foto de la galeria antes que la portada: al compartir el
      // enlace, lo que se previsualiza es de lo que va la pagina.
      imagen: filas[0]?.imagen
        ? `${base()}${filas[0].imagen}`
        : local.imagen_portada
          ? `${base()}${local.imagen_portada}`
          : null,
      tipo: 'article',
      jsonLd: restaurante,
    };
  }

  if (carta) {
    const [[{ platos }]] = await pool.execute(
      `SELECT COUNT(*) AS platos FROM carta_items ci
         JOIN platos p ON p.id = ci.plato_id
        WHERE ci.restaurante_id = ? AND ci.activo = 1 AND p.activo = 1`,
      [local.id]
    );

    return {
      titulo: `Carta de ${local.nombre} · ${local.municipio} · ${NOMBRE_GRUPO}`,
      descripcion:
        `Carta completa de ${local.nombre}, en ${local.municipio}: ${platos} platos ` +
        `con precios actualizados y filtro por alergenos. ${local.reclamo ?? ''}`.trim(),
      canonica: `${base()}/${local.slug}/carta`,
      imagen: local.imagen_portada ? `${base()}${local.imagen_portada}` : null,
      tipo: 'article',
      jsonLd: { ...restaurante, '@type': 'Restaurant', hasMenu: `${base()}/${local.slug}/carta` },
    };
  }

  return {
    titulo: `${local.nombre} · ${local.municipio} · ${NOMBRE_GRUPO}`,
    descripcion: local.reclamo ?? local.descripcion?.slice(0, 200) ?? '',
    canonica: `${base()}/${local.slug}`,
    imagen: local.imagen_portada ? `${base()}${local.imagen_portada}` : null,
    tipo: 'restaurant',
    jsonLd: restaurante,
  };
}

/** Las etiquetas que se inyectan en el <head>. */
export function etiquetas(meta) {
  const t = escaparAtributo(meta.titulo);
  const d = escaparAtributo(meta.descripcion);

  const lineas = [
    /*
      El <title> es SIEMPRE el nombre del grupo, y el descriptivo se queda
      para compartir. Son dos trabajos distintos que antes salian del mismo
      valor:

        <title>     lo que se lee en la pestana. Ahi el nombre del grupo y ya,
                    que es lo que se pidio: "Carta de La Basilica · Candelaria
                    · Grupo Cobama" deja la marca al final, que es justo lo
                    que se corta con varias pestanas abiertas.

        og:title    lo que sale al pegar el enlace en WhatsApp o Instagram.
                    Ahi el descriptivo SI hace falta: un enlace que solo dice
                    "Grupo Cobama" no cuenta a donde lleva.

      Sin esta separacion el cambio de la pestana no llegaba a produccion. En
      desarrollo la web se sirve desde Vite y no pasa por aqui, asi que la
      pestana salia bien; en produccion la sirve este prerenderizado y volvia
      el titulo largo, ademas para siempre, porque las paginas ya no
      sobrescriben el titulo desde el navegador.
    */
    `<title>${escaparAtributo(NOMBRE_GRUPO)}</title>`,
    `<meta name="description" content="${d}" />`,

    // Open Graph: lo que leen WhatsApp, Instagram, Facebook y LinkedIn.
    `<meta property="og:type" content="${escaparAtributo(meta.tipo)}" />`,
    `<meta property="og:site_name" content="${NOMBRE_GRUPO}" />`,
    `<meta property="og:locale" content="es_ES" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,

    `<meta name="twitter:card" content="${meta.imagen ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
  ];

  // Una canonica vacia es peor que ninguna: le dice al buscador que la pagina
  // buena es otra y no cual.
  if (meta.canonica) {
    const url = escaparAtributo(meta.canonica);
    lineas.push(`<link rel="canonical" href="${url}" />`);
    lineas.push(`<meta property="og:url" content="${url}" />`);
  }

  if (meta.imagen) {
    lineas.push(`<meta property="og:image" content="${escaparAtributo(meta.imagen)}" />`);
    lineas.push(`<meta name="twitter:image" content="${escaparAtributo(meta.imagen)}" />`);
  }

  if (meta.jsonLd) {
    lineas.push(
      `<script type="application/ld+json">${escaparJson(meta.jsonLd)}</script>`
    );
  }

  return lineas.join('\n    ');
}

export async function sitemap() {
  const [locales] = await pool.execute(
    'SELECT slug, updated_at FROM restaurantes WHERE activo = 1 ORDER BY orden'
  );

  const urls = [
    { loc: base(), prioridad: '1.0', frecuencia: 'weekly' },
    { loc: `${base()}/reservar`, prioridad: '0.8', frecuencia: 'monthly' },
    ...locales.flatMap((l) => [
      { loc: `${base()}/${l.slug}`, prioridad: '0.9', frecuencia: 'weekly' },
      // La carta cambia mas que la ficha: es la que interesa que se reindexe.
      { loc: `${base()}/${l.slug}/carta`, prioridad: '0.9', frecuencia: 'daily' },
      { loc: `${base()}/${l.slug}/galeria`, prioridad: '0.7', frecuencia: 'weekly' },
    ]),
    { loc: `${base()}/galeria`, prioridad: '0.7', frecuencia: 'weekly' },
    // Prioridad baja: nadie las busca, pero tienen que ser encontrables.
    { loc: `${base()}/aviso-legal`, prioridad: '0.2', frecuencia: 'yearly' },
    { loc: `${base()}/privacidad`, prioridad: '0.2', frecuencia: 'yearly' },
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (u) =>
        `  <url><loc>${u.loc}</loc><changefreq>${u.frecuencia}</changefreq>` +
        `<priority>${u.prioridad}</priority></url>`
    ),
    '</urlset>',
  ].join('\n');
}

export function robots() {
  return [
    'User-agent: *',
    'Allow: /',
    // El panel no pinta nada en un buscador.
    'Disallow: /admin',
    '',
    `Sitemap: ${base()}/sitemap.xml`,
  ].join('\n');
}
