-- =====================================================================
--  Las coordenadas de las cuatro casas estaban mal
--
--  No una: las cuatro. Medido entre lo que habia y donde esta cada sitio:
--
--    Como en Casa       1.561 m    caia en el casco de La Laguna, no en Guamasa
--    El Descarado       1.447 m
--    La Casa del Mago     654 m
--    La Basilica          562 m
--
--  El boton "Como llegar" de cada ficha sale de estas coordenadas, asi que
--  llevaba a la manzana equivocada en los cuatro locales. A medio kilometro
--  aun se ve el sitio desde donde te deja; a kilometro y medio, no.
--
--  Se ve de donde venia el error: los cuatro puntos viejos son redondos
--  -28.4870000, 28.3536000- y caen cerca del centro de su municipio. Estaban
--  puestos a ojo sobre el mapa, no sacados de la ficha del sitio. Parecian
--  razonables porque el municipio SI era el correcto, que es justo lo que
--  hace que un dato asi aguante meses sin que nadie lo mire.
--
--  Las nuevas salen de las fichas de Google que paso William:
--
--    Como en Casa      https://maps.app.goo.gl/VRbAUP5BBBH6VkPT8
--    La Casa del Mago  https://maps.app.goo.gl/KyToDwQsycTCKp7V6
--    La Basilica       https://maps.app.goo.gl/3W7ZS42yVmEcc2578
--    El Descarado      https://maps.app.goo.gl/tcxPUzUxJiR965Qe6
--
--  OJO SI HAY QUE REHACER ESTO. En la direccion que abre cada enlace corto
--  hay DOS pares de numeros y no son lo mismo:
--
--    @28.490136,-16.3691501        centro del mapa: por donde andaba la vista
--                                  al compartir. Se mueve si mueves el mapa.
--    !3d28.4901313!4d-16.3665752   el sitio en si. Este es el bueno.
--
--  En Como en Casa se llevan 250 metros. Coger el equivocado no canta y deja
--  el mismo problema que estamos arreglando.
--
--  Comprobado que cada punto nuevo cae en el municipio que dice su ficha
--  -Guamasa, La Laguna, Candelaria y La Orotava-, y que el nombre del sitio
--  en Google es el de la casa. Sin eso, una coordenada bien escrita puede
--  seguir siendo la de otro restaurante que se llama parecido.
--
--  Los textos de direccion no se tocan.
-- =====================================================================

SET NAMES utf8mb4;

UPDATE restaurantes SET lat = 28.4901313, lng = -16.3665752 WHERE slug = 'como-en-casa';
UPDATE restaurantes SET lat = 28.4902708, lng = -16.3217417 WHERE slug = 'la-casa-del-mago';
UPDATE restaurantes SET lat = 28.3488977, lng = -16.3728941 WHERE slug = 'la-basilica';
UPDATE restaurantes SET lat = 28.4002365, lng = -16.5198288 WHERE slug = 'el-descarado';
