-- =====================================================================
--  Los tres menus de celebracion
--
--  Contenido, precios y minimo salen de la hoja de menus que paso la casa.
--  NO se ha inventado nada aqui: es exactamente el mismo error que arreglo
--  la migracion 018, cuando cinco menus salidos de una semilla provisional
--  llevaban meses publicados con precio y minimo como si fueran ofertas de
--  verdad. Si algun dato de estos no esta aprobado en cocina, se corrige en
--  la base antes de publicarlo, no despues de que alguien llame citandolo.
--
--  Va como semilla y no como migracion porque son datos, no esquema, y
--  porque `db:setup` aplica primero las migraciones: la 026, que crea las
--  tablas, tiene que haber pasado antes de que esto entre.
--
--  Los ids van escritos a mano. Se puede porque `menus_grupo` esta vacia
--  -018- y porque las otras dos tablas nacen en la 026, asi que no hay nada
--  con lo que chocar. Las lineas no llevan id: no las referencia nadie.
--
--  restaurante_id NULL en los tres: son del grupo, iguales en las cuatro
--  casas.
-- =====================================================================

SET NAMES utf8mb4;

INSERT INTO menus_grupo
  (id, slug, restaurante_id, nombre, precio_por_persona, unidad_precio,
   minimo_comensales, incluye, orden, activo)
VALUES
  (1, 'clasico',     NULL, 'Clásico',     25.00, 'persona', 15,
   'Incluye pan, mantequilla y mojo', 1, 1),
  (2, 'tradicional', NULL, 'Tradicional', 35.00, 'persona', 15,
   'Incluye pan, mantequilla y mojo', 2, 1),
  -- Sin minimo propio: el infantil se pide junto al de los mayores, asi que
  -- el minimo que cuenta es el de ellos. Ver la 026.
  (3, 'infantil',    NULL, 'Infantil',    13.00, 'nino',    NULL,
   'Incluye un pan y mantequillas por niño', 3, 1);

-- ------------------------------------------------------------- clasico ---
INSERT INTO menu_grupo_secciones (id, menu_id, titulo, nota, orden) VALUES
  (1, 1, 'Entrantes',      'A compartir cada 4 personas',           1),
  (2, 1, 'Plato principal','A elegir uno por persona',              2),
  (3, 1, 'Postre',         'Uno por comensal',                      3),
  (4, 1, 'Bebidas',        'Ilimitadas hasta la llegada del postre',4);

INSERT INTO menu_grupo_lineas (seccion_id, texto, orden) VALUES
  (1, 'Croquetas de pollo',                                     1),
  (1, 'Queso asado con gofio y miel de palma',                  2),
  (1, 'Timbal de bacalao con mojos',                            3),
  (1, 'Salpicón de atún',                                       4),
  (2, 'Aguja de cerdo a baja temperatura y brasa, con papa rústica', 1),
  (2, 'Atún en mojo hervido',                                   2),
  (3, 'Polvito uruguayo',                                       1),
  (4, 'Agua · Refresco · Vino tinto',                           1);

-- --------------------------------------------------------- tradicional ---
INSERT INTO menu_grupo_secciones (id, menu_id, titulo, nota, orden) VALUES
  (5, 2, 'Entrantes',      'A compartir cada 4 personas',           1),
  (6, 2, 'Plato principal','A elegir uno por persona',              2),
  (7, 2, 'Postre',         'A compartir cada 4 personas',           3),
  (8, 2, 'Bebidas',        'Ilimitadas hasta la llegada del postre',4);

INSERT INTO menu_grupo_lineas (seccion_id, texto, orden) VALUES
  (5, 'Queso ahumado con frutos secos y guayaba',               1),
  (5, 'Ensalada de tomate, batata amarilla y ventresca de atún', 2),
  (5, 'Mixto de aperitivos: croquetas, ensaladilla y calamares (con salsas)', 3),
  (5, 'Chistorras con pimientos de padrón',                     4),
  (6, 'Entrecot a la brasa con papa rústica',                   1),
  (6, 'Salmón con pesto de mojo verde y berros fritos',         2),
  (7, 'Surtido de postres de la casa',                          1),
  (8, 'Agua · Refresco · Vino tinto · Vino blanco',             1);

-- ------------------------------------------------------------ infantil ---
-- Sin notas: cada nino lleva lo suyo, no hay nada que elegir ni repartir.
INSERT INTO menu_grupo_secciones (id, menu_id, titulo, nota, orden) VALUES
  ( 9, 3, 'Entrantes',      NULL,                                   1),
  (10, 3, 'Plato principal',NULL,                                   2),
  (11, 3, 'Postre',         NULL,                                   3),
  (12, 3, 'Bebidas',        'Ilimitadas hasta la llegada del postre',4);

INSERT INTO menu_grupo_lineas (seccion_id, texto, orden) VALUES
  ( 9, 'Sopa de pollo',                                          1),
  (10, 'Croquetas de pollo y salchichas a la brasa con papas fritas', 1),
  (11, 'Helado',                                                 1),
  (12, 'Agua · Zumo',                                            1);
