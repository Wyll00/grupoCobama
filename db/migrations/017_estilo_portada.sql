-- =====================================================================
--  Tres formas de tratar la cabecera, no dos
--
--  Con las cuatro ilustraciones a la vista aparece un tercer caso. Habia:
--
--    oscuro   velo negro y letra crema. Para fotos y para ilustraciones
--             oscuras (el patron de La Casa del Mago, el atardecer de
--             El Descarado): les queda bien.
--    claro    velo suave y tinta oscura, texto a la izquierda. Para las que
--             dejan el hueco justo ahi (La Basilica).
--
--  Pero la de Como en Casa tiene el hueco en el CENTRO y la izquierda
--  cargada de barril y uvas. Con velo negro se volvia un barro gris; con
--  velo claro, el texto caia sobre el barril. El tercer caso es texto
--  centrado sobre ese hueco.
--
--  Un ENUM y no dos booleanos: con `clara` y `centrada` por separado existe
--  la combinacion "oscuro y centrado", que no significa nada y alguien
--  acabaria guardando.
--
--  Sustituye a portada_clara, que llevaba unas horas y solo usaba un local.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE restaurantes
  ADD COLUMN portada_estilo ENUM('oscuro', 'claro', 'claro-centrado')
    NOT NULL DEFAULT 'oscuro'
    COMMENT 'Como se trata el texto sobre la portada. Lo mide el procesador'
    AFTER portada_clara;

UPDATE restaurantes SET portada_estilo = 'claro' WHERE portada_clara = 1;

ALTER TABLE restaurantes DROP COLUMN portada_clara;
