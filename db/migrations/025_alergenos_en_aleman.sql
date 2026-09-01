-- Los catorce alergenos en aleman.
--
-- No son una traduccion libre: son los terminos del anexo II del reglamento
-- europeo 1169/2011, los mismos que aparecen en cualquier carta alemana. Se
-- copian tal cual a proposito. Aqui "traducir con naturalidad" seria un error:
-- quien busca "Schalenfrüchte" porque es alergico necesita encontrar esa
-- palabra exacta, no un sinonimo mas bonito.
--
-- Por eso tambien "Milch" para lacteos y "Weichtiere" para moluscos, que es
-- como los nombra la norma, y no "Milchprodukte" ni "Schalentiere".

UPDATE alergenos SET nombre_de = 'Glutenhaltiges Getreide'    WHERE slug = 'gluten';
UPDATE alergenos SET nombre_de = 'Krebstiere'                 WHERE slug = 'crustaceos';
UPDATE alergenos SET nombre_de = 'Eier'                       WHERE slug = 'huevos';
UPDATE alergenos SET nombre_de = 'Fisch'                      WHERE slug = 'pescado';
UPDATE alergenos SET nombre_de = 'Erdnüsse'                   WHERE slug = 'cacahuetes';
UPDATE alergenos SET nombre_de = 'Soja'                       WHERE slug = 'soja';
UPDATE alergenos SET nombre_de = 'Milch'                      WHERE slug = 'lacteos';
UPDATE alergenos SET nombre_de = 'Schalenfrüchte'             WHERE slug = 'frutos-cascara';
UPDATE alergenos SET nombre_de = 'Sellerie'                   WHERE slug = 'apio';
UPDATE alergenos SET nombre_de = 'Senf'                       WHERE slug = 'mostaza';
UPDATE alergenos SET nombre_de = 'Sesamsamen'                 WHERE slug = 'sesamo';
UPDATE alergenos SET nombre_de = 'Schwefeldioxid und Sulfite' WHERE slug = 'sulfitos';
UPDATE alergenos SET nombre_de = 'Lupinen'                    WHERE slug = 'altramuces';
UPDATE alergenos SET nombre_de = 'Weichtiere'                 WHERE slug = 'moluscos';
