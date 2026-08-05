-- =====================================================================
--  Fase 3 - Ocupacion del local por tramos horarios
--
--  Cada hora, el comandero pregunta a sala como de lleno esta el local. Con
--  eso se saben las horas punta reales de cada casa, que hoy solo estan en la
--  cabeza del encargado.
-- =====================================================================

SET NAMES utf8mb4;

CREATE TABLE ocupacion (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  restaurante_id INT UNSIGNED    NOT NULL,
  usuario_id     INT UNSIGNED        NULL COMMENT 'Quien respondio',

  -- Instante de inicio del tramo, en UTC y truncado a la hora. Canarias va a
  -- UTC+0 o UTC+1, offsets enteros, asi que truncar en UTC cae en la misma
  -- frontera de hora que truncar en local.
  tramo          DATETIME        NOT NULL,

  -- Hora y dia ya en horario de Canarias, calculados al guardar.
  -- Se guardan resueltos para que las estadisticas no dependan de CONVERT_TZ,
  -- que necesita las tablas de zonas horarias cargadas en MySQL y en la
  -- imagen de Docker no vienen.
  hora_local     TINYINT UNSIGNED NOT NULL,
  dia_semana     TINYINT UNSIGNED NOT NULL COMMENT '0=domingo ... 6=sabado',

  -- 0 vacio, 1 flojo, 2 normal, 3 lleno, 4 a tope (sin sitio)
  nivel          TINYINT UNSIGNED NOT NULL,
  comensales     SMALLINT UNSIGNED    NULL COMMENT 'Aproximado, opcional',
  nota           VARCHAR(255)         NULL,

  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  -- Una lectura por local y tramo: si se responde dos veces, se corrige la
  -- anterior en lugar de duplicarla.
  UNIQUE KEY uq_ocupacion_tramo (restaurante_id, tramo),
  KEY ix_ocupacion_historico (restaurante_id, tramo),
  KEY ix_ocupacion_patron (restaurante_id, dia_semana, hora_local),
  CONSTRAINT fk_ocupacion_restaurante FOREIGN KEY (restaurante_id)
    REFERENCES restaurantes (id) ON DELETE CASCADE,
  CONSTRAINT fk_ocupacion_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT ck_ocupacion_nivel CHECK (nivel BETWEEN 0 AND 4),
  CONSTRAINT ck_ocupacion_hora CHECK (hora_local BETWEEN 0 AND 23),
  CONSTRAINT ck_ocupacion_dia CHECK (dia_semana BETWEEN 0 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
