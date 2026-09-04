import { pool } from '../config/db.js';
import { formatearHora, horaAMinutos } from '../utils/horarios.js';
import { procesarPortada, borrarPortada } from '../services/imagenes.service.js';
import { recorteSchema } from '../esquemas/catalogo.js';
import { ApiError } from '../utils/ApiError.js';

async function obtener(id) {
  const [filas] = await pool.execute(
    'SELECT id, slug, nombre, imagen_portada, imagen_portada_movil FROM restaurantes WHERE id = ? LIMIT 1',
    [id]
  );
  if (!filas[0]) throw ApiError.noEncontrado('Ese local no existe');
  return filas[0];
}

// Lo que el formulario del panel puede cambiar. La lista esta escrita a mano
// y no sale del cuerpo de la peticion: asi un campo nuevo en la tabla no se
// vuelve editable solo porque alguien lo mande, y el slug -que va en los QR
// pegados a las mesas- no hay forma de tocarlo desde aqui.
const CAMPOS_EDITABLES = [
  'nombre',
  'municipio',
  'direccion',
  'telefono',
  'whatsapp',
  'email',
  'reclamo',
  'lat',
  'lng',
  'tiene_parking',
  'url_reservas',
];

const SELECT_LOCAL = `
  SELECT id, slug, nombre, municipio, direccion, telefono, whatsapp, email,
         reclamo, lat, lng, tiene_parking, url_reservas,
         imagen_portada, activo
    FROM restaurantes
   WHERE id = ? LIMIT 1
`;

async function leerLocal(id) {
  const [filas] = await pool.execute(SELECT_LOCAL, [id]);
  if (!filas[0]) throw ApiError.noEncontrado('Ese local no existe');

  const [horarios] = await pool.execute(
    `SELECT dia_semana, hora_apertura, hora_cierre, cerrado
       FROM horarios WHERE restaurante_id = ? ORDER BY dia_semana`,
    [id]
  );

  return {
    ...filas[0],
    lat: filas[0].lat === null ? null : Number(filas[0].lat),
    lng: filas[0].lng === null ? null : Number(filas[0].lng),
    tiene_parking: Boolean(filas[0].tiene_parking),
    activo: Boolean(filas[0].activo),
    // La hora sale como '12:30' y no '12:30:00' porque es lo que espera un
    // <input type="time">. El cierre pasada medianoche se guarda como
    // '24:00:00' y aqui se lee '00:00', que es como lo escribiria cualquiera.
    horarios: horarios.map((h) => ({
      dia_semana: h.dia_semana,
      hora_apertura: formatearHora(h.hora_apertura),
      hora_cierre: formatearHora(h.hora_cierre),
      cerrado: Boolean(h.cerrado),
    })),
  };
}

/**
 * Los datos del local tal como estan guardados, para rellenar el formulario.
 */
export async function getLocal(req, res) {
  res.json({ datos: await leerLocal(req.restauranteId) });
}

/**
 * Guarda los datos del local.
 *
 * Devuelve la fila entera y no un "ok" para que el panel se refresque con lo
 * que hay guardado de verdad y no con lo que el formulario cree haber
 * mandado. Si el servidor recorta o normaliza algo, se ve al momento.
 */
export async function patchLocal(req, res) {
  const campos = [];
  const valores = [];

  for (const campo of CAMPOS_EDITABLES) {
    if (req.body[campo] !== undefined) {
      campos.push(`${campo} = ?`);
      valores.push(req.body[campo]);
    }
  }

  if (campos.length > 0) {
    valores.push(req.restauranteId);
    await pool.execute(`UPDATE restaurantes SET ${campos.join(', ')} WHERE id = ?`, valores);
  }

  res.json({ datos: await leerLocal(req.restauranteId) });
}

/**
 * Guarda la semana entera de horarios.
 *
 * CIERRES DE MADRUGADA. La tabla guarda el cierre en minutos desde la
 * apertura del dia, asi que cerrar a medianoche son las '24:00:00' y no las
 * '00:00:00'; los viernes y sabados de las cuatro casas ya estan asi. Si se
 * guardara un 00:00 tal cual, el local figuraria abierto de 12:30 a 00:00 del
 * MISMO dia, o sea doce horas y media antes de abrir: cerrado siempre, y sin
 * tramos de reserva que ofrecer.
 *
 * La regla es que un cierre que no sea posterior a la apertura es del dia
 * siguiente, y se le suman 24 horas. Cubre el 00:00 de los fines de semana y
 * tambien un 01:30 si alguna casa alarga.
 *
 * Los siete dias van en una sola sentencia: o entra la semana entera o no
 * entra ninguno. Media semana guardada es peor que ninguna, porque nadie
 * sabria cual mitad.
 */
export async function putHorarios(req, res) {
  const filas = req.body.horarios.map((dia) => {
    if (dia.cerrado) return [req.restauranteId, dia.dia_semana, null, null, 1];

    const apertura = horaAMinutos(dia.hora_apertura);
    const cierreCrudo = horaAMinutos(dia.hora_cierre);
    const cierre = cierreCrudo <= apertura ? cierreCrudo + 24 * 60 : cierreCrudo;

    return [
      req.restauranteId,
      dia.dia_semana,
      aHoraSql(apertura),
      aHoraSql(cierre),
      0,
    ];
  });

  const huecos = filas.map(() => '(?, ?, ?, ?, ?)').join(', ');
  await pool.query(
    `INSERT INTO horarios (restaurante_id, dia_semana, hora_apertura, hora_cierre, cerrado)
     VALUES ${huecos}
     ON DUPLICATE KEY UPDATE
       hora_apertura = VALUES(hora_apertura),
       hora_cierre   = VALUES(hora_cierre),
       cerrado       = VALUES(cerrado)`,
    filas.flat()
  );

  res.json({ datos: await leerLocal(req.restauranteId) });
}

/** 1470 -> '24:30:00'. No da la vuelta a proposito: ver putHorarios. */
function aHoraSql(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0');
  const m = String(minutos % 60).padStart(2, '0');
  return `${h}:${m}:00`;
}

export async function postPortada(req, res) {
  if (!req.file) throw ApiError.peticionInvalida('No se ha recibido ninguna imagen');

  const anterior = await obtener(req.restauranteId);

  // El recorte llega como campos de texto del multipart, no como JSON.
  let recorte;
  if (req.body?.x !== undefined) {
    const parseado = recorteSchema.safeParse(req.body);
    if (!parseado.success) {
      throw ApiError.peticionInvalida(
        'Los datos del recorte no son validos',
        parseado.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }))
      );
    }
    recorte = parseado.data;
  }

  const { portada, portadaMovil, estilo } = await procesarPortada(
    req.restauranteId,
    req.file.buffer,
    recorte
  );

  await pool.execute(
    `UPDATE restaurantes
        SET imagen_portada = ?, imagen_portada_movil = ?, portada_estilo = ?
      WHERE id = ?`,
    [portada, portadaMovil, estilo, req.restauranteId]
  );

  // Solo despues de que la nueva este guardada en base de datos.
  await borrarPortada(anterior.imagen_portada);
  await borrarPortada(anterior.imagen_portada_movil);

  res.json({ datos: await obtener(req.restauranteId) });
}

export async function deletePortada(req, res) {
  const anterior = await obtener(req.restauranteId);
  await pool.execute('UPDATE restaurantes SET imagen_portada = NULL WHERE id = ?', [
    req.restauranteId,
  ]);
  await borrarPortada(anterior.imagen_portada);
  res.json({ datos: await obtener(req.restauranteId) });
}
