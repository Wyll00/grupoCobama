/**
 * Deja un plato con foto y medida para poder ver la funcion "ver en mi mesa"
 * sin tener que subir nada a mano.
 *
 *   node scripts/demo-ar.js            prepara el plato 1
 *   node scripts/demo-ar.js --limpiar  lo deja como estaba
 *
 * La foto es un degradado sintetico, no una foto de verdad: sirve para
 * comprobar que la cadena funciona, no para ensenarsela a nadie.
 */
import sharp from 'sharp';
import { pool } from '../src/config/db.js';

const BASE = process.env.API_URL ?? 'http://localhost:4100';
const PLATO_ID = 1;
const ANCHO_CM = 26;

const limpiar = process.argv.includes('--limpiar');

async function token() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@grupocobama.es', password: 'cobama2026' }),
  });
  if (!res.ok) throw new Error(`no se ha podido entrar: ${res.status}`);
  return (await res.json()).datos.acceso;
}

const acceso = await token();

if (limpiar) {
  await fetch(`${BASE}/api/admin/platos/${PLATO_ID}/imagen`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${acceso}` },
  });
  await pool.execute('UPDATE platos SET ancho_cm = NULL WHERE id = ?', [PLATO_ID]);
  console.log('Plato de demostracion limpiado.');
} else {
  const jpeg = await sharp({
    create: { width: 1600, height: 1200, channels: 3, background: { r: 214, g: 168, b: 96 } },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="1600" height="1200">
             <circle cx="800" cy="600" r="520" fill="#f2ece1"/>
             <circle cx="800" cy="600" r="360" fill="#c8a05a"/>
             <text x="800" y="620" font-size="90" text-anchor="middle" fill="#5a4526"
                   font-family="Georgia, serif">${ANCHO_CM} cm</text>
           </svg>`
        ),
        top: 0,
        left: 0,
      },
    ])
    .jpeg()
    .toBuffer();

  const formulario = new FormData();
  formulario.append('imagen', new Blob([jpeg], { type: 'image/jpeg' }), 'demo.jpg');

  const subida = await fetch(`${BASE}/api/admin/platos/${PLATO_ID}/imagen`, {
    method: 'POST',
    headers: { authorization: `Bearer ${acceso}` },
    body: formulario,
  });
  if (!subida.ok) throw new Error(`fallo al subir la imagen: ${subida.status}`);

  const patch = await fetch(`${BASE}/api/admin/platos/${PLATO_ID}`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${acceso}`, 'content-type': 'application/json' },
    body: JSON.stringify({ ancho_cm: ANCHO_CM }),
  });
  if (!patch.ok) throw new Error(`fallo al guardar la medida: ${patch.status}`);

  const ar = await fetch(`${BASE}/api/platos/${PLATO_ID}/ar`).then((r) => r.json());
  console.log('Plato listo para verse en la mesa:');
  console.log(`  modo  ${ar.datos.modo}`);
  console.log(`  ancho ${ar.datos.ancho_cm} cm`);
  console.log(`  glb   ${ar.datos.glb}`);
}

await pool.end();
