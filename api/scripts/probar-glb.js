/**
 * Comprueba que el GLB que genera src/lib/glb.js es un fichero valido y esta
 * a escala real.
 *
 *   npm run glb --prefix api
 *
 * El contenedor se parsea a mano, sin librerias: un formato binario escrito a
 * mano es justo lo que se rompe en silencio, porque escribir los bytes nunca
 * falla y el error solo aparece en el movil del cliente.
 */
import sharp from 'sharp';
import { planoTexturizadoGlb } from '../src/lib/glb.js';

const ANCHO_CM = 26; // plato de raciones tipico
const ANCHO_PX = 1200;
const ALTO_PX = 900;

let fallos = 0;
function comprobar(descripcion, condicion, detalle) {
  if (condicion) {
    console.log(`  ok    ${descripcion}`);
  } else {
    fallos++;
    console.log(`  FALLO ${descripcion}${detalle ? ` -> ${detalle}` : ''}`);
  }
}

const png = await sharp({
  create: { width: ANCHO_PX, height: ALTO_PX, channels: 3, background: { r: 200, g: 120, b: 40 } },
})
  .png()
  .toBuffer();

const anchoM = ANCHO_CM / 100;
const altoM = anchoM * (ALTO_PX / ANCHO_PX);

const glb = planoTexturizadoGlb(png, {
  anchoM,
  altoM,
  tipoImagen: 'image/png',
  nombre: 'Plato de prueba',
});

console.log('Contenedor');
comprobar('la magia es glTF', glb.readUInt32LE(0) === 0x46546c67);
comprobar('version 2', glb.readUInt32LE(4) === 2);
comprobar(
  'el largo declarado cuadra con el fichero',
  glb.readUInt32LE(8) === glb.length,
  `dice ${glb.readUInt32LE(8)}, hay ${glb.length}`
);

const largoJson = glb.readUInt32LE(12);
comprobar('el primer trozo es JSON', glb.readUInt32LE(16) === 0x4e4f534a);
comprobar('el trozo JSON va alineado a 4', largoJson % 4 === 0);

const json = JSON.parse(glb.subarray(20, 20 + largoJson).toString('utf8'));

const desplBin = 20 + largoJson;
const largoBin = glb.readUInt32LE(desplBin);
comprobar('el segundo trozo es BIN', glb.readUInt32LE(desplBin + 4) === 0x004e4942);
comprobar('el trozo BIN va alineado a 4', largoBin % 4 === 0);
comprobar(
  'el buffer declarado cuadra con el trozo',
  json.buffers[0].byteLength === largoBin,
  `buffer ${json.buffers[0].byteLength}, trozo ${largoBin}`
);

console.log('\nEscala real');
const acc = json.accessors[0];
const anchoModelo = (acc.max[0] - acc.min[0]) * 100;
const fondoModelo = (acc.max[2] - acc.min[2]) * 100;

comprobar(
  `el ancho del modelo son ${ANCHO_CM} cm`,
  Math.abs(anchoModelo - ANCHO_CM) < 0.01,
  `${anchoModelo.toFixed(2)} cm`
);
comprobar(
  'el fondo respeta la proporcion de la foto',
  Math.abs(fondoModelo - ANCHO_CM * (ALTO_PX / ANCHO_PX)) < 0.01,
  `${fondoModelo.toFixed(2)} cm`
);
comprobar(
  'el plano queda apoyado en Y=0, para que se pegue a la mesa',
  acc.min[1] === 0 && acc.max[1] === 0
);

console.log('\nIntegridad');
const desbordes = json.bufferViews.filter((bv) => bv.byteOffset + bv.byteLength > largoBin);
comprobar('ningun bufferView se sale del buffer', desbordes.length === 0, `${desbordes.length} se salen`);
comprobar('hay una malla con un primitivo', json.meshes?.[0]?.primitives?.length === 1);
comprobar('el material apunta a la textura', json.materials?.[0]?.pbrMetallicRoughness?.baseColorTexture?.index === 0);
comprobar('el plano es visible por las dos caras', json.materials?.[0]?.doubleSided === true);

const bvImg = json.bufferViews[json.images[0].bufferView];
const inicioBin = desplBin + 8;
const imagen = glb.subarray(
  inicioBin + bvImg.byteOffset,
  inicioBin + bvImg.byteOffset + bvImg.byteLength
);
const meta = await sharp(imagen).metadata();
comprobar(
  'la textura embebida se puede volver a leer',
  meta.format === 'png' && meta.width === ANCHO_PX && meta.height === ALTO_PX,
  `${meta.format} ${meta.width}x${meta.height}`
);

console.log(`\nGLB de ${(glb.length / 1024).toFixed(0)} KB`);
if (fallos > 0) {
  console.log(`${fallos} FALLOS.`);
  process.exit(1);
}
console.log('GLB valido.');
