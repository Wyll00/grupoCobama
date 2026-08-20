/**
 * Utilidades de horario.
 *
 * Convenciones del esquema:
 *  - dia_semana: 0=domingo ... 6=sabado (igual que Date.getDay()).
 *  - hora_cierre admite valores >= '24:00:00' para cierres pasada medianoche.
 *
 * La hora se calcula siempre en Atlantic/Canary: el servidor puede estar en
 * cualquier sitio, el restaurante no.
 */

const ZONA = 'Atlantic/Canary';

const NOMBRE_DIA = [
  'domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado',
];

// Orden de lectura habitual en Espana: la semana empieza el lunes.
const ORDEN_VISUAL = [1, 2, 3, 4, 5, 6, 0];

const DIA_POR_ABREVIATURA = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/** '12:30:00' -> 750. Acepta '24:00:00' y superiores. */
export function horaAMinutos(hora) {
  if (!hora) return null;
  const [h, m] = String(hora).split(':').map(Number);
  return h * 60 + m;
}

/** 750 -> '12:30'. Admite valores por encima de 1440, que dan la vuelta. */
export function minutosAHora(minutos) {
  const n = ((minutos % 1440) + 1440) % 1440;
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
}

/** '12:30:00' -> '12:30'. '24:00:00' -> '00:00'. */
export function formatearHora(hora) {
  const minutos = horaAMinutos(hora);
  if (minutos === null) return null;
  const normalizados = minutos % 1440;
  const h = String(Math.floor(normalizados / 60)).padStart(2, '0');
  const m = String(normalizados % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/** Dia de la semana y minutos transcurridos, en hora de Canarias. */
export function ahoraEnCanarias(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fecha);

  const valor = (tipo) => partes.find((p) => p.type === tipo)?.value;
  const hora = Number(valor('hour')) % 24;
  const minuto = Number(valor('minute'));

  return {
    dia: DIA_POR_ABREVIATURA[valor('weekday')] ?? 0,
    minutos: hora * 60 + minuto,
  };
}

/**
 * Indica si el local esta abierto ahora mismo.
 * Contempla el arrastre del dia anterior: un sabado que cierra a las 24:00
 * sigue abierto a las 23:50, y un local que cerrase a las 02:00 seguiria
 * abierto a la 01:00 del dia siguiente.
 */
export function estaAbiertoAhora(horarios, ahora = ahoraEnCanarias()) {
  const deDia = (dia) => horarios.find((h) => Number(h.dia_semana) === dia);

  const hoy = deDia(ahora.dia);
  if (hoy && !hoy.cerrado) {
    const apertura = horaAMinutos(hoy.hora_apertura);
    const cierre = horaAMinutos(hoy.hora_cierre);
    if (apertura !== null && cierre !== null &&
        ahora.minutos >= apertura && ahora.minutos < cierre) {
      return true;
    }
  }

  const ayer = deDia((ahora.dia + 6) % 7);
  if (ayer && !ayer.cerrado) {
    const cierre = horaAMinutos(ayer.hora_cierre);
    if (cierre !== null && cierre > 1440 && ahora.minutos < cierre - 1440) {
      return true;
    }
  }

  return false;
}

/** Fecha de hoy en Canarias, como 'YYYY-MM-DD'. */
export function hoyEnCanarias(fecha = new Date()) {
  // en-CA da directamente el formato ISO de fecha.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha);
}

/**
 * Dia de la semana de una fecha 'YYYY-MM-DD', en la convencion del esquema
 * (0=domingo). Se parsea como UTC a proposito: es una fecha de calendario sin
 * hora, y dejarla en manos del huso local la correria un dia segun donde
 * corra el servidor.
 */
export function diaSemanaDeFecha(fecha) {
  return new Date(`${fecha}T00:00:00Z`).getUTCDay();
}

const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * Agrupa los siete dias en tramos legibles.
 * [{ dias: 'Lunes a jueves', horario: '12:30 - 23:00', cerrado, es_hoy }, ...]
 *
 * `es_hoy` se calcula aqui y no en el navegador a proposito: el dia se decide
 * en horario de Canarias, y para alguien que mire la carta desde la peninsula
 * a las 00:30 el "hoy" de su navegador seria el dia equivocado.
 */
export function resumirHorarios(horarios, hoy = ahoraEnCanarias().dia) {
  const porDia = new Map(horarios.map((h) => [Number(h.dia_semana), h]));

  const tramos = [];
  for (const dia of ORDEN_VISUAL) {
    const h = porDia.get(dia);
    const firma = !h || h.cerrado
      ? 'cerrado'
      : `${h.hora_apertura}-${h.hora_cierre}`;

    const ultimo = tramos.at(-1);
    if (ultimo && ultimo.firma === firma) {
      ultimo.dias.push(dia);
    } else {
      tramos.push({ firma, dias: [dia], registro: h });
    }
  }

  return tramos.map(({ firma, dias, registro }) => {
    const etiqueta = dias.length === 1
      ? capitalizar(NOMBRE_DIA[dias[0]])
      : dias.length === 2
        ? `${capitalizar(NOMBRE_DIA[dias[0]])} y ${NOMBRE_DIA[dias.at(-1)]}`
        : `${capitalizar(NOMBRE_DIA[dias[0]])} a ${NOMBRE_DIA[dias.at(-1)]}`;

    return {
      dias: etiqueta,
      cerrado: firma === 'cerrado',
      es_hoy: dias.includes(hoy),
      horario: firma === 'cerrado'
        ? 'Cerrado'
        : `${formatearHora(registro.hora_apertura)} - ${formatearHora(registro.hora_cierre)}`,
    };
  });
}
