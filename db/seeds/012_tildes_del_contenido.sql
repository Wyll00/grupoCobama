-- =====================================================================
--  Tildes en el contenido que ve el cliente
--
--  Las semillas se escribieron sin acentos y eso llega tal cual a la carta:
--  "Bechamel cremosa hecha cada manana", "Precio por persona, minimo 2",
--  "pimenton de la Vera", "Zamburinas". No es un detalle de estilo. Es lo
--  primero que hace que una carta parezca a medio hacer, y aqui se lee en la
--  mesa, con el plato delante.
--
--  VA EN SEMILLAS, NO EN MIGRACIONES. Las migraciones corren ANTES que las
--  semillas: en una instalacion limpia se ejecutarian con las tablas vacias,
--  no cambiarian nada, y acto seguido las semillas volverian a meter el texto
--  sin acentos. Se probo, y pasa exactamente eso. Este fichero corre despues,
--  asi que arregla igual la base que ya existe y la que se acaba de crear.
--
--  ------------------------------------------------------------------
--  DOS TRAMPAS, las dos comprobadas contra la base de datos
--  ------------------------------------------------------------------
--
--  1. LAS BARRAS VAN DOBLES: '\\b'. MySQL resuelve las escapadas de la cadena
--     antes de entregarsela al motor de expresiones, asi que un '\b' simple
--     llega convertido en el caracter de retroceso y no casa con nada. Un
--     primer intento de esto se aplico entero, se registro como correcto y no
--     cambio una sola fila.
--
--  2. EL ARGUMENTO 'c' DEL FINAL obliga a distinguir mayusculas. Sin el, la
--     comparacion usa la colacion de la columna, que las ignora: '\\bcafe\\b'
--     tambien casa con "Cafe" y lo deja escrito "café", en minuscula y al
--     principio del nombre del plato. Tambien se probo, y dejo cuatro cafes
--     de la carta en minuscula. Por eso hay reglas separadas para "azucar" y
--     "Azucar", "vinedo" y "Vinedo".
--
--  Se usa REGEXP_REPLACE con limites de palabra y no REPLACE a secas: con
--  REPLACE, cambiar "mas" por "más" rompe "masa" y "demasiado", y "dia"
--  rompe "diario".
--
--  ------------------------------------------------------------------
--  Palabras que PARECEN mal y no se tocan, porque estan bien
--  ------------------------------------------------------------------
--
--    papas, garbanzas, potas, millo, gofio     canarismos
--    almogrote, frangollo, bienmesabe          idem
--    raciones, kilo, alioli, sancochada        llanas, sin tilde
--    Carr.                                     abreviatura de carretera
--    Ycoden, Daute, Abona, Tacoronte           denominaciones de origen
--    negramoll, marmajuelo, verdello, gual     variedades de uva
--
--  En ingles y aleman se corrigen SOLO los nombres propios, que llevan su
--  acento en cualquier idioma: Güímar, Padrón, Príncipe, picón, Listán. No se
--  tocan "Sangria", "Malvasia" ni "cordon": son la grafia correcta en esas
--  lenguas. "Braided cordon vines" es el termino ingles de viticultura, no
--  una falta.
-- =====================================================================

SET NAMES utf8mb4;

-- ------------------------------------------------------------ platos.nombre
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\banejo\\b', 'añejo', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\banejo\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bAzucar\\b', 'Azúcar', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bAzucar\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bbotellin\\b', 'botellín', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bbotellin\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bCafe\\b', 'Café', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bCafe\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bcana\\b', 'caña', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bcana\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bChuleton\\b', 'Chuletón', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bChuleton\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bdia\\b', 'día', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bdia\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bfideua\\b', 'fideuá', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bfideua\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bGuimar\\b', 'Güímar', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bGuimar\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bInfusion\\b', 'Infusión', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bInfusion\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bjamon\\b', 'jamón', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bjamon\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\blimon\\b', 'limón', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\blimon\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bLimon\\b', 'Limón', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bLimon\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bMalvasia\\b', 'Malvasía', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bMalvasia\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bMaracuya\\b', 'Maracuyá', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bMaracuya\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bPadron\\b', 'Padrón', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bPadron\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bpina\\b', 'piña', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bpina\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bPrincipe\\b', 'Príncipe', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bPrincipe\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bSangria\\b', 'Sangría', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bSangria\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bTonica\\b', 'Tónica', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bTonica\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bvolcanica\\b', 'volcánica', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bvolcanica\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bZamburinas\\b', 'Zamburiñas', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bZamburinas\\b', 'c');

-- El mismo arroz estaba escrito de tres maneras en tres cartas: "senoret" en
-- Como en Casa, "senorito" en La Casa del Mago y "senyoret" en La Basilica.
-- Se unifica con la de La Basilica, que es la que tienen impresa en papel.
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bsenoret\\b', 'senyoret', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bsenoret\\b', 'c');
UPDATE platos SET nombre = REGEXP_REPLACE(nombre, '\\bsenorito\\b', 'senyoret', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bsenorito\\b', 'c');

-- ------------------------------------------------------- platos.nombre_en/de
UPDATE platos SET nombre_en = REGEXP_REPLACE(nombre_en, '\\bGuimar\\b', 'Güímar', 1, 0, 'c') WHERE REGEXP_LIKE(nombre_en, '\\bGuimar\\b', 'c');
UPDATE platos SET nombre_en = REGEXP_REPLACE(nombre_en, '\\bPadron\\b', 'Padrón', 1, 0, 'c') WHERE REGEXP_LIKE(nombre_en, '\\bPadron\\b', 'c');
UPDATE platos SET nombre_en = REGEXP_REPLACE(nombre_en, '\\bPrincipe\\b', 'Príncipe', 1, 0, 'c') WHERE REGEXP_LIKE(nombre_en, '\\bPrincipe\\b', 'c');
UPDATE platos SET nombre_de = REGEXP_REPLACE(nombre_de, '\\bGuimar\\b', 'Güímar', 1, 0, 'c') WHERE REGEXP_LIKE(nombre_de, '\\bGuimar\\b', 'c');
UPDATE platos SET nombre_de = REGEXP_REPLACE(nombre_de, '\\bPadron\\b', 'Padrón', 1, 0, 'c') WHERE REGEXP_LIKE(nombre_de, '\\bPadron\\b', 'c');
UPDATE platos SET nombre_de = REGEXP_REPLACE(nombre_de, '\\bPrincipe\\b', 'Príncipe', 1, 0, 'c') WHERE REGEXP_LIKE(nombre_de, '\\bPrincipe\\b', 'c');

-- ------------------------------------------------------- platos.descripcion
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bacompanados\\b', 'acompañados', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bacompanados\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\banejo\\b', 'añejo', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\banejo\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bantelacion\\b', 'antelación', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bantelacion\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bautoctona\\b', 'autóctona', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bautoctona\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bazucar\\b', 'azúcar', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bazucar\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bBotellin\\b', 'Botellín', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bBotellin\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bcafeina\\b', 'cafeína', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bcafeina\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bconeac\\b', 'coñac', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bconeac\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bcordon\\b', 'cordón', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bcordon\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bfideua\\b', 'fideuá', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bfideua\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\biberico\\b', 'ibérico', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\biberico\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bisotonica\\b', 'isotónica', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bisotonica\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bjamon\\b', 'jamón', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bjamon\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\blena\\b', 'leña', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\blena\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\blimon\\b', 'limón', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\blimon\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bListan\\b', 'Listán', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bListan\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bmaiz\\b', 'maíz', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bmaiz\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bmanana\\b', 'mañana', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bmanana\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bmaquina\\b', 'máquina', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bmaquina\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bminimo\\b', 'mínimo', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bminimo\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bMinimo\\b', 'Mínimo', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bMinimo\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bpicon\\b', 'picón', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bpicon\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bpimenton\\b', 'pimentón', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bpimenton\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bpina\\b', 'piña', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bpina\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bsegun\\b', 'según', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bsegun\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bSegun\\b', 'Según', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bSegun\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bsenoret\\b', 'senyoret', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bsenoret\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bsenorito\\b', 'senyoret', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bsenorito\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bversion\\b', 'versión', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bversion\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bvinedo\\b', 'viñedo', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bvinedo\\b', 'c');
UPDATE platos SET descripcion = REGEXP_REPLACE(descripcion, '\\bVinedo\\b', 'Viñedo', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bVinedo\\b', 'c');

-- -------------------------------------------------- platos.descripcion_en/de
UPDATE platos SET descripcion_en = REGEXP_REPLACE(descripcion_en, '\\bListan\\b', 'Listán', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion_en, '\\bListan\\b', 'c');
UPDATE platos SET descripcion_en = REGEXP_REPLACE(descripcion_en, '\\bpicon\\b', 'picón', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion_en, '\\bpicon\\b', 'c');
UPDATE platos SET descripcion_de = REGEXP_REPLACE(descripcion_de, '\\bListan\\b', 'Listán', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion_de, '\\bListan\\b', 'c');
UPDATE platos SET descripcion_de = REGEXP_REPLACE(descripcion_de, '\\bpicon\\b', 'picón', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion_de, '\\bpicon\\b', 'c');

-- --------------------------------------------------------- categorias.nombre
UPDATE categorias SET nombre = REGEXP_REPLACE(nombre, '\\bCafes\\b', 'Cafés', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bCafes\\b', 'c');

-- ---------------------------------------------------------- alergenos.nombre
-- Estos salen en la leyenda del final de cada carta y en el icono de cada
-- plato: se leen mas que ningun otro texto de la web.
UPDATE alergenos SET nombre = REGEXP_REPLACE(nombre, '\\bcascara\\b', 'cáscara', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bcascara\\b', 'c');
UPDATE alergenos SET nombre = REGEXP_REPLACE(nombre, '\\bCrustaceos\\b', 'Crustáceos', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bCrustaceos\\b', 'c');
UPDATE alergenos SET nombre = REGEXP_REPLACE(nombre, '\\bDioxido\\b', 'Dióxido', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bDioxido\\b', 'c');
UPDATE alergenos SET nombre = REGEXP_REPLACE(nombre, '\\bLacteos\\b', 'Lácteos', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bLacteos\\b', 'c');
UPDATE alergenos SET nombre = REGEXP_REPLACE(nombre, '\\bsesamo\\b', 'sésamo', 1, 0, 'c') WHERE REGEXP_LIKE(nombre, '\\bsesamo\\b', 'c');

-- ------------------------------------------------------------- restaurantes
UPDATE restaurantes SET direccion = REGEXP_REPLACE(direccion, '\\bMarques\\b', 'Marqués', 1, 0, 'c') WHERE REGEXP_LIKE(direccion, '\\bMarques\\b', 'c');
UPDATE restaurantes SET descripcion = REGEXP_REPLACE(descripcion, '\\bacompanados\\b', 'acompañados', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bacompanados\\b', 'c');
UPDATE restaurantes SET descripcion = REGEXP_REPLACE(descripcion, '\\bchuleton\\b', 'chuletón', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bchuleton\\b', 'c');
UPDATE restaurantes SET descripcion = REGEXP_REPLACE(descripcion, '\\bConcepcion\\b', 'Concepción', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bConcepcion\\b', 'c');
UPDATE restaurantes SET descripcion = REGEXP_REPLACE(descripcion, '\\bhistorico\\b', 'histórico', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bhistorico\\b', 'c');
UPDATE restaurantes SET descripcion = REGEXP_REPLACE(descripcion, '\\bmas\\b', 'más', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bmas\\b', 'c');
UPDATE restaurantes SET descripcion = REGEXP_REPLACE(descripcion, '\\bSalon\\b', 'Salón', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bSalon\\b', 'c');
UPDATE restaurantes SET descripcion = REGEXP_REPLACE(descripcion, '\\bsenoret\\b', 'senyoret', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bsenoret\\b', 'c');
UPDATE restaurantes SET descripcion = REGEXP_REPLACE(descripcion, '\\bultimo\\b', 'último', 1, 0, 'c') WHERE REGEXP_LIKE(descripcion, '\\bultimo\\b', 'c');

-- El reclamo de El Descarado decia "El senoret es la casa". Fuera de la isla
-- eso no se entiende: parece un nombre propio, y no dice que es. Se cuenta lo
-- mismo con todas las letras.
UPDATE restaurantes
   SET reclamo = 'Arroces del norte. Nuestra especialidad es el arroz al senyoret.'
 WHERE slug = 'el-descarado';
