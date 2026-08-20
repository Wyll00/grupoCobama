/**
 * Borra los datos personales de las reservas viejas.
 *
 *   npm run purgar --prefix api           ensayo: dice que haria
 *   npm run purgar --prefix api -- --sql  aplicarlo
 *
 * La politica de privacidad promete que los datos se guardan 12 meses. Sin
 * algo que lo cumpla, esa frase es falsa, y prometer un plazo que no se
 * respeta es peor que no prometer ninguno: convierte la politica en papel
 * mojado justo en lo unico que se puede comprobar desde fuera.
 *
 * ANONIMIZA en vez de borrar la fila. Lo que identifica a una persona son el
 * nombre, el telefono, el email y lo que escribio; el dia, la hora y cuantos
 * eran no identifican a nadie y son justo lo que hace falta para saber como
 * va el negocio. Borrar la fila entera tiraria el historico sin necesidad.
 *
 * Esto tiene que ejecutarse solo, una vez al dia. En produccion va como tarea
 * programada; mientras no la haya, hay que acordarse de lanzarlo.
 */
import 'dotenv/config';
import { pool } from '../src/config/db.js';

// El plazo vive en web/src/datos/legal.js, que es lo que lee el cliente.
// Se repite aqui porque el script no puede importar del front, pero si los
// dos numeros dejan de coincidir la politica miente: la prueba de humo
// comprueba que siguen cuadrando.
const MESES = 12;

async function main() {
  const aplicar = process.argv.includes('--sql');

  const [pendientes] = await pool.execute(
    `SELECT COUNT(*) AS total, MIN(fecha) AS mas_vieja
       FROM reservas
      WHERE anonimizada_en IS NULL
        AND fecha < DATE_SUB(CURDATE(), INTERVAL ? MONTH)`,
    [MESES]
  );

  const { total, mas_vieja } = pendientes[0];

  console.log(`Reservas de hace mas de ${MESES} meses sin anonimizar: ${total}`);
  if (mas_vieja) console.log(`La mas antigua es del ${mas_vieja}`);

  if (total === 0) {
    console.log('No hay nada que borrar.');
    return;
  }

  if (!aplicar) {
    console.log('\nEnsayo. Para aplicarlo:');
    console.log('  npm run purgar --prefix api -- --sql');
    return;
  }

  const [res] = await pool.execute(
    `UPDATE reservas
        SET nombre = '(datos borrados)',
            telefono = '',
            email = NULL,
            observaciones = NULL,
            notas_internas = NULL,
            marketing = 0,
            marketing_en = NULL,
            anonimizada_en = NOW()
      WHERE anonimizada_en IS NULL
        AND fecha < DATE_SUB(CURDATE(), INTERVAL ? MONTH)`,
    [MESES]
  );

  console.log(`\nAnonimizadas ${res.affectedRows} reservas.`);
  console.log('Se conservan fecha, hora, comensales y estado, que no identifican a nadie.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
