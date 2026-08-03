# Grupo Cobama — plataforma web

Web pública y herramienta de gestión para los cuatro guachinches del Grupo Cobama
en Tenerife: **Como en Casa** (Guamasa), **La Basílica** (Candelaria),
**La Casa del Mago** (La Laguna) y **El Descarado** (La Orotava).

Multi-tenant desde el primer día: una aplicación, una base de datos, un
despliegue. Los cuatro locales son filas en la tabla `restaurantes`, no cuatro
proyectos. Abrir un quinto local es un `INSERT`, no un despliegue nuevo.

**Estado:** Fase 1 completa (cimientos y carta digital). Ver [PLAN.md](PLAN.md).

---

## Arrancar en local

Necesitas Docker y Node 20 o superior.

```bash
cp .env.example .env && cp api/.env.example api/.env
```

```bash
docker compose up -d
```

MySQL carga el esquema y los seeds la primera vez que arranca (unos 30 s).
Luego, en dos terminales:

```bash
npm install --prefix api && npm run dev --prefix api
```

```bash
npm install --prefix web && npm run dev --prefix web
```

| Servicio | URL |
|---|---|
| Web | http://localhost:5173 |
| API | http://localhost:4000/api |
| phpMyAdmin | http://localhost:8081 (usuario `cobama`, contraseña `cobama`) |

Para volver a cargar el esquema desde cero, hay que borrar el volumen —
`docker-entrypoint-initdb.d` solo se ejecuta cuando el volumen está vacío:

```bash
docker compose down -v && docker compose up -d
```

---

## API

Todas las respuestas van envueltas en `{ "datos": ... }`; los errores en
`{ "error": { "mensaje": ... } }`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servicio y de la conexión a MySQL |
| GET | `/api/restaurantes` | Los cuatro locales, con horario resumido y `abierto_ahora` |
| GET | `/api/restaurantes/:slug` | Ficha completa, horarios y menús de grupo |
| GET | `/api/restaurantes/:slug/carta` | Carta agrupada por categoría |
| GET | `/api/categorias` | Categorías del catálogo |
| GET | `/api/alergenos` | Los 14 alérgenos obligatorios |

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
curl "http://localhost:4000/api/restaurantes/el-descarado/carta?sin_alergenos=gluten,lacteos"
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
│   ├── migrations/          Esquema
│   └── seeds/               Datos base, cartas y usuarios de desarrollo
├── api/                     Node + Express + mysql2 (ESM)
│   ├── src/
│   │   ├── config/          Entorno y pool de conexiones
│   │   ├── routes/          Definición de rutas
│   │   ├── controllers/     Lectura de la petición y forma de la respuesta
│   │   ├── services/        Consultas y lógica de negocio
│   │   ├── middleware/      Errores (auth y roles en la fase 2)
│   │   └── utils/
│   └── scripts/             Generación de QR
└── web/                     React + Vite
    └── src/
        ├── api/             Cliente HTTP
        ├── components/      Layout, tarjetas, plato, estados
        ├── hooks/           useApi
        ├── pages/           Home, Restaurante, Carta, Reservar
        └── styles/
```

---

## Siguiente

- **Extraer los cuatro PDF** y reemplazar `db/seeds/002_carta.sql`. Es lo que
  bloquea que esto sea enseñable a cliente.
- **Fase 2** — panel de administración: JWT con refresh, middleware de roles con
  filtrado por `restaurante_id` (en el backend, nunca solo en el frontend), CRUD
  del catálogo, gestión de carta por local e histórico de precios.
- **Fase 3** — reservas: el formulario de `/reservar` ya recoge los datos, pero
  hoy los manda por WhatsApp, que es como trabaja el grupo. Falta el
  `POST /api/reservas`, la validación contra el horario real, la bandeja en el
  panel y los avisos por email.
