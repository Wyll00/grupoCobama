# Grupo Cobama — plataforma web

Web pública y herramienta de gestión para los cuatro guachinches del Grupo Cobama
en Tenerife: **Como en Casa** (Guamasa), **La Basílica** (Candelaria),
**La Casa del Mago** (La Laguna) y **El Descarado** (La Orotava).

Multi-tenant desde el primer día: una aplicación, una base de datos, un
despliegue. Los cuatro locales son filas en la tabla `restaurantes`, no cuatro
proyectos. Abrir un quinto local es un `INSERT`, no un despliegue nuevo.

**Estado:** Fases 1 y 2 completas (carta digital y panel de administración).
Ver [PLAN.md](PLAN.md).

---

## Arrancar en local

Necesitas Docker y Node 20 o superior.

```bash
cp .env.example .env && cp api/.env.example api/.env
```

Genera un secreto de JWT y ponlo en `api/.env` como `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Levanta la base de datos y la API, y carga esquema y datos:

```bash
docker compose up -d && npm install --prefix api && npm run db:setup --prefix api
```

Eso deja corriendo la base, phpMyAdmin y la API. Los tres con
`restart: unless-stopped`, asi que vuelven solos si se caen y al reiniciar el
ordenador.

La web de desarrollo sí va a mano, en su terminal:

```bash
npm install --prefix web && npm run dev --prefix web
```

**Al tocar codigo de la API hay que reiniciarla:**

```bash
docker compose restart api
```

Lleva `node --watch`, pero en Windows los avisos de cambio de fichero no
cruzan el bind mount y no se entera. En Linux y Mac sí recarga sola.

Si prefieres la API fuera de Docker mientras trabajas -para tener recarga
automatica-, para el contenedor primero o chocaran por el puerto 4100:

```bash
docker compose stop api && npm run dev --prefix api
```

| Servicio | URL |
|---|---|
| Web pública | http://localhost:5180 |
| Panel | http://localhost:5180/admin |
| API | http://localhost:4100/api |
| phpMyAdmin | http://localhost:8081 (usuario `cobama`, contraseña `cobama`) |

Los puertos no son los de por defecto de Vite (5173) ni de Express (4000) a
propósito: los usa cualquier otro proyecto que tengas abierto a la vez. Se
cambian en `web/.env` (`WEB_PORT`, `API_URL`) y `api/.env` (`PORT`,
`CORS_ORIGIN`, `WEB_BASE_URL`) — los tres del API tienen que ir a juego.

---

## Base de datos

El esquema **no** se carga por `docker-entrypoint-initdb.d`: ese directorio solo
se ejecuta con el volumen vacío, así que cualquier cambio de esquema obligaba a
borrar la base de datos entera. Lo aplica un runner que lleva la cuenta de lo
ejecutado en la tabla `migraciones`.

```bash
npm run db:migrate --prefix api   # aplica db/migrations
npm run db:seed --prefix api      # aplica db/seeds
npm run db:setup --prefix api     # las dos cosas
npm run db:estado --prefix api    # qué hay aplicado
```

Cada `.sql` se aplica una vez y se registra por nombre. El fichero entero va en
una sola llamada, así que no se pueden usar sentencias con `DELIMITER`.

Si tienes una base de datos cargada con el método antiguo, se adopta indicando
hasta dónde dar por aplicado — el límite es obligatorio para que no se marque
como hecha una migración que nunca se ejecutó:

```bash
npm run db:adoptar --prefix api -- 001_schema.sql
```

Para empezar de cero: `docker compose down -v && docker compose up -d` y
`npm run db:setup --prefix api`.

---

## Pruebas

```bash
npm run humo --prefix api
```

```bash
npm run glb --prefix api
```

99 comprobaciones end-to-end contra una API levantada, más 17 sobre el generador
de modelos 3D, que parsea el GLB byte a byte porque un formato binario escrito a
mano se rompe en silencio.

Las 99: login, rotación de
refresh tokens, límites por rol y por local, CRUD de catálogo, alta de platos
desde la carta, generación de QR, secciones, procesado de imágenes, histórico de
precios, reordenación y gestión de usuarios. Deja la base de datos como estaba,
incluso si se rompe a mitad.

Lánzala contra una API arrancada con `npm start`, no con `npm run dev`: el
`--watch` reinicia el servidor si algo toca un fichero durante la ejecución.

---

## API

Todas las respuestas van envueltas en `{ "datos": ... }`; los errores en
`{ "error": { "mensaje": ..., "detalles": [...] } }`. Los listados paginados
añaden `paginacion` al mismo nivel que `datos`.

### Pública

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servicio y de la conexión a MySQL |
| GET | `/api/restaurantes` | Los cuatro locales, con horario resumido y `abierto_ahora` |
| GET | `/api/restaurantes/:slug` | Ficha completa, horarios y menús de grupo |
| GET | `/api/restaurantes/:slug/carta` | Carta agrupada por categoría |
| GET | `/api/categorias` | Categorías del catálogo |
| GET | `/api/alergenos` | Los 14 alérgenos obligatorios |

### Sesión

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Devuelve el access token y pone la cookie de refresco |
| POST | `/api/auth/refresh` | Renueva la sesión y rota el refresh token |
| POST | `/api/auth/logout` | Revoca el refresh token y borra la cookie |
| GET | `/api/auth/yo` | Datos del usuario autenticado |
| POST | `/api/auth/password` | Cambia la propia contraseña |

### Panel

Todo bajo `/api/admin` exige `Authorization: Bearer <access token>`.

| Método | Ruta | Quién |
|---|---|---|
| GET | `/api/admin/platos` | Cualquier usuario (paginado y filtrable) |
| GET | `/api/admin/platos/:id` | Cualquier usuario |
| POST · PATCH · DELETE | `/api/admin/platos[/:id]` | Solo `admin_grupo` |
| POST · DELETE | `/api/admin/platos/:id/imagen` | Solo `admin_grupo` |
| GET | `/api/admin/restaurantes/:id/carta` | Su local |
| GET | `/api/admin/restaurantes/:id/carta/disponibles` | Su local |
| POST | `/api/admin/restaurantes/:id/carta` | Su local |
| PUT | `/api/admin/restaurantes/:id/carta/orden` | Su local |
| POST | `/api/admin/restaurantes/:id/carta/nuevo-plato` | Solo `admin_grupo` |
| GET | `/api/admin/restaurantes/:id/qr` | Su local |
| GET | `/api/admin/restaurantes/:id/ocupacion/pendiente` | Su local |
| POST | `/api/admin/restaurantes/:id/ocupacion` | Su local |
| GET | `/api/admin/restaurantes/:id/ocupacion` | Su local |
| GET | `/api/admin/restaurantes/:id/ocupacion/patron` | Su local |
| PATCH · DELETE | `/api/admin/carta-items/:id` | Su local |
| GET | `/api/admin/carta-items/:id/historico` | Su local |
| GET | `/api/admin/categorias` | Cualquier usuario |
| POST · PATCH · DELETE | `/api/admin/categorias[/:id]` | Solo `admin_grupo` |
| PUT | `/api/admin/categorias/orden` | Solo `admin_grupo` |
| GET · POST · PATCH · DELETE | `/api/admin/usuarios[/:id]` | Solo `admin_grupo` |

Filtros de `/carta`:

| Parámetro | Ejemplo | Efecto |
|---|---|---|
| `categoria` | `arroces` | Solo esa categoría |
| `sin_alergenos` | `gluten,lacteos` | Oculta los platos que los contengan |
| `vegetariano` | `1` | Solo vegetarianos |
| `vegano` | `1` | Solo veganos |
| `destacados` | `1` | Solo platos de la casa |
| `q` | `arroz` | Busca en nombre y descripción |

```bash
curl "http://localhost:4100/api/restaurantes/el-descarado/carta?sin_alergenos=gluten,lacteos"
```

El frontend replica esos filtros en la query string de la URL, así que un
enlace compartido llega con el filtro ya puesto.

---

## Decisiones de diseño

**Catálogo separado de la carta.** Los cuatro locales comparten buena parte de
los platos, pero con precios y disponibilidad distintos. `platos` es el catálogo
maestro del grupo (un plato existe una sola vez, con su descripción, alérgenos y
foto) y `carta_items` es la tabla puente que decide qué local lo sirve, a qué
precio y en qué orden. Cocina central da de alta el plato una vez; cada local lo
activa por su cuenta. Es la solución al problema de los cuatro PDF descoordinados.

**Horarios modelados por día y por local**, aunque hoy los cuatro coincidan.
En cuanto uno cierre los lunes o cambie el horario de verano, el sistema lo
absorbe sin tocar código. Los cierres pasada medianoche se guardan como
`24:00:00` o más (el tipo `TIME` de MySQL llega a 838 horas), y
`api/src/utils/horarios.js` contempla el arrastre del día anterior al calcular
si el local está abierto. La hora se calcula siempre en `Atlantic/Canary`: el
servidor puede estar en cualquier sitio, el restaurante no.

**Precios en `DECIMAL(6,2)`, nunca `FLOAT`.** El pool de mysql2 va con
`decimalNumbers: true`: `DECIMAL(6,2)` cabe de sobra en un double sin perder
precisión y el frontend se ahorra el parseo.

**Borrado lógico con `activo`, nunca `DELETE`.** Un plato retirado de la carta
sigue haciendo falta para el histórico de precios.

**`historico_precios` se escribe desde el servicio, no desde un trigger.** Un
trigger no conoce al usuario autenticado sin variables de sesión, y esas son
frágiles con pool de conexiones. La escritura irá en la misma transacción que el
`UPDATE` del precio, en la fase 2.

**Campos `*_en` desde el principio**, aunque se rellenen en la fase 4. Añadir
columnas a `platos` y `carta_items` con datos dentro cuesta más que dejarlas
puestas.

---

## Autenticación

**El access token vive solo en memoria del navegador**, nunca en `localStorage`:
así un XSS no puede leerlo. La sesión se sostiene con una cookie `httpOnly` de
refresco que el navegador manda sola y que JavaScript no ve. Al recargar la
página el token en memoria se pierde y se recupera con un `/refresh`.

**Rotación con detección de reutilización.** Cada refresco emite un token nuevo
y revoca el anterior. Si llega un token ya revocado es señal de que alguien se
hizo con una copia, y se revocan todas las sesiones del usuario.

Eso choca con un caso legítimo: dos pestañas del panel abiertas refrescan a la
vez con la misma cookie y la segunda llega ya revocada. Por eso hay un **margen
de gracia de 10 segundos**: dentro de él se entiende como carrera, se emite el
access token y no se vuelve a rotar, porque el navegador ya tiene la cookie
buena. Pasado el margen sí se trata como robo. El precio es una ventana de
replay de 10 s para un token robado; es el compromiso habitual.

Los refresh tokens se guardan hasheados con **SHA-256, no con bcrypt**: son
valores aleatorios de 256 bits, no contraseñas de baja entropía, así que un hash
lento no aporta nada y encarecería cada renovación.

**El login limita por email y por IP, contando solo los fallos.** Limitar solo
por IP sería un mal negocio: los cuatro locales pueden salir por la misma línea
y un límite bajo dejaría fuera a gente que solo se ha equivocado tecleando. El
límite por cuenta (6 fallos / 15 min) es el que frena la fuerza bruta contra un
usuario concreto; el de IP (40 / 15 min) queda de red para el barrido masivo.

**Cambiar la contraseña, el rol, el local o desactivar un usuario revoca sus
sesiones abiertas.** El access token lleva el rol y el `restaurante_id` firmados
dentro, así que seguiría valiendo hasta caducar si no se cortara.

---

## Dónde se toca cada cosa

El precio **no es del plato, es de cada carta**: el mismo plato puede costar
distinto en cada casa. Por eso hay dos entradas al mismo dato, según lo que
estés haciendo:

| Quiero... | Voy a |
|---|---|
| Cambiar los precios de un local | **Cartas** — todos los platos de una casa |
| Corregir el nombre o la descripción de un plato | **Cartas** → clic en el nombre del plato |
| Decir que un plato se ha acabado hoy | **Cartas** → *Se acabó* en su fila |
| Meter en la carta un plato que ya existe | **Cartas** → *Añadir plato* → *Del catálogo* |
| Meter un plato que no existe todavía | **Cartas** → *Añadir plato* → *Crear un plato nuevo* |
| Cambiar el precio de un plato en varias casas | **Catálogo** → el plato → *Precio por local* |
| Cambiar alérgenos o foto | **Catálogo** → el plato |
| Crear, renombrar u ordenar las secciones | **Catálogo** → *Secciones* |
| Que el cliente vea el plato a tamaño real | **Catálogo** → el plato → *Ancho real* |
| Sacar el enlace o el QR para publicar | **Cartas** → *Compartir carta* |
| Ver a qué horas se llena el local | **Ocupación** |

> El nombre, la descripción, los alérgenos y la foto son **del catálogo del
> grupo**: corregirlos desde la carta de un local los cambia en los cuatro. Lo
> que es de cada casa es el precio, si el plato está en carta y si va destacado.

Cartas y la ficha del plato son la misma tabla vista de dos formas: en Cartas,
todos los platos de un local; en la ficha, todos los locales de un plato. Sin la
segunda, subir un precio en las cuatro casas obligaba a entrar cuatro veces en
Cartas.

*Crear un plato nuevo* da de alta el plato en el catálogo del grupo **y** lo mete
en esa carta, en una sola transacción: si fueran dos pasos y fallara el segundo,
quedaría un plato huérfano que no sirve nadie. Toca el catálogo compartido, así
que ese camino solo lo ve el admin de grupo; un encargado añade de lo que ya
existe. Un encargado tampoco ve editable la fila de otro local en *Precio por
local*: no le aparece.

### Compartir la carta

**Cartas** → *Compartir carta* da el enlace público del local y su QR.

El enlace es **fijo y no caduca**: apunta a la carta, que se lee de la base de
datos en cada visita. Cambiar un precio se ve al momento en el enlace que ya
está publicado en redes, sin volver a compartir nada. Hay botones para copiarlo,
copiarlo con un texto ya redactado, abrirlo, mandarlo por WhatsApp y —en móvil—
la hoja de compartir del sistema.

El QR baja en SVG y PNG. Para imprimir hay que usar el SVG: escala desde un
adhesivo de mesa hasta un cartel sin pixelarse.

El destino sale de `WEB_BASE_URL` en `api/.env`. Mientras eso apunte a
`localhost` el panel avisa de que ese enlace **no sirve fuera de ese ordenador**.
Hay un script para generar los cuatro QR de golpe: `npm run qr --prefix api`.

La vista previa al pegar el enlace en WhatsApp o Instagram sale con el nombre
del local, no con el genérico del grupo. Ver **Lo que ve un buscador** más abajo.

---

## Ver el plato en la mesa (realidad aumentada)

> **Apagado desde el 21-08-2026.** El botón «Ver en mi mesa» ya no sale en la
> carta y el campo del ancho ya no está en el panel. Todo lo de abajo sigue
> montado y funcionando (endpoint, generación del GLB, `VerEnMesa.jsx`, las
> columnas y once comprobaciones de la prueba de humo): está **dormido**, no
> borrado. Volver a encenderlo son tres líneas en `Plato.jsx`.
>
> Quitarlo se llevó por delante el trozo de `model-viewer`, que era **1 MB del
> build**. Solo se descargaba al pulsar el botón, así que ningún cliente lo
> pagaba sin querer, pero ya no está ni ahí.

En la carta, los platos con foto y medida llevan un botón **Ver en mi mesa**.
Desde el móvil abre la cámara y planta el plato encima de la mesa a tamaño real,
para responder a la única pregunta que se hace el cliente delante de la carta:
*¿esto es grande o pequeño?*.

**No hace falta escanear los platos en 3D.** Basta con medir el ancho real de lo
que llega a la mesa y ponerlo en **Catálogo** → el plato → *Ancho real del plato*.
Con eso y la foto que ya existe, la API genera al vuelo un modelo a escala: la
foto tumbada en la mesa al tamaño exacto. No es un plato 3D, pero contesta a la
pregunta, y son treinta segundos con una regla frente a un escaneo por plato.

Si algún día se escanea un plato de verdad, los campos `modelo_glb` y
`modelo_usdz` tienen prioridad sobre la foto.

Cómo funciona la AR en web, que no es obvio:

- **Android** abre Scene Viewer, que consume `.glb`
- **iOS** abre AR Quick Look, que consume `.usdz`

No hay un formato que valga para ambos; `<model-viewer>` se encarga de despachar
a uno u otro. Lo que se genera es `.glb`, así que **en Android funciona la cámara
y en iPhone se ve el modelo girable pero sin botón de cámara** hasta que se suba
un `.usdz`. Convertir glb→usdz en el servidor pide herramientas de Apple y queda
fuera de esto.

Detalles que costaron una vuelta:

- El GLB se escribe a mano en [`api/src/lib/glb.js`](api/src/lib/glb.js). Un plano
  texturizado es el caso más simple del formato —cuatro vértices, dos triángulos
  y una imagen— y meter una librería de exportación glTF entera para esto sería
  desproporcionado. Como un formato binario escrito a mano se rompe en silencio,
  hay un validador que lo parsea byte a byte: `npm run glb --prefix api`.
- **La cámara por defecto de `model-viewer` mira a 75° de la vertical**, casi
  horizontal. Un plano tumbado visto de canto no se ve: hay que bajarla a 35° y
  poner un tope para que al girar con el dedo no se acabe otra vez de canto.
- El modelo se cachea en disco con un nombre derivado de la foto y la medida, así
  que cambiar cualquiera de las dos lo regenera solo.
- La textura se convierte a PNG: glTF admite PNG y JPEG, y WebP necesitaría la
  extensión `EXT_texture_webp`, que no soportan todos los visores.
- `model-viewer` son 300 KB, así que va en su propio *chunk* y solo se descarga
  cuando alguien pulsa el botón. El bundle público no se entera.

> **La cámara no está probada.** Se ha verificado que el GLB es válido, que carga
> y que mide exactamente lo que se le pide (`getDimensions()` devuelve 0,26 m
> para 26 cm), pero el render y la cámara necesitan un móvil de verdad: aquí la
> pestaña no compone y `requestAnimationFrame` no llega a ejecutarse. Además la
> AR exige **HTTPS** salvo en `localhost`, así que para probarla desde el teléfono
> hace falta el sitio publicado o un túnel.

Para verlo funcionando sin subir nada: `node scripts/demo-ar.js` deja el plato 1
con una foto sintética y 26 cm de ancho, y `node scripts/demo-ar.js --limpiar` lo
deshace.

---

## Lo que ve un buscador

La web es una SPA: el HTML que sale del servidor es un `<div>` vacío y los
platos los pinta JavaScript. Eso vale para una persona con navegador, pero **los
rastreadores de WhatsApp, Instagram y Facebook no ejecutan JavaScript**. Sin
tratamiento, los cuatro locales comparten el mismo título genérico al compartir
el enlace, y Google no sabe que son restaurantes.

Por eso la API sirve la web con el `<head>` ya relleno para cada ruta:

| Ruta | Título que recibe el rastreador |
|---|---|
| `/` | Grupo Cobama · Cocina canaria en Tenerife |
| `/el-descarado` | El Descarado · La Orotava · Grupo Cobama |
| `/el-descarado/carta` | Carta de El Descarado · La Orotava · Grupo Cobama |
| `/reservar` | Reservar mesa · Grupo Cobama |

Además de título y descripción se inyectan Open Graph, Twitter Card, la URL
canónica y **datos estructurados `schema.org/Restaurant`** por local: dirección,
coordenadas, teléfono, horario por franjas y enlace a la carta y a reservas. Es
lo que alimenta la ficha lateral de Google con el "Abierto ahora". Todo sale de
la base de datos, así que cambiar un horario en el panel lo cambia también ahí.

También se sirven `/robots.txt` y `/sitemap.xml`, generados de los locales
activos. La carta va como `daily` y la ficha como `weekly`: la carta es la que
cambia.

### Probarlo en local

```bash
npm run build --prefix web
```

La API sirve la web construida en su propio puerto, con el prerenderizado
puesto. Para ver lo que recibe un rastreador:

```bash
curl -A "WhatsApp/2.23" http://localhost:4100/el-descarado/carta
```

En el día a día el front lo sigue sirviendo Vite en el 5180, sin prerenderizar.
Esto es para comprobar el SEO y como alternativa de despliegue si la web acaba
en el mismo VPS que la API; en Cloudflare Pages lo hará una función equivalente.

> **Falta la imagen de la vista previa.** `restaurantes.imagen_portada` está
> vacío en los cuatro, así que la tarjeta de WhatsApp sale sin foto y la
> `twitter:card` cae a `summary` en lugar de `summary_large_image`. En cuanto
> haya una foto por local —decisión 4 del plan, la sesión de fotografía— se
> rellena el campo y las etiquetas salen solas.

---

## Reservas

El formulario de `/reservar` guarda la reserva en base de datos y avisa al
local. Entra como **solicitud pendiente** hasta que alguien la confirma desde
**Reservas** en el panel.

No hay control de mesas ni de aforo: eso es un proyecto en sí mismo y hoy el
grupo lo lleva por WhatsApp sin registro ninguno, así que una bandeja
estructurada ya es la mejora. El panel enseña los comensales esperados del día
para que sala decida.

Lo que sí valida la API, porque es donde se cometen los errores:

- **Contra el horario real de cada local.** Las horas que ofrece el formulario
  salen de la tabla `horarios`, así que un viernes se puede reservar más tarde
  que un lunes y un día cerrado no aparece. Mover una reserva desde el panel
  vuelve a pasar por la misma validación: si no, se podría colocar una reserva
  un día que el local no abre.
- **Última mesa 45 minutos antes de cerrar.** Nadie sienta a alguien cinco
  minutos antes de echar el cierre, y aceptarlo solo genera un plante en la
  puerta.
- **Una hora de antelación mínima por web.** La reserva necesita que alguien la
  mire; para dentro de diez minutos no da tiempo. El alta manual desde el panel
  se salta esa regla, porque quien la mete está hablando con el cliente.
- **Máximo 90 días vista**, y nada en el pasado.

Cada reserva lleva un **código de seis caracteres** (`5GYKMD`) que se le da al
cliente. El id numérico no vale para eso: es correlativo, así que con el de uno
se adivinan los demás. El alfabeto no tiene `0/O` ni `1/I/L`, porque el código
se dicta por teléfono.

El formulario público está limitado a 10 reservas por hora e IP. Sin captcha y
sin límite, cualquiera llena la bandeja del local en un minuto.

### Avisos por correo

Sin SMTP configurado el sistema **no se calla ni finge que ha enviado**: escribe
el correo en `api/correos/` y lo dice por consola, para poder leer exactamente
lo que le llegaría al local y al cliente. Cuando haya servidor de correo se
instala nodemailer y se sustituye `entregar` en
[`correo.service.js`](api/src/services/correo.service.js); el resto de la
aplicación no se entera.

`api/correos/` está en el `.gitignore`: esos ficheros llevan nombre, teléfono y
email de clientes.

Que falle un aviso nunca tumba la reserva: ya está guardada y sala la ve igual
en el panel.

---

## Ocupación del local

Cada hora, mientras el local está abierto, aparece una barra fija abajo del
panel preguntando cómo está la sala: **Vacío · Flojo · Normal · Lleno · A tope**,
con botones grandes porque se pulsan de pie y con prisa desde el comandero.
Opcionalmente se apunta el número de comensales.

Con eso salen las horas punta reales de cada casa, que hoy solo están en la
cabeza del encargado. **Ocupación** enseña un mapa de calor por día de la semana
y hora, más las últimas lecturas.

Detalles que condicionan el diseño:

- **Solo se pregunta con el local abierto.** Preguntar a las cinco de la mañana
  no da ningún dato y consigue que en sala dejen de hacer caso al aviso.
- **Una lectura por tramo.** Responder dos veces corrige la anterior en lugar de
  duplicarla: en sala se falla el botón y lo normal es volver a pulsar.
- **La hora se guarda ya resuelta** a horario de Canarias, en `hora_local` y
  `dia_semana`, para que las estadísticas no dependan de `CONVERT_TZ` —necesita
  las tablas de zonas horarias cargadas en MySQL y la imagen de Docker no las
  trae.
- Al admin de grupo **no se le pregunta**: no está en ninguna sala.

> **Es un sondeo, no una notificación push.** El panel pregunta a la API cada
> minuto si toca. Una notificación de verdad —que suene con el panel cerrado—
> necesita HTTPS, claves VAPID, un *service worker* y que alguien acepte el
> permiso en cada dispositivo, y no es verificable hasta que haya dominio y
> aparatos reales. Como el comandero tiene el panel abierto durante todo el
> servicio, el sondeo cubre el caso. La decisión de *si toca preguntar* vive en
> la API (`GET .../ocupacion/pendiente`), así que añadir push encima no obliga a
> rehacer nada.

### Secciones de la carta

Las secciones (entrantes, arroces, vinos...) se crean, renombran, ordenan y
ocultan desde **Catálogo** → *Secciones*. El orden de esa lista es el orden en
que el cliente las ve.

Una sección con platos dentro no se borra: se oculta. Borrarla dejaría sin
categoría a platos que siguen en cartas y en el histórico de precios. Solo se
borra de verdad una que esté vacía, y el panel lo dice en el propio botón.

---

## Roles y filtrado por local

| Rol | Alcance |
|---|---|
| `admin_grupo` | Los cuatro locales, el catálogo maestro y los usuarios |
| `encargado_local` | Solo su `restaurante_id`: da de alta platos, ajusta precios, reordena su carta y gestiona sus reservas |

### Quitar un plato: hay dos formas y no son lo mismo

| | Qué hace | Cuándo |
|---|---|---|
| **Se acabó** | Sigue en la carta, tachado y con "Hoy no queda". **Vuelve solo** al día siguiente. | Se agotó hoy |
| **Se acabó → ⋯** | Igual, pero hasta la fecha que elijas. También vuelve solo. | No hay en una temporada |
| Casilla **En carta** | Desaparece de la carta pública. No vuelve hasta que lo marques. | Ya no se sirve |

La distinción importa: con una sola casilla, lo que se agota un martes se queda
escondido tres semanas porque nadie se acuerda de volver a marcarlo. Con fecha de
vuelta no hay que acordarse de nada, y no hace falta ninguna tarea programada
porque la caducidad se evalúa al leer (`agotado_hasta > NOW()`).

Un plato agotado **se sigue enseñando al cliente**, tachado, en lugar de
esconderlo. Si desaparece, el cliente lo pide igual porque lo vio ayer; verlo
tachado le ahorra la pregunta y a sala la explicación. Lo que sí se le quita es
el botón de verlo en la mesa.

### Quién puede tocar un plato

El precio, si el plato está en carta y si va destacado son **de cada casa**: los
cambia su encargado y punto. El nombre, la descripción, los alérgenos y la foto
son **del catálogo compartido**, así que ahí la regla es por plato, no por rol:

| Situación del plato | Quién lo edita |
|---|---|
| No lo sirve nadie todavía | Cualquiera |
| Solo lo sirve un local | El encargado de ese local, y el admin |
| Lo sirven dos o más | Solo el admin de grupo |

Un encargado da de alta un plato nuevo desde **Cartas** → *Añadir plato* →
*Crear un plato nuevo*, que es lo que pasa cuando entra un plato en su cocina.
El plato nace sirviéndolo solo su casa, así que sigue siendo suyo para editarlo.
En cuanto otro local lo añade a su carta pasa a mantenerlo la administración del
grupo: renombrarlo se lo cambiaría a los demás.

La regla vive en `ambitoPlato`
([`api/src/middleware/auth.js`](api/src/middleware/auth.js)) y el panel la
replica en [`web/src/admin/permisos.js`](web/src/admin/permisos.js) solo para no
enseñar botones que van a responder 403. El límite de verdad está en la API.

El límite se aplica en el middleware del backend
([`api/src/middleware/auth.js`](api/src/middleware/auth.js)), nunca solo en el
frontend. Un encargado no llega a otro local aunque cambie el id de la URL: se
compara contra el `restaurante_id` que va **firmado dentro del token**, no
contra nada que mande el cliente.

Para las rutas de `carta-items` el ámbito se deduce de la propia línea de carta,
y si es de otro local se responde 404 en lugar de 403: no hay por qué
confirmarle a un encargado que ese elemento existe en otro sitio.

Un `CHECK` en `usuarios` y una validación equivalente en la API garantizan que
un `admin_grupo` no tenga local y un `encargado_local` sí. Tampoco se puede
desactivar el último admin activo ni el propio usuario.

---

## El movil es la pantalla normal

La mayoría de las visitas llegan desde el móvil, así que ahí no se trata de
«que quepa». Lo que se hace en consecuencia:

### La portada se sirve en dos tamaños

1920 px de ancho para escritorio, **960 para móvil**. En una pantalla de 375
la grande se pintaba a una quinta parte de su tamaño y encima bajo un velo del
85%: 122 KB de datos móviles para un fondo que casi no se ve. La pequeña pesa
**48 KB**.

La de móvil se genera **a partir de la grande ya recortada**, no del original.
Recortando las dos por separado, `position: attention` podría elegir encuadres
distintos y la foto daría un salto al girar el teléfono.

Las dos rutas van al DOM como **variables CSS**, no como `backgroundImage`: un
estilo en línea gana a cualquier regla de la hoja, así que con `backgroundImage`
ninguna media query podría elegir la de móvil.

### En el móvil no se repiten los botones

La barra fija de abajo ya lleva **Reservar** y **Llamar**, y está siempre a la
vista. La cabecera los repetía: 175 px de botones apilados en la pantalla más
pequeña, la carta empujada fuera de la primera pantalla, y cinco opciones para
hacer dos cosas.

En móvil esos dos se ocultan de la cabecera. **«Ver la carta» queda el primero**,
que es a lo que viene la gente. La cabecera baja de 534 a 471 px.

---

## Foto de portada de cada local

La cabecera de la ficha de un local puede llevar una foto de fondo, atenuada,
con el nombre encima. Se sube desde **Inicio** en el panel, en la tarjeta del
local: *Poner foto de portada*. Se recorta en panorámico y se guarda en
1920×1000 WebP.

La capa oscura que va encima **no es decorativa**: sin ella el nombre en crema
sobre una foto clara deja de leerse, y el contraste de texto sobre imagen es lo
primero que se rompe al meter fotos en una cabecera. Va más cerrada por la
izquierda, donde cae el texto, y más abierta a la derecha para que la foto se
vea.

Sin foto la cabecera tampoco queda plana: lleva un resplandor cálido del ocre de
la marca, que da profundidad sin fingir que hay una imagen.

> **Tiene que ser una foto vuestra.** Una imagen sacada de internet en una web
> comercial expone al grupo a una reclamación de derechos, por muy fácil que sea
> descargarla. Sirve una foto propia del local o de la sesión de fotografía
> —decisión 4 del plan—. En cuanto haya archivos, se suben desde el panel y ya
> aparecen también en la vista previa al compartir el enlace, que hoy sale sin
> imagen por esto mismo.

---

## Imágenes de plato

Se suben en memoria (`multer`), se procesan con `sharp` y **el original nunca se
guarda**: a disco va solo la versión ya recortada. De cada imagen salen dos
tamaños en WebP, 1200×900 para la ficha y 400×300 para los listados. La carta se
ve casi siempre desde el móvil con datos, y servir el JPEG de 4 MB que sale de
un teléfono no es una opción.

El recorte se fuerza a 4:3 y lo encuadra el usuario en el panel; llega como
píxeles de la imagen original. Se aplica `rotate()` sin argumentos para respetar
la orientación EXIF, porque si no las fotos hechas en vertical salen tumbadas.

En producción estas imágenes van a Cloudflare R2 o S3; en desarrollo se sirven
desde `api/uploads/`.

---

## Lo legal (RGPD y LSSI)

### Dos bases legales distintas, y no se pueden mezclar

Es el error más común en formularios de reserva y aquí está separado a propósito:

| Para qué | Base legal | ¿Casilla? |
| --- | --- | --- |
| Gestionar la reserva | **Contrato** (art. 6.1.b) | No |
| Mandar novedades | **Consentimiento** (art. 6.1.a) | Sí, aparte y desmarcada |

No se pide permiso para tratar los datos de la reserva porque **no se puede
reservar sin dar el teléfono**: un permiso que no se puede negar sin perder el
servicio no es un permiso, y presentarlo como tal invalida el consentimiento
entero, también el de marketing. Lo que sí exige el art. 13 es **informar** al
recoger los datos, y eso es lo que hace el bloque del formulario.

La casilla obligatoria dice «he leído», no «autorizo». La de marketing solo
aparece si la persona ha dejado email, porque pedir permiso para escribir a
quien no ha dado dirección es recoger un consentimiento inútil.

### Qué se guarda como prueba

`politica_version` y no un booleano. Cuando el texto de la política cambie, un
`true` con fecha no dice **qué** leyó esa persona, porque el texto de entonces
ya no existe. La versión vive en `web/src/datos/legal.js` (`VERSION_POLITICA`)
y hay que subirla cada vez que se toque el texto.

En las reservas por teléfono el campo queda a `NULL`: no hay casilla que
enseñar y rellenarlo desde el servidor sería fabricar una prueba falsa.

### Conservación

12 meses, y lo cumple un script:

```bash
npm run purgar --prefix api -- --sql
```

**Anonimiza en vez de borrar**: quita nombre, teléfono, email y observaciones,
y conserva fecha, hora, comensales y estado, que no identifican a nadie y son
el histórico del negocio. Tiene que ejecutarse a diario; mientras no haya tarea
programada, hay que acordarse. Sin esto, la política promete un plazo que no se
cumple, y eso es peor que no prometer ninguno.

### Cookies: no hace falta banner

La web pública **no pone ninguna cookie**. La única del proyecto es la de sesión
del panel, que es técnica y solo la reciben los usuarios internos. Si algún día
se añade Google Analytics o un píxel, esto deja de ser cierto y hay que montar
el banner.

### Lo que falta antes de publicar

`web/src/datos/legal.js` tiene los campos marcados `PENDIENTE` — razón social,
NIF, domicilio y los proveedores. **Mientras falten, las dos páginas legales
enseñan un aviso rojo bien visible.** Es feo aposta: un TODO en un comentario no
lo ve nadie, ese aviso lo ve el primero que abra la página.

Falta también firmar el **contrato de encargado del tratamiento (art. 28)** con
CoverManager, con el hosting y con el proveedor de correo. Listarlos en la
política no basta: sin contrato, la cesión es ilícita aunque esté contada.

---

## CoverManager

Las reservas de la web se envían a CoverManager y **además** quedan registradas
aquí. Ese «además» es el orden: se guarda en local primero y se envía después,
nunca al revés. Si se enviara primero, un timeout dejaría al cliente sin reserva
y sin rastro para reclamar.

```
formulario → reserva guardada aquí → intento de envío
                     ↓                      ↓
              el cliente ya                 ok → cm_estado = enviada
              tiene su código               fallo → reintento con espera creciente
```

### Estados

| `cm_estado` | Qué significa |
| --- | --- |
| `no_aplica` | Ese local no tiene CoverManager, o la integración está apagada |
| `pendiente` | Hay que enviarla |
| `enviando` | Intento en curso — es lo que impide mandarla dos veces |
| `enviada` | Confirmada al otro lado, con su identificador en `cm_id` |
| `error` | Falló; se reintenta según `cm_proximo_intento` |

Los reintentos esperan 1, 5, 15, 60 y 360 minutos. Un **4xx no se reintenta**:
si han rechazado los datos o las credenciales están mal, insistir da el mismo
resultado y solo llena el log. Un 5xx, un 429 o un timeout sí.

En el panel, una reserva en `error` sale en rojo con **«NO está en
CoverManager»** y un botón de reintentar. No es un aviso técnico: significa que
esa mesa no está bloqueada en su libro y se puede vender dos veces.

### Configuración

Cada local tiene su cuenta, así que el identificador va en
`restaurantes.covermanager_id`, no en una variable suelta. Las credenciales sí
van al entorno:

```
COVERMANAGER_URL=
COVERMANAGER_API_KEY=
```

**Sin esas dos variables la integración está apagada** y la aplicación se
comporta igual que antes.

### ⚠️ El contrato de su API está sin confirmar

CoverManager no publica su API: la entrega a sus clientes con las credenciales.
**No he inventado rutas ni nombres de campo.** Un cliente HTTP escrito a ojo
falla de la peor manera: parece correcto, pasa las pruebas contra un servidor
falso y en producción pierde reservas de gente que se presenta a cenar.

Lo que falta está en **una sola función**, `PETICION()` en
`api/src/integraciones/covermanager.js`: la ruta, la autenticación, los nombres
de los campos y de dónde sale el identificador. Rellenarla son diez líneas.

Todo lo demás —estados, reintentos, reclamo atómico, panel— está montado y
probado contra un CoverManager falso:

```bash
npm run cm --prefix api
```

Esa prueba cubre envío correcto, 500, 422, timeout, local sin integrar, no
mandar dos veces la misma y el reintento manual.

### Cómo probarlo, en tres niveles

```bash
npm run cm --prefix api          # 1. la maquinaria, contra un servidor falso
npm run cm-check --prefix api    # 2. qué se enviaría, sin enviar nada
npm run cm-check --prefix api -- --enviar   # 3. contra su API de verdad
```

El nivel 2 es el útil **antes** de tener credenciales: imprime la petición
exacta con los datos personales sustituidos por unos de ejemplo, y ese volcado
se le reenvía al contacto de CoverManager preguntando «¿es correcto?». Convierte
un contrato desconocido en una pregunta que se contesta en un correo.

El volcado enmascara siempre nombre, teléfono, email y observaciones: está hecho
para pegarlo en correos, y no puede llevar datos de clientes. Con `--enviar` sí
va la reserva real, sin tocar.

Que su API responda 200 **no** prueba que la reserva exista: eso solo se ve
abriendo el panel de CoverManager. El paso 3 lo recuerda.

Una cosa que hay que preguntarles: **cómo evitan un duplicado**. Ahora se manda
nuestro código de reserva como `external_id` para que un reintento que se cruce
con un envío que sí llegó no genere dos mesas. Si su API no admite referencia
del cliente, el problema no desaparece por no tener campo.

---

## Lo que recomienda la casa

En la ficha de cada local, un carrusel de fichas con los platos que esa casa
quiere enseñar primero. En La Basílica están marcados **los seis arroces y las
seis carnes premium** (los tres chuletones a peso, los dos ibéricos y el
solomillo de vaca canaria).

### No hay interruptor nuevo

Salen de `carta_items.destacado`, **el mismo** que ya pintaba la etiqueta «De
la casa» en la carta, y que el panel ya dejaba marcar. Un segundo sitio donde
marcar lo mismo acaba contradiciendo al primero: se marca en la carta del local
y aparece aquí.

Para cambiar la selección: **Cartas** en el panel, interruptor «Destacado» en
cada plato.

### El medallón

De 171 platos, **uno** tiene foto. Una tarjeta diseñada alrededor de una foto y
sin foto es un hueco, así que mientras no la haya va un dibujo de plato con
cubiertos. Cuando haya foto, manda la foto.

Los cubiertos son lo que lo hace legible: **un plato solo, visto desde arriba,
son dos círculos concéntricos — que es exactamente el sello de la marca**, y se
confundirían. Y las tres púas del tenedor van dibujadas por separado porque en
bloque se convierten en una mancha por debajo de 40 px.

### El precio dice sus condiciones

El mínimo de comensales va **pegado al precio**, no en una nota al pie: quien
lee «21,00 € · por persona» entiende que puede pedirlo solo, y en la mesa le
dicen que no. El dato sale de la nota de sección de la carta de papel
(«Precio por persona · mínimo 2 personas»), así que si el local la cambia se
actualiza al reimportar.

### Un plato agotado no se recomienda

El endpoint filtra los que están marcados como agotados. Enseñar en portada
algo que hoy no hay es mandar a alguien a pedir lo que no puedes servirle.

El carrusel es el mismo componente que la galería: lo que aporta es el
movimiento y la pausa, no saber qué lleva dentro, así que recibe las fichas ya
hechas. Arreglar la pausa una vez la arregla en los dos sitios.

---

## Galería

Una por local (`/:slug/galeria`) y una del grupo (`/galeria`), con filtro por
categoría —platos, el local, el equipo, celebraciones— y visor a pantalla
completa. Se gestiona desde **Galería** en el panel.

### Las fotos conservan su encuadre

Es la diferencia con las fotos de plato, y es deliberada. Un plato va recortado
a 4:3 porque tiene que cuadrar en una rejilla al lado de un precio. Aplicar ese
mismo recorte en una galería **decapita a la gente y parte los platos por la
mitad**, así que aquí se redimensiona sin deformar (1600 px el lado mayor, 600
la miniatura) y se guardan las medidas resultantes.

Esas medidas van en `width`/`height` de cada `<img>`. Sin ellas el navegador no
sabe cuánto sitio reservar y la página pega saltos según van cargando las fotos
— en una galería de treinta, insufrible.

La rejilla usa `columns` y no `grid`: en una rejilla todas las celdas de una
fila miden lo mismo, así que o se recortan las fotos o quedan huecos.

### De quién es cada foto

`restaurante_id NULL` = foto del grupo. Y ahí hay dos comportamientos distintos
a propósito:

| | Fotos del local | Fotos del grupo |
| --- | --- | --- |
| Galería pública del local | Sí | **Sí** |
| Galería pública del grupo | Sí | Sí |
| Panel del local | Sí | No |
| Quién las gestiona | El encargado | Solo la administración |

En la web se mezclan porque quien entra en la ficha de una casa quiere ver
ambiente, no una clasificación interna nuestra. En el panel **no** se mezclan,
porque enseñar fotos que no se pueden tocar solo confunde sobre de quién es
cada una.

### En la portada

Un botón **Galería** arriba a la derecha del titular, y debajo un carrusel con
las fotos de las cuatro casas que pasa solo. Si no hay fotos, la sección entera
no se pinta: no queda un hueco vacío.

El carrusel se mueve con **scroll horizontal nativo y `scroll-snap`**, no con
`transform` y cuentas de píxeles. Así el arrastre con el dedo, la rueda y el
teclado funcionan sin escribir nada — que es justo donde fallan los carruseles
hechos a mano. Las flechas no son más que un `scrollBy`.

Lo importante de uno que pasa solo es **poder pararlo**. Una foto que se va
justo cuando la estabas mirando es de las cosas que más irritan de una web, así
que se detiene al pasar el ratón, al llegar el foco con el teclado, al tocarlo,
y mientras la pestaña no se ve (si no, los temporizadores se acumulan y al
volver pega un salto de varias fotos). Con el sistema en «menos animaciones» no
arranca siquiera.

Ahí las fotos **sí** se recortan a un alto fijo, al revés que en la galería: en
una fila horizontal, fotos de altos distintos hacen que la tira baile.

### Descripción de la foto

`alt` es lo que oye quien usa un lector de pantalla y lo que lee Google
Imágenes — que para un restaurante no es poca cosa. No se exige al subir, para
no bloquear una tanda de veinte fotos, pero el panel **marca en ámbar las que
están sin describir**. Mismo criterio que con los alérgenos sin confirmar: lo
que no se ve, se olvida.

### Borrar borra de verdad

Al revés que con los platos, que se desactivan. Un plato desactivado guarda
histórico —precios, reservas que lo incluían—; una foto no cuenta nada, y dejar
los ficheros ocupando disco para siempre no beneficia a nadie. Para esconderla
sin perderla ya está `activo`.

Los ficheros se borran **después** de que la fila se haya ido: si falla, es
preferible un fichero huérfano en disco que una fila apuntando a una imagen que
ya no existe y un hueco roto en la galería.

---

## Modo oscuro

Lo enciende el **platito** de la esquina de la cabecera: de día el plato está
entero, de noche le entra una sombra y se queda en cuarto creciente. Es la idea
de las fases de la luna con la vajilla.

Por defecto sigue al sistema. En cuanto alguien pulsa el plato, manda su
elección y se recuerda.

### El tema se aplica antes de pintar

Lo pone un `<script>` en línea en `index.html`, no React. Si se aplicara al
montar el componente, cada carga empezaría con un **fogonazo blanco** — y esto
es una carta que se abre de noche, sentado en la mesa, con el móvil a media
pantalla. Va en línea y no en un fichero aparte por lo mismo: un `<script src>`
es otra petición, y el fogonazo dura lo que tarde en llegar.

El `<html>` es la fuente de verdad (`data-tema`), y el componente lo lee de ahí
también al pulsar. Leerlo del estado de React hacía que dos pulsaciones seguidas
vieran el mismo valor viejo y el segundo clic no deshiciera el primero.

### `--carbon` no es «oscuro», es media pareja

La trampa de este cambio. `--carbon` y `--crema` se usan como **pareja de
contraste**: los bloques de marca (hero, cabecera de ficha, pie) llevan
`--carbon` de fondo y `--crema` de texto, y **siguen siendo oscuros también de
noche**. Invertirlas dejaba el título de la ficha en texto oscuro sobre una foto
oscura.

Pero `--carbon` también se usaba como color de **texto** en titulares, la marca
y el subrayado de categoría. Dejándolo fijo, esos quedaban invisibles sobre el
fondo oscuro: medido, **1,07 de contraste**.

Por eso hay tres tokens donde antes había uno:

| Token | Qué es | ¿Cambia de noche? |
| --- | --- | --- |
| `--carbon` / `--crema` | pareja de los bloques de marca | **No** |
| `--tinta` | titulares, marca, subrayados | Sí |
| `--fondo` | fondo de la página | Sí |

Y dos más que estaban escritos a pelo: `--superficie` (las tarjetas, que eran
`#fff` en cinco sitios) y `--velo` (el fondo translúcido de las barras
pegajosas).

### Contraste comprobado, no supuesto

Se midió el contraste real de doce elementos en los dos temas. Todo pasa AA
salvo una cosa, y **viene de antes**: el botón principal en modo claro es blanco
sobre ocre, **3,38** frente al 4,5 que pide la norma. Como el ocre es color de
marca, no lo he tocado por mi cuenta.

De noche el ocre se sube de luminosidad para que no salga sucio sobre el carbón,
y entonces el blanco encima bajaba a 2,52. Por eso el color que va encima del
ocre es otra variable (`--sobre-ocre`): blanco en claro, tinta oscura de noche.
Así el par no se puede descuadrar. Ese botón pasó de **2,52 a 7,35**.

---

## Reservar fuera de aquí

Cada local decide adónde lleva su botón de reservar, desde **Inicio** en el
panel. Vacío → el formulario de la web. Con una dirección → ahí fuera (el widget
de CoverManager, TheFork, lo que sea).

Va por local y no en una variable de entorno porque las cuatro casas no tienen
por qué ir a la vez: se puede probar en una, dejar las otras como están, y
volver atrás borrando el campo.

### Lo que se pierde, y por qué el panel lo avisa

Una reserva hecha fuera **no existe en esta aplicación**. No sale en la bandeja,
no llega el aviso al local y no cuenta para el histórico. Parece un ajuste sin
consecuencias y no lo es, así que el panel lo dice en ámbar en cuanto está
puesto. Sin ese aviso, es una trampa que se descubre semanas después, cuando
alguien busca una reserva que no está.

### Solo http y https

La comprobación del protocolo no es cosmética. El valor lo escribe una persona
en el panel y acaba dentro de un `href` que pulsa cualquier visitante: con un
`javascript:` ahí, un encargado —o quien le robe la sesión— ejecuta código en el
navegador de todos los clientes de ese local.

Se valida en el servidor y por **lista blanca**, no prohibiendo `javascript:` a
mano: eso dejaría fuera `data:`, `vbscript:` y los que vengan mañana. Los enlaces
externos llevan `rel="noopener"`, sin el cual la página de destino puede
redirigir la nuestra desde `window.opener`.

### Un solo sitio donde se decide

Hay cuatro botones de reservar: portada, tarjeta de local, ficha y barra de
móvil. Todos pasan por `BotonReservar`. Repartida, la decisión se olvida en uno
de ellos y ese botón sigue llevando al formulario cuando ya no debe — el cliente
reserva por un sitio que el local ha dejado de mirar.

El formulario también lo comprueba: si eliges del desplegable un local que
reserva fuera, desaparecen los campos y sale el enlace. El enlace «Reservar» de
la cabecera es del grupo, no de un local, así que ese sigue yendo al formulario.

---

## La carta real de La Basílica

Ya está cargada. La fuente es `La Basilica/assets/carta.js` — la carta que está
publicada en basilicacarta.pages.dev, transcrita del papel de la mesa — y se
importa con:

```bash
npm run carta-real --prefix api           # ensayo
npm run carta-real --prefix api -- --sql  # aplicarlo
```

**67 platos** en siete secciones, con precios, descripciones y nombres en
inglés. Es idempotente: vuelve a ejecutarse para actualizar precios.

### Lo que el importador NO trae, y por qué

| | Motivo |
| --- | --- |
| Sección «Fuera de carta» | Está marcada `borrador`; sus cinco platos son inventados |
| Bebidas | `bebidas.js` entero está en borrador, precios sin confirmar por el local |
| Alérgenos | La carta web no los lleva a propósito; ya están cargados desde la transcripción |

Ese último punto es el que hace que las dos piezas encajen: **64 de los 67
platos ya tenían sus alérgenos** cargados de la transcripción de las fotos, y
cuelgan del plato, así que al importar la carta se enganchan solos.

Los otros tres eran errores míos de transcripción que la carta real corrige:
«Huevos **gomeros**» (no *someros*), «al **senyoret**» (no *señorito*) y
«**Pimienta**» (no *Pimientos*).

### Media ración, kilo y persona

La carta real trae tres cosas que la tabla no sabía guardar, y las tres cambian
lo que paga el cliente:

- **`precio_media`** — nueve platos van en media y en ración a precios distintos
- **`unidad`** — los chuletones van **a peso** y los arroces **por persona**
- **`numero_carta`** — el número del papel, para pedir «ponme el 35»

Lo de la unidad es lo importante: un chuletón a `47,00 €` a secas no es un
precio incompleto, es un **precio equivocado** — quien lo lee entiende que ese
es el plato y le llega una cuenta al doble. En la carta sale «47,00 € · el
kilo».

### Dos platos en la sección equivocada

El importador mueve un plato de sección solo si lo sirve **nada más que La
Basílica**. La sección vive en el plato, no en la línea de carta, así que
moverla en un plato compartido se la cambia también a las otras casas — y esa
no es una decisión que pueda tomar un importador de una sola carta.

Quedan dos así, y el script los avisa al terminar:

- **Carne fiesta** está en Carnes; en el papel va en Entrantes
- **Langostinos al ajillo** está en Entrantes; en el papel va en Pescados

---

## Alérgenos

Los 14 de declaración obligatoria (Reglamento UE 1169/2011, Anexo II) viven en
la tabla `alergenos` y cuelgan del **plato**, no de la línea de carta: un plato
es el mismo en las cuatro casas, así que sus alérgenos también.

### Los dibujos

Van en `web/public/alergenos/{slug}.webp`, 128×128 con transparencia. Para
regenerarlos, deja los originales en `iconos-alergenos/` y:

```
npm run alergenos --prefix api
```

Recorta el margen transparente (si no, cada icono se ve de un tamaño distinto),
cuadra a 128, guarda el WebP y apunta el fichero en `alergenos.icono`.

`icono` vale `NULL` cuando todavía no hay dibujo, y eso es deliberado: la web
solo pinta la imagen si hay valor, y si aquí hubiera un nombre inventado
saldría una **imagen rota justo donde va un alérgeno**, que se lee como un
fallo de carga y no como información que falta. El icono nunca sustituye al
nombre; lo acompaña. Un cangrejo y una concha se confunden de un vistazo.

**Faltan `gluten` y `mostaza`** del envío del 13-08-2026 (llegaron 12 de 14).
Hasta que lleguen salen como etiqueta de texto.

### De dónde salen los datos

`db/datos/alergenos-basilica.json` es la transcripción de las fotos de la carta
impresa de La Basílica: 70 platos con sus alérgenos. Se carga con

```
npm run carta-basilica --prefix api           # ensayo, no toca nada
npm run carta-basilica --prefix api -- --sql  # aplicarlo
```

Entra en el **catálogo**, no en la carta de ningún local, porque la
transcripción no trae precios. Inventar un precio para que se vea algo sería
peor que no tener el plato: en una carta pública un precio falso se lee como
verdadero. Cuando lleguen los precios, añadirlos desde el panel arrastra los
alérgenos solos — para eso está separado el catálogo de la carta.

### Confirmado vs. transcrito

`platos.alergenos_revisados_en` es `NULL` mientras nadie de cocina lo haya
comprobado, que es el estado por defecto a propósito: confirmar es un acto, no
la ausencia de uno.

Hace falta porque **un plato con los alérgenos bien y otro con los alérgenos mal
se ven exactamente igual**. Sin una marca, en dos meses nadie sabe qué filas
están revisadas y cuáles se copiaron de una foto, y la duda desaparece sola.

Se confirma con un botón en la ficha del plato, no guardando el formulario: el
formulario se guarda por mil motivos que no tienen que ver con los alérgenos.
Y **cambiar la lista invalida la firma anterior**, porque cocina firmó unos
alérgenos concretos; si la lista cambia, esa firma ya no dice nada de lo que
hay ahora.

### Lo que queda antes de publicar

1. Que cocina compare la transcripción con las fichas de receta y la firme.
2. Aclarar si los iconos son ingrediente directo, trazas o ambos.
3. Los menús de celebración (Clásico, Tradicional, Infantil) **no** heredan los
   alérgenos de platos con nombre parecido: van por receta.

El filtro de la carta pública dice «ocultar platos que contengan» y no «sin
gluten», también a propósito: esconder platos no es garantizar que el resto sea
apto. El aviso de contaminación cruzada sale dentro del propio panel de
filtros, que es donde está mirando quien filtra por alergia.

---

## Datos de prueba

> ⚠️ **Los platos y precios de `db/seeds/002_carta.sql` son PROVISIONALES**, con
> una excepción: **La Basílica ya tiene su carta real** (ver más abajo). Las
> otras tres casas siguen con cocina canaria verosímil, no con sus cartas.
> **No enseñar esos precios a cliente final.**

Las bebidas **no llevan etiqueta de dieta**, y `0` ahí significa «no consta»,
no «lleva animal». El seed las marcaba todas como vegetarianas y casi todas
como veganas, en bloque y sin comprobar nada. En los **vinos era falso**:
muchos se clarifican con clara de huevo, caseína o cola de pescado, así que un
vino no es vegano por defecto — lo es si la bodega lo dice. Es el mismo error
que el propio `carta.js` de La Basílica describe para los alérgenos: afirmar
sin comprobar. En el resto era ruido, y una etiqueta que sale en las 59 líneas
entrena a la gente a no mirarlas — y entonces tampoco las mira en los platos,
que es donde sí importan.

En la carta de bebidas (`db/seeds/004_bebidas.sql`) las marcas y las
denominaciones de origen **sí son reales** — el catálogo de Coca-Cola, las
cervezas canarias y las nueve D.O. del archipiélago. Los precios no: están para
que la carta se pueda ver, y se cambian desde el panel.

Los vinos van **por denominación de origen y no por bodega**, a propósito: son
una plantilla. Cada casa sustituye la línea por la botella concreta que trabaja,
con su bodega y su foto, desde **Catálogo**.

Las coordenadas `lat`/`lng` son aproximadas a nivel de calle. Hay que verificarlas
en Google Maps antes de publicar el mapa.

Usuarios de desarrollo (`db/seeds/003_usuarios.sql`), todos con contraseña
`cobama2026`. Solo para local; en producción el primer admin se crea a mano.

| Email | Rol |
|---|---|
| `admin@grupocobama.es` | `admin_grupo` |
| `comoencasa@grupocobama.es` | `encargado_local` (1) |
| `labasilica@grupocobama.es` | `encargado_local` (2) |
| `lacasadelmago@grupocobama.es` | `encargado_local` (3) |
| `eldescarado@grupocobama.es` | `encargado_local` (4) |

---

## QR por local

```bash
npm run qr --prefix api
```

Genera un PNG y un SVG por local en `qr/`, apuntando a `/{slug}/carta`. El
destino sale de `WEB_BASE_URL` en `api/.env`: **para imprimir hay que generarlos
con la URL de producción**, no con `localhost`.

---

## Estructura

```
.
├── docker-compose.yml       MySQL 8 + phpMyAdmin
├── db/
│   ├── migrations/          Esquema, aplicado por el runner
│   └── seeds/               Datos base, cartas y usuarios de desarrollo
├── api/                     Node + Express + mysql2 (ESM)
│   ├── src/
│   │   ├── config/          Entorno y pool de conexiones
│   │   ├── esquemas/        Validación de entrada con zod
│   │   ├── lib/             Runner de migraciones
│   │   ├── routes/          Pública, /auth y /admin
│   │   ├── controllers/     Lectura de la petición y forma de la respuesta
│   │   ├── services/        Consultas y lógica de negocio
│   │   ├── middleware/      Auth, roles, ámbito por local, subidas, errores
│   │   └── utils/
│   └── scripts/             Migraciones, QR y prueba de humo
└── web/                     React + Vite
    └── src/
        ├── api/             Cliente HTTP público
        ├── components/      Layout, tarjetas, plato, estados
        ├── hooks/           useApi
        ├── pages/           Home, Restaurante, Carta, Reservar
        ├── admin/           Panel: se carga en chunks aparte
        │   ├── componentes/ Layout, modal, campos, recorte de imagen
        │   └── paginas/     Login, Panel, CartaLocal, Platos, Usuarios
        └── styles/
```

El panel entero va con `React.lazy`, incluida su hoja de estilos. La web pública
no descarga nada de él: el cliente llega escaneando un QR desde la mesa, muchas
veces con datos móviles.

---

## Siguiente

- **Extraer los cuatro PDF** y reemplazar `db/seeds/002_carta.sql`. Es lo que
  bloquea que esto sea enseñable a cliente.
- **Fase 3** — reservas: el formulario de `/reservar` ya recoge los datos, pero
  hoy los manda por WhatsApp, que es como trabaja el grupo. Falta el
  `POST /api/reservas`, la validación contra el horario real, la bandeja en el
  panel y los avisos por email.
