# Cartas en PDF

Deja aqui los PDF de las cartas (vinos, comida, menus de celebracion) y
avisame. De aqui salen los datos que se cargan en la base.

## Por que esta carpeta existe

Un PDF adjuntado en el chat no llega al disco, asi que no se puede leer ni
extraer. Dejandolo aqui si.

## Como se llaman

Lo que sea, mientras se entienda:

    cartas/vinos.pdf
    cartas/como-en-casa-comida.pdf

## Que se puede sacar y que no

En esta maquina hay `pdftotext` pero NO `pdftoppm`, asi que:

  - El TEXTO se extrae bien: nombres, precios, denominaciones de origen.
  - Las PAGINAS no se pueden ver como imagen. Para copiar el diseño (colores,
    tipografia, como se agrupan) hace falta una captura de pantalla de una
    pagina, o instalar poppler completo.

## Lo que no entra en el repositorio

Los PDF pesan y son material del grupo: quedan fuera por .gitignore. Lo que
se versiona es lo que se extrae de ellos (db/datos/*.json) y el script que
lo carga.
