-- =====================================================================
--  RGPD en la tarjeta de socio.
--
--  Hasta ahora un socio solo lo daba de alta el personal, en la mesa y con
--  el cliente delante. Desde que cualquiera puede hacerse la tarjeta desde
--  la web, el grupo recoge nombre, telefono y correo de gente a la que no
--  ha visto, y eso hay que poder justificarlo.
--
--  Las bases legales, que NO son la misma para las dos cosas:
--
--    la tarjeta    base legal: ejecucion de un contrato (art. 6.1.b). Alguien
--                  pide una tarjeta de fidelidad; para llevarle la cuenta de
--                  las visitas hacen falta sus datos. NO se pide
--                  consentimiento para esto: pedirlo seria enganoso, porque
--                  sin datos no hay tarjeta y no habria nada que consentir.
--                  Lo que si se guarda es que se le enseno la politica.
--
--    el marketing  base legal: consentimiento (art. 6.1.a). Mandarle ofertas
--                  no hace falta para llevarle las visitas, asi que va en una
--                  casilla aparte, desmarcada, y se guarda cuando la marco.
--
--  Mismo criterio y mismas columnas que `008_rgpd_reservas.sql`: se guarda la
--  VERSION de la politica y no solo la fecha, porque cuando el texto cambie
--  una fecha suelta no dice que leyo esa persona.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE socios
  ADD COLUMN politica_version VARCHAR(20) NULL
    COMMENT 'Version de la politica que se le enseno. NULL en altas hechas en sala'
    AFTER email,
  ADD COLUMN politica_aceptada_en DATETIME NULL
    COMMENT 'Cuando confirmo haber leido la politica'
    AFTER politica_version,
  ADD COLUMN marketing TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'Consentimiento para comunicaciones comerciales. Por defecto 0'
    AFTER politica_aceptada_en,
  ADD COLUMN marketing_en DATETIME NULL
    COMMENT 'Cuando lo dio. Prueba del consentimiento (art. 7.1)'
    AFTER marketing,

  -- De donde salio el alta. No es lo mismo una tarjeta que pidio alguien en
  -- la mesa -con el encargado delante- que una que se hizo sola desde el
  -- movil: si algun dia aparecen altas basura, lo primero que hay que poder
  -- responder es por donde entraron.
  ADD COLUMN via VARCHAR(10) NOT NULL DEFAULT 'sala'
    COMMENT 'sala | web. Por donde se dio de alta'
    AFTER marketing_en;
