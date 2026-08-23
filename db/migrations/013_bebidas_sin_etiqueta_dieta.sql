-- =====================================================================
--  Fuera las etiquetas de dieta de las bebidas
--
--  El seed marcaba las 59 bebidas como vegetarianas y casi todas como
--  veganas, en bloque y sin comprobar nada. Dos problemas distintos:
--
--  1. En los VINOS es directamente falso. Muchos se clarifican con clara de
--     huevo, caseina o cola de pescado, asi que un vino no es vegano por
--     defecto: lo es si la bodega lo dice. Marcarlos los 21 en bloque es
--     decirle a un vegano que puede beberselos, que es el mismo error que
--     la propia carta de La Basilica describe para los alergenos: afirmar
--     sin comprobar.
--
--  2. En el resto es ruido. Nadie se pregunta si una Coca-Cola es
--     vegetariana, y una etiqueta que sale en las 59 lineas no informa de
--     nada: solo entrena a la gente a no mirarlas, y entonces tampoco las
--     mira en los platos, que es donde si importan.
--
--  Se dejan a 0, que aqui significa "no consta". Si algun dia una bodega lo
--  certifica, se marca esa referencia y entonces la etiqueta si dira algo.
-- =====================================================================

SET NAMES utf8mb4;

UPDATE platos p
   JOIN categorias c ON c.id = p.categoria_id
    SET p.es_vegetariano = 0,
        p.es_vegano = 0
  WHERE c.slug IN ('bebidas', 'refrescos', 'cervezas', 'vinos', 'cafes-licores');
