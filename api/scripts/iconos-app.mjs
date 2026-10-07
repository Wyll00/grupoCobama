/**
 * Los iconos para cuando alguien se guarda la web en la pantalla de inicio.
 *
 *     npm run iconos-app --prefix api
 *
 * Se dibujan aqui a partir del mismo sello del favicon en vez de guardar
 * cuatro PNG sueltos en el repositorio: si manana cambia el logo, se vuelve a
 * lanzar esto y salen los cuatro iguales. Un PNG suelto es un fichero que
 * nadie sabe de donde salio ni como rehacerlo.
 *
 * SON TRES DIBUJOS DISTINTOS, no el mismo a tres tamanos:
 *
 *   normal      El sello con su chapa redondeada, tal cual. Es el que se usa
 *               cuando el sistema respeta la forma del icono.
 *
 *   enmascarable  Android recorta el icono con la forma que tenga el movil
 *               -circulo, cuadrado, gota-, asi que el fondo tiene que llegar
 *               hasta el borde y el dibujo quedarse en el 80% central. Con el
 *               icono normal, el recorte se comia la chapa y dejaba un
 *               cuadrado con las esquinas mordidas.
 *
 *   de Apple    iOS no admite transparencia y redondea el el solo. Fondo a
 *               sangre y nada de esquinas propias, que si no salen dos
 *               redondeos, uno dentro del otro.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DESTINO = join(AQUI, '..', '..', 'web', 'public', 'icono');

// Los mismos colores del favicon. A pelo y no con variables CSS: estos
// ficheros se abren sueltos, fuera de la pagina, donde no hay variables.
const TINTA = '#1f1a17';
const CREMA = '#faf6f0';
const OCRE = '#c07d2a';

/** El sello, centrado en un lienzo de 104 y a la escala que se le pida. */
const sello = (escala = 1) => {
  const c = 52;
  const r = 42 * escala;
  return `
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${CREMA}" stroke-width="${4 * escala}"/>
    <circle cx="${c}" cy="${c}" r="${34 * escala}" fill="none" stroke="${OCRE}" stroke-width="${2.4 * escala}"/>
    <text x="${c}" y="${c + 1}" text-anchor="middle" dominant-baseline="central"
          fill="${CREMA}" font-family="Georgia, 'Times New Roman', serif"
          font-size="${30 * escala}" letter-spacing="${1.2 * escala}">CB</text>`;
};

const lienzo = (contenido) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 104" width="104" height="104">${contenido}</svg>`
  );

// Con su chapa redondeada, como el favicon.
const normal = lienzo(`<rect width="104" height="104" rx="16" fill="${TINTA}"/>${sello()}`);

// Fondo a sangre y el sello al 72%: Android recorta hasta un 10% por cada
// lado, asi que lo que tiene que sobrevivir al recorte es el circulo entero.
const enmascarable = lienzo(`<rect width="104" height="104" fill="${TINTA}"/>${sello(0.72)}`);

// Para iOS: fondo a sangre tambien, pero sin encoger tanto, que ahi el
// recorte es suave y un sello pequeno se ve perdido.
const deApple = lienzo(`<rect width="104" height="104" fill="${TINTA}"/>${sello(0.86)}`);

const PIEZAS = [
  { nombre: 'icono-192.png', fuente: normal, lado: 192 },
  { nombre: 'icono-512.png', fuente: normal, lado: 512 },
  { nombre: 'icono-enmascarable-512.png', fuente: enmascarable, lado: 512 },
  // 180 es el que pide iOS para la pantalla de inicio en pantallas @3x.
  { nombre: 'icono-apple-180.png', fuente: deApple, lado: 180 },
];

async function main() {
  await mkdir(DESTINO, { recursive: true });

  for (const pieza of PIEZAS) {
    const png = await sharp(pieza.fuente, { density: 400 })
      .resize(pieza.lado, pieza.lado)
      .png({ compressionLevel: 9 })
      .toBuffer();

    await writeFile(join(DESTINO, pieza.nombre), png);
    console.log(`  ${pieza.nombre.padEnd(30)} ${pieza.lado}x${pieza.lado}  ${png.length} bytes`);
  }

  console.log(`\n${PIEZAS.length} iconos en web/public/icono/`);
}

main().catch((err) => {
  console.error('No se han podido generar los iconos:', err.message);
  process.exit(1);
});
