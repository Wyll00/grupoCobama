/**
 * Genera un GLB (glTF 2.0 binario) con un plano texturizado a escala real.
 *
 * Es la pieza que evita tener que escanear cien platos en 3D: con la foto que
 * ya hay y el ancho real en centimetros sale un modelo que el movil planta
 * encima de la mesa al tamano que va a llegar el plato. No es un plato 3D,
 * es la foto a tamano real tumbada en la mesa, que es justo lo que responde a
 * "esto es grande o pequeno".
 *
 * Se escribe a mano en lugar de tirar de una libreria porque un plano
 * texturizado es el caso mas simple del formato: cuatro vertices, dos
 * triangulos y una imagen. Meter una dependencia de exportacion glTF entera
 * para esto seria desproporcionado.
 *
 * Referencia del formato: glTF 2.0, seccion 4 (GLB container).
 */

const MAGIC = 0x46546c67; // 'glTF'
const VERSION = 2;
const CHUNK_JSON = 0x4e4f534a; // 'JSON'
const CHUNK_BIN = 0x004e4942; // 'BIN\0'

/** Los trozos del contenedor van alineados a 4 bytes. */
function alinear(buffer, relleno) {
  const sobra = buffer.length % 4;
  if (sobra === 0) return buffer;
  return Buffer.concat([buffer, Buffer.alloc(4 - sobra, relleno)]);
}

/**
 * @param {Buffer} imagen  PNG o JPEG. WebP necesitaria la extension
 *                         EXT_texture_webp, que no soportan todos los visores.
 * @param {object} opciones
 * @param {number} opciones.anchoM  Ancho real en metros (glTF trabaja en metros).
 * @param {number} opciones.altoM   Profundidad real en metros.
 * @param {string} opciones.tipoImagen  'image/png' o 'image/jpeg'.
 * @param {string} [opciones.nombre]
 */
export function planoTexturizadoGlb(imagen, { anchoM, altoM, tipoImagen, nombre = 'plato' }) {
  const x = anchoM / 2;
  const z = altoM / 2;

  // Plano tumbado en el suelo (Y arriba), centrado en el origen. Scene Viewer
  // y AR Quick Look apoyan el modelo sobre la superficie detectada, asi que
  // dejarlo a Y=0 es lo que hace que quede pegado a la mesa.
  const posiciones = new Float32Array([
    -x, 0, -z,
     x, 0, -z,
     x, 0,  z,
    -x, 0,  z,
  ]);

  // Origen de UV en glTF es la esquina superior izquierda.
  const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

  const bufPos = Buffer.from(posiciones.buffer);
  const bufUv = Buffer.from(uvs.buffer);
  const bufIdx = alinear(Buffer.from(indices.buffer), 0);
  const bufImg = alinear(imagen, 0);

  const desplPos = 0;
  const desplUv = desplPos + bufPos.length;
  const desplIdx = desplUv + bufUv.length;
  const desplImg = desplIdx + bufIdx.length;

  const binario = Buffer.concat([bufPos, bufUv, bufIdx, bufImg]);

  const gltf = {
    asset: { version: '2.0', generator: 'cobama-glb' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: nombre }],
    meshes: [
      {
        name: nombre,
        primitives: [
          {
            attributes: { POSITION: 0, TEXCOORD_0: 1 },
            indices: 2,
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        name: nombre,
        pbrMetallicRoughness: {
          baseColorTexture: { index: 0 },
          metallicFactor: 0,
          roughnessFactor: 0.9,
        },
        // Visible tambien desde abajo: si el cliente agacha el movil por
        // debajo del nivel de la mesa, mejor que siga viendo algo.
        doubleSided: true,
      },
    ],
    textures: [{ sampler: 0, source: 0 }],
    images: [{ bufferView: 3, mimeType: tipoImagen }],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126, // FLOAT
        count: 4,
        type: 'VEC3',
        // min y max son obligatorios en POSITION: los visores los usan para
        // encuadrar la camara sin recorrer la geometria.
        min: [-x, 0, -z],
        max: [x, 0, z],
      },
      { bufferView: 1, componentType: 5126, count: 4, type: 'VEC2' },
      { bufferView: 2, componentType: 5123, count: 6, type: 'SCALAR' }, // UNSIGNED_SHORT
    ],
    bufferViews: [
      { buffer: 0, byteOffset: desplPos, byteLength: bufPos.length, target: 34962 },
      { buffer: 0, byteOffset: desplUv, byteLength: bufUv.length, target: 34962 },
      { buffer: 0, byteOffset: desplIdx, byteLength: indices.byteLength, target: 34963 },
      { buffer: 0, byteOffset: desplImg, byteLength: imagen.length },
    ],
    buffers: [{ byteLength: binario.length }],
  };

  const bufJson = alinear(Buffer.from(JSON.stringify(gltf), 'utf8'), 0x20);

  const cabecera = Buffer.alloc(12);
  cabecera.writeUInt32LE(MAGIC, 0);
  cabecera.writeUInt32LE(VERSION, 4);
  cabecera.writeUInt32LE(12 + 8 + bufJson.length + 8 + binario.length, 8);

  const cabJson = Buffer.alloc(8);
  cabJson.writeUInt32LE(bufJson.length, 0);
  cabJson.writeUInt32LE(CHUNK_JSON, 4);

  const cabBin = Buffer.alloc(8);
  cabBin.writeUInt32LE(binario.length, 0);
  cabBin.writeUInt32LE(CHUNK_BIN, 4);

  return Buffer.concat([cabecera, cabJson, bufJson, cabBin, binario]);
}
