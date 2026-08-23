-- =====================================================================
--  Seed 4 - Carta de bebidas
--
--  >>> PRECIOS PROVISIONALES <<<
--  Las marcas y las denominaciones de origen si son reales; los precios no.
--  Estan puestos para que la carta se pueda ver y probar, y se cambian desde
--  el panel sin tocar SQL.
--
--  La idea es dejar el andamio montado: los refrescos son el catalogo de
--  Coca-Cola que ya se sirve, las cervezas las canarias de siempre, y los
--  vinos van por denominacion de origen en lugar de por bodega, para que
--  cada casa ponga encima las botellas que trabaja de verdad, con su foto.
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Una sola categoria "Bebidas" no da: entre refrescos, cervezas, vinos y
-- cafes salen mas de sesenta referencias y el cliente no encuentra nada.
-- ---------------------------------------------------------------------
INSERT INTO categorias (id, slug, nombre, nombre_en, orden) VALUES
  (10, 'refrescos',      'Refrescos',        'Soft drinks',      70),
  (11, 'cervezas',       'Cervezas',         'Beers',            72),
  (12, 'vinos',          'Vinos',            'Wines',            74),
  (13, 'cafes-licores',  'Cafes y licores',  'Coffee & spirits', 76);

-- Las bebidas que ya existian se reparten entre las nuevas categorias.
UPDATE platos SET categoria_id = 12 WHERE id IN (42, 43);   -- vinos
UPDATE platos SET categoria_id = 11 WHERE id = 44;          -- cerveza de barril
UPDATE platos SET categoria_id = 10 WHERE id = 45;          -- agua
UPDATE platos SET categoria_id = 13 WHERE id = 47;          -- barraquito

-- El "Refresco" generico lo sustituyen las referencias concretas.
UPDATE platos SET categoria_id = 10, activo = 0 WHERE id = 46;
UPDATE carta_items SET activo = 0 WHERE plato_id = 46;

-- La categoria antigua se oculta, no se borra: los platos siguen colgando de
-- su historico y el borrado logico es la norma de la casa.
UPDATE categorias SET activo = 0 WHERE id = 7;

-- ---------------------------------------------------------------------
-- Refrescos - catalogo de Coca-Cola
-- ---------------------------------------------------------------------
-- es_vegetariano y es_vegano van a 0 en TODAS las bebidas, y 0 aqui
-- significa "no consta", no "lleva animal".
--
-- En los vinos ponerlo a 1 era falso: muchos se clarifican con clara de
-- huevo, caseina o cola de pescado, asi que un vino no es vegano por defecto,
-- lo es si la bodega lo dice. Marcarlos en bloque es decirle a un vegano que
-- puede beberselos.
--
-- En el resto es ruido: nadie se pregunta si una Coca-Cola es vegetariana, y
-- una etiqueta que sale en las 59 lineas entrena a la gente a no mirarlas, y
-- entonces tampoco las mira en los platos, que es donde si importan.
INSERT INTO platos (id, categoria_id, nombre, descripcion, es_vegetariano, es_vegano) VALUES
  (100, 10, 'Coca-Cola',                  'Botellin 20 cl.', 0, 0),
  (101, 10, 'Coca-Cola Zero Azucar',      'Botellin 20 cl.', 0, 0),
  (102, 10, 'Coca-Cola Zero Zero',        'Sin azucar y sin cafeina. Botellin 20 cl.', 0, 0),
  (103, 10, 'Fanta Naranja',              'Botellin 20 cl.', 0, 0),
  (104, 10, 'Fanta Limon',                'Botellin 20 cl.', 0, 0),
  (105, 10, 'Sprite',                     'Botellin 20 cl.', 0, 0),
  (106, 10, 'Nestea Limon',               'Botellin 25 cl.', 0, 0),
  (107, 10, 'Nestea Maracuya',            'Botellin 25 cl.', 0, 0),
  (108, 10, 'Aquarius Limon',             'Botellin 33 cl.', 0, 0),
  (109, 10, 'Aquarius Naranja',           'Botellin 33 cl.', 0, 0),
  (110, 10, 'Appletiser',                 'Zumo de manzana con gas. 27,5 cl.', 0, 0),
  (111, 10, 'Royal Bliss Tonica',         'Botellin 20 cl.', 0, 0),
  (112, 10, 'Royal Bliss Ginger Ale',     'Botellin 20 cl.', 0, 0),
  (113, 10, 'Powerade',                   'Bebida isotonica. 50 cl.', 0, 0),
  (114, 10, 'Agua mineral 50 cl',         'Natural o con gas.', 0, 0),
  (115, 10, 'Zumo de naranja natural',    'Exprimido al momento.', 0, 0),
  (116, 10, 'Bitter sin alcohol',         'Botellin 20 cl.', 0, 0),

-- ---------------------------------------------------------------------
-- Cervezas - las canarias de siempre
-- ---------------------------------------------------------------------
  (120, 11, 'Dorada Especial (botellin)', 'Cerveza de Tenerife. 25 cl.', 0, 0),
  (121, 11, 'Dorada Pilsen (botellin)',   'Cerveza de Tenerife. 25 cl.', 0, 0),
  (122, 11, 'Dorada sin alcohol',         'Botellin 25 cl.', 0, 0),
  (123, 11, 'Tropical (botellin)',        'Cerveza de Gran Canaria. 25 cl.', 0, 0),
  (124, 11, 'Jarra de cerveza 50 cl',     'De barril.', 0, 0),
  (125, 11, 'Clara con limon',            'Cerveza con refresco de limon.', 0, 0),

-- ---------------------------------------------------------------------
-- Vinos - por denominacion de origen
--
-- Van por D.O. y no por bodega a proposito: son las nueve denominaciones
-- reales de Canarias y sirven de plantilla. Cada local sustituye la linea por
-- la botella concreta que trabaja, con su bodega y su foto.
-- ---------------------------------------------------------------------
  (130, 12, 'Tinto joven D.O. Tacoronte-Acentejo',  'Listan negro y negramoll. Botella 75 cl.', 0, 0),
  (131, 12, 'Tinto barrica D.O. Tacoronte-Acentejo','Crianza en roble. Botella 75 cl.', 0, 0),
  (132, 12, 'Blanco seco D.O. Ycoden-Daute-Isora',  'Listan blanco y marmajuelo. Botella 75 cl.', 0, 0),
  (133, 12, 'Tinto D.O. Valle de la Orotava',       'Listan negro de cordon trenzado. Botella 75 cl.', 0, 0),
  (134, 12, 'Blanco D.O. Valle de la Orotava',      'Listan blanco. Botella 75 cl.', 0, 0),
  (135, 12, 'Blanco seco D.O. Valle de Guimar',     'Listan blanco y gual. Botella 75 cl.', 0, 0),
  (136, 12, 'Blanco D.O. Abona',                    'Listan blanco de vinedo de altura. Botella 75 cl.', 0, 0),
  (137, 12, 'Malvasia volcanica seco D.O. Lanzarote','Vinedo en hoyos de picon. Botella 75 cl.', 0, 0),
  (138, 12, 'Malvasia dulce D.O. Lanzarote',        'Para el postre. Botella 50 cl.', 0, 0),
  (139, 12, 'Blanco D.O. La Palma',                 'Albillo criollo. Botella 75 cl.', 0, 0),
  (140, 12, 'Tinto D.O. La Palma',                  'Negramoll. Botella 75 cl.', 0, 0),
  (141, 12, 'Blanco D.O. El Hierro',                'Verdello y vijariego. Botella 75 cl.', 0, 0),
  (142, 12, 'Tinto D.O. Gran Canaria',              'Listan negro y tintilla. Botella 75 cl.', 0, 0),
  (143, 12, 'Rosado D.O.P. Islas Canarias',         'Botella 75 cl.', 0, 0),
  (144, 12, 'Vino blanco de la casa (copa)',        NULL, 0, 0),
  (145, 12, 'Vino tinto de la casa (copa)',         NULL, 0, 0),
  (146, 12, 'Vino rosado de la casa (copa)',        NULL, 0, 0),
  (147, 12, 'Sangria (jarra 1 L)',                  'Minimo dos personas.', 0, 0),
  (148, 12, 'Tinto de verano',                      'Vaso.', 0, 0),

-- ---------------------------------------------------------------------
-- Cafes y licores
-- ---------------------------------------------------------------------
  (150, 13, 'Cafe solo',                  NULL, 0, 0),
  (151, 13, 'Cafe cortado',               NULL, 0, 0),
  (152, 13, 'Cafe con leche',             NULL, 0, 0),
  (153, 13, 'Cafe descafeinado',          'De maquina o de sobre.', 0, 0),
  (154, 13, 'Carajillo',                  'Con ron, coneac o whisky.', 0, 0),
  (155, 13, 'Ron miel canario (copa)',    NULL, 0, 0),
  (156, 13, 'Ron anejo canario (copa)',   NULL, 0, 0),
  (157, 13, 'Licor 43 (copa)',            NULL, 0, 0),
  (158, 13, 'Hierbas canarias (copa)',    NULL, 0, 0),
  (159, 13, 'Orujo (copa)',               'Blanco o de hierbas.', 0, 0),
  (160, 13, 'Infusion',                   'Manzanilla, poleo, tila o te.', 0, 0);

-- ---------------------------------------------------------------------
-- Alergenos
-- Cerveza: gluten. Vino y derivados: sulfitos. Cafes con leche: lacteos.
-- Igual que el resto del seed, lo tiene que confirmar cocina.
-- ---------------------------------------------------------------------
INSERT INTO plato_alergenos (plato_id, alergeno_id) VALUES
  (120, 1), (121, 1), (122, 1), (123, 1), (124, 1), (125, 1),
  (130,12), (131,12), (132,12), (133,12), (134,12), (135,12), (136,12),
  (137,12), (138,12), (139,12), (140,12), (141,12), (142,12), (143,12),
  (144,12), (145,12), (146,12), (147,12), (148,12),
  (151, 7), (152, 7), (153, 7), (155, 7);

-- ---------------------------------------------------------------------
-- Carta de bebidas de los cuatro locales.
--
-- Mismo precio en las cuatro casas: en bebida embotellada el grupo compra
-- junto y no tiene sentido que varie. Se puede cambiar local a local desde el
-- panel en cuanto haga falta.
-- ---------------------------------------------------------------------
INSERT INTO carta_items (restaurante_id, plato_id, precio, activo, orden)
SELECT r.id, b.plato_id, b.precio, 1, b.orden
FROM restaurantes r
CROSS JOIN (
  SELECT 100 AS plato_id,  2.50 AS precio,  10 AS orden UNION ALL
  SELECT 101,  2.50,  20 UNION ALL
  SELECT 102,  2.50,  30 UNION ALL
  SELECT 103,  2.50,  40 UNION ALL
  SELECT 104,  2.50,  50 UNION ALL
  SELECT 105,  2.50,  60 UNION ALL
  SELECT 106,  2.60,  70 UNION ALL
  SELECT 107,  2.60,  80 UNION ALL
  SELECT 108,  2.60,  90 UNION ALL
  SELECT 109,  2.60, 100 UNION ALL
  SELECT 110,  2.90, 110 UNION ALL
  SELECT 111,  2.90, 120 UNION ALL
  SELECT 112,  2.90, 130 UNION ALL
  SELECT 113,  2.90, 140 UNION ALL
  SELECT 114,  1.80, 150 UNION ALL
  SELECT 115,  3.20, 160 UNION ALL
  SELECT 116,  2.60, 170 UNION ALL

  SELECT 120,  2.60,  10 UNION ALL
  SELECT 121,  2.50,  20 UNION ALL
  SELECT 122,  2.50,  30 UNION ALL
  SELECT 123,  2.60,  40 UNION ALL
  SELECT 124,  3.80,  50 UNION ALL
  SELECT 125,  2.80,  60 UNION ALL

  SELECT 130, 14.00,  10 UNION ALL
  SELECT 131, 18.50,  20 UNION ALL
  SELECT 132, 15.00,  30 UNION ALL
  SELECT 133, 15.50,  40 UNION ALL
  SELECT 134, 14.50,  50 UNION ALL
  SELECT 135, 14.00,  60 UNION ALL
  SELECT 136, 14.50,  70 UNION ALL
  SELECT 137, 19.00,  80 UNION ALL
  SELECT 138, 16.00,  90 UNION ALL
  SELECT 139, 16.50, 100 UNION ALL
  SELECT 140, 16.50, 110 UNION ALL
  SELECT 141, 17.00, 120 UNION ALL
  SELECT 142, 15.50, 130 UNION ALL
  SELECT 143, 13.50, 140 UNION ALL
  SELECT 144,  2.80, 150 UNION ALL
  SELECT 145,  2.80, 160 UNION ALL
  SELECT 146,  2.80, 170 UNION ALL
  SELECT 147, 12.00, 180 UNION ALL
  SELECT 148,  3.20, 190 UNION ALL

  SELECT 150,  1.40,  10 UNION ALL
  SELECT 151,  1.50,  20 UNION ALL
  SELECT 152,  1.70,  30 UNION ALL
  SELECT 153,  1.50,  40 UNION ALL
  SELECT 154,  2.60,  50 UNION ALL
  SELECT 155,  3.50,  60 UNION ALL
  SELECT 156,  4.50,  70 UNION ALL
  SELECT 157,  4.00,  80 UNION ALL
  SELECT 158,  3.50,  90 UNION ALL
  SELECT 159,  3.50, 100 UNION ALL
  SELECT 160,  1.60, 110
) b
WHERE r.activo = 1;
