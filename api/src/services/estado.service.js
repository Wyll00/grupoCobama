import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { estaConfigurado as coverManagerConfigurado } from '../integraciones/covermanager.js';

/**
 * Que esta conectado de verdad, y que trabajo humano implica lo que no.
 *
 * Existe porque una revision externa no pudo comprobar si las reservas van a
 * CoverManager o no, y se quedo con la duda de cuanto trabajo manual habia
 * detras. Esa duda no se resuelve leyendo codigo: hay que poder mirarlo desde
 * el panel, en el sistema que esta corriendo, sin credenciales de servidor.
 *
 * La regla de este fichero es no maquillar. Si algo no esta conectado, lo dice
 * y dice QUIEN tiene que hacerlo a mano mientras tanto. Un panel que pone
 * "todo correcto" cuando los avisos se estan escribiendo en una carpeta es
 * peor que no tener panel: da una tranquilidad que no se corresponde con nada.
 *
 * No expone secretos: dice si hay una clave configurada, nunca cual.
 */

/** Reservas que ha dejado el formulario y todavia no ha visto nadie. */
async function reservasSinAtender() {
  const [[fila]] = await pool.query(
    `SELECT COUNT(*) AS pendientes,
            MIN(created_at) AS mas_antigua
       FROM reservas
      WHERE estado = 'pendiente'
        AND origen = 'web'`
  );
  return {
    pendientes: Number(fila.pendientes ?? 0),
    masAntigua: fila.mas_antigua ?? null,
  };
}

async function estadoCoverManager() {
  const configurado = coverManagerConfigurado();

  // Locales que TIENEN identificador de CoverManager: son los unicos a los
  // que se les enviaria algo si la integracion estuviera encendida.
  const [locales] = await pool.query(
    `SELECT slug, nombre, covermanager_id, url_reservas
       FROM restaurantes
      WHERE activo = 1
      ORDER BY orden, nombre`
  );

  const conIdentificador = locales.filter((l) => l.covermanager_id);
  const conEnlaceFuera = locales.filter((l) => l.url_reservas);

  const [[cuentas]] = await pool.query(
    `SELECT
       SUM(cm_estado = 'enviada') AS enviadas,
       SUM(cm_estado = 'error')   AS con_error,
       SUM(cm_estado IN ('pendiente', 'enviando')) AS en_cola
     FROM reservas`
  );

  return {
    configurado,
    // Lo que de verdad se quiere saber: si una reserva de hoy acabaria en su
    // libro de mesas o solo en esta base de datos.
    enviaReservas: configurado && conIdentificador.length > 0,
    localesConIdentificador: conIdentificador.map((l) => l.slug),
    localesSinIdentificador: locales
      .filter((l) => !l.covermanager_id && !l.url_reservas)
      .map((l) => l.slug),
    // Estos no pasan por aqui: mandan al cliente al sistema del propio local.
    localesQueReservanFuera: conEnlaceFuera.map((l) => ({
      slug: l.slug,
      url: l.url_reservas,
    })),
    reservas: {
      enviadas: Number(cuentas.enviadas ?? 0),
      conError: Number(cuentas.con_error ?? 0),
      enCola: Number(cuentas.en_cola ?? 0),
    },
  };
}

function estadoCorreo() {
  return {
    activo: env.correo.activo,
    // Sin SMTP los avisos se escriben en api/correos/. No se pierden, pero
    // tampoco llegan: nadie del local recibe nada.
    modo: env.correo.activo ? 'smtp' : 'carpeta',
    carpeta: env.correo.activo ? null : 'api/correos',
  };
}

/**
 * Las frases que se leen en el panel.
 *
 * Se arman aqui y no en el navegador porque son afirmaciones sobre el
 * sistema, no adornos: quien las escriba tiene que estar mirando los mismos
 * datos con los que se deciden. Cada una dice que pasa y, si hace falta que
 * alguien haga algo a mano, lo dice tambien.
 */
function avisos({ cover, correo, sinAtender }) {
  const fuera = [];

  if (!cover.configurado) {
    fuera.push({
      nivel: 'aviso',
      titulo: 'Las reservas NO se envían a CoverManager',
      detalle:
        'No hay dirección ni clave de CoverManager configuradas, así que la integración está apagada. ' +
        'Las reservas de la web se guardan aquí y se ven en esta pantalla, pero no aparecen en el libro de mesas de CoverManager.',
      manual: 'Alguien de sala tiene que pasarlas al libro de mesas, o llevar el aforo desde este panel.',
    });
  } else if (!cover.enviaReservas) {
    fuera.push({
      nivel: 'aviso',
      titulo: 'CoverManager está configurado, pero ningún local tiene identificador',
      detalle:
        'La conexión existe y no se le envía nada porque ninguna casa tiene su identificador de CoverManager puesto en su ficha.',
      manual: 'Rellenar el identificador de cada local en Locales.',
    });
  }

  if (cover.reservas.conError > 0) {
    fuera.push({
      nivel: 'error',
      titulo: `${cover.reservas.conError} reserva(s) no han llegado a CoverManager`,
      detalle:
        'Existen aquí pero no en su libro de mesas, así que esas mesas no están bloqueadas y se pueden vender dos veces.',
      manual: 'Reintentar el envío desde Reservas, o meterlas a mano en CoverManager.',
    });
  }

  if (!correo.activo) {
    fuera.push({
      nivel: 'aviso',
      titulo: 'No se envían correos: se escriben en una carpeta',
      detalle:
        `Sin servidor de correo configurado, el aviso al local y la confirmación al cliente se guardan en ${correo.carpeta} en vez de enviarse. ` +
        'No se pierde nada, pero nadie recibe nada.',
      manual:
        'Hay que mirar esta pantalla para enterarse de las reservas nuevas: no va a llegar ningún aviso.',
    });
  }

  if (sinAtender.pendientes > 0) {
    fuera.push({
      nivel: sinAtender.pendientes > 5 ? 'error' : 'info',
      titulo: `${sinAtender.pendientes} reserva(s) de la web sin confirmar`,
      detalle: 'Están guardadas y esperando a que alguien las confirme o las rechace.',
      manual: 'Confirmarlas en Reservas.',
    });
  }

  return fuera;
}

export async function estadoDelSistema() {
  const [cover, sinAtender] = await Promise.all([estadoCoverManager(), reservasSinAtender()]);
  const correo = estadoCorreo();

  return {
    covermanager: cover,
    correo,
    reservas: sinAtender,
    // La purga de datos de reservas no esta programada en ningun sitio: no hay
    // tarea que la ejecute. Decirlo aqui es lo unico honesto mientras siga
    // asi, porque la politica de privacidad promete un plazo de conservacion.
    purga: {
      programada: false,
      meses: 12,
    },
    avisos: avisos({ cover, correo, sinAtender }),
    comprobadoEn: new Date().toISOString(),
  };
}
