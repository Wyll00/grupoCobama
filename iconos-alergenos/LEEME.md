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

## Que falta

Del envio del 13-08-2026 llegaron 12 de los 14: **faltan `gluten` y
`mostaza`**. Mientras no esten, esos dos salen en la carta como etiqueta de
texto, que es el comportamiento correcto: nunca se oculta un alergeno por no
tener dibujo.
