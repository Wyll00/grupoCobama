-- =====================================================================
--  Fase 3 - Reservas
--
--  La tabla ya venia del esquema inicial. Aqui se le anaden las dos cosas
--  que hacen falta para usarla de verdad.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE reservas
  -- Referencia corta que se le da al cliente y que sala puede buscar cuando
  -- llama alguien preguntando por su reserva. El id numerico no vale: es
  -- correlativo, asi que con el de uno se adivinan los demas.
  ADD COLUMN codigo CHAR(6) NULL AFTER id,

  -- Lo que apunta sala y el cliente no ve: "vienen con carrito", "prefieren
  -- terraza", "el ano pasado no aparecieron".
  ADD COLUMN notas_internas VARCHAR(500) NULL AFTER observaciones,

  -- Quien la atendio desde el panel, para poder preguntar.
  ADD COLUMN usuario_id INT UNSIGNED NULL AFTER origen,

  ADD CONSTRAINT fk_reservas_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE SET NULL;

-- El codigo se busca tal cual desde sala, asi que va indexado.
CREATE UNIQUE INDEX uq_reservas_codigo ON reservas (codigo);
