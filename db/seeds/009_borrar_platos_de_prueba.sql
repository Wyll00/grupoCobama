-- =====================================================================
--  Fuera los dos platos de prueba
--
--  Dos filas que se quedaron de probar el formulario de alta el 16 de agosto:
--
--    "sasdasa"  /  "sasasasasas"
--    "hola"     /  "daaaaaaaaaaaaaaaa"
--
--  No salen en la web -no estan en ninguna carta-, pero si en la lista del
--  panel, que es lo que se abre delante de alguien al ensenar como se
--  gestiona la carta.
--
--  SOLO ESAS DOS. Fuera de carta hay otras cinco -zamburinas, tarta de mango,
--  huevos someros, un arroz y unos pimientos- que son platos de verdad sin
--  local asignado, no basura. Borrarlas seria tirar trabajo hecho: lo que
--  necesitan es que alguien decida si van a alguna carta, y para eso ahora
--  esta el filtro ?falta=carta del panel.
--
--  El borrado va atado a nombre Y descripcion, sin ids: los ids son de esta
--  instalacion y en otra podrian ser platos de verdad. Y con la condicion de
--  no estar en ninguna carta, que es lo que los define como sobrantes; si
--  alguien los hubiera anadido a una, esto no los toca.
--
--  Los alergenos de "hola" -tiene dos, tambien de la prueba- se van solos:
--  plato_alergenos borra en cascada. carta_items NO borra en cascada, asi que
--  si alguno estuviera en una carta la clave ajena pararia el borrado. Las dos
--  protecciones dicen lo mismo por caminos distintos.
-- =====================================================================

SET NAMES utf8mb4;

DELETE FROM platos
 WHERE nombre = 'sasdasa'
   AND descripcion = 'sasasasasas'
   AND id NOT IN (SELECT plato_id FROM carta_items);

DELETE FROM platos
 WHERE nombre = 'hola'
   AND descripcion LIKE 'daaaa%'
   AND id NOT IN (SELECT plato_id FROM carta_items);
