import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Prepara las fotos del mosaico de la portada.
 *
 * Se ejecuta a mano cuando el grupo manda fotos nuevas:
 *
 *   node scripts/fotos-portada.mjs <carpeta con los originales>
 *
 * Los originales llegan como PNG de dos y tres megas. Puestos tal cual en la
 * portada serian nueve megas de descarga antes de que se vea la primera
 * palabra, y la portada es la pagina que mas se abre desde el movil, muchas
 * veces con datos moviles y de pie en la calle.
 *
 * Salen en WebP y a dos tamanos, el normal y el del doble para pantallas
 * finas. El navegador elige con `srcset` y se descarga uno solo.
 *
 * El recorte va con `position: 'attention'`, que centra en la zona con mas
 * detalle en vez de en el centro geometrico: en una foto de un plato en una
 * mesa de madera, el centro de la imagen suele ser mesa.
 */

const DESTINO = '../web/public/portada';

/*
  Las proporciones SALEN DE LOS HUECOS del mosaico, y los huecos estan
  calculados para que sean casi las de las fotos. Es al reves de como se hizo
  la primera vez -primero el mosaico bonito, luego a ver que cabe- y por eso
  la primera vez las fotos salian cortadas: el hueco grande pedia 0,61 con
  fotos de 0,80, y los pequenos 0,93 con fotos de 1,50. Ahi se iba casi el 40%
  del ancho de cada plato.

  Ahora:

    grande    0,80  =  exactamente la de las papas, no se recorta nada
    pequenas  1,40  =  las fuentes son 1,50, o sea un 7% de recorte

  Si se cambian las columnas del mosaico en global.css hay que volver aqui:
  las dos cosas son la misma decision escrita en dos sitios.
*/
const FOTOS = [
  {
    origen: 'papas-arrugadas-con-mojo.png',
    nombre: 'papas-arrugadas',
    ancho: 760,
    alto: 950,
  },
  {
    origen: 'queso-asado-con-mojos-y-arandanos.png',
    nombre: 'queso-asado',
    ancho: 700,
    alto: 500,
  },
  {
    origen: 'carne-de-cabra-compuesta.png',
    nombre: 'carne-de-cabra',
    ancho: 700,
    alto: 500,
  },
];

const carpeta = process.argv[2];
if (!carpeta) {
  console.error('Falta la carpeta con los originales.');
  console.error('  node scripts/fotos-portada.mjs C:/ruta/a/las/fotos');
  process.exit(1);
}

await mkdir(DESTINO, { recursive: true });

for (const foto of FOTOS) {
  for (const escala of [1, 2]) {
    const ancho = foto.ancho * escala;
    const alto = foto.alto * escala;
    const salida = join(DESTINO, `${foto.nombre}${escala === 2 ? '@2x' : ''}.webp`);

    const info = await sharp(join(carpeta, foto.origen))
      .resize(ancho, alto, { fit: 'cover', position: 'attention' })
      // Calidad 78: por encima de eso, en una foto de comida, lo que crece es
      // el fichero y no lo que se ve.
      .webp({ quality: 78 })
      .toFile(salida);

    console.log(
      `  ${salida.padEnd(46)} ${info.width}x${info.height}  ${Math.round(info.size / 1024)} kB`
    );
  }
}

console.log('\nListo.');
