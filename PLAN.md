# Plan de implementación — Web unificada Grupo Cobama

**Proyecto:** plataforma web multi-local para los cuatro guachinches del Grupo Cobama
**Fase actual:** Fase 1 completa en local
**Última actualización:** 4 de agosto de 2026

---

## 1. Contexto

El Grupo Cobama opera cuatro establecimientos de cocina canaria en Tenerife.
Cuentan con una web en Framer (`grupocobama.es`) que funciona como escaparate:
cuatro páginas de reserva prácticamente idénticas, cartas en PDF alojadas en
Google Drive y reservas centralizadas por WhatsApp.

**Limitaciones del sistema actual:**

- Las cartas son PDFs estáticos. Cambiar un precio implica rehacer y volver a subir el documento.
- No hay base de datos. Cero trazabilidad de precios, platos o reservas.
- Las reservas llegan por WhatsApp a un único número, sin registro estructurado ni asignación por local.
- Cada local se gestiona de forma aislada pese a compartir cocina, proveedores y buena parte de la carta.
- Sin versión en inglés, en una isla con volumen turístico alto.

**Objetivo:** sustituir ese escaparate por una plataforma unificada que sirva a
la vez como web pública y como herramienta de gestión interna.

---

## 2. Datos de partida

### Establecimientos

| Local | Municipio | Dirección | Teléfono |
|---|---|---|---|
| Como en Casa | La Laguna | Guamasa, junto al aeropuerto Tenerife Norte | 922 87 65 09 |
| La Basílica | Candelaria | C. la Magdalena, 38509 | 822 77 14 69 |
| La Casa del Mago | La Laguna | C. Marqués de Celada 15, 38202 | 822 05 96 92 |
| El Descarado | La Orotava | Carr. Enlace el Ramal, 38314 | 922 08 15 50 |

### Datos comunes del grupo

- **Horario (los cuatro):** domingo a jueves 12:30–23:00 · viernes y sábado 12:30–00:00
- **WhatsApp de reservas:** +34 822 680 304
- **Email:** info@grupocobama.es
- **Sede:** Guamasa, Santa Cruz de Tenerife
- **Redes:** Instagram `@grupocobama`, TikTok `@grupocobama`

### Cartas (PDF en Google Drive)

| Local | ID de archivo |
|---|---|
| Como en Casa | `1UxLfplA6xtFpO0XNdKO9towlMHhXvci_` |
| La Basílica | `14r_0DqPOi80KTf6CZIS6VBPB0WxeAV2r` |
| La Casa del Mago | `1vvJLG0MombiBXexDokqosRoDQed9xyv6` |
| El Descarado | `1w_BSDayTcVZ0PBZZwBOXX1waZtBHwJLu` |

> **Pendiente y bloqueante.** Extraer el contenido de los cuatro PDFs (platos,
> categorías, precios, alérgenos) para reemplazar `db/seeds/002_carta.sql`, que
> hoy lleva datos de relleno. Es lo único que separa el prototipo de algo
> enseñable al cliente.

### Perfil de cada local

- **Como en Casa** — El más grande del grupo. Parking amplio, granja con animales y zona infantil. Público familiar, mucha afluencia de fin de semana, fuerte presencia en redes.
- **La Basílica** — Ocupa el antiguo Restaurante El Cruce. Espacio grande con terraza cerrada y parking propio. Especialidad en carnes a la brasa y arroces.
- **La Casa del Mago** — Casona canaria reformada en el centro de La Laguna, cerca de la plaza de la Concepción. Sin parking. Propuesta más elaborada, raciones más pequeñas, cenas y grupos reducidos.
- **El Descarado** — Abierto en 2025 en La Orotava, zona El Ramal. Salón interior y terrazas amplias, parking privado. Especialidad en arroces (el arroz al señoret es su plato bandera) y carnes.

---

## 3. Stack técnico

| Capa | Tecnología | Motivo |
|---|---|---|
| Frontend | React + Vite | Stack ya dominado, arranque rápido, buen rendimiento |
| Backend | Node.js + Express | Reutilizable desde proyectos previos |
| Base de datos | MySQL 8 | Relacional, encaja con el modelo multi-local |
| Autenticación | JWT con roles | Patrón ya implementado anteriormente |
| Entorno local | Docker Compose | Reproducible, aísla MySQL del sistema |
| Almacenamiento de imágenes | Local en desarrollo → Cloudflare R2 o S3 en producción | Evita meter binarios en la base de datos |

**Despliegue previsto:** frontend en Cloudflare Pages, API y base de datos en VPS
o servicio gestionado. A decidir en la fase 4.

---

## 4. Arquitectura

### Principio rector: multi-tenant desde el inicio

Una sola aplicación, una sola base de datos, un solo despliegue. Los cuatro
locales son filas en una tabla `restaurantes`, no cuatro proyectos. Casi todas
las tablas llevan `restaurante_id` como clave foránea.

**Rutas públicas:**

```
/                      → landing del grupo
/como-en-casa          → ficha del local
/como-en-casa/carta    → carta del local
/la-basilica
/la-casa-del-mago
/el-descarado
/reservar              → formulario con selector de local
```

Todas las fichas usan el mismo componente y la misma llamada a la API cambiando
el parámetro. Abrir un quinto local es insertar una fila, no desplegar nada nuevo.

### Separación catálogo / carta

Los cuatro locales comparten gran parte de la carta (croquetas de la casa, queso
asado, carne fiesta, papas arrugadas) pero con precios y disponibilidad
distintos. Por eso el catálogo se separa en dos niveles:

- **`platos`** — catálogo maestro del grupo. Un plato existe una sola vez, con su nombre, descripción, alérgenos y foto.
- **`carta_items`** — tabla puente que decide qué local sirve qué plato, a qué precio y en qué orden.

Esto permite que cocina central dé de alta un plato una vez y cada local lo
active o desactive de forma independiente. Es la solución directa al problema de
los cuatro PDFs descoordinados.

---

## 5. Esquema de base de datos

Implementado en [`db/migrations/001_schema.sql`](db/migrations/001_schema.sql).

### Tablas principales

**`restaurantes`**
`id`, `slug`, `nombre`, `municipio`, `direccion`, `telefono`, `email`, `whatsapp`,
`lat`, `lng`, `descripcion`, `descripcion_en`, `reclamo`, `reclamo_en`,
`imagen_portada`, `tiene_parking`, `orden`, `activo`

**`horarios`**
`id`, `restaurante_id`, `dia_semana` (0–6), `hora_apertura`, `hora_cierre`, `cerrado`

Se modela por día aunque hoy los cuatro coincidan: en cuanto uno cierre los lunes
o cambie el horario de verano, el sistema lo absorbe sin tocar código. Los
cierres pasada medianoche se guardan como `24:00:00` o más.

**`categorias`**
`id`, `slug`, `nombre`, `nombre_en`, `orden`, `activo`
Entrantes, ensaladas, arroces, carnes, pescados, postres, bebidas.

**`platos`** — catálogo maestro del grupo
`id`, `categoria_id`, `nombre`, `nombre_en`, `descripcion`, `descripcion_en`,
`imagen`, `es_vegetariano`, `es_vegano`, `activo`

**`alergenos`**
`id`, `slug`, `nombre`, `nombre_en`, `icono`
Los 14 alérgenos de declaración obligatoria según el Reglamento (UE) 1169/2011.

**`plato_alergenos`**
`plato_id`, `alergeno_id`, `trazas`

**`carta_items`** — qué sirve cada local y a qué precio
`id`, `restaurante_id`, `plato_id`, `precio` DECIMAL(6,2), `activo`, `orden`, `destacado`
Índice único sobre (`restaurante_id`, `plato_id`).

**`historico_precios`**
`id`, `carta_item_id`, `precio_anterior`, `precio_nuevo`, `usuario_id`, `fecha`

Se alimenta desde el servicio al actualizar un precio, dentro de la misma
transacción. Es lo que convierte la web en herramienta de gestión: permite
responder a preguntas del tipo "¿cuánto costaba el arroz al señoret en marzo?".

**`reservas`**
`id`, `restaurante_id`, `nombre`, `telefono`, `email`, `fecha`, `hora`,
`comensales`, `observaciones`, `estado` (pendiente / confirmada / cancelada /
no_presentado), `origen` (web / whatsapp / telefono)

**`usuarios`**
`id`, `nombre`, `email`, `password_hash`, `rol` (admin_grupo / encargado_local),
`restaurante_id` (nulo para admin de grupo), `activo`, `ultimo_acceso`

**`menus_grupo`** — menús cerrados para eventos y celebraciones
`id`, `restaurante_id`, `nombre`, `descripcion`, `precio_por_persona`,
`minimo_comensales`, `activo`

### Convenciones

- Precios siempre en `DECIMAL(6,2)`. Nunca `FLOAT`.
- Todas las tablas con `created_at` y `updated_at`.
- Borrado lógico mediante `activo`, no `DELETE`. Un plato retirado sigue siendo necesario para el histórico.
- Campos `*_en` duplicados para la traducción al inglés desde el principio, aunque se rellenen más tarde.

---

## 6. Roles y permisos

| Rol | Alcance |
|---|---|
| `admin_grupo` | Acceso a los cuatro locales. Gestiona el catálogo maestro de platos, usuarios y estadísticas globales. |
| `encargado_local` | Acceso restringido a su `restaurante_id`. Activa o desactiva platos de su carta, ajusta precios, gestiona sus reservas. |

El filtrado por `restaurante_id` se aplica en el middleware del backend, nunca
solo en el frontend. Un `CHECK` en `usuarios` garantiza que `admin_grupo` no
tenga local y `encargado_local` sí.

---

## 7. Fases de ejecución

### Fase 1 — Cimientos y carta digital ✅

Es la fase que sustituye los PDFs y por sí sola justifica el proyecto.

- [x] `docker-compose.yml` con MySQL 8 y phpMyAdmin
- [x] Esquema SQL completo
- [x] Seed con los cuatro restaurantes, horarios, categorías y los 14 alérgenos
- [ ] Extracción de las cuatro cartas desde los PDFs → seed de `platos` y `carta_items` *(bloqueado: hoy hay datos de relleno)*
- [x] API REST de lectura: `GET /api/restaurantes`, `/api/restaurantes/:slug`, `/api/restaurantes/:slug/carta`
- [x] Frontend público: landing del grupo, ficha de local y carta
- [x] Filtro por alérgenos y por categoría
- [x] Diseño responsive con prioridad móvil (el cliente llega por QR desde la mesa)
- [x] Generación de QR por local

### Fase 2 — Panel de administración

- [ ] Autenticación JWT con refresh token
- [ ] Middleware de roles y filtrado por `restaurante_id`
- [ ] CRUD del catálogo maestro de platos
- [ ] Gestión de carta por local: activar, desactivar, reordenar, cambiar precio
- [ ] Registro automático en `historico_precios`
- [ ] Subida y recorte de imágenes de platos
- [ ] Gestión de usuarios

### Fase 3 — Reservas

Arranca como sistema de solicitud con confirmación manual. La agenda con gestión
de mesas y aforo se evalúa después: es un proyecto en sí mismo y hoy el grupo
gestiona por WhatsApp, así que cualquier registro estructurado ya supone una
mejora sustancial.

- [x] Formulario público con selector de local, fecha, hora y comensales *(hoy compone un mensaje de WhatsApp)*
- [ ] Validación contra el horario real del local
- [ ] Registro en base de datos con estado `pendiente`
- [ ] Notificación por email al local
- [ ] Bandeja de reservas en el panel: confirmar, cancelar, marcar no presentado
- [ ] Email de confirmación al cliente
- [ ] Vista de calendario por local

### Fase 4 — Producción y extras

- [ ] Traducción al inglés de la carta y la web
- [ ] Menús de grupo y eventos *(esquema y lectura ya hechos)*
- [ ] Panel de estadísticas: reservas por local, platos más pedidos, evolución de precios
- [ ] SEO y datos estructurados `schema.org/Restaurant` por local
- [ ] Despliegue: frontend en Cloudflare Pages, API en VPS
- [ ] Backups automáticos de la base de datos
- [ ] Aviso legal, política de privacidad y cookies

### Ideas para más adelante

- Lista de espera digital para los fines de semana, especialmente en Como en Casa y El Descarado
- Pedidos para llevar
- Integración con TPV
- Panel de proveedores y escandallos

---

## 8. Decisiones pendientes

1. **Alcance de las reservas** — ¿solicitud con confirmación manual (recomendado para empezar) o agenda completa con mesas, turnos y aforo?
2. **Encargo** — ¿es una propuesta para presentar al grupo o un trabajo ya confirmado? Condiciona cuánto se invierte en el prototipo antes de enseñarlo.
3. **Identidad visual** — ¿existe manual de marca, logotipos vectoriales y tipografías del grupo, o hay que definirlos? El prototipo va con una paleta provisional (carbón, ocre, crema) y tipografías del sistema.
4. **Fotografía** — las fotos actuales son de la web en Framer. Hay oportunidad de incluir una sesión propia de fotografía y dron en la propuesta. El esquema ya tiene `platos.imagen` y `restaurantes.imagen_portada` esperando.
5. **Dominio** — ¿se mantiene `grupocobama.es` y se sustituye el Framer, o se trabaja en un subdominio hasta el lanzamiento?
