import { pool } from '../config/db.js';

/**
 * Mapa de alergenos de la carta.
 *
 * Para cada uno de los catorce declarables: cuantos platos lo llevan, cuantos
 * estan libres de el y de cuantos no se sabe nada. Sirve para responder a la
 * pregunta que hace un cliente por telefono: "soy celiaco, ¿que puedo comer
 * ahi?".
 *
 * Las TRES cifras son deliberadas y la tercera es la importante. Un plato sin
 * alergenos asignados no es un plato seguro: es un plato del que nadie ha
 * dicho nada. Contarlo como apto seria decirle a un celiaco que puede comerse
 * algo que nadie ha mirado, y eso no es una imprecision estadistica sino una
 * urgencia.
 *
 * Por eso "aptos" solo cuenta platos con informacion, y el porcentaje se
 * calcula sobre los que la tienen, no sobre el total de la carta.
 */
export async function mapaAlergenos(req, res) {
  const esAdmin = req.usuario.rol === 'admin_grupo';
  const local = esAdmin ? null : req.usuario.restaurante_id;
  const filtro = local ? 'AND c.restaurante_id = ?' : '';
  const arg = local ? [local] : [];

  // Platos servidos, y de ellos cuantos tienen informacion de alergenos.
  const [[totales]] = await pool.execute(
    `SELECT COUNT(DISTINCT p.id) AS en_carta,
            COUNT(DISTINCT CASE
              WHEN EXISTS (SELECT 1 FROM plato_alergenos a WHERE a.plato_id = p.id)
                OR p.alergenos_revisados_en IS NOT NULL
              THEN p.id END) AS con_datos
       FROM platos p
       JOIN carta_items c ON c.plato_id = p.id AND c.activo = 1
      WHERE 1 = 1 ${filtro}`,
    arg
  );

  // Subconsulta correlacionada en vez de LEFT JOIN encadenados: con tres joins
  // en cadena, un alergeno que no usa ningun plato desaparecia o duplicaba
  // filas segun donde cayera la condicion del local. Asi cada alergeno da
  // exactamente una fila, y los que no usa nadie salen con cero, que es
  // justamente lo que interesa ver.
  const [filas] = await pool.execute(
    `SELECT al.id, al.slug, al.nombre, al.nombre_en, al.nombre_de, al.icono,
            (SELECT COUNT(DISTINCT p.id)
               FROM plato_alergenos pa
               JOIN platos p ON p.id = pa.plato_id
               JOIN carta_items c ON c.plato_id = p.id AND c.activo = 1
                    ${local ? 'AND c.restaurante_id = ?' : ''}
              WHERE pa.alergeno_id = al.id) AS platos_con
       FROM alergenos al
      ORDER BY platos_con DESC, al.nombre`,
    arg
  );

  const conDatos = Number(totales.con_datos) || 0;

  res.json({
    datos: {
      en_carta: Number(totales.en_carta) || 0,
      con_datos: conDatos,
      sin_datos: (Number(totales.en_carta) || 0) - conDatos,
      alergenos: filas.map((f) => {
        const con = Number(f.platos_con) || 0;
        return {
          ...f,
          platos_con: con,
          // Aptos: los que tienen informacion y no lo llevan. Nunca se suman
          // aqui los platos sin datos.
          platos_aptos: conDatos - con,
          porcentaje_apto: conDatos ? Math.round(((conDatos - con) / conDatos) * 100) : null,
        };
      }),
    },
  });
}
