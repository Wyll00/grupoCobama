/**
 * Adaptador de CoverManager.
 *
 * ---------------------------------------------------------------------------
 * AVISO: el contrato exacto de esta API esta SIN CONFIRMAR.
 *
 * CoverManager no publica su API abiertamente: la da a sus clientes junto con
 * las credenciales. No he inventado rutas ni nombres de campo para que "se
 * vea funcionando", porque un cliente HTTP escrito a ojo falla de la peor
 * manera posible: parece correcto, devuelve 200 en las pruebas contra un
 * servidor falso y en produccion pierde reservas de gente que se presenta a
 * cenar y no tiene mesa.
 *
 * Lo que hay montado alrededor (estados, reintentos, idempotencia, panel) es
 * real y no cambia. Lo unico que falta es rellenar PETICION con lo que diga
 * la documentacion que les den, y es deliberadamente una sola funcion para
 * que ese cambio sea de diez lineas.
 *
 * Mientras COVERMANAGER_URL y COVERMANAGER_API_KEY no esten definidas, la
 * integracion esta apagada y la aplicacion se comporta exactamente igual que
 * antes: la reserva se guarda aqui y ya esta.
 * ---------------------------------------------------------------------------
 */

const URL_BASE = process.env.COVERMANAGER_URL ?? '';
const API_KEY = process.env.COVERMANAGER_API_KEY ?? '';
const TIMEOUT_MS = Number(process.env.COVERMANAGER_TIMEOUT_MS ?? 8000);

export function estaConfigurado() {
  return Boolean(URL_BASE && API_KEY);
}

/** Errores que no se arreglan reintentando: hay que mirarlos a mano. */
export class ErrorPermanente extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorPermanente';
    this.permanente = true;
  }
}

/** Caidas, timeouts y 5xx: se reintentan. */
export class ErrorTemporal extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorTemporal';
    this.permanente = false;
  }
}

/**
 * ==== LO QUE HAY QUE CONFIRMAR CON SU DOCUMENTACION ====
 *
 * Cuatro cosas, y las cuatro estan aqui dentro:
 *
 *   1. La ruta        (abajo, `camino`)
 *   2. La autenticacion (cabecera `Authorization`? `X-Api-Key`? query?)
 *   3. Los nombres de los campos del cuerpo
 *   4. De donde sale el identificador en la respuesta
 *
 * La referencia externa es lo mas importante de todo: es nuestro codigo de
 * reserva, y sirve para que si un reintento se cruza con un envio que si
 * habia llegado, no salgan dos mesas para la misma gente. Si su API no
 * admite una referencia del cliente, hay que preguntarles como evitan el
 * duplicado, porque el problema no desaparece por no tener campo.
 */
function PETICION({ reserva, local }) {
  // La hora sale de MySQL como "21:00:00" y del formulario como "21:00". Se
  // normaliza a HH:MM para mandar siempre lo mismo: una API que acepte un
  // formato y rechace el otro fallaria solo a veces, y eso es lo peor que
  // puede pasar porque parece aleatorio. Confirmar cual quieren ellos.
  const hora = String(reserva.hora).slice(0, 5);

  return {
    camino: '/reservations',
    metodo: 'POST',
    cabeceras: {
      'content-type': 'application/json',
      authorization: `Bearer ${API_KEY}`,
    },
    cuerpo: {
      restaurant_id: local.covermanager_id,
      date: reserva.fecha,
      time: hora,
      people: reserva.comensales,
      customer: {
        name: reserva.nombre,
        phone: reserva.telefono,
        email: reserva.email ?? undefined,
      },
      comments: reserva.observaciones ?? undefined,
      // Clave de idempotencia. Ver arriba.
      external_id: reserva.codigo,
      source: 'web',
    },
    // Donde viene el identificador en la respuesta.
    leerId: (json) => json?.id ?? json?.reservation_id ?? null,
  };
}

/**
 * Solo para el script de diagnostico.
 *
 * Expone la peticion sin enviarla, para poder ensenarla y preguntarle a
 * CoverManager si el formato es el correcto. Va aparte y con nombre feo a
 * proposito: no es parte de la interfaz que usa la aplicacion.
 */
export function __peticionParaDiagnostico({ reserva, local }) {
  return PETICION({ reserva, local });
}

/**
 * Manda una reserva. Devuelve { id } o lanza ErrorPermanente/ErrorTemporal.
 */
export async function enviarReserva({ reserva, local }) {
  if (!estaConfigurado()) {
    throw new ErrorPermanente('CoverManager no esta configurado');
  }
  if (!local.covermanager_id) {
    throw new ErrorPermanente(`El local ${local.nombre} no tiene covermanager_id`);
  }

  const peticion = PETICION({ reserva, local });

  // Sin timeout, una peticion colgada bloquea el reintentador entero: la fila
  // se queda en "enviando" y ninguna otra avanza.
  const corte = AbortSignal.timeout(TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${URL_BASE.replace(/\/+$/, '')}${peticion.camino}`, {
      method: peticion.metodo,
      headers: peticion.cabeceras,
      body: JSON.stringify(peticion.cuerpo),
      signal: corte,
    });
  } catch (e) {
    // Red caida, DNS, timeout: nada de esto es culpa de los datos.
    throw new ErrorTemporal(`No se ha podido contactar con CoverManager: ${e.message}`);
  }

  const texto = await res.text();
  let json = null;
  try {
    json = texto ? JSON.parse(texto) : null;
  } catch {
    // Respuesta que no es JSON. Si el status era bueno, es que la ruta no es
    // la que creemos y nos ha llegado una pagina HTML.
    if (res.ok) {
      throw new ErrorPermanente(
        `CoverManager ha respondido ${res.status} con algo que no es JSON. ` +
          'Revisa la ruta y la documentacion.'
      );
    }
  }

  if (res.status === 429 || res.status >= 500) {
    throw new ErrorTemporal(`CoverManager ha respondido ${res.status}`);
  }

  if (!res.ok) {
    // 4xx: datos malos, credenciales malas o sin hueco. Reintentar no cambia
    // nada; alguien tiene que mirarlo.
    const detalle = json?.message ?? json?.error ?? texto.slice(0, 200);
    throw new ErrorPermanente(`CoverManager ha rechazado la reserva (${res.status}): ${detalle}`);
  }

  const id = peticion.leerId(json);
  if (!id) {
    throw new ErrorPermanente(
      'CoverManager ha aceptado la reserva pero no se ha encontrado el identificador ' +
        'en la respuesta. Hay que ajustar leerId() al formato real.'
    );
  }

  return { id: String(id) };
}
