-- =====================================================================
--  Un menu de celebracion para las otras tres casas
--
--  AVISO, LEER ANTES DE DAR NINGUNO POR BUENO
--
--  Los de La Basilica salieron de una hoja de menus de la casa. Estos tres
--  NO: no hay hoja. Lo que si es real es de donde sale cada linea.
--
--    REAL      los platos y sus precios. Cada uno esta en la carta de esa
--              casa, con el precio que tiene hoy en carta_items. No hay ni
--              un plato inventado, y ninguna casa ofrece nada que no sirva.
--    PROPUESTA que cuatro entrantes van juntos, que principales se eligen,
--              y el precio final. Eso lo he compuesto yo, no la cocina.
--
--  Por eso van SIN minimo de comensales y SIN linea de "incluye": son
--  condiciones comerciales, y no hay quien las haya decidido. La ficha, con
--  esos campos vacios, simplemente no dice nada de eso, que es lo correcto
--  mientras nadie lo fije. Comparese con la 006, donde el minimo de 15 si
--  venia dado.
--
--  El precio, plato por plato, en carta y por persona:
--
--    Familiar (Como en Casa)      entrantes 28,50 / 4 = 7,13
--                                 principal (11,50 + 14,50) / 2 = 13,00
--                                 postre 4,50            suma 24,63  ->  26,00
--    Casona (La Casa del Mago)    entrantes 30,50 / 4 = 7,63
--                                 principal (18,50 + 20,00) / 2 = 19,25
--                                 postre 5,50            suma 32,38  ->  34,00
--    Arrocero (El Descarado)      entrantes 32,50 / 4 = 8,13
--                                 principal (17,00 + 17,50) / 2 = 17,25
--                                 postre 5,50            suma 30,88  ->  32,00
--
--  El redondeo hacia arriba es por las bebidas, que van incluidas y sin
--  limite hasta el postre. No es un margen calculado: es un numero redondo
--  por encima del coste en carta. Si la cocina dice otro, se cambia aqui.
--
--  Para quitarlos de la web sin borrar nada:
--    UPDATE menus_grupo SET activo = 0 WHERE slug LIKE 'celebracion-%';
--
--  Los nombres de plato van acentuados aunque en `platos` esten sin acentos
--  -"Pimientos de Padron", "Arroz al senoret"-. Eso es un defecto de la
--  importacion de la carta, no una decision; copiarlo aqui solo lo
--  extenderia a texto nuevo.
--
--  INSERT ... SELECT FROM restaurantes y no un id a pelo: si el local no
--  existiera no se inserta el menu, y las secciones fallan por la clave
--  ajena. Ruidoso a proposito. Un menu huerfano, sin casa donde servirlo,
--  es justo lo que arreglo la semilla 007.
-- =====================================================================

SET NAMES utf8mb4;

INSERT INTO menus_grupo
  (id, slug, restaurante_id, nombre, precio_por_persona, unidad_precio,
   minimo_comensales, incluye, orden, activo)
SELECT 4, 'celebracion-como-en-casa', r.id, 'Familiar', 26.00, 'persona',
       NULL, NULL, 1, 1
  FROM restaurantes r WHERE r.slug = 'como-en-casa';

INSERT INTO menus_grupo
  (id, slug, restaurante_id, nombre, precio_por_persona, unidad_precio,
   minimo_comensales, incluye, orden, activo)
SELECT 5, 'celebracion-la-casa-del-mago', r.id, 'Casona', 34.00, 'persona',
       NULL, NULL, 1, 1
  FROM restaurantes r WHERE r.slug = 'la-casa-del-mago';

INSERT INTO menus_grupo
  (id, slug, restaurante_id, nombre, precio_por_persona, unidad_precio,
   minimo_comensales, incluye, orden, activo)
SELECT 6, 'celebracion-el-descarado', r.id, 'Arrocero', 32.00, 'persona',
       NULL, NULL, 1, 1
  FROM restaurantes r WHERE r.slug = 'el-descarado';

-- ------------------------------------------------ Familiar (Como en Casa) ---
INSERT INTO menu_grupo_secciones (id, menu_id, titulo, nota, orden) VALUES
  (13, 4, 'Entrantes',       'A compartir cada 4 personas',            1),
  (14, 4, 'Plato principal', 'A elegir uno por persona',               2),
  (15, 4, 'Postre',          'Uno por comensal',                       3),
  (16, 4, 'Bebidas',         'Ilimitadas hasta la llegada del postre', 4);

INSERT INTO menu_grupo_lineas (seccion_id, texto, orden) VALUES
  (13, 'Papas arrugadas con mojos',      1),
  (13, 'Croquetas de la casa',           2),
  (13, 'Queso asado con mojo',           3),
  (13, 'Chicharrones canarios',          4),
  (14, 'Carne fiesta',                   1),
  (14, 'Calamares a la plancha',         2),
  (15, 'Quesillo canario',               1),
  (16, 'Agua · Refresco · Vino tinto',   1);

-- --------------------------------------------- Casona (La Casa del Mago) ---
INSERT INTO menu_grupo_secciones (id, menu_id, titulo, nota, orden) VALUES
  (17, 5, 'Entrantes',       'A compartir cada 4 personas',            1),
  (18, 5, 'Plato principal', 'A elegir uno por persona',               2),
  (19, 5, 'Postre',          'Uno por comensal',                       3),
  (20, 5, 'Bebidas',         'Ilimitadas hasta la llegada del postre', 4);

INSERT INTO menu_grupo_lineas (seccion_id, texto, orden) VALUES
  (17, 'Papas arrugadas con mojos',                                1),
  (17, 'Croquetas de queso de cabra y cebolla caramelizada',       2),
  (17, 'Almogrote gomero con tostas',                              3),
  (17, 'Queso fresco a la plancha con miel de palma',              4),
  (18, 'Cochino negro canario a la brasa',                         1),
  (18, 'Cherne a la espalda',                                      2),
  (19, 'Bienmesabe',                                               1),
  (20, 'Agua · Refresco · Vino tinto',                             1);

-- ---------------------------------------------- Arrocero (El Descarado) ---
INSERT INTO menu_grupo_secciones (id, menu_id, titulo, nota, orden) VALUES
  (21, 6, 'Entrantes',       'A compartir cada 4 personas',            1),
  (22, 6, 'Plato principal', 'A elegir uno por persona',               2),
  (23, 6, 'Postre',          'Uno por comensal',                       3),
  (24, 6, 'Bebidas',         'Ilimitadas hasta la llegada del postre', 4);

INSERT INTO menu_grupo_lineas (seccion_id, texto, orden) VALUES
  (21, 'Papas arrugadas con mojos',      1),
  (21, 'Croquetas de la casa',           2),
  (21, 'Pimientos de padrón',            3),
  (21, 'Langostinos al ajillo',          4),
  (22, 'Arroz al señoret',               1),
  (22, 'Arroz negro con chipirones',     2),
  (23, 'Tarta de queso al horno',        1),
  (24, 'Agua · Refresco · Vino tinto',   1);
