-- =====================================================================
--  Boton de reservar apuntando fuera
--
--  Cada local decide adonde lleva su boton de reservar. Si esta vacio, al
--  formulario de siempre; si tiene una direccion, ahi (el widget de
--  CoverManager, TheFork, lo que sea).
--
--  Va por local y no en una variable de entorno porque las cuatro casas no
--  tienen por que ir a la vez: se puede probar en una y dejar las otras como
--  estan, y volver atras borrando un campo.
--
--  Lo que hay que tener claro al usarlo: una reserva hecha fuera NO queda
--  registrada aqui. Se pierden la bandeja del panel, el aviso al local y el
--  historico. Por eso el panel lo avisa en vez de presentarlo como una
--  opcion mas.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE restaurantes
  ADD COLUMN url_reservas VARCHAR(500) NULL
    COMMENT 'Si esta puesta, el boton de reservar lleva aqui en vez de al formulario'
    AFTER covermanager_id;
