-- =====================================================================
--  Seed 1 - Datos base del grupo
--  Restaurantes, horarios, categorias y los 14 alergenos obligatorios.
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- restaurantes
-- TODO: lat/lng son aproximadas (nivel calle/municipio). Verificar cada
--       una en Google Maps antes de publicar el mapa en produccion.
-- ---------------------------------------------------------------------
INSERT INTO restaurantes
  (id, slug, nombre, municipio, direccion, telefono, email, whatsapp,
   lat, lng, reclamo, descripcion, tiene_parking, orden, activo)
VALUES
  (1, 'como-en-casa', 'Como en Casa', 'La Laguna',
   'Guamasa, junto al aeropuerto Tenerife Norte', '922876509',
   'info@grupocobama.es', '+34822680304',
   28.4870000, -16.3510000,
   'El grande de la familia: parking, granja y zona infantil.',
   'El local mas grande del grupo, en Guamasa junto al aeropuerto Tenerife Norte. Parking amplio, granja con animales y zona infantil. Cocina canaria de siempre en raciones generosas, pensado para venir en familia y quedarse toda la tarde.',
   1, 1, 1),

  (2, 'la-basilica', 'La Basilica', 'Candelaria',
   'C. la Magdalena, 38509 Candelaria', '822771469',
   'info@grupocobama.es', '+34822680304',
   28.3536000, -16.3708000,
   'Carnes a la brasa y arroces en el antiguo El Cruce.',
   'En el que fue el Restaurante El Cruce de Candelaria. Espacio amplio con terraza cerrada y parking propio. La brasa manda: cochino negro, entrecot y chuleton madurado, acompanados de una buena carta de arroces.',
   1, 2, 1),

  (3, 'la-casa-del-mago', 'La Casa del Mago', 'La Laguna',
   'C. Marques de Celada 15, 38202 La Laguna', '822059692',
   'info@grupocobama.es', '+34822680304',
   28.4874000, -16.3159000,
   'Casona canaria en el casco, cocina de detalle.',
   'Casona canaria reformada en pleno casco de La Laguna, a un paso de la plaza de la Concepcion. Sin parking, pero con el centro historico a la puerta. Propuesta mas elaborada y raciones mas cuidadas: el local del grupo para cenas y grupos reducidos.',
   0, 3, 1),

  (4, 'el-descarado', 'El Descarado', 'La Orotava',
   'Carr. Enlace el Ramal, 38314 La Orotava', '922081550',
   'info@grupocobama.es', '+34822680304',
   28.3877000, -16.5238000,
   'Arroces del norte. El senoret es la casa.',
   'El ultimo en abrir, en 2025, en la zona de El Ramal de La Orotava. Salon interior y terrazas amplias con parking privado. Especialidad en arroces (el arroz al senoret es su plato bandera) y carnes a la brasa.',
   1, 4, 1);

-- ---------------------------------------------------------------------
-- horarios
-- Hoy los cuatro locales coinciden, pero se modela por dia y por local:
-- en cuanto uno cierre los lunes o cambie el horario de verano, el sistema
-- lo absorbe sin tocar codigo.
--   dia_semana: 0=domingo, 1=lunes ... 6=sabado
--   viernes (5) y sabado (6) cierran a las 00:00 -> se guarda '24:00:00'
-- ---------------------------------------------------------------------
INSERT INTO horarios (restaurante_id, dia_semana, hora_apertura, hora_cierre, cerrado)
SELECT r.id,
       d.dia,
       '12:30:00',
       CASE WHEN d.dia IN (5, 6) THEN '24:00:00' ELSE '23:00:00' END,
       0
FROM restaurantes r
CROSS JOIN (
  SELECT 0 AS dia UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
  UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) d;

-- ---------------------------------------------------------------------
-- categorias
-- ---------------------------------------------------------------------
INSERT INTO categorias (id, slug, nombre, nombre_en, orden) VALUES
  (1, 'entrantes', 'Entrantes',  'Starters',   10),
  (2, 'ensaladas', 'Ensaladas',  'Salads',     20),
  (3, 'arroces',   'Arroces',    'Rice dishes',30),
  (4, 'carnes',    'Carnes',     'Meat',       40),
  (5, 'pescados',  'Pescados',   'Fish',       50),
  (6, 'postres',   'Postres',    'Desserts',   60),
  (7, 'bebidas',   'Bebidas',    'Drinks',     70);

-- ---------------------------------------------------------------------
-- alergenos - los 14 de declaracion obligatoria
-- Reglamento (UE) 1169/2011, Anexo II
--
-- icono = fichero dentro de web/public/alergenos/, NULL si todavia no hay
-- dibujo. NULL a proposito y no un nombre inventado: la web solo pinta la
-- imagen si el fichero existe, y si aqui hubiera un nombre que no existe
-- saldria una imagen rota donde va un alergeno. Faltan gluten y mostaza.
-- Para regenerarlos: npm run alergenos --prefix api
-- ---------------------------------------------------------------------
INSERT INTO alergenos (id, slug, nombre, nombre_en, icono) VALUES
  ( 1, 'gluten',          'Gluten',                        'Gluten',        NULL),
  ( 2, 'crustaceos',      'Crustaceos',                    'Crustaceans',   'crustaceos.webp'),
  ( 3, 'huevos',          'Huevos',                        'Eggs',          'huevos.webp'),
  ( 4, 'pescado',         'Pescado',                       'Fish',          'pescado.webp'),
  ( 5, 'cacahuetes',      'Cacahuetes',                    'Peanuts',       'cacahuetes.webp'),
  ( 6, 'soja',            'Soja',                          'Soybeans',      'soja.webp'),
  ( 7, 'lacteos',         'Lacteos',                       'Milk',          'lacteos.webp'),
  ( 8, 'frutos-cascara',  'Frutos de cascara',             'Tree nuts',     'frutos-cascara.webp'),
  ( 9, 'apio',            'Apio',                          'Celery',        'apio.webp'),
  (10, 'mostaza',         'Mostaza',                       'Mustard',       NULL),
  (11, 'sesamo',          'Granos de sesamo',              'Sesame',        'sesamo.webp'),
  (12, 'sulfitos',        'Dioxido de azufre y sulfitos',  'Sulphites',     'sulfitos.webp'),
  (13, 'altramuces',      'Altramuces',                    'Lupin',         'altramuces.webp'),
  (14, 'moluscos',        'Moluscos',                      'Molluscs',      'moluscos.webp');
