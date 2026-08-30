-- Marca de producto canario.
--
-- El dato ya existia en la carta de papel de La Basilica -19 platos llevan la
-- etiqueta 'canaria' en La Basilica/assets/carta.js- pero se perdia al
-- importar, porque no habia donde guardarlo.
--
-- Va en `platos` y no en `carta_items` porque es una propiedad del plato, no
-- de lo que cobra cada casa: el escaldon es canario en las cuatro.

ALTER TABLE platos
  ADD COLUMN es_canario TINYINT(1) NOT NULL DEFAULT 0 AFTER es_vegano;
