# Fotos de portada

Guarda aquí una foto por local, con el **slug** del local como nombre:

```
como-en-casa.jpg
la-basilica.jpg
la-casa-del-mago.jpg
el-descarado.jpg
```

Y luego:

```bash
npm run portadas --prefix api
```

Sube solo las que encuentre, así que se pueden ir poniendo de una en una.

Valen `.jpg`, `.png`, `.webp` y `.avif`. Cuanto más ancha mejor: se recorta a
1920×1000 y se convierte a WebP. Funciona mejor una foto del espacio o del
entorno que un plato de cerca, porque va de fondo con el nombre encima.

Si prefieres encuadrar tú el recorte, súbela desde el panel:
**Inicio** → la tarjeta del local → *Poner foto de portada*.

Esta carpeta no va al repositorio: son fotos con derechos y pesan.
