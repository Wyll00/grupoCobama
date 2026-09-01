-- Franja sin reservas dentro del horario de apertura.
--
-- Sabados y domingos las cuatro casas dejan de aceptar reservas entre las
-- 13:00 y las 17:00: esa franja se guarda para quien llega sin reservar, que
-- es unos tres de cada cuatro sitios en el momento de mas gente.
--
-- El nombre de las columnas importa. NO es un descanso ni un cierre: la
-- cocina sigue abierta -de eso habla el cartel de "cocina ininterrumpida" de
-- la portada, y sigue siendo verdad-. Lo unico que se corta son las reservas,
-- y si esto se llamara "descanso" el siguiente que lo lea cerrara el local a
-- mediodia sin querer.
--
-- Va en la tabla y no escrito en el codigo porque `horarios` ya esta modelada
-- por dia y por local: asi una casa puede tener otra franja, o ninguna, sin
-- que nadie publique una version. Dos columnas y no filas nuevas porque hay
-- un UNIQUE por (restaurante, dia) y porque el caso real es un unico hueco en
-- medio de una jornada continua.

ALTER TABLE horarios
  ADD COLUMN sin_reservas_desde TIME NULL AFTER hora_cierre,
  ADD COLUMN sin_reservas_hasta TIME NULL AFTER sin_reservas_desde;

-- Las dos o ninguna: media franja no significa nada y dejaria el generador de
-- horas comparando contra NULL.
ALTER TABLE horarios
  ADD CONSTRAINT ck_horarios_sin_reservas
  CHECK (
    (sin_reservas_desde IS NULL AND sin_reservas_hasta IS NULL)
    OR (sin_reservas_desde IS NOT NULL AND sin_reservas_hasta IS NOT NULL
        AND sin_reservas_desde < sin_reservas_hasta)
  );

-- dia_semana: 0 = domingo, 6 = sabado (ver db/seeds/001_base.sql).
UPDATE horarios
   SET sin_reservas_desde = '13:00:00', sin_reservas_hasta = '17:00:00'
 WHERE dia_semana IN (0, 6);
