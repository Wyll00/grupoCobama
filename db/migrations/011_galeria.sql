-- =====================================================================
--  Galeria de fotos
--
--  Una fila por foto. restaurante_id NULL = foto del grupo, que sale en la
--  galeria general y no en la de ninguna casa concreta.
--
--  Se guardan ancho y alto. No es un dato de adorno: sin ellos el navegador
--  no sabe cuanto sitio reservar y la pagina pega saltos segun van cargando
--  las fotos, que en una galeria de treinta es insufrible. Con las medidas
--  se reserva el hueco exacto desde el primer momento.
--
--  Y se guardan las medidas REALES, no una proporcion fija: aqui las fotos
--  conservan su encuadre. Las de plato van recortadas a 4:3 porque tienen
--  que cuadrar en una rejilla junto al precio, pero forzar eso mismo en una
--  galeria decapita a la gente y corta los platos por la mitad.
-- =====================================================================

SET NAMES utf8mb4;

CREATE TABLE galeria (
  id             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  restaurante_id INT UNSIGNED         NULL COMMENT 'NULL = foto del grupo',

  categoria      ENUM('plato','local','equipo','evento')
                 NOT NULL DEFAULT 'local',

  imagen         VARCHAR(255)     NOT NULL,
  imagen_thumb   VARCHAR(255)     NOT NULL,
  ancho          SMALLINT UNSIGNED NOT NULL,
  alto           SMALLINT UNSIGNED NOT NULL,

  titulo         VARCHAR(150)         NULL COMMENT 'Pie de foto, opcional',

  -- Descripcion para quien no ve la foto: lectores de pantalla y buscadores.
  -- NULL a proposito y no cadena vacia: hay que poder distinguir "no lo ha
  -- escrito nadie todavia" de "esta foto es decorativa y no dice nada".
  -- El panel avisa de las que estan sin describir.
  alt            VARCHAR(255)         NULL,

  orden          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  activo         TINYINT(1)       NOT NULL DEFAULT 1,

  created_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  -- La consulta de la galeria publica es siempre "las de este local (o las
  -- del grupo), activas, por orden".
  KEY ix_galeria_local (restaurante_id, activo, orden),
  KEY ix_galeria_categoria (categoria, activo),

  CONSTRAINT fk_galeria_restaurante FOREIGN KEY (restaurante_id)
    REFERENCES restaurantes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
