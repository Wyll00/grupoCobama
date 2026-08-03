-- =====================================================================
--  Seed 2 - Catalogo de platos y cartas por local
--
--  >>> ATENCION: DATOS PROVISIONALES <<<
--  Los nombres de plato son cocina canaria de guachinche verosimil, pero
--  NI LOS PLATOS NI LOS PRECIOS NI LOS ALERGENOS estan tomados de las
--  cartas reales del grupo. Son datos de relleno para poder desarrollar
--  y ensenar el prototipo con la carta llena.
--
--  Este fichero se REEMPLAZA integramente en cuanto se extraiga el
--  contenido de los cuatro PDF de Google Drive (ver plan, seccion 2).
--  Hasta entonces, no ensenar precios a cliente final.
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- platos - catalogo maestro del grupo
-- Un plato existe una sola vez. Que local lo sirve y a que precio se
-- decide en carta_items.
-- ---------------------------------------------------------------------
INSERT INTO platos (id, categoria_id, nombre, descripcion, es_vegetariano, es_vegano) VALUES
  -- Entrantes
  ( 1, 1, 'Papas arrugadas con mojos',           'Papa bonita con mojo rojo y mojo verde de la casa.', 1, 1),
  ( 2, 1, 'Queso asado con mojo',                'Queso de cabra majorero a la plancha con mojo verde.', 1, 0),
  ( 3, 1, 'Croquetas de la casa',                'Ocho unidades. Bechamel cremosa hecha cada manana.', 0, 0),
  ( 4, 1, 'Croquetas de queso de cabra y cebolla caramelizada', 'Ocho unidades.', 1, 0),
  ( 5, 1, 'Pimientos de Padron',                 'Fritos con sal gruesa.', 1, 1),
  ( 6, 1, 'Garbanzas compuestas',                'Guiso tradicional con costilla y chorizo de perro.', 0, 0),
  ( 7, 1, 'Ropa vieja de garbanzas',             'Con pollo y carne de res desmenuzada.', 0, 0),
  ( 8, 1, 'Chicharrones canarios',               'Con papas y mojo picon.', 0, 0),
  ( 9, 1, 'Almogrote gomero con tostas',         'Untado de queso curado y pimienta palmera.', 1, 0),
  (10, 1, 'Tortilla de papas',                   'Jugosa, con cebolla.', 1, 0),
  (11, 1, 'Huevos rotos con jamon',              'Con papas de la tierra y jamon iberico.', 0, 0),
  (12, 1, 'Pulpo a la brasa',                    'Sobre parmentier de papa y pimenton de la Vera.', 0, 0),
  (13, 1, 'Langostinos al ajillo',               'A la cazuela, con guindilla.', 0, 0),
  (14, 1, 'Chopitos fritos',                     'Con alioli de la casa.', 0, 0),
  (15, 1, 'Morcilla dulce de Tenerife',          'A la plancha, sobre pan tostado.', 0, 0),
  (16, 1, 'Queso fresco a la plancha con miel de palma', 'Miel de palma gomera.', 1, 0),

  -- Ensaladas
  (17, 2, 'Ensalada de la casa',                 'Lechuga, tomate, cebolla, maiz, zanahoria y aceituna.', 1, 1),
  (18, 2, 'Ensalada de queso de cabra',          'Con frutos secos, brotes y vinagreta de miel.', 1, 0),
  (19, 2, 'Ensalada de aguacate y langostinos',  'Con salsa rosa de la casa.', 0, 0),

  -- Arroces (precio por persona, minimo dos comensales)
  (20, 3, 'Arroz al senoret',                    'Precio por persona, minimo 2. Arroz seco de marisco pelado.', 0, 0),
  (21, 3, 'Arroz caldoso de bogavante',          'Precio por persona, minimo 2.', 0, 0),
  (22, 3, 'Arroz negro con chipirones',          'Precio por persona, minimo 2. Con alioli aparte.', 0, 0),
  (23, 3, 'Paella de carne',                     'Precio por persona, minimo 2. Pollo y conejo.', 0, 0),
  (24, 3, 'Arroz de verduras',                   'Precio por persona, minimo 2. Verduras de temporada.', 1, 1),

  -- Carnes
  (25, 4, 'Carne fiesta',                        'Adobo tradicional canario, con papas de la tierra.', 0, 0),
  (26, 4, 'Costillas con papas y pina',          'Guiso de siempre.', 0, 0),
  (27, 4, 'Cochino negro canario a la brasa',    'Raza autoctona, a la brasa de lena.', 0, 0),
  (28, 4, 'Entrecot de vacuno a la brasa',       'Con papas y pimientos.', 0, 0),
  (29, 4, 'Solomillo de cerdo con salsa de queso','Salsa de queso de cabra curado.', 0, 0),
  (30, 4, 'Chuleton de vaca madurado',           'Precio por kilo. Se sirve al peso, consultar disponibilidad.', 0, 0),
  (31, 4, 'Cabrito al horno',                    'Con papas panadera. Encargar con antelacion.', 0, 0),
  (32, 4, 'Pollo al ajillo',                     'De corral, con papas.', 0, 0),

  -- Pescados
  (33, 5, 'Cherne a la espalda',                 'Con refrito de ajos.', 0, 0),
  (34, 5, 'Vieja sancochada',                    'Con papas, batata y mojo verde.', 0, 0),
  (35, 5, 'Calamares a la plancha',              'Con aceite de ajo y perejil.', 0, 0),
  (36, 5, 'Pescado del dia a la sal',            'Segun lonja. Precio por kilo.', 0, 0),

  -- Postres
  (37, 6, 'Quesillo canario',                    'Con caramelo.', 1, 0),
  (38, 6, 'Frangollo con leche',                 'Postre tradicional de millo.', 1, 0),
  (39, 6, 'Bienmesabe',                          'De almendra, con helado de vainilla.', 1, 0),
  (40, 6, 'Tarta de queso al horno',             'Cremosa, con mermelada de frutos rojos.', 1, 0),
  (41, 6, 'Principe Alberto',                    'Chocolate, almendra y galleta.', 1, 0),

  -- Bebidas
  (42, 7, 'Vino de la tierra (copa)',            'Tinto o blanco de la casa.', 1, 1),
  (43, 7, 'Vino Tacoronte-Acentejo (botella)',   'D.O. Tacoronte-Acentejo.', 1, 1),
  (44, 7, 'Cerveza de barril (cana)',            'Dorada.', 1, 1),
  (45, 7, 'Agua mineral 1 L',                    'Natural o con gas.', 1, 1),
  (46, 7, 'Refresco',                            'Consultar variedades.', 1, 1),
  (47, 7, 'Barraquito',                          'Con leche condensada, licor 43, canela y limon.', 1, 0);

-- ---------------------------------------------------------------------
-- plato_alergenos
-- PROVISIONAL. Debe validarlo cocina antes de publicar: la informacion de
-- alergenos es obligacion legal, no puede salir de una estimacion.
-- ---------------------------------------------------------------------
INSERT INTO plato_alergenos (plato_id, alergeno_id) VALUES
  ( 2, 7),
  ( 3, 1), ( 3, 3), ( 3, 7),
  ( 4, 1), ( 4, 3), ( 4, 7),
  ( 6, 9), ( 6,12),
  ( 7, 9),
  ( 9, 7),
  (10, 3),
  (11, 3),
  (12,14),
  (13, 2),
  (14, 1), (14, 3), (14,14),
  (15, 1), (15, 8),
  (16, 7),
  (18, 7), (18, 8),
  (19, 2), (19, 3),
  (20, 2), (20, 4), (20,14),
  (21, 2), (21, 4), (21,14),
  (22, 2), (22, 4), (22,14),
  (23, 9),
  (24, 9),
  (25,12),
  (29, 7),
  (31,12),
  (32,12),
  (33, 4),
  (34, 4),
  (35,14),
  (36, 4),
  (37, 3), (37, 7),
  (38, 1), (38, 7),
  (39, 3), (39, 8),
  (40, 1), (40, 3), (40, 7),
  (41, 3), (41, 7), (41, 8),
  (42,12),
  (43,12),
  (44, 1),
  (47, 7);

-- ---------------------------------------------------------------------
-- carta_items - Como en Casa (1)
-- Carta amplia, publico familiar, precios contenidos.
-- ---------------------------------------------------------------------
INSERT INTO carta_items (restaurante_id, plato_id, precio, orden, destacado) VALUES
  (1,  1,  4.50,  10, 0), (1,  2,  8.50,  20, 0), (1,  3,  8.00,  30, 1),
  (1,  5,  6.50,  40, 0), (1,  6,  8.00,  50, 0), (1,  7,  9.50,  60, 0),
  (1,  8,  7.50,  70, 0), (1, 10,  7.00,  80, 0), (1, 11, 11.00,  90, 0),
  (1, 12, 16.50, 100, 0), (1, 14, 10.50, 110, 0), (1, 15,  6.50, 120, 0),
  (1, 17,  8.50, 200, 0), (1, 18, 11.00, 210, 0),
  (1, 20, 16.50, 300, 0), (1, 23, 15.00, 310, 0), (1, 24, 13.50, 320, 0),
  (1, 25, 11.50, 400, 1), (1, 26, 13.50, 410, 0), (1, 27, 16.50, 420, 0),
  (1, 28, 19.50, 430, 0), (1, 29, 15.50, 440, 0), (1, 31, 18.50, 450, 0),
  (1, 32, 11.50, 460, 0),
  (1, 33, 18.00, 500, 0), (1, 34, 17.50, 510, 0), (1, 35, 14.50, 520, 0),
  (1, 37,  4.50, 600, 0), (1, 38,  4.50, 610, 0), (1, 39,  4.50, 620, 0),
  (1, 40,  5.50, 630, 0), (1, 41,  5.50, 640, 0),
  (1, 42,  2.80, 700, 0), (1, 43, 14.00, 710, 0), (1, 44,  2.20, 720, 0),
  (1, 45,  2.50, 730, 0), (1, 46,  2.50, 740, 0), (1, 47,  2.80, 750, 0);

-- ---------------------------------------------------------------------
-- carta_items - La Basilica (2)
-- Brasa y arroces.
-- ---------------------------------------------------------------------
INSERT INTO carta_items (restaurante_id, plato_id, precio, orden, destacado) VALUES
  (2,  1,  4.50,  10, 0), (2,  2,  8.50,  20, 0), (2,  3,  8.00,  30, 0),
  (2,  5,  6.50,  40, 0), (2,  8,  7.50,  50, 0), (2, 12, 17.00,  60, 1),
  (2, 13, 13.50,  70, 0),
  (2, 17,  8.50, 200, 0), (2, 19, 12.50, 210, 0),
  (2, 20, 17.00, 300, 0), (2, 21, 24.00, 310, 1), (2, 22, 17.50, 320, 0),
  (2, 23, 15.50, 330, 0),
  (2, 25, 12.00, 400, 0), (2, 26, 14.00, 410, 0), (2, 27, 17.00, 420, 0),
  (2, 28, 20.50, 430, 1), (2, 30, 49.00, 440, 1), (2, 31, 19.00, 450, 0),
  (2, 33, 18.50, 500, 0), (2, 36, 21.00, 510, 0),
  (2, 37,  4.50, 600, 0), (2, 40,  5.50, 610, 0), (2, 41,  5.50, 620, 0),
  (2, 42,  3.00, 700, 0), (2, 43, 15.00, 710, 0), (2, 44,  2.30, 720, 0),
  (2, 45,  2.50, 730, 0), (2, 46,  2.50, 740, 0), (2, 47,  2.80, 750, 0);

-- ---------------------------------------------------------------------
-- carta_items - La Casa del Mago (3)
-- Carta mas corta y elaborada, raciones mas pequenas, precio algo superior.
-- ---------------------------------------------------------------------
INSERT INTO carta_items (restaurante_id, plato_id, precio, orden, destacado) VALUES
  (3,  1,  5.00,  10, 0), (3,  2,  9.50,  20, 0), (3,  4,  9.50,  30, 1),
  (3,  9,  7.50,  40, 0), (3, 12, 18.50,  50, 1), (3, 13, 14.50,  60, 0),
  (3, 15,  7.50,  70, 0), (3, 16,  8.50,  80, 0),
  (3, 18, 12.50, 200, 0), (3, 19, 13.50, 210, 0),
  (3, 22, 19.00, 300, 0),
  (3, 27, 18.50, 400, 0), (3, 28, 22.00, 410, 0), (3, 29, 17.50, 420, 0),
  (3, 33, 20.00, 500, 0), (3, 35, 15.50, 510, 0),
  (3, 39,  5.50, 600, 0), (3, 40,  6.00, 610, 0), (3, 41,  6.00, 620, 0),
  (3, 42,  3.50, 700, 0), (3, 43, 17.00, 710, 0), (3, 44,  2.50, 720, 0),
  (3, 45,  2.50, 730, 0), (3, 46,  2.80, 740, 0), (3, 47,  3.00, 750, 0);

-- ---------------------------------------------------------------------
-- carta_items - El Descarado (4)
-- Arroces (el senoret es el plato bandera) y carnes.
-- ---------------------------------------------------------------------
INSERT INTO carta_items (restaurante_id, plato_id, precio, orden, destacado) VALUES
  (4,  1,  4.50,  10, 0), (4,  2,  8.50,  20, 0), (4,  3,  8.00,  30, 0),
  (4,  5,  6.50,  40, 0), (4,  8,  7.50,  50, 0), (4, 13, 13.50,  60, 0),
  (4, 14, 11.00,  70, 0),
  (4, 17,  8.50, 200, 0), (4, 19, 12.50, 210, 0),
  (4, 20, 17.00, 300, 1), (4, 21, 24.50, 310, 1), (4, 22, 17.50, 320, 0),
  (4, 23, 15.50, 330, 0), (4, 24, 14.00, 340, 0),
  (4, 25, 12.00, 400, 0), (4, 26, 14.00, 410, 0), (4, 27, 17.00, 420, 0),
  (4, 28, 20.50, 430, 0), (4, 30, 49.00, 440, 0), (4, 32, 12.00, 450, 0),
  (4, 33, 18.50, 500, 0), (4, 36, 21.00, 510, 0),
  (4, 37,  4.50, 600, 0), (4, 38,  4.50, 610, 0), (4, 40,  5.50, 620, 0),
  (4, 42,  3.00, 700, 0), (4, 43, 15.00, 710, 0), (4, 44,  2.30, 720, 0),
  (4, 45,  2.50, 730, 0), (4, 46,  2.50, 740, 0), (4, 47,  2.80, 750, 0);

-- ---------------------------------------------------------------------
-- menus_grupo - tambien provisional
-- ---------------------------------------------------------------------
INSERT INTO menus_grupo (restaurante_id, nombre, descripcion, precio_por_persona, minimo_comensales) VALUES
  (1, 'Menu Guachinche',   'Entrantes al centro, carne fiesta o costillas, postre casero, bebida incluida.', 24.00, 10),
  (1, 'Menu Celebracion',  'Entrantes al centro, arroz o brasa a elegir, postre, bebida y cafe.',            32.00, 12),
  (2, 'Menu Brasa',        'Entrantes al centro, parrillada de carnes, postre, bebida y cafe.',              34.00, 10),
  (3, 'Menu Casona',       'Menu degustacion de siete pases. Solo cena y con reserva previa.',               42.00,  8),
  (4, 'Menu Arrocero',     'Entrantes al centro, arroz a elegir, postre, bebida y cafe.',                    30.00, 10);
