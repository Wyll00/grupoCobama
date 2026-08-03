-- =====================================================================
--  Grupo Cobama - Esquema inicial
--  MySQL 8.0 / InnoDB / utf8mb4
--
--  Convenciones:
--   - Precios en DECIMAL(6,2). Nunca FLOAT.
--   - Borrado logico con `activo`. Nunca DELETE (el historico lo necesita).
--   - Campos *_en desde el principio, aunque se rellenen mas tarde.
--   - Todas las tablas con created_at / updated_at.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- restaurantes
-- ---------------------------------------------------------------------
CREATE TABLE restaurantes (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  slug            VARCHAR(60)     NOT NULL,
  nombre          VARCHAR(120)    NOT NULL,
  municipio       VARCHAR(80)     NOT NULL,
  direccion       VARCHAR(200)    NOT NULL,
  telefono        VARCHAR(20)         NULL,
  email           VARCHAR(120)        NULL,
  whatsapp        VARCHAR(20)         NULL,
  lat             DECIMAL(10,7)       NULL,
  lng             DECIMAL(10,7)       NULL,
  descripcion     TEXT                NULL,
  descripcion_en  TEXT                NULL,
  reclamo         VARCHAR(180)        NULL COMMENT 'Frase corta para tarjetas y cabeceras',
  reclamo_en      VARCHAR(180)        NULL,
  imagen_portada  VARCHAR(255)        NULL,
  tiene_parking   TINYINT(1)      NOT NULL DEFAULT 0,
  orden           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  activo          TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_restaurantes_slug (slug),
  KEY ix_restaurantes_activo (activo, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- horarios
--   dia_semana: 0=domingo ... 6=sabado (compatible con Date.getDay() de JS)
--   hora_cierre admite valores >= '24:00:00' para cierres pasada medianoche
--   (el tipo TIME de MySQL llega hasta 838:59:59). Viernes y sabado cierran
--   a las 00:00 del dia siguiente -> se almacena '24:00:00'.
-- ---------------------------------------------------------------------
CREATE TABLE horarios (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  restaurante_id  INT UNSIGNED    NOT NULL,
  dia_semana      TINYINT UNSIGNED NOT NULL,
  hora_apertura   TIME                NULL,
  hora_cierre     TIME                NULL,
  cerrado         TINYINT(1)      NOT NULL DEFAULT 0,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_horarios_restaurante_dia (restaurante_id, dia_semana),
  CONSTRAINT fk_horarios_restaurante FOREIGN KEY (restaurante_id)
    REFERENCES restaurantes (id) ON DELETE CASCADE,
  CONSTRAINT ck_horarios_dia CHECK (dia_semana BETWEEN 0 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- categorias
-- ---------------------------------------------------------------------
CREATE TABLE categorias (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(60)      NOT NULL,
  nombre      VARCHAR(80)      NOT NULL,
  nombre_en   VARCHAR(80)          NULL,
  orden       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  activo      TINYINT(1)       NOT NULL DEFAULT 1,
  created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- alergenos  (14 de declaracion obligatoria, Reglamento UE 1169/2011)
-- ---------------------------------------------------------------------
CREATE TABLE alergenos (
  id          TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(40)      NOT NULL,
  nombre      VARCHAR(60)      NOT NULL,
  nombre_en   VARCHAR(60)          NULL,
  icono       VARCHAR(60)          NULL COMMENT 'Nombre del fichero/emoji del icono',
  created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_alergenos_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- platos  -- catalogo maestro del grupo
--   Un plato existe UNA vez para todo el grupo. Que local lo sirve y a que
--   precio se decide en carta_items.
-- ---------------------------------------------------------------------
CREATE TABLE platos (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  categoria_id    INT UNSIGNED   NOT NULL,
  nombre          VARCHAR(150)   NOT NULL,
  nombre_en       VARCHAR(150)       NULL,
  descripcion     TEXT               NULL,
  descripcion_en  TEXT               NULL,
  imagen          VARCHAR(255)       NULL,
  es_vegetariano  TINYINT(1)     NOT NULL DEFAULT 0,
  es_vegano       TINYINT(1)     NOT NULL DEFAULT 0,
  activo          TINYINT(1)     NOT NULL DEFAULT 1,
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_platos_categoria (categoria_id, activo),
  CONSTRAINT fk_platos_categoria FOREIGN KEY (categoria_id)
    REFERENCES categorias (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- plato_alergenos
-- ---------------------------------------------------------------------
CREATE TABLE plato_alergenos (
  plato_id     INT UNSIGNED     NOT NULL,
  alergeno_id  TINYINT UNSIGNED NOT NULL,
  trazas       TINYINT(1)       NOT NULL DEFAULT 0 COMMENT '1 = puede contener trazas',
  PRIMARY KEY (plato_id, alergeno_id),
  KEY ix_plato_alergenos_alergeno (alergeno_id),
  CONSTRAINT fk_pa_plato FOREIGN KEY (plato_id)
    REFERENCES platos (id) ON DELETE CASCADE,
  CONSTRAINT fk_pa_alergeno FOREIGN KEY (alergeno_id)
    REFERENCES alergenos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- usuarios
--   rol admin_grupo -> restaurante_id NULL (acceso a los cuatro locales)
--   rol encargado_local -> restaurante_id obligatorio
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(120) NOT NULL,
  email           VARCHAR(150) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  rol             ENUM('admin_grupo','encargado_local') NOT NULL,
  restaurante_id  INT UNSIGNED     NULL,
  activo          TINYINT(1)   NOT NULL DEFAULT 1,
  ultimo_acceso   DATETIME         NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email),
  KEY ix_usuarios_restaurante (restaurante_id),
  CONSTRAINT fk_usuarios_restaurante FOREIGN KEY (restaurante_id)
    REFERENCES restaurantes (id),
  CONSTRAINT ck_usuarios_ambito CHECK (
    (rol = 'admin_grupo'     AND restaurante_id IS NULL) OR
    (rol = 'encargado_local' AND restaurante_id IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- carta_items  -- que sirve cada local y a que precio
-- ---------------------------------------------------------------------
CREATE TABLE carta_items (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  restaurante_id  INT UNSIGNED  NOT NULL,
  plato_id        INT UNSIGNED  NOT NULL,
  precio          DECIMAL(6,2)  NOT NULL,
  activo          TINYINT(1)    NOT NULL DEFAULT 1,
  orden           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  destacado       TINYINT(1)    NOT NULL DEFAULT 0,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_carta_restaurante_plato (restaurante_id, plato_id),
  KEY ix_carta_listado (restaurante_id, activo, orden),
  KEY ix_carta_plato (plato_id),
  CONSTRAINT fk_carta_restaurante FOREIGN KEY (restaurante_id)
    REFERENCES restaurantes (id) ON DELETE CASCADE,
  CONSTRAINT fk_carta_plato FOREIGN KEY (plato_id)
    REFERENCES platos (id),
  CONSTRAINT ck_carta_precio CHECK (precio >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- historico_precios
--   Se escribe desde el servicio (cartaService.actualizarPrecio) dentro de
--   la misma transaccion que el UPDATE, para poder registrar el usuario_id.
--   No se usa trigger: un trigger no conoce al usuario autenticado sin
--   variables de sesion, fragiles con pool de conexiones.
-- ---------------------------------------------------------------------
CREATE TABLE historico_precios (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  carta_item_id   INT UNSIGNED    NOT NULL,
  precio_anterior DECIMAL(6,2)    NOT NULL,
  precio_nuevo    DECIMAL(6,2)    NOT NULL,
  usuario_id      INT UNSIGNED        NULL,
  fecha           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_historico_item_fecha (carta_item_id, fecha),
  CONSTRAINT fk_historico_item FOREIGN KEY (carta_item_id)
    REFERENCES carta_items (id) ON DELETE CASCADE,
  CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- reservas
-- ---------------------------------------------------------------------
CREATE TABLE reservas (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  restaurante_id  INT UNSIGNED NOT NULL,
  nombre          VARCHAR(120) NOT NULL,
  telefono        VARCHAR(30)  NOT NULL,
  email           VARCHAR(150)     NULL,
  fecha           DATE         NOT NULL,
  hora            TIME         NOT NULL,
  comensales      TINYINT UNSIGNED NOT NULL,
  observaciones   TEXT             NULL,
  estado          ENUM('pendiente','confirmada','cancelada','no_presentado')
                    NOT NULL DEFAULT 'pendiente',
  origen          ENUM('web','whatsapp','telefono') NOT NULL DEFAULT 'web',
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_reservas_agenda (restaurante_id, fecha, hora),
  KEY ix_reservas_estado (restaurante_id, estado, fecha),
  CONSTRAINT fk_reservas_restaurante FOREIGN KEY (restaurante_id)
    REFERENCES restaurantes (id),
  CONSTRAINT ck_reservas_comensales CHECK (comensales BETWEEN 1 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- menus_grupo  -- menus cerrados para eventos y celebraciones
-- ---------------------------------------------------------------------
CREATE TABLE menus_grupo (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  restaurante_id     INT UNSIGNED NOT NULL,
  nombre             VARCHAR(150) NOT NULL,
  nombre_en          VARCHAR(150)     NULL,
  descripcion        TEXT             NULL,
  descripcion_en     TEXT             NULL,
  precio_por_persona DECIMAL(6,2) NOT NULL,
  minimo_comensales  TINYINT UNSIGNED NOT NULL DEFAULT 10,
  activo             TINYINT(1)   NOT NULL DEFAULT 1,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_menus_restaurante (restaurante_id, activo),
  CONSTRAINT fk_menus_restaurante FOREIGN KEY (restaurante_id)
    REFERENCES restaurantes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
