-- =====================================================================
--  Portada en tamano de movil
--
--  La portada se guarda a 1920 de ancho. En un movil de 375 se descargan
--  esos 122 KB para pintarlos a una quinta parte de tamano y, encima, bajo
--  un velo del 85%. Eso son datos moviles de un cliente sentado a la mesa.
--
--  La mayoria de las visitas de esta web son desde el movil, asi que el
--  tamano grande es el caso raro, no el normal.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE restaurantes
  ADD COLUMN imagen_portada_movil VARCHAR(255) NULL
    COMMENT 'La misma portada a 960 de ancho, para pantallas pequenas'
    AFTER imagen_portada;
