-- =====================================================================
--  Fecha de revision de alergenos por plato
--
--  Los alergenos que hay cargados vienen de transcribir a mano las fotos de
--  la carta impresa. Sirve para trabajar, pero no es una fuente valida: la
--  informacion de alergenos es obligacion legal (Reglamento UE 1169/2011) y
--  quien responde de ella es el establecimiento, no una transcripcion.
--
--  Sin una marca de "esto lo ha mirado alguien de cocina", en dos meses nadie
--  sabra que filas estan confirmadas y cuales se copiaron de una foto. Y esa
--  duda no se puede resolver mirando los datos: un plato con los alergenos
--  bien y otro con los alergenos mal se ven exactamente igual.
--
--  NULL = nadie lo ha confirmado todavia. Es el estado por defecto a
--  proposito: confirmar es un acto, no la ausencia de uno.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE platos
  ADD COLUMN alergenos_revisados_en DATETIME NULL
    COMMENT 'Cuando cocina confirmo los alergenos. NULL = sin confirmar'
    AFTER activo,
  ADD COLUMN alergenos_revisados_por INT UNSIGNED NULL
    COMMENT 'Quien lo confirmo'
    AFTER alergenos_revisados_en;

-- ON DELETE SET NULL y no CASCADE: si se borra el usuario no se puede perder
-- el plato, y perder solo el nombre de quien firmo es asumible.
ALTER TABLE platos
  ADD CONSTRAINT fk_platos_revisor FOREIGN KEY (alergenos_revisados_por)
    REFERENCES usuarios (id) ON DELETE SET NULL;

-- Para sacar rapido la lista de lo que queda por confirmar.
CREATE INDEX ix_platos_revision ON platos (alergenos_revisados_en);
