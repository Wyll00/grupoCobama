-- =====================================================================
--  Los iconos de alergenos pasan a llevar huella en el nombre
--
--  Antes se llamaban `mostaza.webp` a secas. Con el nombre fijo, cambiar un
--  icono no lo veia nadie que ya hubiera entrado a la web: el navegador tenia
--  guardado el fichero viejo bajo esa misma direccion y lo seguia usando sin
--  preguntar. Paso de verdad al cambiar el de la mostaza, y desde el servidor
--  no hay forma de arreglarlo, porque el navegador ni llega a pedirlo.
--
--  Ahora el nombre lleva ocho caracteres sacados del contenido:
--  `mostaza-7355c6b7.webp`. Otra imagen es otra direccion, asi que no hay
--  nada guardado que estorbe y el cambio se ve al instante y para todo el
--  mundo. Es lo mismo que hace Vite con el JavaScript.
--
--  ESTE FICHERO SE GENERA, no se escribe a mano: sale de los ficheros que hay
--  en web/public/alergenos/. Al cambiar un icono, `npm run alergenos --prefix
--  api` deja el nuevo webp y actualiza la base en local; para produccion hace
--  falta un seed como este con los nombres nuevos, porque los originales no
--  estan en el servidor.
-- =====================================================================

SET NAMES utf8mb4;

UPDATE alergenos SET icono = 'altramuces-59772475.webp' WHERE slug = 'altramuces';
UPDATE alergenos SET icono = 'apio-35d82b20.webp' WHERE slug = 'apio';
UPDATE alergenos SET icono = 'cacahuetes-e10e455f.webp' WHERE slug = 'cacahuetes';
UPDATE alergenos SET icono = 'crustaceos-d31d9dea.webp' WHERE slug = 'crustaceos';
UPDATE alergenos SET icono = 'frutos-cascara-b2ce2a2d.webp' WHERE slug = 'frutos-cascara';
UPDATE alergenos SET icono = 'gluten-3c4c5c09.webp' WHERE slug = 'gluten';
UPDATE alergenos SET icono = 'huevos-6d16c2eb.webp' WHERE slug = 'huevos';
UPDATE alergenos SET icono = 'lacteos-8f932b2a.webp' WHERE slug = 'lacteos';
UPDATE alergenos SET icono = 'moluscos-3617f893.webp' WHERE slug = 'moluscos';
UPDATE alergenos SET icono = 'mostaza-7355c6b7.webp' WHERE slug = 'mostaza';
UPDATE alergenos SET icono = 'pescado-cca80aca.webp' WHERE slug = 'pescado';
UPDATE alergenos SET icono = 'sesamo-6f02df58.webp' WHERE slug = 'sesamo';
UPDATE alergenos SET icono = 'soja-e82d1faa.webp' WHERE slug = 'soja';
UPDATE alergenos SET icono = 'sulfitos-154806b9.webp' WHERE slug = 'sulfitos';
