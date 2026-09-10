-- =====================================================================
--  Los menus de celebracion, traducidos
--
--  LA MITAD SE COPIA DE LA CARTA, NO SE INVENTA.
--
--  De las 44 lineas de menu, 22 son platos que ya estan en `platos` con su
--  nombre en ingles y aleman. Se traen de ahi con un JOIN por el nombre en
--  castellano, y no se escriben otra vez: si en la carta pone "Canarian
--  wrinkled potatoes with mojo sauces" y en el menu pusiera "Wrinkled
--  potatoes", el mismo plato tendria dos nombres en la misma pagina y quien
--  lo lee no sabria si son dos cosas.
--
--  Ademas se arregla solo el dia que se corrija un nombre en la carta y se
--  vuelva a pasar esto.
--
--  Las otras 22 son texto propio del menu -"Mixto de aperitivos: croquetas,
--  ensaladilla y calamares"- y van escritas aqui abajo.
--
--  Los nombres de los menus -Clasico, Familiar, Casona, Arrocero- NO se
--  traducen: son como los llama la casa. "Casona" es la casa misma.
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
--  Antes que nada: una grafia suelta del mismo arroz
--
--  En la carta se unifico en "senyoret", pero estas tablas no se miraron
--  entonces y aqui quedaba escrito con ene. Tres grafias del mismo plato en
--  la misma web es una de mas.
-- ---------------------------------------------------------------------
UPDATE menu_grupo_lineas
   SET texto = REPLACE(texto, 'señoret', 'senyoret')
 WHERE texto LIKE '%señoret%';

-- ---------------------------------------------------------------------
--  Las secciones: cuatro titulos y cuatro notas distintas en los seis menus
-- ---------------------------------------------------------------------
UPDATE menu_grupo_secciones SET titulo_en = 'Starters',     titulo_de = 'Vorspeisen'   WHERE titulo = 'Entrantes';
UPDATE menu_grupo_secciones SET titulo_en = 'Main course',  titulo_de = 'Hauptgang'    WHERE titulo = 'Plato principal';
UPDATE menu_grupo_secciones SET titulo_en = 'Dessert',      titulo_de = 'Nachtisch'    WHERE titulo = 'Postre';
UPDATE menu_grupo_secciones SET titulo_en = 'Drinks',       titulo_de = 'Getränke'     WHERE titulo = 'Bebidas';

UPDATE menu_grupo_secciones
   SET nota_en = 'To share, one per 4 people',
       nota_de = 'Zum Teilen, eine pro 4 Personen'
 WHERE nota = 'A compartir cada 4 personas';

UPDATE menu_grupo_secciones
   SET nota_en = 'Choose one per person',
       nota_de = 'Eine Wahl pro Person'
 WHERE nota = 'A elegir uno por persona';

UPDATE menu_grupo_secciones
   SET nota_en = 'One per diner',
       nota_de = 'Eines pro Person'
 WHERE nota = 'Uno por comensal';

UPDATE menu_grupo_secciones
   SET nota_en = 'Unlimited until dessert is served',
       nota_de = 'Unbegrenzt bis zum Nachtisch'
 WHERE nota = 'Ilimitadas hasta la llegada del postre';

-- ---------------------------------------------------------------------
--  Lo que incluye el precio
-- ---------------------------------------------------------------------
UPDATE menus_grupo
   SET incluye_en = 'Includes bread, butter and mojo',
       incluye_de = 'Inklusive Brot, Butter und Mojo'
 WHERE incluye = 'Incluye pan, mantequilla y mojo';

UPDATE menus_grupo
   SET incluye_en = 'Includes bread and butter for each child',
       incluye_de = 'Inklusive Brot und Butter für jedes Kind'
 WHERE incluye = 'Incluye un pan y mantequillas por niño';

-- ---------------------------------------------------------------------
--  Las lineas que SON platos de la carta: se traen de alli
--
--  El JOIN es por el nombre en castellano, que es lo unico que comparten las
--  dos tablas. Coincide exacto en 22 de las 44 lineas; el resto se queda a
--  NULL y lo rellenan los UPDATE de mas abajo.
-- ---------------------------------------------------------------------
UPDATE menu_grupo_lineas l
  JOIN platos p ON p.nombre = l.texto
   SET l.texto_en = p.nombre_en,
       l.texto_de = p.nombre_de
 WHERE p.nombre_en IS NOT NULL;

-- ---------------------------------------------------------------------
--  Y las que son propias del menu
-- ---------------------------------------------------------------------
UPDATE menu_grupo_lineas SET
  texto_en = 'Still water · Soft drink · Red wine',
  texto_de = 'Wasser · Erfrischungsgetränk · Rotwein'
 WHERE texto = 'Agua · Refresco · Vino tinto';

UPDATE menu_grupo_lineas SET
  texto_en = 'Still water · Soft drink · Red wine · White wine',
  texto_de = 'Wasser · Erfrischungsgetränk · Rotwein · Weißwein'
 WHERE texto = 'Agua · Refresco · Vino tinto · Vino blanco';

UPDATE menu_grupo_lineas SET
  texto_en = 'Still water · Juice',
  texto_de = 'Wasser · Saft'
 WHERE texto = 'Agua · Zumo';

UPDATE menu_grupo_lineas SET
  texto_en = 'Slow-cooked then grilled pork collar, with rustic potatoes',
  texto_de = 'Bei Niedrigtemperatur gegartes und gegrilltes Schweinenackensteak mit rustikalen Kartoffeln'
 WHERE texto = 'Aguja de cerdo a baja temperatura y brasa, con papa rústica';

UPDATE menu_grupo_lineas SET
  texto_en = 'Arroz al senyoret (rice with peeled seafood)',
  texto_de = 'Arroz al senyoret (Reis mit ausgelöstem Meeresfrüchte)'
 WHERE texto = 'Arroz al senyoret';

UPDATE menu_grupo_lineas SET
  texto_en = 'Tuna in boiled mojo',
  texto_de = 'Thunfisch in gekochtem Mojo'
 WHERE texto = 'Atún en mojo hervido';

UPDATE menu_grupo_lineas SET
  texto_en = 'Chistorra sausage with Padrón peppers',
  texto_de = 'Chistorra-Wurst mit Padrón-Paprika'
 WHERE texto = 'Chistorras con pimientos de padrón';

UPDATE menu_grupo_lineas SET
  texto_en = 'Chicken croquettes and grilled sausages with chips',
  texto_de = 'Hähnchenkroketten und gegrillte Würstchen mit Pommes'
 WHERE texto = 'Croquetas de pollo y salchichas a la brasa con papas fritas';

UPDATE menu_grupo_lineas SET
  texto_en = 'Tomato salad with yellow sweet potato and tuna belly',
  texto_de = 'Tomatensalat mit gelber Süßkartoffel und Thunfischbauch'
 WHERE texto = 'Ensalada de tomate, batata amarilla y ventresca de atún';

UPDATE menu_grupo_lineas SET
  texto_en = 'Grilled entrecote with rustic potatoes',
  texto_de = 'Gegrilltes Entrecôte mit rustikalen Kartoffeln'
 WHERE texto = 'Entrecot a la brasa con papa rústica';

UPDATE menu_grupo_lineas SET texto_en = 'Ice cream', texto_de = 'Eis'
 WHERE texto = 'Helado';

UPDATE menu_grupo_lineas SET
  texto_en = 'Mixed starters: croquettes, potato salad and squid (with sauces)',
  texto_de = 'Vorspeisenteller: Kroketten, Kartoffelsalat und Tintenfisch (mit Saucen)'
 WHERE texto = 'Mixto de aperitivos: croquetas, ensaladilla y calamares (con salsas)';

UPDATE menu_grupo_lineas SET
  texto_en = 'Polvito uruguayo (dulce de leche, cream and meringue)',
  texto_de = 'Polvito uruguayo (Milchkaramell, Sahne und Baiser)'
 WHERE texto = 'Polvito uruguayo';

UPDATE menu_grupo_lineas SET
  texto_en = 'Smoked cheese with nuts and guava',
  texto_de = 'Geräucherter Käse mit Nüssen und Guave'
 WHERE texto = 'Queso ahumado con frutos secos y guayaba';

UPDATE menu_grupo_lineas SET
  texto_en = 'Grilled cheese with gofio and palm honey',
  texto_de = 'Gegrillter Käse mit Gofio und Palmhonig'
 WHERE texto = 'Queso asado con gofio y miel de palma';

UPDATE menu_grupo_lineas SET
  texto_en = 'Salmon with green mojo pesto and fried watercress',
  texto_de = 'Lachs mit grünem Mojo-Pesto und frittierter Brunnenkresse'
 WHERE texto = 'Salmón con pesto de mojo verde y berros fritos';

UPDATE menu_grupo_lineas SET
  texto_en = 'Tuna salpicón (with onion, pepper and tomato)',
  texto_de = 'Thunfisch-Salpicón (mit Zwiebel, Paprika und Tomate)'
 WHERE texto = 'Salpicón de atún';

UPDATE menu_grupo_lineas SET
  texto_en = 'Selection of house desserts',
  texto_de = 'Auswahl an hausgemachten Desserts'
 WHERE texto = 'Surtido de postres de la casa';

UPDATE menu_grupo_lineas SET
  texto_en = 'Cod timbale with mojo sauces',
  texto_de = 'Kabeljau-Timbal mit Mojo-Saucen'
 WHERE texto = 'Timbal de bacalao con mojos';
