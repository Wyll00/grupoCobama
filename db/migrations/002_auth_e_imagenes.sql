-- =====================================================================
--  Fase 2 - Autenticacion e imagenes de platos
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- refresh_tokens
--
-- El refresh token viaja en una cookie httpOnly y se guarda hasheado con
-- SHA-256, no con bcrypt: es un valor aleatorio de 256 bits, no una
-- contrasena de baja entropia, asi que no hace falta un hash lento y se
-- evita pagar el coste de bcrypt en cada renovacion.
--
-- Rotacion: cada uso emite un token nuevo y marca el anterior como
-- reemplazado. Si llega un token ya revocado, es senal de robo y se revoca
-- la familia entera del usuario.
-- ---------------------------------------------------------------------
CREATE TABLE refresh_tokens (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id      INT UNSIGNED    NOT NULL,
  token_hash      CHAR(64)        NOT NULL COMMENT 'SHA-256 en hexadecimal',
  expira_en       DATETIME        NOT NULL,
  revocado_en     DATETIME            NULL,
  reemplazado_por CHAR(64)            NULL,
  user_agent      VARCHAR(255)        NULL,
  ip              VARCHAR(45)         NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_hash (token_hash),
  KEY ix_refresh_usuario (usuario_id, revocado_en),
  KEY ix_refresh_expira (expira_en),
  CONSTRAINT fk_refresh_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Miniatura de plato.
-- `imagen` guarda la version grande (1200x900 webp) y `imagen_thumb` la
-- pequena (400x300 webp). Se guardan las dos rutas en lugar de derivar una
-- de la otra por convencion de nombre: el dia que las imagenes se sirvan
-- desde R2 con nombres opacos, la convencion se rompe.
-- ---------------------------------------------------------------------
ALTER TABLE platos
  ADD COLUMN imagen_thumb VARCHAR(255) NULL AFTER imagen;
