# Iconos de alergenos

Deja aqui el original de cada icono y ejecuta:

```
npm run alergenos --prefix api
```

El script recorta el margen, lo cuadra a 128x128, lo guarda en WebP dentro de
`web/public/alergenos/` y apunta el fichero en la columna `alergenos.icono`.

## Como se llaman los ficheros

El nombre debe ser el slug del alergeno. Valen PNG, JPG, SVG y WebP.

| Fichero          | Alergeno                     |
| ---------------- | ---------------------------- |
| gluten           | Gluten                       |
| crustaceos       | Crustaceos                   |
| huevos           | Huevos                       |
| pescado          | Pescado                      |
| cacahuetes       | Cacahuetes                   |
| soja             | Soja                         |
| lacteos          | Lacteos                      |
| frutos-cascara   | Frutos de cascara            |
| apio             | Apio                         |
| mostaza          | Mostaza                      |
| sesamo           | Granos de sesamo             |
| sulfitos         | Dioxido de azufre y sulfitos |
| altramuces       | Altramuces                   |
| moluscos         | Moluscos                     |

Hay algunos alias admitidos por comodidad (`pescados`, `granos_de_sesamo`,
`dioxido_azufre_sulfitos`, `frutos_de_cascara`, `leche`). Si el nombre no
cuadra con ninguno, el script lo dice en vez de generar un fichero suelto.

## Estado

Los 14 estan. Los 12 primeros llegaron el 13-08-2026 y los dos que faltaban
-`gluten` y `mostaza`- el 30-08-2026.
