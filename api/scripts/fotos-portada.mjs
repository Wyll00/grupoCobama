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

// La grande es vertical y las dos pequenas apaisadas, que es como estan
// pensados los huecos del mosaico. La proporcion se fija aqui y no en el CSS
// para no servir pixeles que el recorte va a tirar.
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
    ancho: 620,
    alto: 560,
  },
  {
    origen: 'carne-de-cabra-compuesta.png',
    nombre: 'carne-de-cabra',
    ancho: 620,
    alto: 560,
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
