import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '../config/env.js';

/**
 * Envio de correo.
 *
 * Sin SMTP configurado NO se calla ni finge que ha enviado: escribe el correo
 * en api/correos/ y lo anuncia por consola. Asi se puede leer exactamente lo
 * que le llegaria al local y al cliente, que es lo unico verificable hasta que
 * haya un servidor de correo de verdad.
 *
 * Cuando se configure SMTP hay que instalar nodemailer y sustituir `entregar`.
 * El resto de la aplicacion no se entera: solo llama a avisar*().
 */
const CARPETA = 'correos';

async function entregar({ para, asunto, texto }) {
  if (!env.correo.activo) {
    await mkdir(CARPETA, { recursive: true });
    const nombre = `${new Date().toISOString().replace(/[:.]/g, '-')}-${para.replace(/[^\w.@-]/g, '_')}.txt`;
    const contenido = `Para: ${para}\nAsunto: ${asunto}\n\n${texto}\n`;
    await writeFile(join(CARPETA, nombre), contenido, 'utf8');
    console.log(`[correo] sin SMTP configurado; escrito en ${CARPETA}/${nombre}`);
    return { enviado: false, guardadoEn: `${CARPETA}/${nombre}` };
  }

  // Aqui iria el transporte real.
  throw new Error('SMTP configurado pero sin transporte implementado');
}

const formatearFecha = (fecha) =>
  new Date(`${fecha}T12:00:00Z`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

/** Aviso al local de que ha entrado una solicitud por web. */
export async function avisarLocalDeReserva(reserva, emailLocal) {
  if (!emailLocal) return { enviado: false, motivo: 'el local no tiene email' };

  return entregar({
    para: emailLocal,
    asunto: `Nueva reserva web · ${reserva.nombre} · ${formatearFecha(reserva.fecha)} ${reserva.hora.slice(0, 5)}`,
    texto: [
      `Ha entrado una solicitud de reserva en ${reserva.restaurante_nombre}.`,
      '',
      `Codigo:      ${reserva.codigo}`,
      `Nombre:      ${reserva.nombre}`,
      `Telefono:    ${reserva.telefono}`,
      reserva.email ? `Email:       ${reserva.email}` : null,
      `Dia y hora:  ${formatearFecha(reserva.fecha)} a las ${reserva.hora.slice(0, 5)}`,
      `Comensales:  ${reserva.comensales}`,
      reserva.observaciones ? `Nota:        ${reserva.observaciones}` : null,
      '',
      'Esta PENDIENTE de confirmar. Entra en el panel para confirmarla o cancelarla:',
      `${env.webBaseUrl}/admin/reservas`,
    ]
      // Solo se quitan las lineas opcionales que no aplican. Con filter(Boolean)
      // se irian tambien las cadenas vacias, que son las que separan bloques.
      .filter((linea) => linea !== null)
      .join('\n'),
  });
}

/** Aviso al cliente cuando el local confirma o cancela. */
export async function avisarClienteDeReserva(reserva) {
  if (!reserva.email) return { enviado: false, motivo: 'la reserva no tiene email' };

  const confirmada = reserva.estado === 'confirmada';

  return entregar({
    para: reserva.email,
    asunto: confirmada
      ? `Reserva confirmada en ${reserva.restaurante_nombre}`
      : `Reserva cancelada en ${reserva.restaurante_nombre}`,
    texto: [
      `Hola ${reserva.nombre},`,
      '',
      confirmada
        ? `Tu reserva en ${reserva.restaurante_nombre} esta confirmada.`
        : `Tu reserva en ${reserva.restaurante_nombre} ha quedado cancelada.`,
      '',
      `Codigo:      ${reserva.codigo}`,
      `Dia y hora:  ${formatearFecha(reserva.fecha)} a las ${reserva.hora.slice(0, 5)}`,
      `Comensales:  ${reserva.comensales}`,
      '',
      confirmada
        ? 'Si no puedes venir, avisanos y liberamos la mesa. Gracias.'
        : 'Si ha sido un error o quieres cambiarla, escribenos.',
      '',
      `${env.webBaseUrl}/${reserva.restaurante_slug}`,
    ].join('\n'),
  });
}
