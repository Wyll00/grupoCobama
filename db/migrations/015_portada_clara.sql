-- =====================================================================
--  Portadas claras
--
--  La cabecera del local lleva una capa oscura encima de la foto para que el
--  nombre se lea. Con una FOTO va bien. Con una ILUSTRACION luminosa la
--  apaga entera: la de La Basilica pasaba de mar turquesa y flores a un
--  marron turbio.
--
--  Y ademas sobra: esa ilustracion tiene el lado izquierdo en crema a
--  proposito, que es justo donde va el nombre. Ahi lo que hace falta es
--  tinta oscura, no un velo negro.
--
--  Se guarda si la portada es clara para poder elegir el tratamiento. No lo
--  decide una persona: lo mide el procesador de imagenes mirando la zona
--  donde cae el texto. Un ajuste manual mas es un ajuste que alguien olvida
--  al cambiar la foto, y entonces el nombre desaparece sobre el cielo.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE restaurantes
  ADD COLUMN portada_clara TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'La zona del texto es clara: cabecera con tinta oscura en vez de velo negro'
    AFTER imagen_portada;
