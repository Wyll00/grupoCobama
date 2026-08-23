-- =====================================================================
--  Media racion, precio por unidad y numero de carta
--
--  La carta real de La Basilica trae tres cosas que la tabla no sabia
--  guardar, y las tres cambian lo que paga el cliente:
--
--    media racion   Nueve platos se sirven en media y en racion, a precios
--                   distintos. Meter solo el de racion encarece la carta a
--                   ojos de quien la lee en el movil.
--
--    unidad         El chuleton va A PESO y los arroces POR PERSONA. Un
--                   "49,00 EUR" a secas en un chuleton es informacion falsa:
--                   quien lo lee entiende que ese es el plato, y llega una
--                   cuenta que no esperaba. Esto es lo mas importante de la
--                   migracion.
--
--    numero_carta   El numero del papel. En sala se pide "ponme el 35", y
--                   los numeros no se reutilizan cuando un plato se retira
--                   para que signifiquen lo mismo en la mesa y en el movil.
--
--  Van en carta_items y no en platos porque son decisiones de cada local:
--  el mismo plato puede ir a peso en una casa y por racion en otra.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE carta_items
  ADD COLUMN precio_media DECIMAL(6,2) NULL
    COMMENT 'Precio de la media racion. NULL = no se sirve media'
    AFTER precio,

  ADD COLUMN unidad ENUM('racion','kg','ud','persona') NOT NULL DEFAULT 'racion'
    COMMENT 'A que se refiere el precio'
    AFTER precio_media,

  ADD COLUMN numero_carta SMALLINT UNSIGNED NULL
    COMMENT 'Numero en la carta impresa, para pedir "el 35"'
    AFTER unidad;

-- Las salsas son seccion propia en la carta de papel. Estaban cayendo en
-- "Carnes" por no tener sitio, y ahi no las busca nadie.
INSERT INTO categorias (slug, nombre, nombre_en, orden)
VALUES ('salsas', 'Salsas', 'Sauces', 45);
