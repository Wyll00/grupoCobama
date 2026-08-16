-- =====================================================================
--  Platos agotados temporalmente
--
--  Hasta ahora solo habia `activo`: o el plato esta en la carta o no esta.
--  Eso mezcla dos situaciones que en sala son muy distintas:
--
--    "se acabo hoy"            vuelve manana, y nadie se acuerda de volver a
--                              activarlo, asi que el plato desaparece semanas
--    "no lo servimos una       decision de carta, indefinida
--     temporada"
--
--  Con una fecha de vuelta, lo de hoy se restaura solo: no hay que acordarse
--  de nada. Y no hace falta ninguna tarea programada, porque la caducidad se
--  evalua al leer.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE carta_items
  ADD COLUMN agotado_hasta DATETIME NULL
    COMMENT 'Si esta en el futuro, el plato sigue en carta pero marcado como agotado'
    AFTER activo;

-- Para poder listar de un vistazo lo que hay agotado en un local.
CREATE INDEX ix_carta_agotados ON carta_items (restaurante_id, agotado_hasta);
