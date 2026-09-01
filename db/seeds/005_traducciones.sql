-- =====================================================================
--  Traducciones al ingles y al aleman
--
--  La carta se lee en tres idiomas, pero hasta aqui solo llegaban traducidos
--  los alergenos (migracion 025) y los nombres de seccion. Los platos que
--  crean 002_carta y 004_bebidas nacian sin ingles ni aleman, asi que quien
--  cambiaba de idioma veia las secciones traducidas y los platos en
--  castellano. Media traduccion se lee peor que ninguna.
--
--  SOLO TOCA TRADUCCIONES. No crea platos, no borra y no cambia el nombre en
--  castellano ni los precios. Son UPDATE por id: si una fila no existe en esa
--  instalacion, no pasa nada, se queda en cero filas afectadas. Esa es la
--  misma regla que sigue scripts/importar-idiomas-basilica.js, y por el mismo
--  motivo: de un fichero de traducciones que ademas da de alta platos no se
--  fia nadie para volver a pasarlo.
--
--  Va como semilla y no como migracion a proposito. `db:setup` aplica primero
--  las migraciones y despues las semillas: una migracion se ejecutaria con la
--  tabla de platos todavia vacia y no actualizaria nada.
--
--  Criterio de traduccion: los platos con nombre propio se mantienen y se
--  glosan, no se traducen a lo bruto. Bienmesabe sigue siendo Bienmesabe y al
--  lado se explica que es una crema de almendra. Las uvas y las denominaciones
--  de origen se dejan intactas. Las marcas tampoco se tocan.
-- =====================================================================

SET NAMES utf8mb4;

-- Platos: nombre y descripcion (100 filas)
UPDATE platos SET nombre_en='Canarian wrinkled potatoes with mojo sauces', nombre_de='Kanarische Runzelkartoffeln mit Mojo-Saucen', descripcion_en='Papa bonita potatoes with house red and green mojo.', descripcion_de='Papa-bonita-Kartoffeln mit hausgemachtem rotem und grünem Mojo.' WHERE id=1;
UPDATE platos SET nombre_en='Grilled cheese with mojo sauce', nombre_de='Gegrillter Käse mit Mojo-Sauce', descripcion_en='Grilled Majorero goat cheese with green mojo.', descripcion_de='Gegrillter Majorero-Ziegenkäse mit grünem Mojo.' WHERE id=2;
UPDATE platos SET nombre_en='House croquettes', nombre_de='Kroketten des Hauses', descripcion_en='Eight pieces. Creamy bechamel made fresh each morning.', descripcion_de='Acht Stück. Cremige Béchamel, jeden Morgen frisch zubereitet.' WHERE id=3;
UPDATE platos SET nombre_en='Goat cheese and caramelised onion croquettes', nombre_de='Kroketten mit Ziegenkäse und karamellisierten Zwiebeln', descripcion_en='Eight pieces.', descripcion_de='Acht Stück.' WHERE id=4;
UPDATE platos SET nombre_en='Padron peppers', nombre_de='Padron-Paprika', descripcion_en='Fried with coarse salt.', descripcion_de='Gebraten mit grobem Salz.' WHERE id=5;
UPDATE platos SET nombre_en='Canarian chickpea stew', nombre_de='Kanarischer Kichererbseneintopf', descripcion_en='Traditional stew with pork ribs and soft Canarian chorizo.', descripcion_de='Traditioneller Eintopf mit Rippchen und weicher kanarischer Chorizo.' WHERE id=6;
UPDATE platos SET nombre_en='Ropa vieja with chickpeas', nombre_de='Ropa vieja mit Kichererbsen', descripcion_en='With shredded chicken and beef.', descripcion_de='Mit zerpflücktem Hähnchen und Rindfleisch.' WHERE id=7;
UPDATE platos SET nombre_en='Canarian pork crackling', nombre_de='Kanarische Grieben', descripcion_en='With potatoes and spicy mojo picon.', descripcion_de='Mit Kartoffeln und scharfem Mojo picon.' WHERE id=8;
UPDATE platos SET nombre_en='Almogrote from La Gomera with toast', nombre_de='Almogrote aus La Gomera mit Toast', descripcion_en='Cured cheese spread with La Palma pepper.', descripcion_de='Aufstrich aus gereiftem Käse mit La-Palma-Paprika.' WHERE id=9;
UPDATE platos SET nombre_en='Spanish potato omelette', nombre_de='Spanische Kartoffeltortilla', descripcion_en='Juicy, with onion.', descripcion_de='Saftig, mit Zwiebeln.' WHERE id=10;
UPDATE platos SET nombre_en='Broken eggs with Serrano ham', nombre_de='Spiegeleier mit Serrano-Schinken', descripcion_en='With local potatoes and Iberian ham.', descripcion_de='Mit einheimischen Kartoffeln und iberischem Schinken.' WHERE id=11;
UPDATE platos SET nombre_en='Grilled octopus', nombre_de='Gegrillter Oktopus', descripcion_en='On black potato parmentier with smoked paprika.', descripcion_de='Auf Parmentier aus schwarzer Kartoffel mit geräuchertem Paprika.' WHERE id=12;
UPDATE platos SET nombre_en='King prawns in garlic', nombre_de='Garnelen in Knoblauchöl', descripcion_en='In a casserole, with chilli.', descripcion_de='Im Tontopf, mit Chili.' WHERE id=13;
UPDATE platos SET nombre_en='Fried baby squid', nombre_de='Frittierte Mini-Tintenfische', descripcion_en='With house alioli.', descripcion_de='Mit hausgemachtem Alioli.' WHERE id=14;
UPDATE platos SET nombre_en='Sweet blood sausage from Tenerife', nombre_de='Süße Blutwurst aus Teneriffa', descripcion_en='Grilled, on toasted bread.', descripcion_de='Gegrillt, auf geröstetem Brot.' WHERE id=15;
UPDATE platos SET nombre_en='Grilled fresh cheese with palm honey', nombre_de='Gegrillter Frischkäse mit Palmhonig', descripcion_en='Palm honey from La Gomera.', descripcion_de='Palmhonig aus La Gomera.' WHERE id=16;
UPDATE platos SET nombre_en='House salad', nombre_de='Salat des Hauses', descripcion_en='Lettuce, tomato, onion, corn, carrot and olives.', descripcion_de='Salat, Tomate, Zwiebel, Mais, Karotte und Oliven.' WHERE id=17;
UPDATE platos SET nombre_en='Goat cheese salad', nombre_de='Ziegenkäse-Salat', descripcion_en='With nuts, sprouts and honey vinaigrette.', descripcion_de='Mit Nüssen, Sprossen und Honig-Vinaigrette.' WHERE id=18;
UPDATE platos SET nombre_en='Avocado and prawn salad', nombre_de='Avocado-Garnelen-Salat', descripcion_en='With house cocktail sauce.', descripcion_de='Mit hausgemachter Cocktailsauce.' WHERE id=19;
UPDATE platos SET nombre_en='Rice al senyoret with peeled seafood', nombre_de='Reis al senyoret mit ausgelösten Meeresfrüchten', descripcion_en='Price per person, minimum 2. Dry rice with peeled seafood.', descripcion_de='Preis pro Person, mindestens 2. Trockener Reis mit ausgelösten Meeresfrüchten.' WHERE id=20;
UPDATE platos SET nombre_en='Soupy rice with lobster', nombre_de='Sämiger Reis mit Hummer', descripcion_en='Price per person, minimum 2.', descripcion_de='Preis pro Person, mindestens 2.' WHERE id=21;
UPDATE platos SET nombre_en='Black rice with baby squid', nombre_de='Schwarzer Reis mit Tintenfisch', descripcion_en='Price per person, minimum 2. Alioli served separately.', descripcion_de='Preis pro Person, mindestens 2. Alioli separat serviert.' WHERE id=22;
UPDATE platos SET nombre_en='Meat paella', nombre_de='Fleisch-Paella', descripcion_en='Price per person, minimum 2. Chicken and rabbit.', descripcion_de='Preis pro Person, mindestens 2. Hähnchen und Kaninchen.' WHERE id=23;
UPDATE platos SET nombre_en='Vegetable rice', nombre_de='Gemüsereis', descripcion_en='Price per person, minimum 2. Seasonal vegetables.', descripcion_de='Preis pro Person, mindestens 2. Saisonales Gemüse.' WHERE id=24;
UPDATE platos SET nombre_en='Carne fiesta', nombre_de='Carne fiesta', descripcion_en='Marinated fried pork, a Canarian classic.', descripcion_de='Mariniertes, gebratenes Schweinefleisch, ein kanarischer Klassiker.' WHERE id=25;
UPDATE platos SET nombre_en='Pork ribs with potatoes and corn', nombre_de='Schweinerippchen mit Kartoffeln und Mais', descripcion_en='The traditional stew.', descripcion_de='Der traditionelle Eintopf.' WHERE id=26;
UPDATE platos SET nombre_en='Grilled Canarian black pork', nombre_de='Gegrilltes kanarisches Schwarzschwein', descripcion_en='Native breed, cooked over a wood fire.', descripcion_de='Einheimische Rasse, über Holzfeuer gegrillt.' WHERE id=27;
UPDATE platos SET nombre_en='Grilled beef entrecote', nombre_de='Gegrilltes Rinder-Entrecôte', descripcion_en='With potatoes and peppers.', descripcion_de='Mit Kartoffeln und Paprika.' WHERE id=28;
UPDATE platos SET nombre_en='Pork tenderloin with cheese sauce', nombre_de='Schweinefilet mit Käsesauce', descripcion_en='Cured goat cheese sauce.', descripcion_de='Sauce aus gereiftem Ziegenkäse.' WHERE id=29;
UPDATE platos SET nombre_en='Aged beef chop', nombre_de='Gereiftes Rinderkotelett', descripcion_en='Price per kilo. Served by weight, please ask about availability.', descripcion_de='Preis pro Kilo. Wird nach Gewicht serviert, bitte nach Verfügbarkeit fragen.' WHERE id=30;
UPDATE platos SET nombre_en='Roast kid goat', nombre_de='Zicklein aus dem Ofen', descripcion_en='With baker style potatoes. Please order in advance.', descripcion_de='Mit Bäckerkartoffeln. Bitte vorbestellen.' WHERE id=31;
UPDATE platos SET nombre_en='Garlic chicken', nombre_de='Knoblauchhähnchen', descripcion_en='Free range, with potatoes.', descripcion_de='Freilandhähnchen, mit Kartoffeln.' WHERE id=32;
UPDATE platos SET nombre_en='Wreckfish «a la espalda»', nombre_de='Wrackbarsch «a la espalda»', descripcion_en='Split and grilled, with papas arrugadas and green mojo.', descripcion_de='Aufgeschnitten und gegrillt, mit Papas arrugadas und grünem Mojo.' WHERE id=33;
UPDATE platos SET nombre_en='Boiled parrotfish', nombre_de='Gekochter Papageifisch', descripcion_en='With potatoes, sweet potato and mojo.', descripcion_de='Mit Kartoffeln, Süßkartoffel und Mojo.' WHERE id=34;
UPDATE platos SET nombre_en='Grilled squid', nombre_de='Gegrillter Tintenfisch', descripcion_en='With garlic and parsley oil.', descripcion_de='Mit Knoblauch-Petersilien-Öl.' WHERE id=35;
UPDATE platos SET nombre_en='Catch of the day baked in salt', nombre_de='Tagesfisch in Salzkruste', descripcion_en='Market catch. Price per kilo.', descripcion_de='Je nach Fang. Preis pro Kilo.' WHERE id=36;
UPDATE platos SET nombre_en='Quesillo, Canarian caramel flan', nombre_de='Quesillo, kanarischer Karamellflan', descripcion_en='With caramel.', descripcion_de='Mit Karamell.' WHERE id=37;
UPDATE platos SET nombre_en='Frangollo, Canarian corn pudding with milk', nombre_de='Frangollo, kanarischer Maispudding mit Milch', descripcion_en='Traditional Canarian corn dessert.', descripcion_de='Traditionelles kanarisches Maisdessert.' WHERE id=38;
UPDATE platos SET nombre_en='Bienmesabe, Canarian almond cream', nombre_de='Bienmesabe, kanarische Mandelcreme', descripcion_en='Almond, with vanilla ice cream.', descripcion_de='Mandel, mit Vanilleeis.' WHERE id=39;
UPDATE platos SET nombre_en='Baked cheesecake', nombre_de='Gebackener Käsekuchen', descripcion_en='Creamy, with red berry jam.', descripcion_de='Cremig, mit Beerenkonfitüre.' WHERE id=40;
UPDATE platos SET nombre_en='Principe Alberto, hazelnut and chocolate dessert', nombre_de='Principe Alberto, Haselnuss-Schokoladen-Dessert', descripcion_en='Chocolate, almond and biscuit.', descripcion_de='Schokolade, Mandel und Keks.' WHERE id=41;
UPDATE platos SET nombre_en='Local wine (glass)', nombre_de='Landwein (Glas)', descripcion_en='House red or white.', descripcion_de='Hausrot- oder Hausweißwein.' WHERE id=42;
UPDATE platos SET nombre_en='Tacoronte-Acentejo wine (bottle)', nombre_de='Tacoronte-Acentejo-Wein (Flasche)', descripcion_en='D.O. Tacoronte-Acentejo.', descripcion_de='D.O. Tacoronte-Acentejo.' WHERE id=43;
UPDATE platos SET nombre_en='Draught beer (small)', nombre_de='Fassbier (klein)', descripcion_en='Dorada beer.', descripcion_de='Dorada-Bier.' WHERE id=44;
UPDATE platos SET nombre_en='Mineral water 1 L', nombre_de='Mineralwasser 1 L', descripcion_en='Still or sparkling.', descripcion_de='Still oder mit Kohlensäure.' WHERE id=45;
UPDATE platos SET nombre_en='Soft drink', nombre_de='Erfrischungsgetränk', descripcion_en='Please ask for available flavours.', descripcion_de='Bitte nach den Sorten fragen.' WHERE id=46;
UPDATE platos SET nombre_en='Barraquito, layered Canarian coffee', nombre_de='Barraquito, kanarischer Schichtkaffee', descripcion_en='With condensed milk, Licor 43, cinnamon and lemon.', descripcion_de='Mit Kondensmilch, Licor 43, Zimt und Zitrone.' WHERE id=47;
UPDATE platos SET nombre_en='Coca-Cola', nombre_de='Coca-Cola', descripcion_en='20 cl bottle.', descripcion_de='20-cl-Flasche.' WHERE id=100;
UPDATE platos SET nombre_en='Coca-Cola Zero Sugar', nombre_de='Coca-Cola Zero Zucker', descripcion_en='20 cl bottle.', descripcion_de='20-cl-Flasche.' WHERE id=101;
UPDATE platos SET nombre_en='Coca-Cola Zero Zero', nombre_de='Coca-Cola Zero Zero', descripcion_en='Sugar free and caffeine free. 20 cl bottle.', descripcion_de='Zucker- und koffeinfrei. 20-cl-Flasche.' WHERE id=102;
UPDATE platos SET nombre_en='Fanta Orange', nombre_de='Fanta Orange', descripcion_en='20 cl bottle.', descripcion_de='20-cl-Flasche.' WHERE id=103;
UPDATE platos SET nombre_en='Fanta Lemon', nombre_de='Fanta Zitrone', descripcion_en='20 cl bottle.', descripcion_de='20-cl-Flasche.' WHERE id=104;
UPDATE platos SET nombre_en='Sprite', nombre_de='Sprite', descripcion_en='20 cl bottle.', descripcion_de='20-cl-Flasche.' WHERE id=105;
UPDATE platos SET nombre_en='Nestea Lemon', nombre_de='Nestea Zitrone', descripcion_en='25 cl bottle.', descripcion_de='25-cl-Flasche.' WHERE id=106;
UPDATE platos SET nombre_en='Nestea Passion Fruit', nombre_de='Nestea Maracuja', descripcion_en='25 cl bottle.', descripcion_de='25-cl-Flasche.' WHERE id=107;
UPDATE platos SET nombre_en='Aquarius Lemon', nombre_de='Aquarius Zitrone', descripcion_en='33 cl bottle.', descripcion_de='33-cl-Flasche.' WHERE id=108;
UPDATE platos SET nombre_en='Aquarius Orange', nombre_de='Aquarius Orange', descripcion_en='33 cl bottle.', descripcion_de='33-cl-Flasche.' WHERE id=109;
UPDATE platos SET nombre_en='Appletiser', nombre_de='Appletiser', descripcion_en='Sparkling apple juice. 27.5 cl.', descripcion_de='Prickelnder Apfelsaft. 27,5 cl.' WHERE id=110;
UPDATE platos SET nombre_en='Royal Bliss Tonic', nombre_de='Royal Bliss Tonic', descripcion_en='20 cl bottle.', descripcion_de='20-cl-Flasche.' WHERE id=111;
UPDATE platos SET nombre_en='Royal Bliss Ginger Ale', nombre_de='Royal Bliss Ginger Ale', descripcion_en='20 cl bottle.', descripcion_de='20-cl-Flasche.' WHERE id=112;
UPDATE platos SET nombre_en='Powerade', nombre_de='Powerade', descripcion_en='Isotonic drink. 50 cl.', descripcion_de='Isotonisches Getränk. 50 cl.' WHERE id=113;
UPDATE platos SET nombre_en='Mineral water 50 cl', nombre_de='Mineralwasser 50 cl', descripcion_en='Still or sparkling.', descripcion_de='Still oder mit Kohlensäure.' WHERE id=114;
UPDATE platos SET nombre_en='Freshly squeezed orange juice', nombre_de='Frisch gepresster Orangensaft', descripcion_en='Squeezed to order.', descripcion_de='Frisch gepresst.' WHERE id=115;
UPDATE platos SET nombre_en='Alcohol-free bitter', nombre_de='Alkoholfreier Bitter', descripcion_en='20 cl bottle.', descripcion_de='20-cl-Flasche.' WHERE id=116;
UPDATE platos SET nombre_en='Dorada Especial (small bottle)', nombre_de='Dorada Especial (kleine Flasche)', descripcion_en='Beer from Tenerife. 25 cl.', descripcion_de='Bier aus Teneriffa. 25 cl.' WHERE id=120;
UPDATE platos SET nombre_en='Dorada Pilsen (small bottle)', nombre_de='Dorada Pilsen (kleine Flasche)', descripcion_en='Beer from Tenerife. 25 cl.', descripcion_de='Bier aus Teneriffa. 25 cl.' WHERE id=121;
UPDATE platos SET nombre_en='Dorada alcohol-free', nombre_de='Dorada alkoholfrei', descripcion_en='25 cl bottle.', descripcion_de='25-cl-Flasche.' WHERE id=122;
UPDATE platos SET nombre_en='Tropical (small bottle)', nombre_de='Tropical (kleine Flasche)', descripcion_en='Beer from Gran Canaria. 25 cl.', descripcion_de='Bier aus Gran Canaria. 25 cl.' WHERE id=123;
UPDATE platos SET nombre_en='Beer mug 50 cl', nombre_de='Bierkrug 50 cl', descripcion_en='On tap.', descripcion_de='Vom Fass.' WHERE id=124;
UPDATE platos SET nombre_en='Shandy with lemon', nombre_de='Radler mit Zitrone', descripcion_en='Beer with lemon soda.', descripcion_de='Bier mit Zitronenlimonade.' WHERE id=125;
UPDATE platos SET nombre_en='Young red, D.O. Tacoronte-Acentejo', nombre_de='Junger Rotwein, D.O. Tacoronte-Acentejo', descripcion_en='Listan Negro and Negramoll. 75 cl bottle.', descripcion_de='Listan Negro und Negramoll. 75-cl-Flasche.' WHERE id=130;
UPDATE platos SET nombre_en='Oak-aged red, D.O. Tacoronte-Acentejo', nombre_de='Barrique-Rotwein, D.O. Tacoronte-Acentejo', descripcion_en='Oak aged. 75 cl bottle.', descripcion_de='Im Eichenfass gereift. 75-cl-Flasche.' WHERE id=131;
UPDATE platos SET nombre_en='Dry white, D.O. Ycoden-Daute-Isora', nombre_de='Trockener Weißwein, D.O. Ycoden-Daute-Isora', descripcion_en='Listan Blanco and Marmajuelo. 75 cl bottle.', descripcion_de='Listan Blanco und Marmajuelo. 75-cl-Flasche.' WHERE id=132;
UPDATE platos SET nombre_en='Red, D.O. Valle de la Orotava', nombre_de='Rotwein, D.O. Valle de la Orotava', descripcion_en='Listan Negro from braided cordon vines. 75 cl bottle.', descripcion_de='Listan Negro von geflochtenen Rebstöcken. 75-cl-Flasche.' WHERE id=133;
UPDATE platos SET nombre_en='White, D.O. Valle de la Orotava', nombre_de='Weißwein, D.O. Valle de la Orotava', descripcion_en='Listan Blanco. 75 cl bottle.', descripcion_de='Listan Blanco. 75-cl-Flasche.' WHERE id=134;
UPDATE platos SET nombre_en='Dry white, D.O. Valle de Guimar', nombre_de='Trockener Weißwein, D.O. Valle de Guimar', descripcion_en='Listan Blanco and Gual. 75 cl bottle.', descripcion_de='Listan Blanco und Gual. 75-cl-Flasche.' WHERE id=135;
UPDATE platos SET nombre_en='White, D.O. Abona', nombre_de='Weißwein, D.O. Abona', descripcion_en='Listan Blanco from high altitude vineyards. 75 cl bottle.', descripcion_de='Listan Blanco aus Höhenlagen. 75-cl-Flasche.' WHERE id=136;
UPDATE platos SET nombre_en='Dry volcanic Malvasia, D.O. Lanzarote', nombre_de='Trockener vulkanischer Malvasia, D.O. Lanzarote', descripcion_en='Vines grown in volcanic gravel hollows. 75 cl bottle.', descripcion_de='Reben in Lavakies-Mulden. 75-cl-Flasche.' WHERE id=137;
UPDATE platos SET nombre_en='Sweet Malvasia, D.O. Lanzarote', nombre_de='Süßer Malvasia, D.O. Lanzarote', descripcion_en='A dessert wine. 50 cl bottle.', descripcion_de='Dessertwein. 50-cl-Flasche.' WHERE id=138;
UPDATE platos SET nombre_en='White, D.O. La Palma', nombre_de='Weißwein, D.O. La Palma', descripcion_en='Albillo Criollo. 75 cl bottle.', descripcion_de='Albillo Criollo. 75-cl-Flasche.' WHERE id=139;
UPDATE platos SET nombre_en='Red, D.O. La Palma', nombre_de='Rotwein, D.O. La Palma', descripcion_en='Negramoll. 75 cl bottle.', descripcion_de='Negramoll. 75-cl-Flasche.' WHERE id=140;
UPDATE platos SET nombre_en='White, D.O. El Hierro', nombre_de='Weißwein, D.O. El Hierro', descripcion_en='Verdello and Vijariego. 75 cl bottle.', descripcion_de='Verdello und Vijariego. 75-cl-Flasche.' WHERE id=141;
UPDATE platos SET nombre_en='Red, D.O. Gran Canaria', nombre_de='Rotwein, D.O. Gran Canaria', descripcion_en='Listan Negro and Tintilla. 75 cl bottle.', descripcion_de='Listan Negro und Tintilla. 75-cl-Flasche.' WHERE id=142;
UPDATE platos SET nombre_en='Rose, P.D.O. Canary Islands', nombre_de='Rosé, g.U. Kanarische Inseln', descripcion_en='75 cl bottle.', descripcion_de='75-cl-Flasche.' WHERE id=143;
UPDATE platos SET nombre_en='House white wine (glass)', nombre_de='Hausweißwein (Glas)', descripcion_en=NULL, descripcion_de=NULL WHERE id=144;
UPDATE platos SET nombre_en='House red wine (glass)', nombre_de='Hausrotwein (Glas)', descripcion_en=NULL, descripcion_de=NULL WHERE id=145;
UPDATE platos SET nombre_en='House rose (glass)', nombre_de='Hausrosé (Glas)', descripcion_en=NULL, descripcion_de=NULL WHERE id=146;
UPDATE platos SET nombre_en='Sangria (1 L jug)', nombre_de='Sangria (1-L-Krug)', descripcion_en='Minimum two people.', descripcion_de='Mindestens zwei Personen.' WHERE id=147;
UPDATE platos SET nombre_en='Tinto de verano, red wine with lemon soda', nombre_de='Tinto de verano, Rotwein mit Limonade', descripcion_en='Glass.', descripcion_de='Glas.' WHERE id=148;
UPDATE platos SET nombre_en='Espresso', nombre_de='Espresso', descripcion_en=NULL, descripcion_de=NULL WHERE id=150;
UPDATE platos SET nombre_en='Cortado, espresso with a dash of milk', nombre_de='Cortado, Espresso mit etwas Milch', descripcion_en=NULL, descripcion_de=NULL WHERE id=151;
UPDATE platos SET nombre_en='White coffee', nombre_de='Milchkaffee', descripcion_en=NULL, descripcion_de=NULL WHERE id=152;
UPDATE platos SET nombre_en='Decaffeinated coffee', nombre_de='Entkoffeinierter Kaffee', descripcion_en='From the machine or a sachet.', descripcion_de='Aus der Maschine oder als Beutel.' WHERE id=153;
UPDATE platos SET nombre_en='Carajillo, coffee with liqueur', nombre_de='Carajillo, Kaffee mit Likör', descripcion_en='With rum, brandy or whisky.', descripcion_de='Mit Rum, Weinbrand oder Whisky.' WHERE id=154;
UPDATE platos SET nombre_en='Canarian honey rum (glass)', nombre_de='Kanarischer Honigrum (Glas)', descripcion_en=NULL, descripcion_de=NULL WHERE id=155;
UPDATE platos SET nombre_en='Canarian aged rum (glass)', nombre_de='Kanarischer alter Rum (Glas)', descripcion_en=NULL, descripcion_de=NULL WHERE id=156;
UPDATE platos SET nombre_en='Licor 43 (glass)', nombre_de='Licor 43 (Glas)', descripcion_en=NULL, descripcion_de=NULL WHERE id=157;
UPDATE platos SET nombre_en='Canarian herbal liqueur (glass)', nombre_de='Kanarischer Kräuterlikoer (Glas)', descripcion_en=NULL, descripcion_de=NULL WHERE id=158;
UPDATE platos SET nombre_en='Orujo pomace brandy (glass)', nombre_de='Orujo Tresterbrand (Glas)', descripcion_en='Clear or herbal.', descripcion_de='Klar oder mit Kräutern.' WHERE id=159;
UPDATE platos SET nombre_en='Herbal tea', nombre_de='Kräutertee', descripcion_en='Camomile, pennyroyal, lime blossom or tea.', descripcion_de='Kamille, Poleiminze, Lindenblüte oder Tee.' WHERE id=160;

-- Secciones de la carta (12). Se empareja por slug y no por id:
-- la categoria Salsas la crea la migracion 012 y su id depende de cuando
-- se aplico, asi que un UPDATE por id la dejaria sin traducir.
UPDATE categorias SET nombre_en='Starters', nombre_de='Vorspeisen' WHERE slug='entrantes';
UPDATE categorias SET nombre_en='Salads', nombre_de='Salate' WHERE slug='ensaladas';
UPDATE categorias SET nombre_en='Rice & fideuá', nombre_de='Reis & Fideuá' WHERE slug='arroces';
UPDATE categorias SET nombre_en='Meat', nombre_de='Fleisch' WHERE slug='carnes';
UPDATE categorias SET nombre_en='Fish & seafood', nombre_de='Fisch & Meeresfrüchte' WHERE slug='pescados';
UPDATE categorias SET nombre_en='Desserts', nombre_de='Desserts' WHERE slug='postres';
UPDATE categorias SET nombre_en='Drinks', nombre_de='Getränke' WHERE slug='bebidas';
UPDATE categorias SET nombre_en='Soft drinks', nombre_de='Erfrischungsgetränke' WHERE slug='refrescos';
UPDATE categorias SET nombre_en='Beers', nombre_de='Biere' WHERE slug='cervezas';
UPDATE categorias SET nombre_en='Wines', nombre_de='Weine' WHERE slug='vinos';
UPDATE categorias SET nombre_en='Coffee & spirits', nombre_de='Kaffee und Spirituosen' WHERE slug='cafes-licores';
UPDATE categorias SET nombre_en='Sauces', nombre_de='Saucen' WHERE slug='salsas';

-- Alergenos (14). La migracion 025 los traduce, pero se ejecuta
-- ANTES que las semillas y para entonces la tabla esta vacia: en una base
-- recien creada no llega a aplicar nada. Aqui se repite ya con las filas
-- existentes. En bases antiguas el UPDATE escribe lo mismo que ya habia.
UPDATE alergenos SET nombre_en='Gluten', nombre_de='Glutenhaltiges Getreide' WHERE slug='gluten';
UPDATE alergenos SET nombre_en='Crustaceans', nombre_de='Krebstiere' WHERE slug='crustaceos';
UPDATE alergenos SET nombre_en='Eggs', nombre_de='Eier' WHERE slug='huevos';
UPDATE alergenos SET nombre_en='Fish', nombre_de='Fisch' WHERE slug='pescado';
UPDATE alergenos SET nombre_en='Peanuts', nombre_de='Erdnüsse' WHERE slug='cacahuetes';
UPDATE alergenos SET nombre_en='Soybeans', nombre_de='Soja' WHERE slug='soja';
UPDATE alergenos SET nombre_en='Milk', nombre_de='Milch' WHERE slug='lacteos';
UPDATE alergenos SET nombre_en='Tree nuts', nombre_de='Schalenfrüchte' WHERE slug='frutos-cascara';
UPDATE alergenos SET nombre_en='Celery', nombre_de='Sellerie' WHERE slug='apio';
UPDATE alergenos SET nombre_en='Mustard', nombre_de='Senf' WHERE slug='mostaza';
UPDATE alergenos SET nombre_en='Sesame', nombre_de='Sesamsamen' WHERE slug='sesamo';
UPDATE alergenos SET nombre_en='Sulphites', nombre_de='Schwefeldioxid und Sulfite' WHERE slug='sulfitos';
UPDATE alergenos SET nombre_en='Lupin', nombre_de='Lupinen' WHERE slug='altramuces';
UPDATE alergenos SET nombre_en='Molluscs', nombre_de='Weichtiere' WHERE slug='moluscos';

-- Reclamo de cada local (4)
UPDATE restaurantes SET reclamo_en='The big one in the family: parking, farm and play area', reclamo_de='Der Große der Familie: Parkplatz, Bauernhof und Spielbereich' WHERE slug='como-en-casa';
UPDATE restaurantes SET reclamo_en='Grilled meats and rice dishes in the old El Drago', reclamo_de='Grillfleisch und Reisgerichte im alten El Drago' WHERE slug='la-basilica';
UPDATE restaurantes SET reclamo_en='Canarian manor house in the old town, cooking with detail', reclamo_de='Kanarisches Herrenhaus in der Altstadt, Küche mit Liebe zum Detail' WHERE slug='la-casa-del-mago';
UPDATE restaurantes SET reclamo_en='Rice dishes from the north. The senyoret is the house special.', reclamo_de='Reisgerichte aus dem Norden. Der Senyoret ist die Spezialität des Hauses.' WHERE slug='el-descarado';
