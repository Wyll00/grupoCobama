-- =====================================================================
--  Los menus de celebracion son de La Basilica
--
--  La semilla 006 los dio de alta con restaurante_id NULL, o sea "del grupo
--  entero, iguales en las cuatro casas". Es la suposicion que hice al montar
--  la portada y no era cierta: la hoja de menus que entro es la del
--  guachinche La Basilica. Las otras tres casas tendran los suyos, y hasta
--  que lleguen no hay nada que ensenar en ellas.
--
--  Importa mas de lo que parece. Publicados como del grupo, alguien reserva
--  veinte personas en Como en Casa contando con el menu de 25 EUR y en la
--  puerta le dicen que ahi no existe. Es el mismo problema de fondo que la
--  migracion 018: un menu publicado donde no se sirve.
--
--  Va como semilla nueva y no editando la 006: las semillas se aplican una
--  sola vez y quedan registradas por nombre, asi que cambiar la 006 no
--  tocaria las instalaciones donde ya paso -el servidor entre ellas- y solo
--  serviria para que el fichero dejara de contar lo que de verdad ocurrio.
--
--  Lo que decidio la 026 sigue en pie: siguen sin ingles ni aleman. Cambian
--  de la portada a la ficha del local, y la ficha tampoco esta traducida -el
--  selector de idioma vive en la carta-.
--
--  El UPDATE va con JOIN y no con subconsulta a proposito. Con
--  `SET restaurante_id = (SELECT id FROM restaurantes WHERE slug=...)`, si el
--  local no existiera la subconsulta devolveria NULL y los menus se
--  quedarian publicados como del grupo, que es exactamente lo que estamos
--  arreglando. Con JOIN, si no hay local no se toca ninguna fila.
-- =====================================================================

SET NAMES utf8mb4;

UPDATE menus_grupo m
  JOIN restaurantes r ON r.slug = 'la-basilica'
   SET m.restaurante_id = r.id
 WHERE m.slug IN ('clasico', 'tradicional', 'infantil');
