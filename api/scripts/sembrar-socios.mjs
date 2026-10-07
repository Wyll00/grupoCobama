/**
 * Socios de prueba, para poder mirar el panel con algo dentro.
 *
 * Es un SCRIPT y no un seed numerado a proposito. Los seeds se ejecutan solos
 * en cada instalacion -tambien en la del servidor-, y doce clientes inventados
 * con sus visitas y sus premios no tienen nada que hacer en la base de datos
 * real del grupo. Esto hay que lanzarlo a mano:
 *
 *     npm run socios:demo --prefix api
 *
 * Se puede repetir las veces que haga falta: borra sus propios socios y los
 * vuelve a crear. Borra SOLO los codigos de la lista de aqui abajo, asi que no
 * puede llevarse por delante a un socio de verdad aunque se lance donde no
 * debe. Antes de tocar nada dice contra que base va, por si acaso.
 *
 * Los perfiles no son doce clientes iguales con numeros distintos: cada uno
 * esta puesto para que en el panel se vea un caso que hay que saber manejar
 * -el que esta a una visita del premio, el que lo tiene sin recoger, el que se
 * dio de alta y no volvio-. Un listado donde todos van por la mitad no ensena
 * si la pantalla sirve.
 */

import { pool } from '../src/config/db.js';
import { VISITAS_POR_PREMIO } from '../src/services/socios.service.js';

/*
  Codigos fijos y no generados al azar.

  Es lo que hace que el script se pueda repetir: con codigos nuevos cada vez,
  la segunda pasada dejaria veinticuatro socios en vez de doce. Van con el
  alfabeto de verdad -sin 0/O ni 1/I/L- para que se puedan dictar y buscar
  igual que los reales.
*/
const PERFILES = [
  {
    codigo: 'TDUXN435',
    nombre: 'William Luis Gonzalez',
    telefono: '+34 600 111 222',
    email: 'william@ejemplo.es',
    // Ya existia de las pruebas de ayer.
    visitas: VISITAS_POR_PREMIO,
    reparto: 'mezclado',
    ultimaHaceDias: 0,
  },
  {
    codigo: 'MARCANA7',
    nombre: 'Candelaria Hernández Perdomo',
    telefono: '+34 600 333 444',
    email: 'candelaria.hp@ejemplo.es',
    // El caso que mas importa de toda la pantalla: a UNA visita del premio.
    // Si sala no lo ve venir, se pierde la gracia de decirselo en la mesa.
    visitas: VISITAS_POR_PREMIO - 1,
    reparto: 'mezclado',
    ultimaHaceDias: 3,
  },
  {
    codigo: 'JPRMZ928',
    nombre: 'Airam Delgado Siverio',
    telefono: '+34 600 555 666',
    email: null,
    // Premio recien ganado y SIN entregar: es lo que tiene que saltar a la
    // vista en la lista.
    visitas: VISITAS_POR_PREMIO,
    reparto: 'mezclado',
    ultimaHaceDias: 1,
  },
  {
    codigo: 'YGHTR364',
    nombre: 'Nayra Baute Cabrera',
    telefono: '+34 600 777 888',
    email: 'nayra.baute@ejemplo.es',
    // Dos premios: el primero ya entregado, el segundo pendiente. Sirve para
    // ver que el historial de premios distingue uno de otro.
    visitas: VISITAS_POR_PREMIO * 2,
    reparto: 'mezclado',
    entregarPremios: [VISITAS_POR_PREMIO],
    ultimaHaceDias: 2,
  },
  {
    codigo: 'QWSDE573',
    nombre: 'Jonay Martín Alonso',
    telefono: null,
    email: null,
    // Pasa de largo del premio y lo tiene TODO cobrado: el estado "al dia".
    // Por eso se entregan los dos escalones y no solo el primero.
    visitas: VISITAS_POR_PREMIO * 2 + 2,
    reparto: 'mezclado',
    entregarPremios: [VISITAS_POR_PREMIO, VISITAS_POR_PREMIO * 2],
    ultimaHaceDias: 9,
  },
  {
    codigo: 'ZXCVB238',
    nombre: 'Yurena Rodríguez Padrón',
    telefono: '+34 600 999 000',
    email: 'yurena.rp@ejemplo.es',
    // Solo va a una casa. Deja ver "donde mas viene" con un ganador claro.
    visitas: VISITAS_POR_PREMIO + 1,
    reparto: 'una-sola',
    ultimaHaceDias: 5,
  },
  {
    codigo: 'HJKLM457',
    nombre: 'Eloy Gutiérrez Ramos',
    telefono: '+34 600 121 212',
    email: null,
    // Las cuatro casas. El argumento de la tarjeta de grupo, hecho dato.
    visitas: 4,
    reparto: 'las-cuatro',
    ultimaHaceDias: 11,
  },
  {
    codigo: 'VBNMK892',
    nombre: 'Idaira Santana Negrín',
    telefono: null,
    email: 'idaira.sn@ejemplo.es',
    // Se dio de alta y no ha vuelto. Es el agujero del programa: si hay
    // muchos asi, el problema no es la tarjeta, es que nadie la usa.
    visitas: 0,
    reparto: 'mezclado',
    ultimaHaceDias: null,
  },
  {
    codigo: 'PQRST746',
    nombre: 'Borja Afonso Melián',
    telefono: '+34 600 343 434',
    email: null,
    // Una sola visita, la del dia que se hizo socio.
    visitas: 1,
    reparto: 'una-sola',
    ultimaHaceDias: 21,
  },
  {
    codigo: 'FGHJD529',
    nombre: 'Tanausú Morales Quintero',
    telefono: '+34 600 565 656',
    email: 'tanausu.mq@ejemplo.es',
    // Venia, y lleva ocho meses sin aparecer. En la lista tiene que poder
    // distinguirse de uno que vino ayer, aunque los dos lleven 4 visitas.
    visitas: 4,
    reparto: 'mezclado',
    ultimaHaceDias: 240,
  },
  {
    codigo: 'RTYUH683',
    nombre: 'Guacimara Díaz Ravelo',
    telefono: null,
    email: null,
    visitas: 3,
    reparto: 'mezclado',
    ultimaHaceDias: 14,
  },
  {
    codigo: 'KMNBV394',
    nombre: 'Ayoze Pérez Betancort',
    telefono: '+34 600 787 878',
    email: 'ayoze.pb@ejemplo.es',
    // Dos premios y ninguno recogido: el caso que hay que ir a buscar.
    visitas: VISITAS_POR_PREMIO * 2 + 1,
    reparto: 'mezclado',
    ultimaHaceDias: 4,
  },
];

const CODIGOS = PERFILES.map((p) => p.codigo);

/** Una fecha en formato DATE, contando dias hacia atras desde hoy. */
function haceDias(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Reparte N visitas en dias y casas sin chocar con la clave unica.
 *
 * La tabla tiene UNIQUE (socio_id, restaurante_id, fecha): una casa no puede
 * apuntar dos veces el mismo dia al mismo socio. Asi que se va dia a dia hacia
 * atras y en cada uno se usa una casa distinta. Nunca se repite el par, y de
 * paso las fechas quedan repartidas en el tiempo en vez de amontonadas.
 */
function repartir(visitas, modo, locales, desdeHaceDias) {
  const salida = [];
  let dia = desdeHaceDias;

  for (let i = 0; i < visitas; i += 1) {
    let local;
    if (modo === 'una-sola') local = locales[0];
    else if (modo === 'las-cuatro') local = locales[i % locales.length];
    else local = locales[(i * 3 + 1) % locales.length];

    salida.push({ restauranteId: local.id, fecha: haceDias(dia) });

    // Entre 2 y 13 dias hasta la siguiente hacia atras. Suficiente para que
    // dos visitas del mismo socio no caigan nunca el mismo dia.
    dia += 2 + ((i * 7) % 12);
  }

  return salida;
}

async function main() {
  const [[donde]] = await pool.query('SELECT DATABASE() AS db, @@hostname AS host');
  console.log(`Base de datos: ${donde.db} en ${donde.host}`);

  const [locales] = await pool.query(
    'SELECT id, nombre FROM restaurantes WHERE activo = 1 ORDER BY id'
  );
  if (locales.length === 0) {
    throw new Error('No hay restaurantes activos: lanza antes npm run db:setup --prefix api');
  }
  console.log(`Locales disponibles: ${locales.map((l) => l.nombre).join(', ')}\n`);

  // Fuera los de la pasada anterior. Solo estos codigos: las visitas y los
  // premios se van en cascada con ellos.
  const huecos = CODIGOS.map(() => '?').join(', ');
  const [borrados] = await pool.query(`DELETE FROM socios WHERE codigo IN (${huecos})`, CODIGOS);
  if (borrados.affectedRows > 0) {
    console.log(`Borrados ${borrados.affectedRows} socios de prueba de la pasada anterior.\n`);
  }

  for (const perfil of PERFILES) {
    // El alta se reparte entre las casas para que la estadistica de "de donde
    // vienen las altas" no salga toda del mismo sitio.
    const alta = locales[PERFILES.indexOf(perfil) % locales.length];

    const [res] = await pool.query(
      `INSERT INTO socios (codigo, nombre, telefono, email, alta_restaurante_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        perfil.codigo,
        perfil.nombre,
        perfil.telefono,
        perfil.email,
        alta.id,
        // Se dio de alta antes de su primera visita, no despues.
        `${haceDias((perfil.ultimaHaceDias ?? 30) + perfil.visitas * 9 + 5)} 12:00:00`,
      ]
    );
    const socioId = res.insertId;

    const visitas =
      perfil.visitas > 0
        ? repartir(perfil.visitas, perfil.reparto, locales, perfil.ultimaHaceDias ?? 0)
        : [];

    if (visitas.length > 0) {
      await pool.query(
        `INSERT INTO socio_visitas (socio_id, restaurante_id, fecha) VALUES ${visitas
          .map(() => '(?, ?, ?)')
          .join(', ')}`,
        visitas.flatMap((v) => [socioId, v.restauranteId, v.fecha])
      );
    }

    // Los premios se calculan igual que en produccion: por escalones de ocho.
    // No se inventan aqui, se derivan del numero de visitas, que es la misma
    // regla que aplica el servicio.
    const escalones = [];
    for (let n = VISITAS_POR_PREMIO; n <= perfil.visitas; n += VISITAS_POR_PREMIO) {
      escalones.push(n);
    }

    for (const n of escalones) {
      const entregado = (perfil.entregarPremios ?? []).includes(n);
      await pool.query(
        `INSERT INTO socio_premios (socio_id, visitas, entregado_en, entregado_nota)
         VALUES (?, ?, ?, ?)`,
        [
          socioId,
          n,
          entregado ? `${haceDias((perfil.ultimaHaceDias ?? 0) + 6)} 21:30:00` : null,
          entregado ? 'Postre invitado' : null,
        ]
      );
    }

    const pendientes = escalones.length - (perfil.entregarPremios ?? []).length;
    const estado = [
      `${perfil.visitas} visita${perfil.visitas === 1 ? '' : 's'}`,
      escalones.length > 0 ? `${escalones.length} premio(s)` : null,
      pendientes > 0 ? `${pendientes} SIN ENTREGAR` : null,
      perfil.visitas === 0 ? 'sin estrenar' : null,
      (perfil.ultimaHaceDias ?? 0) > 180 ? 'inactivo' : null,
    ]
      .filter(Boolean)
      .join(' · ');

    console.log(`  ${perfil.codigo}  ${perfil.nombre.padEnd(30)} ${estado}`);
  }

  console.log(`\n${PERFILES.length} socios de prueba listos.`);
  console.log('Panel: /admin/socios');
  await pool.end();
}

main().catch(async (err) => {
  console.error('\nNo se ha podido sembrar:', err.message);
  await pool.end();
  process.exit(1);
});
