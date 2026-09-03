-- =====================================================================
--  Menus de celebracion
--
--  La migracion 018 vacio `menus_grupo` pero dejo la tabla en pie, y dejo
--  escrito por que: "es probable que vuelvan con datos de verdad". Han
--  vuelto. Esto es lo que le faltaba a la tabla para guardarlos enteros.
--
--  Lo que un menu cerrado necesita y ahi no cabia:
--
--    - Las SECCIONES. Un menu no es un parrafo: son entrantes, principal,
--      postre y bebidas, y cada bloque lleva su propia regla -"a compartir
--      cada 4 personas", "a elegir uno por persona"-. Esa nota es lo que
--      decide si una mesa de veinte entiende cuanta comida le llega, y sin
--      ella el precio no se puede juzgar.
--
--    - Las LINEAS. Texto suelto, no filas de `platos`: "mixto de aperitivos:
--      croquetas, ensaladilla y calamares" no es un plato de la carta ni va
--      a serlo. Enlazarlo obligaria a inventar platos para que cuadrara, y
--      esos platos inventados acabarian saliendo en la carta de verdad.
--
--    - Quien paga POR NINO. 13,00 EUR "por persona" en el menu infantil es
--      un precio equivocado, no un precio incompleto; el mismo problema que
--      el chuleton sin el "por kg" que arreglo la migracion 012.
--
--  restaurante_id pasa a admitir NULL: el menu es del grupo entero. Asi se
--  publican los tres primeros -mismos menus en las cuatro casas-. El dia que
--  una casa tenga el suyo se guarda con su id y no hay que tocar nada mas.
--
--  SIN columnas en ingles ni aleman, a proposito. Estos menus salen en la
--  portada, y la portada esta solo en castellano: el selector de idioma vive
--  en la carta, que es a donde llega el turista con el QR de la mesa. El dia
--  que los menus entren en la carta habra que traducirlos de verdad; dejar
--  ahora columnas vacias no adelanta ese trabajo, solo lo aparenta.
--
--  La tabla esta vacia -018 la dejo asi y ninguna semilla la rellena-, por
--  eso se pueden anadir columnas NOT NULL sin valor por defecto. Si en
--  alguna instalacion tuviera filas, esta migracion falla y se ve; que es lo
--  que queremos, porque significaria que alguien metio menus por su cuenta.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE menus_grupo
  MODIFY restaurante_id INT UNSIGNED NULL
    COMMENT 'NULL = menu de todo el grupo, no de una casa',

  -- El identificador con el que se le llama por su nombre desde las semillas
  -- y desde un enlace. Los ids numericos cambian de una instalacion a otra.
  ADD COLUMN slug VARCHAR(60) NOT NULL AFTER id,

  -- El orden en que se ensenan. Sin esto salen por id, que es el orden en
  -- que se cargaron: da igual hoy y deja de dar igual el dia que se anada
  -- uno nuevo y tenga que ir el primero.
  ADD COLUMN orden SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER minimo_comensales,

  -- Por persona o por nino. Ver arriba.
  ADD COLUMN unidad_precio ENUM('persona', 'nino') NOT NULL DEFAULT 'persona'
    COMMENT 'A que se refiere el precio'
    AFTER precio_por_persona,

  -- La linea de abajo del todo: "Incluye pan, mantequilla y mojo". Va aparte
  -- de las secciones porque no es un plato que se elija ni se comparta: es
  -- lo que entra en el precio y no hay que pedir.
  ADD COLUMN incluye VARCHAR(255) NULL
    COMMENT 'Lo que entra en el precio sin pedirlo'
    AFTER descripcion_en,

  ADD UNIQUE KEY uq_menus_grupo_slug (slug);

-- El minimo de comensales deja de ser obligatorio y pierde el 10 por
-- defecto. El menu infantil no tiene minimo propio -se pide junto al de los
-- mayores-, y un 10 puesto por descuido se lee en la web como una condicion
-- que la casa nunca ha impuesto. Vacio significa vacio.
ALTER TABLE menus_grupo
  MODIFY minimo_comensales TINYINT UNSIGNED NULL
    COMMENT 'Minimo de comensales. NULL = sin minimo propio';

-- ---------------------------------------------------------------------
-- menu_grupo_secciones  -- entrantes, principal, postre, bebidas
-- ---------------------------------------------------------------------
CREATE TABLE menu_grupo_secciones (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  menu_id  INT UNSIGNED NOT NULL,
  titulo   VARCHAR(60)  NOT NULL,
  -- Como se sirve ese bloque. NULL cuando no hay nada que aclarar: en el
  -- menu infantil cada nino lleva lo suyo y no hay que elegir ni repartir.
  nota     VARCHAR(160)     NULL,
  orden    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_secciones_menu (menu_id, orden),
  CONSTRAINT fk_secciones_menu FOREIGN KEY (menu_id)
    REFERENCES menus_grupo (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- menu_grupo_lineas  -- cada cosa que se sirve, tal cual se lee
-- ---------------------------------------------------------------------
CREATE TABLE menu_grupo_lineas (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  seccion_id INT UNSIGNED NOT NULL,
  texto      VARCHAR(255) NOT NULL,
  orden      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_lineas_seccion (seccion_id, orden),
  CONSTRAINT fk_lineas_seccion FOREIGN KEY (seccion_id)
    REFERENCES menu_grupo_secciones (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
