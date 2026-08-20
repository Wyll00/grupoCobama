/**
 * Identidad del responsable y politicas.
 *
 * ATENCION: los campos marcados con PENDIENTE los tiene que rellenar el grupo
 * con sus datos registrales antes de publicar. Estan aqui y no repartidos por
 * las paginas para que se toquen una sola vez.
 *
 * Obligaciones que cubre esto:
 *   - LSSI-CE art. 10: un sitio de una empresa tiene que identificar quien
 *     esta detras (razon social, NIF, domicilio, contacto).
 *   - RGPD art. 13: hay que informar al recoger datos, en el momento de
 *     recogerlos, no en una pagina que nadie visita.
 */

/**
 * Version de la politica de privacidad.
 *
 * Se guarda junto a cada reserva. Si manana cambia la politica, hay que poder
 * demostrar QUE texto se le enseno a cada persona; con una fecha de aceptacion
 * a secas no se puede, porque el texto de hoy ya no existe.
 *
 * Al cambiar el texto de la politica, sube esta fecha.
 */
export const VERSION_POLITICA = '2026-08-21';

export const LEGAL = {
  // --- Identificacion (LSSI art. 10) --------------------------------------
  razonSocial: 'PENDIENTE — razon social completa, p. ej. "Cobama Restauracion, S.L."',
  nif: 'PENDIENTE — CIF/NIF',
  domicilio: 'PENDIENTE — domicilio social completo con codigo postal',
  registro: null, // p. ej. 'Registro Mercantil de Santa Cruz de Tenerife, tomo X, folio Y, hoja Z'

  // --- Contacto para ejercer derechos -------------------------------------
  // Puede ser el mismo email general, pero tiene que estar publicado y alguien
  // tiene que leerlo: hay un mes de plazo para contestar (RGPD art. 12.3).
  emailPrivacidad: 'privacidad@grupocobama.es',

  // Solo si el grupo llega a designarlo. La mayoria de restaurantes no estan
  // obligados (RGPD art. 37): no hacen observacion a gran escala ni tratan
  // categorias especiales de forma habitual.
  delegadoProteccionDatos: null,

  // --- Conservacion --------------------------------------------------------
  // Cuanto se guarda cada cosa. Los numeros van aqui y no dentro del texto
  // para que el script de borrado y la politica no puedan contradecirse.
  conservacion: {
    reservaMeses: 12,
    reservaMotivo:
      'para gestionar la reserva, poder atender una reclamacion posterior y llevar el control de asistencia',
    marketingMeses: null, // hasta que la persona se de de baja
  },

  /**
   * Encargados del tratamiento (RGPD art. 28): terceros que ven los datos de
   * los clientes porque prestan un servicio.
   *
   * No basta con listarlos aqui. Con cada uno hace falta un contrato de
   * encargado firmado; sin el, la cesion es ilicita aunque la politica lo
   * cuente. Y hay que nombrarlos: "terceros proveedores" no informa de nada.
   *
   * `contrato: false` = todavia no hay contrato de encargado firmado.
   */
  encargados: [
    {
      nombre: 'CoverManager',
      para: 'gestion de las reservas y del libro de mesas',
      pais: 'Espana (UE)',
      contrato: false,
    },
    {
      nombre: 'PENDIENTE — proveedor de alojamiento',
      para: 'alojamiento de la web y de la base de datos',
      pais: 'PENDIENTE',
      contrato: false,
    },
    {
      nombre: 'PENDIENTE — proveedor de correo',
      para: 'envio de los avisos de reserva',
      pais: 'PENDIENTE',
      contrato: false,
    },
  ],

  // --- Autoridad de control ------------------------------------------------
  autoridad: {
    nombre: 'Agencia Espanola de Proteccion de Datos (AEPD)',
    web: 'https://www.aepd.es',
  },
};

/** Los campos que faltan por rellenar. Vacio = listo para publicar. */
export function camposPendientes() {
  const sueltos = Object.entries(LEGAL)
    .filter(([, v]) => typeof v === 'string' && v.startsWith('PENDIENTE'))
    .map(([k]) => k);

  const deEncargados = LEGAL.encargados
    .filter((e) => e.nombre.startsWith('PENDIENTE') || e.pais.startsWith('PENDIENTE'))
    .map((e) => `encargado: ${e.para}`);

  return [...sueltos, ...deEncargados];
}

/** Encargados con los que todavia no hay contrato del art. 28 firmado. */
export function encargadosSinContrato() {
  return LEGAL.encargados.filter((e) => !e.contrato);
}
