/**
 * Sube las fotos de portada de los locales desde la carpeta fotos/.
 *
 *   npm run portadas --prefix api
 *
 * Espera un fichero por local, nombrado con su slug:
 *   fotos/como-en-casa.jpg
 *   fotos/la-basilica.jpg
 *   fotos/la-casa-del-mago.jpg
 *   fotos/el-descarado.jpg
 *
 * Vale jpg, jpeg, png o webp. Sube solo las que encuentre, asi que se puede
 * ir poniendo una a una. El recorte lo decide sharp buscando el motivo
 * principal; si hace falta encuadrar a mano, se hace desde el panel.
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.API_URL ?? 'http://localhost:4100';
const CARPETA = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'fotos');
const EXTENSIONES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

const TIPOS = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

async function main() {
  let ficheros;
  try {
    ficheros = (await readdir(CARPETA)).filter((f) => EXTENSIONES.has(extname(f).toLowerCase()));
  } catch {
    console.error(`No existe la carpeta ${CARPETA}`);
    process.exit(1);
  }

  if (ficheros.length === 0) {
    console.log(`No hay imagenes en ${CARPETA}.`);
    console.log('Guarda una por local con el nombre de su slug, por ejemplo la-basilica.jpg');
    return;
  }

  const entrada = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: process.env.COBAMA_EMAIL ?? 'admin@grupocobama.es',
      password: process.env.COBAMA_PASSWORD ?? 'cobama2026',
    }),
  });
  if (!entrada.ok) {
    console.error(`No se ha podido entrar en la API: ${entrada.status}`);
    process.exit(1);
  }
  const acceso = (await entrada.json()).datos.acceso;

  const locales = (await fetch(`${BASE}/api/restaurantes`).then((r) => r.json())).datos;
  const porSlug = new Map(locales.map((l) => [l.slug, l]));

  for (const fichero of ficheros) {
    const slug = fichero.slice(0, -extname(fichero).length);
    const local = porSlug.get(slug);

    if (!local) {
      console.log(`  ${fichero}: no hay ningun local con el slug "${slug}", se salta`);
      continue;
    }

    const datos = new FormData();
    datos.append(
      'imagen',
      new Blob([await readFile(join(CARPETA, fichero))], {
        type: TIPOS[extname(fichero).toLowerCase()],
      }),
      fichero
    );

    const res = await fetch(`${BASE}/api/admin/restaurantes/${local.id}/portada`, {
      method: 'POST',
      headers: { authorization: `Bearer ${acceso}` },
      body: datos,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      console.log(`  ${local.nombre}: FALLO ${res.status} ${err?.error?.mensaje ?? ''}`);
      continue;
    }

    console.log(`  ${local.nombre}: ${(await res.json()).datos.imagen_portada}`);
  }
}

await main();
