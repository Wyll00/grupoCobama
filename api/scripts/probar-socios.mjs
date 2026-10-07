/*
  Prueba la regla de negocio de la tarjeta de socio.

  Lo que hay que demostrar, y no se ve mirando la pantalla:

    1. Una visita apuntada dos veces el mismo dia en la misma casa cuenta UNA.
    2. El mismo dia en dos casas distintas cuentan DOS.
    3. Al llegar al umbral aparece el premio, ni antes ni dos veces.
    4. Entregarlo lo quita de pendientes sin borrar que se gano.

  Las visitas de dias pasados se meten por SQL: por la API solo se puede
  apuntar la de hoy, que es justo lo que se quiere que pase en sala.
*/
import mysql from 'mysql2/promise';

const BASE = 'http://localhost:4100';
const CREDENCIALES = { email: 'admin@grupocobama.es', password: 'cobama2026' };

const pool = await mysql.createPool({
  host: '127.0.0.1', port: 3306, user: 'cobama', password: 'cobama',
  database: 'cobama', charset: 'utf8mb4',
});

let fallos = 0;
const comprobar = (bien, que, detalle = '') => {
  if (!bien) fallos += 1;
  console.log(`  ${bien ? 'ok  ' : 'MAL '} ${que}${detalle ? '  -> ' + detalle : ''}`);
};

// --- sesion ---
const login = await (
  await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDENCIALES),
  })
).json();
const token = login.datos.acceso;
const cabeceras = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

// --- socio nuevo para la prueba ---
const alta = await (
  await fetch(`${BASE}/api/admin/socios`, {
    method: 'POST',
    headers: cabeceras,
    body: JSON.stringify({ nombre: 'Prueba de socio', restaurante_id: 1 }),
  })
).json();
const codigo = alta.datos.codigo;
const [[socio]] = await pool.execute('SELECT id FROM socios WHERE codigo = ?', [codigo]);
console.log(`\nsocio de prueba: ${codigo}\n`);

const apuntar = (cuerpo) =>
  fetch(`${BASE}/api/admin/socios/${codigo}/visitas`, {
    method: 'POST',
    headers: cabeceras,
    body: JSON.stringify(cuerpo),
  }).then((r) => r.json());

// --- 1. dos pulsaciones en la misma casa el mismo dia ---
const uno = await apuntar({ restaurante_id: 1 });
const dos = await apuntar({ restaurante_id: 1 });
comprobar(uno.datos.visitas === 1, 'la primera cuenta', `visitas ${uno.datos.visitas}`);
comprobar(dos.datos.visitas === 1, 'la segunda NO duplica', `visitas ${dos.datos.visitas}`);
comprobar(dos.datos.repetida === true, 'y avisa de que estaba repetida');

// --- 2. el mismo dia en otra casa ---
const otra = await apuntar({ restaurante_id: 2 });
comprobar(otra.datos.visitas === 2, 'otra casa el mismo dia SI cuenta', `visitas ${otra.datos.visitas}`);
comprobar(otra.datos.repetida === false, 'y no se marca como repetida');

/*
  El umbral se le PREGUNTA a la API, no se escribe aqui.

  Estaba puesto a 8 a mano, y el dia que el grupo lo bajo a 5 la prueba fallo
  entera aunque el codigo estaba perfecto: comprobaba el numero en vez de la
  regla. Asi vale para cualquier umbral que decidan manana.
*/
let t = await (await fetch(`${BASE}/api/socios/${codigo}`)).json();
const UMBRAL = t.datos.visitasParaElPremio;
console.log(`  (el premio esta en ${UMBRAL} visitas)
`);

// Dias pasados, por SQL: por la API solo se puede apuntar la de hoy.
const visitaVieja = (dia) =>
  pool.execute(
    `INSERT INTO socio_visitas (socio_id, restaurante_id, fecha)
     VALUES (?, 1, DATE_SUB(CURDATE(), INTERVAL ? DAY))`,
    [socio.id, dia]
  );

// --- 3. hasta una menos de las que hacen falta ---
let dia = 1;
while (t.datos.visitas < UMBRAL - 1) {
  await visitaVieja(dia);
  dia += 1;
  t = await (await fetch(`${BASE}/api/socios/${codigo}`)).json();
}
comprobar(t.datos.visitas === UMBRAL - 1, `con ${UMBRAL - 1} visitas`, `visitas ${t.datos.visitas}`);
comprobar(t.datos.premiosGanados === 0, 'todavia NO hay premio');
comprobar(t.datos.faltan === 1, 'y dice que falta 1', `faltan ${t.datos.faltan}`);

// --- 4. la que lo desencadena ---
const justa = await apuntar({ restaurante_id: 3 });
comprobar(justa.datos.visitas === UMBRAL, `la ${UMBRAL} entra`, `visitas ${justa.datos.visitas}`);
comprobar(justa.datos.premiosGanados === 1, 'y salta el premio');
comprobar(justa.datos.premiosPendientes === 1, 'pendiente de entregar');
comprobar(justa.datos.faltan === 0, 'no pide otro tramo entero para cobrarlo', `faltan ${justa.datos.faltan}`);

// --- 5. que no se duplique el premio al recontar ---
await apuntar({ restaurante_id: 4 });
t = await (await fetch(`${BASE}/api/socios/${codigo}`)).json();
comprobar(t.datos.visitas === UMBRAL + 1, 'una visita mas', `visitas ${t.datos.visitas}`);
comprobar(t.datos.premiosGanados === 1, 'el premio sigue siendo UNO, no dos');

/*
  --- 6. el segundo escalon ---

  Aqui se llega al doble SOLO con visitas de dias pasados, y despues se pulsa
  una que ya estaba apuntada. Suena raro y tiene su motivo:

    - A estas alturas las cuatro casas ya tienen visita de HOY, asi que
      cualquier `apuntar` choca con la regla de una por casa y dia y no suma.
    - Pero los premios se otorgan al apuntar, no al consultar. Metiendo las
      visitas por SQL nadie recalcula, y el premio del segundo escalon no
      llegaria a existir.

  Asi que la pulsacion repetida no esta para sumar: esta para disparar el
  recuento. Que ademas comprueba de paso algo que importa: que una visita
  repetida recalcule los premios sin duplicar la visita.
*/
while (t.datos.visitas < UMBRAL * 2) {
  await visitaVieja(dia);
  dia += 1;
  t = await (await fetch(`${BASE}/api/socios/${codigo}`)).json();
}
const doble = await apuntar({ restaurante_id: 2, nota: 'el segundo escalon' });
comprobar(doble.datos.repetida === true, 'la pulsacion repetida no suma visita');
comprobar(doble.datos.visitas === UMBRAL * 2, `con ${UMBRAL * 2} visitas`, `visitas ${doble.datos.visitas}`);
comprobar(doble.datos.premiosGanados === 2, 'hay DOS premios ganados');

// --- 7. entregar uno ---
const pendiente = doble.datos.premios.find((p) => !p.entregado_en);
const entregado = await (
  await fetch(`${BASE}/api/admin/socios/premios/${pendiente.id}/entregar`, {
    method: 'POST',
    headers: cabeceras,
    body: JSON.stringify({ nota: 'Postre invitado' }),
  })
).json();
comprobar(entregado.datos.premiosGanados === 2, 'sigue constando que se gano');
comprobar(entregado.datos.premiosPendientes === 1, 'y baja a uno pendiente');

// --- limpieza ---
await pool.execute('DELETE FROM socios WHERE codigo = ?', [codigo]);
const [[quedan]] = await pool.execute(
  'SELECT COUNT(*) n FROM socio_visitas WHERE socio_id = ?', [socio.id]
);
comprobar(Number(quedan.n) === 0, 'al borrar el socio se van sus visitas');

console.log(fallos === 0 ? '\nTodo bien.' : `\n${fallos} FALLOS`);
await pool.end();
process.exit(fallos === 0 ? 0 : 1);
