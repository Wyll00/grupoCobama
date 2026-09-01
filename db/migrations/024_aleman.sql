-- Columnas en aleman, en paralelo a las que ya hay en ingles.
--
-- El aleman no hay que traducirlo: la carta de papel de La Basilica ya lo trae
-- escrito para 72 platos y las 8 secciones, en La Basilica/assets/carta.js.
-- Se perdia al importar porque no habia donde meterlo.
--
-- OJO CON EL SUFIJO. En esta base `_en` significa dos cosas distintas:
-- "en ingles" en nombre_en, y "en tal momento" en revocado_en o expira_en. El
-- `_de` de aqui es el codigo ISO del aleman, no la preposicion: descripcion_de
-- es "descripcion en aleman", no "descripcion de algo". Se mantiene el codigo
-- ISO por consistencia con _en, pero conviene tenerlo presente al leerlo.

ALTER TABLE platos
  ADD COLUMN nombre_de VARCHAR(160) NULL AFTER nombre_en,
  ADD COLUMN descripcion_de TEXT NULL AFTER descripcion_en;

ALTER TABLE categorias
  ADD COLUMN nombre_de VARCHAR(80) NULL AFTER nombre_en;

ALTER TABLE alergenos
  ADD COLUMN nombre_de VARCHAR(60) NULL AFTER nombre_en;

ALTER TABLE restaurantes
  ADD COLUMN reclamo_de VARCHAR(255) NULL AFTER reclamo_en,
  ADD COLUMN descripcion_de TEXT NULL AFTER descripcion_en;
