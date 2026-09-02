import { pool } from '../config/db.js';

/**
 * Lo que falta por rematar en la carta.
 *
 * El panel tenia herramientas para arreglar cada plato, pero ningun sitio que
 * dijera CUALES estaban incompletos: para saber que treinta y siete platos no
 * tenian alergenos habia que abrirlos de uno en uno. Esto devuelve los
 * recuentos para que la portada del panel sea una lista de tareas y no un menu.
 *
 * Solo cuenta lo que un cliente puede ver: carta_items activos. Un plato
 * apagado sin foto no es un problema, y meterlo en la cuenta convierte el aviso
 * en ruido que se acaba ignorando.
 *
 * Un encargado ve lo suyo y nada mas. El filtro se aplica aqui contra el
 * restaurante_id de su sesion, no contra un id que venga en la peticion.
 */
export async function resumen(req, res) {
  const esAdmin = req.usuario.rol === 'admin_grupo';
  const local = esAdmin ? null : req.usuario.restaurante_id;

  // Un unico filtro reutilizado en todas las consultas de carta.
  const filtroLocal = local ? 'AND c.restaurante_id = ?' : '';
  const arg = local ? [local] : [];

  // Sin revisar, no "sin alergenos". No es lo mismo que un plato no lleve
  // gluten a que nadie haya dicho todavia si lo lleva, y delante de un cliente
  // celiaco esa diferencia es justo la que importa.
  //
  // Contar los que no tienen filas en plato_alergenos era ademas un contador
  // que nunca podia llegar a cero: el agua mineral y el cafe solo no llevan
  // ninguno de los catorce declarables y ahi seguirian para siempre. Un aviso
  // que no se puede apagar se acaba ignorando, y con el se ignora el de al lado.
  //
  // Esto en cambio baja segun se confirma cada plato, incluidos los que se
  // confirman con cero alergenos, que es exactamente el trabajo que hay que
  // hacer y el que deja constancia de que se hizo.
  const [[{ sin_revisar }]] = await pool.execute(
    `SELECT COUNT(DISTINCT p.id) AS sin_revisar
       FROM platos p
       JOIN carta_items c ON c.plato_id = p.id AND c.activo = 1
      WHERE p.alergenos_revisados_en IS NULL
        ${filtroLocal}`,
    arg
  );

  const [[{ sin_foto }]] = await pool.execute(
    `SELECT COUNT(DISTINCT p.id) AS sin_foto
       FROM platos p
       JOIN carta_items c ON c.plato_id = p.id AND c.activo = 1
      WHERE (p.imagen IS NULL OR p.imagen = '') ${filtroLocal}`,
    arg
  );

  const [[{ sin_traducir }]] = await pool.execute(
    `SELECT COUNT(DISTINCT p.id) AS sin_traducir
       FROM platos p
       JOIN carta_items c ON c.plato_id = p.id AND c.activo = 1
      WHERE (p.nombre_en IS NULL OR p.nombre_en = ''
          OR p.nombre_de IS NULL OR p.nombre_de = '') ${filtroLocal}`,
    arg
  );

  // Agotado no es un si o un no: es una fecha hasta la que no hay. Lo que
  // interesa es lo que sigue agotado hoy, no el historico.
  const [[{ agotados }]] = await pool.execute(
    `SELECT COUNT(*) AS agotados
       FROM carta_items c
      WHERE c.activo = 1 AND c.agotado_hasta IS NOT NULL
        AND c.agotado_hasta >= CURDATE() ${filtroLocal}`,
    arg
  );

  const [[{ reservas_pendientes }]] = await pool.execute(
    `SELECT COUNT(*) AS reservas_pendientes
       FROM reservas r
      WHERE r.estado = 'pendiente' AND r.fecha >= CURDATE()
        ${local ? 'AND r.restaurante_id = ?' : ''}`,
    arg
  );

  // Platos que no sirve ningun local. Son del catalogo maestro, asi que la
  // cuenta no se filtra por local: a un encargado no le corresponde.
  let fuera_de_carta = null;
  if (esAdmin) {
    const [[fila]] = await pool.execute(
      `SELECT COUNT(*) AS fuera_de_carta
         FROM platos p
        WHERE NOT EXISTS (SELECT 1 FROM carta_items c WHERE c.plato_id = p.id)`
    );
    fuera_de_carta = fila.fuera_de_carta;
  }

  res.json({
    datos: {
      sin_revisar,
      sin_foto,
      sin_traducir,
      agotados,
      reservas_pendientes,
      fuera_de_carta,
    },
  });
}
