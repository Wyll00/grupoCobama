-- El estilo de portada se queda en dos casos, no tres.
--
-- 'claro-centrado' existia porque cada ilustracion dejaba su hueco en un
-- sitio distinto y el texto se movia a buscarlo: a la izquierda en unas, al
-- centro en otras. Con las cuatro cabeceras centradas el texto ya no se
-- mueve, asi que lo unico que hay que saber de una portada es si su franja
-- central es clara u oscura -o sea, de que color tiene que ser el velo-.
--
-- Como en Casa era el unico 'claro-centrado' y pasa a 'claro'. No cambia como
-- se ve: su centro mide 0,83 de luz, que es justo lo que significa 'claro'.
-- Se convierten los datos ANTES de estrechar el ENUM; al reves, MySQL
-- convertiria las filas sobrantes en cadena vacia sin avisar.

UPDATE restaurantes SET portada_estilo = 'claro' WHERE portada_estilo = 'claro-centrado';

ALTER TABLE restaurantes
  MODIFY COLUMN portada_estilo ENUM('oscuro', 'claro') NOT NULL DEFAULT 'oscuro';
