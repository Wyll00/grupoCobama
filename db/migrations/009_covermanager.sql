-- =====================================================================
--  Envio de reservas a CoverManager
--
--  La reserva se guarda SIEMPRE aqui primero y despues se intenta enviar.
--  Nunca al reves. Si se enviara primero, una caida de su lado o un timeout
--  dejaria al cliente sin reserva y sin saberlo, y no habria ni rastro para
--  reclamar. Guardando primero, lo peor que pasa es que haya que reenviarla.
--
--  Por eso el envio es un estado de la reserva y no un efecto secundario:
--  una reserva puede existir aqui y no haber llegado alli todavia, y sala
--  tiene que poder verlo.
--
--  Cada local tiene su propia cuenta en CoverManager, asi que el
--  identificador va en restaurantes y no en una variable de entorno suelta.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE restaurantes
  ADD COLUMN covermanager_id VARCHAR(80) NULL
    COMMENT 'Identificador del local en CoverManager. NULL = no integrado'
    AFTER activo;

ALTER TABLE reservas
  -- no_aplica: el local no tiene CoverManager, o la reserva la metio sala
  --            desde el panel estando ya en su sistema.
  -- pendiente: hay que enviarla.
  -- enviando:  hay un intento en curso. Es lo que impide que dos pasadas
  --            del reintentador cojan la misma fila y la manden dos veces.
  -- enviada:   confirmada al otro lado, con su identificador.
  -- error:     fallo el ultimo intento; se reintenta segun cm_proximo_intento.
  ADD COLUMN cm_estado ENUM('no_aplica','pendiente','enviando','enviada','error')
    NOT NULL DEFAULT 'no_aplica'
    COMMENT 'Estado del envio a CoverManager'
    AFTER anonimizada_en,

  ADD COLUMN cm_id VARCHAR(80) NULL
    COMMENT 'Identificador que devuelve CoverManager'
    AFTER cm_estado,

  ADD COLUMN cm_intentos TINYINT UNSIGNED NOT NULL DEFAULT 0
    AFTER cm_id,

  -- Espera creciente entre intentos. Si su API esta caida, insistir cada
  -- pocos segundos no la arregla y solo llena el log.
  ADD COLUMN cm_proximo_intento DATETIME NULL
    COMMENT 'Cuando toca reintentar'
    AFTER cm_intentos,

  ADD COLUMN cm_ultimo_error VARCHAR(500) NULL
    COMMENT 'Que fallo, para poder verlo desde el panel'
    AFTER cm_proximo_intento,

  ADD COLUMN cm_enviada_en DATETIME NULL
    AFTER cm_ultimo_error;

-- El reintentador busca por estado y por cuando toca: sin indice, cada pasada
-- recorreria la tabla entera de reservas.
CREATE INDEX ix_reservas_cm ON reservas (cm_estado, cm_proximo_intento);
