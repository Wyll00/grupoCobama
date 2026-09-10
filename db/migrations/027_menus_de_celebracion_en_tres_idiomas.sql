-- Los menus de celebracion, en los tres idiomas.
--
-- Cuando se tradujo la web se traduje el ARMAZON de esta seccion -el titulo,
-- la entradilla, "por persona"- y se dejo el contenido en castellano, porque
-- estas tablas no tenian donde meterlo. El resultado era raro de leer: un
-- bloque que dice "Set menus for celebrations" y debajo "ENTRANTES · A
-- compartir cada 4 personas · Papas arrugadas con mojos".
--
-- Y es justo el sitio donde peor sienta: un menu cerrado se mira para decidir
-- si se reserva para diez personas, o sea que se lee entero y con calma.
--
-- `menus_grupo` ya tenia nombre_en y descripcion_en, sin usar -la API ni
-- siquiera los servia-. Se completa el aleman y se anaden las dos tablas que
-- no tenian nada.
--
-- `incluye` tambien se traduce: es la linea de "Incluye pan, mantequilla y
-- mojo", que forma parte del precio y por tanto de lo que hay que entender
-- antes de reservar.

ALTER TABLE menus_grupo
  ADD COLUMN nombre_de      VARCHAR(150) NULL AFTER nombre_en,
  ADD COLUMN descripcion_de TEXT         NULL AFTER descripcion_en,
  ADD COLUMN incluye_en     VARCHAR(255) NULL AFTER incluye,
  ADD COLUMN incluye_de     VARCHAR(255) NULL AFTER incluye_en;

ALTER TABLE menu_grupo_secciones
  ADD COLUMN titulo_en VARCHAR(60)  NULL AFTER titulo,
  ADD COLUMN titulo_de VARCHAR(60)  NULL AFTER titulo_en,
  ADD COLUMN nota_en   VARCHAR(160) NULL AFTER nota,
  ADD COLUMN nota_de   VARCHAR(160) NULL AFTER nota_en;

ALTER TABLE menu_grupo_lineas
  ADD COLUMN texto_en VARCHAR(255) NULL AFTER texto,
  ADD COLUMN texto_de VARCHAR(255) NULL AFTER texto_en;
