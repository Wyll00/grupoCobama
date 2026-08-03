/**
 * Genera un PNG y un SVG por local apuntando a su carta.
 *
 *   npm run qr --prefix api
 *
 * Los QR salen en la carpeta qr/ de la raiz del repo. El destino se toma de
 * WEB_BASE_URL (api/.env), asi que para imprimir hay que generarlos con la
 * URL de produccion, no con localhost.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

import { env } from '../src/config/env.js';
import { pool } from '../src/config/db.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SALIDA = join(RAIZ, 'qr');

const OPCIONES = {
  errorCorrectionLevel: 'M',
  margin: 2,
  width: 1024,
  color: { dark: '#1a1a1a', light: '#ffffff' },
};

async function main() {
  const [restaurantes] = await pool.execute(
    'SELECT slug, nombre FROM restaurantes WHERE activo = 1 ORDER BY orden'
  );

  if (restaurantes.length === 0) {
    console.error('No hay restaurantes activos. Levanta la BD y carga los seeds.');
    process.exitCode = 1;
    return;
  }

  await mkdir(SALIDA, { recursive: true });

  for (const { slug, nombre } of restaurantes) {
    const url = `${env.webBaseUrl.replace(/\/$/, '')}/${slug}/carta`;

    await QRCode.toFile(join(SALIDA, `${slug}.png`), url, OPCIONES);
    await writeFile(
      join(SALIDA, `${slug}.svg`),
      await QRCode.toString(url, { ...OPCIONES, type: 'svg' }),
      'utf8'
    );

    console.log(`${nombre.padEnd(20)} -> ${url}`);
  }

  console.log(`\n${restaurantes.length} QR generados en ${SALIDA}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
