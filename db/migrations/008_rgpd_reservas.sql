-- =====================================================================
--  RGPD en las reservas
--
--  El formulario recoge nombre, telefono y email de clientes y hasta ahora
--  no informaba de nada. Eso incumple el art. 13 del RGPD, que no pide un
--  permiso: pide INFORMAR en el momento de recoger los datos.
--
--  Dos cosas que se confunden mucho y que aqui van separadas a proposito:
--
--    la reserva      base legal: ejecucion de un contrato (art. 6.1.b).
--                    NO se pide consentimiento. Pedirlo seria enganoso,
--                    porque no se puede reservar sin dar el telefono: un
--                    permiso que no se puede negar no es un permiso.
--                    Lo que se guarda es que se informo, y con que texto.
--
--    el marketing    base legal: consentimiento (art. 6.1.a). Aqui si, y
--                    tiene que ser voluntario, separado y desmarcado por
--                    defecto. Y hay que poder demostrarlo (art. 7.1).
--
--  Se guarda la VERSION de la politica, no solo la fecha. Cuando el texto
--  cambie, una fecha suelta no dice que leyo esa persona, porque el texto
--  de entonces ya no existe.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE reservas
  ADD COLUMN politica_version VARCHAR(20) NULL
    COMMENT 'Version de la politica que se le enseno. NULL en reservas por telefono'
    AFTER observaciones,
  ADD COLUMN politica_aceptada_en DATETIME NULL
    COMMENT 'Cuando confirmo haber leido la politica'
    AFTER politica_version,
  ADD COLUMN marketing TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'Consentimiento para comunicaciones comerciales. Por defecto 0'
    AFTER politica_aceptada_en,
  ADD COLUMN marketing_en DATETIME NULL
    COMMENT 'Cuando lo dio. Prueba del consentimiento (art. 7.1)'
    AFTER marketing,
  ADD COLUMN anonimizada_en DATETIME NULL
    COMMENT 'Cuando se borraron los datos personales por antiguedad'
    AFTER marketing_en;

-- El borrado por antiguedad recorre por fecha y salta lo ya anonimizado.
CREATE INDEX ix_reservas_purga ON reservas (fecha, anonimizada_en);
