-- La una del mediodia SI se reserva.
--
-- La franja empezaba a las 13:00 y el limite de abajo es inclusivo, asi que
-- las 13:00 quedaban fuera. Pero "hasta la una" incluye la una: quien pide
-- mesa para las 13:00 un sabado tiene que poder.
--
-- Se mueve el principio al siguiente hueco de cuarto de hora. Asi la columna
-- se sigue leyendo tal cual -"sin reservas desde las 13:15"- y el codigo no
-- cambia: solo cambia el dato, que es justo para lo que se puso en la tabla y
-- no escrito a fuego.
--
-- Queda: ultima mesa a las 13:00, nada de 13:15 a 16:45, y otra vez desde las
-- 17:00.

UPDATE horarios
   SET sin_reservas_desde = '13:15:00'
 WHERE sin_reservas_desde = '13:00:00';
