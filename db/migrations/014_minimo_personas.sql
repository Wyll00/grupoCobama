-- =====================================================================
--  Minimo de comensales por plato
--
--  Los arroces van por persona y con un minimo de dos. Con solo el precio y
--  el "por persona", quien lee 21,00 EUR entiende que puede pedirlo solo, y
--  en la mesa le dicen que no. Es el mismo problema que el precio por kilo:
--  no es informacion incompleta, es informacion que induce a error.
--
--  Va en carta_items y no en platos porque el minimo lo pone cada casa: el
--  mismo arroz puede ser de dos en un sitio y de cuatro en otro.
--
--  El dato sale de la nota de seccion de la carta de papel ("Precio por
--  persona · minimo 2 personas"), asi que no se inventa aqui.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE carta_items
  ADD COLUMN minimo_personas TINYINT UNSIGNED NULL
    COMMENT 'Minimo de comensales para pedirlo. NULL = sin minimo'
    AFTER unidad;
