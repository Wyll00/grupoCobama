-- =====================================================================
--  Los cuatro locales, en ingles y aleman
--
--  La revision externa pidio que los idiomas llegasen tambien a la
--  informacion practica, no solo a la carta. Faltaba lo que se lee antes de
--  decidir a que casa se va: la frase de cada tarjeta y el parrafo de su
--  ficha.
--
--  Ademas habia DOS cosas mal en lo que ya estaba traducido:
--
--  1. La Basilica decia "in the old El Drago" en ingles y "im alten El Drago"
--     en aleman. No es El Drago: el local ocupa lo que fue el Restaurante El
--     Cruce, y asi lo dice el castellano. Un dato equivocado en la unica
--     frase que lee un turista antes de elegir mesa.
--
--  2. El Descarado seguia con "The senyoret is the house special", que es la
--     traduccion de la frase que se acaba de cambiar en castellano por no
--     entenderse fuera de la isla. Se pone la nueva en los tres idiomas.
--
--  Las descripciones largas estaban a NULL en los dos idiomas, asi que la
--  ficha caia al castellano campo a campo. Se traducen las cuatro.
--
--  Lo que NO se traduce, a proposito:
--
--    - Los nombres de los locales. Son nombres propios; "Como en Casa" se
--      llama igual en Hamburgo.
--    - Los nombres de los sitios: Guamasa, El Ramal, la plaza de la
--      Concepcion. Quien busca el sitio en un mapa necesita el nombre real.
--    - "arroz al senyoret". Es el nombre del plato, y traducirlo por "rice
--      for the young gentleman" no lo aclara: lo convierte en otra cosa.
-- =====================================================================

SET NAMES utf8mb4;

-- ------------------------------------------------------------ Como en Casa
UPDATE restaurantes SET
  reclamo_en = 'The biggest of the four: car park, farm animals and a play area.',
  reclamo_de = 'Das größte der vier Häuser: Parkplatz, Bauernhof und Spielbereich.',
  descripcion_en = 'The largest restaurant in the group, in Guamasa next to Tenerife North airport. Plenty of parking, a farm with animals and a play area. Traditional Canarian cooking in generous portions, made for coming with the family and staying all afternoon.',
  descripcion_de = 'Das größte Lokal der Gruppe, in Guamasa direkt am Flughafen Teneriffa Nord. Viele Parkplätze, ein Bauernhof mit Tieren und ein Spielbereich. Traditionelle kanarische Küche in großzügigen Portionen, gemacht für einen langen Nachmittag mit der Familie.'
WHERE slug = 'como-en-casa';

-- ------------------------------------------------------------ La Basilica
-- Aqui se corrige "El Drago" por "El Cruce" en los dos idiomas.
UPDATE restaurantes SET
  reclamo_en = 'Charcoal-grilled meats and rice dishes in the old El Cruce.',
  reclamo_de = 'Fleisch vom Holzkohlegrill und Reisgerichte im ehemaligen El Cruce.',
  descripcion_en = 'In what used to be Restaurante El Cruce in Candelaria. A roomy place with an enclosed terrace and its own car park. The grill runs the show: Canarian black pork, entrecote and dry-aged rib steak, alongside a good list of rice dishes.',
  descripcion_de = 'Im ehemaligen Restaurante El Cruce in Candelaria. Ein großzügiges Lokal mit überdachter Terrasse und eigenem Parkplatz. Der Grill gibt den Ton an: kanarisches schwarzes Schwein, Entrecôte und gereiftes Kotelett, dazu eine gute Auswahl an Reisgerichten.'
WHERE slug = 'la-basilica';

-- ------------------------------------------------------- La Casa del Mago
UPDATE restaurantes SET
  reclamo_en = 'A Canarian manor house in the old town, cooking with care.',
  reclamo_de = 'Kanarisches Herrenhaus in der Altstadt, Küche mit Liebe zum Detail.',
  descripcion_en = 'A restored Canarian manor house in the heart of La Laguna, a step away from Plaza de la Concepción. No car park, but the historic centre is at the door. A more elaborate menu and more carefully plated portions: this is the group''s restaurant for dinners and small groups.',
  descripcion_de = 'Ein restauriertes kanarisches Herrenhaus mitten in der Altstadt von La Laguna, wenige Schritte von der Plaza de la Concepción. Kein eigener Parkplatz, dafür das historische Zentrum vor der Tür. Anspruchsvollere Gerichte und sorgfältiger angerichtete Portionen: das Haus der Gruppe für Abendessen und kleine Gruppen.'
WHERE slug = 'la-casa-del-mago';

-- ------------------------------------------------------------ El Descarado
-- Y aqui la frase nueva, la misma que se puso en castellano.
UPDATE restaurantes SET
  reclamo_en = 'Rice dishes from the north. Our speciality is arroz al senyoret.',
  reclamo_de = 'Reisgerichte aus dem Norden. Unsere Spezialität ist der Arroz al senyoret.',
  descripcion_en = 'The newest of the four, open since 2025, in the El Ramal area of La Orotava. An indoor dining room and wide terraces with private parking. Rice dishes are the speciality — arroz al senyoret is the one they are known for — along with charcoal-grilled meats.',
  descripcion_de = 'Das jüngste der vier Häuser, eröffnet 2025, im Viertel El Ramal in La Orotava. Innenraum und weitläufige Terrassen mit eigenem Parkplatz. Spezialität sind die Reisgerichte — der Arroz al senyoret ist ihr Aushängeschild — dazu Fleisch vom Holzkohlegrill.'
WHERE slug = 'el-descarado';
