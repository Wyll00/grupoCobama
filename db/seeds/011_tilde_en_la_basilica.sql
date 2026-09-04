-- =====================================================================
--  La Basilica lleva tilde
--
--  El nombre del local estaba guardado sin ella. No es solo una falta: en la
--  misma pagina convivian las dos grafias, porque tres platos de esa casa SI
--  la llevan y se ven al lado del nombre del sitio:
--
--    Arroz caldoso «La Basilica»          <- el plato, con tilde
--    Polvito uruguayo «La Basilica»
--    Tarta de queso manchego «La Basilica»
--
--  (Los de arriba salen aqui sin tilde por el comentario; en la base la
--  llevan.) Google tambien la lista con tilde.
--
--  Se cambia tambien en los dos usuarios del panel -"Encargado La Basilica",
--  "Jefe de Cocina La Basilica"-, que son el mismo nombre escrito en otro
--  sitio. Es el rotulo que se ensena, no la forma de entrar: el acceso va por
--  correo, asi que nadie se queda fuera por esto.
--
--  EL SLUG NO SE TOCA. Sigue siendo `la-basilica`, sin tilde: va en la
--  direccion de la ficha y de la carta, y en los codigos QR que hay pegados
--  en las mesas. Cambiarlo dejaria esos QR llevando a una pagina que ya no
--  existe. Un slug sin tilde no es un error, es lo que toca en una URL.
--
--  Tampoco se tocan los comentarios del codigo ni las semillas anteriores:
--  cuentan lo que se hizo en su momento y no los lee ningun cliente.
-- =====================================================================

SET NAMES utf8mb4;

UPDATE restaurantes
   SET nombre = 'La Basílica'
 WHERE slug = 'la-basilica';

UPDATE usuarios
   SET nombre = REPLACE(nombre, 'La Basilica', 'La Basílica')
 WHERE nombre LIKE '%La Basilica%';
