import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { metadatosDeRuta, etiquetas } from '../services/seo.service.js';
import { env } from '../config/env.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const DIST = join(RAIZ, 'web', 'dist');

let plantilla = null;

/** Respaldo para rutas que no reconocemos. */
const GENERICO = {
  titulo: 'Grupo Cobama · Cocina canaria en Tenerife',
  descripcion:
    'Cuatro guachinches de cocina canaria en Tenerife: Como en Casa, La Basilica, La Casa del Mago y El Descarado.',
  canonica: null,
  tipo: 'website',
  jsonLd: null,
};

/**
 * Lee el index.html construido y le quita el titulo y la descripcion, que se
 * sustituyen por los de cada ruta. En desarrollo se relee en cada peticion
 * para no tener que reiniciar la API despues de cada build.
 */
async function cargarPlantilla() {
  if (plantilla && env.isProd) return plantilla;

  const html = await readFile(join(DIST, 'index.html'), 'utf8');
  plantilla = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/>\s*/i, '');
  return plantilla;
}

/**
 * Sirve la SPA con el <head> ya relleno para cada ruta.
 *
 * Es lo que hace que el enlace de un local se vea con SU nombre al pegarlo en
 * WhatsApp, y que Google entienda que es un restaurante. Los rastreadores de
 * las redes sociales no ejecutan JavaScript: leen este HTML y nada mas.
 *
 * En produccion esto lo hara una funcion de Cloudflare Pages. Aqui vive en la
 * API para poder probarlo en local sin desplegar nada, y sirve igual si al
 * final se decide servir la web desde el propio VPS.
 */
export function prerender() {
  return async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();

    try {
      const base = await cargarPlantilla();
      const meta = await metadatosDeRuta(req.path);

      // Una ruta que no reconocemos, o un local que no existe. El enrutador
      // del navegador ya ensena su propio "no encontrado", pero el HTML tiene
      // que salir con titulo igualmente: sin el, el enlace compartido aparece
      // en blanco y el navegador ensena la URL cruda en la pestana.
      if (!meta) {
        return res
          .status(404)
          .type('html')
          .send(base.replace('</head>', `  ${etiquetas(GENERICO)}\n  </head>`));
      }

      res.type('html').send(base.replace('</head>', `  ${etiquetas(meta)}\n  </head>`));
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res
          .status(503)
          .type('text/plain')
          .send('La web no esta construida todavia. Ejecuta: npm run build --prefix web');
      }
      next(err);
    }
  };
}
