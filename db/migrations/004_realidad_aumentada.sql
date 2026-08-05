-- =====================================================================
--  Fase 3 - Ver el plato en la mesa (realidad aumentada)
--
--  La pregunta que hace el cliente delante de la carta es "esto es grande o
--  pequeno". Con una sola medida real por plato se puede responder: se genera
--  al vuelo un modelo a escala desde la foto que ya existe, y el movil lo
--  planta encima de la mesa al tamano que va a llegar.
--
--  Los campos de modelo son para los platos que merezcan un escaneo 3D de
--  verdad; el resto tira de la foto.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE platos
  -- Ancho real de lo que se sirve, borde a borde del plato o la fuente.
  -- Es el unico dato que hay que medir, y con una regla en cocina se saca en
  -- un minuto por plato.
  ADD COLUMN ancho_cm DECIMAL(5,1) NULL
    COMMENT 'Ancho real del plato servido, en centimetros' AFTER imagen_thumb,

  -- Modelo 3D subido a mano, si algun dia se escanea el plato.
  -- glb lo usa Android (Scene Viewer) y usdz lo usa iOS (AR Quick Look): son
  -- dos formatos distintos porque son dos visores distintos, no hay uno solo
  -- que valga para ambos.
  ADD COLUMN modelo_glb  VARCHAR(255) NULL AFTER ancho_cm,
  ADD COLUMN modelo_usdz VARCHAR(255) NULL AFTER modelo_glb;
