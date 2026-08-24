-- Fuera los menus de grupo de la ficha del local.
--
-- Las cinco filas eran inventadas: salieron del seed provisional, no de
-- ninguna carta real, y llevaban meses publicadas con precio y minimo de
-- comensales como si fueran ofertas de verdad. Un cliente que llama para
-- reservar diez personas a 24 EUR citando algo que nadie en la cocina ha
-- aprobado es un problema en la puerta, no un detalle de la web.
--
-- Se borran las filas, NO la tabla. Los menus cerrados para grupos son un
-- producto normal de un restaurante y es probable que vuelvan con datos de
-- verdad; tirar la tabla obligaria a otra migracion para recrearla igual.
-- Vacia no cuesta nada y la ficha ya no la consulta.

DELETE FROM menus_grupo;
