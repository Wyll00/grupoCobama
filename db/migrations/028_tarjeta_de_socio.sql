-- Tarjeta de socio: visitas y premios.
--
-- Un cliente se hace socio, recibe una tarjeta con su codigo y su QR, y cada
-- vez que viene sala le apunta la visita. A las 8 visitas se le premia.
--
-- ---------------------------------------------------------------------------
-- LAS VISITAS SE CUENTAN EN EL GRUPO ENTERO
--
-- Cada visita guarda en que casa fue -eso no se pierde y se puede mirar-, pero
-- lo que suma para el premio es el total de las cuatro. Una tarjeta que solo
-- vale en una casa es cuatro programas de fidelidad distintos; esta es la
-- ventaja de tener un solo grupo y una sola base.
--
-- Si se quisiera por casa, lo unico que cambia es el COUNT de
-- `socios.service.js`: la tabla de visitas ya guarda el restaurante.
-- ---------------------------------------------------------------------------

CREATE TABLE socios (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- El codigo va impreso en la tarjeta, dentro del QR, y se dicta por
  -- telefono cuando el movil no tiene bateria. Mismo alfabeto que el de las
  -- reservas: sin 0/O ni 1/I/L, que al dictarlos se confunden.
  codigo     VARCHAR(10)  NOT NULL,

  nombre     VARCHAR(120) NOT NULL,
  telefono   VARCHAR(30)  NULL,
  email      VARCHAR(150) NULL,

  -- La casa donde se hizo socio. No limita nada -la tarjeta vale en las
  -- cuatro-, pero dice de donde viene cada alta, que es lo que permite saber
  -- si el programa lo esta moviendo alguien o nadie.
  alta_restaurante_id INT UNSIGNED NULL,

  activo     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_socios_codigo (codigo),
  KEY idx_socios_nombre (nombre),
  CONSTRAINT fk_socios_restaurante
    FOREIGN KEY (alta_restaurante_id) REFERENCES restaurantes (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE socio_visitas (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  socio_id       INT UNSIGNED NOT NULL,
  restaurante_id INT UNSIGNED NOT NULL,

  -- El DIA de la visita, ya resuelto a hora de Canarias por quien la apunta.
  -- Se guarda aparte de `created_at` porque es la clave del limite de abajo y
  -- porque una visita de las 00:30 del sabado es del viernes para la casa.
  fecha          DATE         NOT NULL,

  -- Quien la apunto, para poder preguntar si algo no cuadra.
  usuario_id     INT UNSIGNED NULL,
  nota           VARCHAR(160) NULL,

  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- UNA VISITA POR SOCIO, CASA Y DIA.
  --
  -- Es la regla que impide que ocho pulsaciones seguidas en el comandero
  -- regalen un premio. Lo normal no es el fraude: es que sala pulse dos veces
  -- porque no vio si habia cogido. Con esto, la segunda no cuenta y no hay que
  -- deshacer nada.
  --
  -- Por CASA y no solo por socio: comer a mediodia en Guamasa y cenar en
  -- Candelaria el mismo dia son dos visitas de verdad.
  UNIQUE KEY uq_visita_dia (socio_id, restaurante_id, fecha),
  KEY idx_visitas_socio (socio_id),
  KEY idx_visitas_fecha (fecha),

  CONSTRAINT fk_visitas_socio
    FOREIGN KEY (socio_id) REFERENCES socios (id) ON DELETE CASCADE,
  CONSTRAINT fk_visitas_restaurante
    FOREIGN KEY (restaurante_id) REFERENCES restaurantes (id),
  CONSTRAINT fk_visitas_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE socio_premios (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  socio_id    INT UNSIGNED NOT NULL,

  -- Con cuantas visitas se gano. Se guarda el numero y no solo la fecha
  -- porque el dia que se cambie el umbral -de 8 a 10, por ejemplo- los
  -- premios viejos tienen que seguir contando lo que contaron.
  visitas     SMALLINT UNSIGNED NOT NULL,

  ganado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Hasta que no se entrega, el premio esta pendiente y sale en la tarjeta.
  entregado_en   DATETIME     NULL,
  entregado_por  INT UNSIGNED NULL,
  entregado_nota VARCHAR(160) NULL,

  PRIMARY KEY (id),
  -- Un premio por cada escalon: sin esto, dos visitas a la vez en dos casas
  -- podrian generar dos premios por el mismo 8.
  UNIQUE KEY uq_premio_escalon (socio_id, visitas),
  KEY idx_premios_pendientes (socio_id, entregado_en),

  CONSTRAINT fk_premios_socio
    FOREIGN KEY (socio_id) REFERENCES socios (id) ON DELETE CASCADE,
  CONSTRAINT fk_premios_usuario
    FOREIGN KEY (entregado_por) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
