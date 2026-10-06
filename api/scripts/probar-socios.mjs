/*
  Prueba la regla de negocio de la tarjeta de socio.

  Lo que hay que demostrar, y no se ve mirando la pantalla:

    1. Una visita apuntada dos veces el mismo dia en la misma casa cuenta UNA.
    2. El mismo dia en dos casas distintas cuentan DOS.
    3. A las 8 aparece el premio, ni antes ni dos veces.
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

// --- 3. hasta 7, por dias pasados ---
for (let i = 1; i <= 5; i += 1) {
  await pool.execute(
    `INSERT INTO socio_visitas (socio_id, restaurante_id, fecha)
     VALUES (?, 1, DATE_SUB(CURDATE(), INTERVAL ? DAY))`,
    [socio.id, i]
  );
}
let t = await (await fetch(`${BASE}/api/socios/${codigo}`)).json();
comprobar(t.datos.visitas === 7, 'con 7 visitas', `visitas ${t.datos.visitas}`);
comprobar(t.datos.premiosGanados === 0, 'todavia NO hay premio');
comprobar(t.datos.faltan === 1, 'y dice que falta 1', `faltan ${t.datos.faltan}`);

// --- 4. la octava ---
const octava = await apuntar({ restaurante_id: 3 });
comprobar(octava.datos.visitas === 8, 'la octava entra', `visitas ${octava.datos.visitas}`);
comprobar(octava.datos.premiosGanados === 1, 'y salta el premio');
comprobar(octava.datos.premiosPendientes === 1, 'pendiente de entregar');
comprobar(octava.datos.faltan === 0, 'no pide otras ocho para cobrarlo', `faltan ${octava.datos.faltan}`);

// --- 5. que no se duplique el premio al recontar ---
await apuntar({ restaurante_id: 4 });
t = await (await fetch(`${BASE}/api/socios/${codigo}`)).json();
comprobar(t.datos.visitas === 9, 'novena visita', `visitas ${t.datos.visitas}`);
comprobar(t.datos.premiosGanados === 1, 'el premio sigue siendo UNO, no dos');

// --- 6. el escalon 16 ---
for (let i = 6; i <= 12; i += 1) {
  await pool.execute(
    `INSERT INTO socio_visitas (socio_id, restaurante_id, fecha)
     VALUES (?, 1, DATE_SUB(CURDATE(), INTERVAL ? DAY))`,
    [socio.id, i]
  );
}
const decimosexta = await apuntar({ restaurante_id: 2, nota: 'la 16' });
comprobar(decimosexta.datos.visitas === 16, 'con 16 visitas', `visitas ${decimosexta.datos.visitas}`);
comprobar(decimosexta.datos.premiosGanados === 2, 'hay DOS premios ganados');

// --- 7. entregar uno ---
const pendiente = decimosexta.datos.premios.find((p) => !p.entregado_en);
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
