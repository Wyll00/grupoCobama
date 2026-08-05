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

Levanta la base de datos y carga esquema y datos:

```bash
docker compose up -d && npm install --prefix api && npm run db:setup --prefix api
```

Luego, en dos terminales:

```bash
npm run dev --prefix api
```

```bash
npm install --prefix web && npm run dev --prefix web
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

53 comprobaciones end-to-end contra una API levantada: login, rotación de
refresh tokens, límites por rol y por local, CRUD de catálogo, procesado de
imágenes, histórico de precios, reordenación y gestión de usuarios. Deja la base
de datos como estaba, incluso si se rompe a mitad.

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
| PATCH · DELETE | `/api/admin/carta-items/:id` | Su local |
| GET | `/api/admin/carta-items/:id/historico` | Su local |
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
| Cambiar el precio de un plato en varias casas | **Catálogo** → el plato → *Precio por local* |
| Cambiar nombre, descripción, alérgenos o foto | **Catálogo** → el plato |
| Dar de alta un plato nuevo del grupo | **Catálogo** → *Nuevo plato* |

Son la misma tabla vista de dos formas: en Cartas, todos los platos de un local;
en la ficha del plato, todos los locales de un plato. Sin la segunda, subir un
precio en las cuatro casas obligaba a entrar cuatro veces en Cartas.

Desde la ficha del plato también se da de alta en una carta que todavía no lo
sirve, y se consulta el histórico de precios de cada local. Un encargado solo ve
editable la fila de su local; las demás no le aparecen.

---

## Roles y filtrado por local

| Rol | Alcance |
|---|---|
| `admin_grupo` | Los cuatro locales, el catálogo maestro y los usuarios |
| `encargado_local` | Solo su `restaurante_id`: activa platos, ajusta precios y reordena su carta |

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

## Datos de prueba

> ⚠️ **Los platos y precios de `db/seeds/002_carta.sql` son PROVISIONALES.**
> Son cocina canaria verosímil, no las cartas reales del grupo. Ese fichero se
> reemplaza entero cuando se extraiga el contenido de los cuatro PDF de Google
> Drive. **No enseñar esos precios a cliente final.** Lo mismo vale para los
> alérgenos: son una estimación y tiene que validarlos cocina antes de publicar,
> porque es obligación legal.

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
