# Augusto Freire — Portafolio Personal

Portafolio full-stack con estética editorial tipo terminal y panel de administración privado. Frontend en **React 19 + TypeScript (Vite)**, API REST en **Node.js + Express + PostgreSQL**, todo desplegado como un stack autocontenido de **Docker Compose** detrás de **Nginx**.

🌐 **Producción:** [freire.ucielbustamante.com](https://freire.ucielbustamante.com)

---

## Stack tecnológico

### Frontend
- **React 19** + **TypeScript** — componentes tipados y hooks de datos propios (sin state manager externo)
- **Vite** — bundler y dev server
- **React Router v7** — SPA con rutas protegidas para el admin
- **Framer Motion** — sistema de animaciones propio (`src/motion/`) con tokens y variantes reutilizables
- **Canvas 2D** — fondo de partículas de 5 capas con drift, repulsión al mouse, conexiones por profundidad, parallax y escalado retina; respeta `prefers-reduced-motion`
- **CSS Modules** + custom properties — sistema de diseño "paper": paleta crema/tinta, JetBrains Mono + Newsreader
- **Vitest** + **Testing Library** + **fast-check** — tests unitarios y property-based

### Backend
- **Express** + **TypeScript** — API REST con validación en el borde
- **PostgreSQL 16** + **node-postgres** — queries parametrizadas, IDs UUID
- **Zod** — todo body entrante se valida antes de llegar al handler
- **JWT (HS256, 8 h)** + **bcrypt (cost 12)** — autenticación del admin
- **express-rate-limit** — login (10 req/15 min) y contacto (5 req/15 min), por IP real detrás del proxy
- **Resend** — notificación por email de cada mensaje del formulario
- **Migraciones automáticas** — el backend aplica las migraciones pendientes al arrancar (tabla `schema_migrations`, transaccional e idempotente)

### Infraestructura
- **Docker Compose** — frontend (Nginx) + backend + PostgreSQL con volumen persistente
- **Nginx** — sirve la SPA y proxya `/api/*` al backend
- `infra/rotate-secrets.sh` — rotación guiada de secretos (JWT, Postgres, admin, Resend) con backup y health check

---

## Funcionalidades

### Sitio público
- **Hero terminal** — sesión de consola con animación de tipeo y estado de disponibilidad en vivo (`open / working / occupied`) gestionado desde el admin
- **Proyectos** — listado tipo índice servido desde la API: tecnologías expandibles con animación, link al sitio en vivo (click en la fila) y al repositorio ("Ver repo")
- **Contacto** — formulario con validación accesible (labels, `aria-invalid`, mensajes de error), persistencia en DB y notificación por email
- **CV** — botón en la barra de navegación que abre el PDF en una pestaña nueva
- **Accesibilidad** — skip-link, focus rings visibles, focus trap en menú móvil y diálogos, toasts anunciados con `aria-live`, `prefers-reduced-motion` respetado

### Panel de administración (`/admin`)
- **Login** con JWT (8 h); las credenciales salen de variables de entorno — no hace falta insertar nada en la DB
- **Proyectos** — CRUD completo con búsqueda, filtros por tecnología, orden y export a JSON
- **Mensajes** — bandeja con filtros leído/no-leído, detalle, respuesta vía Gmail y eliminación con confirmación
- **Ajustes** — cambia el estado de disponibilidad que muestra el hero público
- **Atajos de teclado** — `/` buscar · `n` nuevo proyecto · `g p / g m / g s` navegar · `Esc` cerrar

---

## Cómo levantarlo

### Opción A — Docker (recomendada)

**Requisitos:** Docker + Node.js (solo para generar el hash del admin)

```bash
git clone https://github.com/Guss-dev-py/portafolio.git
cd portafolio

cp .env.example .env
# Completar los valores (ver tabla de variables)

# Generar el hash bcrypt del password del admin:
cd backend && npm install
node -e "const b=require('bcrypt');b.hash('TU_PASSWORD',12).then(console.log)"
cd ..
# Pegarlo en ADMIN_PASSWORD_HASH escapando cada $ como $$ → $$2b$$12$$...

docker compose up -d --build
```

- Portfolio: `http://localhost:8080`
- Admin: `http://localhost:8080/admin/login`

Las migraciones se aplican solas al arrancar el backend — tanto en la primera corrida como al actualizar (`git pull && docker compose up -d --build`).

### Opción B — Desarrollo local

**Requisitos:** Node.js 20+ y PostgreSQL 14+

```bash
# Backend
cd backend
cp .env.example .env   # completar todas las variables
npm install
npm run dev            # → http://localhost:3001 (aplica migraciones al arrancar)

# Frontend (otra terminal)
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3001
npm install
npm run dev            # → http://localhost:5173
```

---

## Variables de entorno (`.env` raíz)

| Variable | Descripción |
|----------|-------------|
| `FRONTEND_PORT` / `BACKEND_PORT` / `POSTGRES_PORT` | Puertos publicados (defaults: 8080 / 3001 / 5432) |
| `POSTGRES_PASSWORD` | Password de PostgreSQL |
| `DATABASE_URL` | Conexión a la DB (host `postgres` dentro del compose) |
| `JWT_SECRET` | Secreto de firma JWT — `openssl rand -hex 32` |
| `ADMIN_USERNAME` | Usuario del panel admin |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt (escapar `$` → `$$` en el archivo) |
| `CORS_ORIGIN` | Dominio del frontend en producción, **sin barra final** |
| `RESEND_API_KEY` | API key de Resend |
| `RECIPIENT_EMAIL` | Casilla que recibe los mensajes del formulario |

El backend valida todas las variables al arrancar y corta con un error claro si falta alguna.

---

## Arquitectura

```
            ┌──────────────────────────────────────┐
            │   freire.ucielbustamante.com          │
            │   Nginx del host (reverse proxy)      │
            └────────────────┬───────────────────── ┘
                             │
            ┌────────────────▼─────────────────┐
            │  frontend (Nginx :8080)           │
            │  /        → SPA React             │
            │  /api/*   → proxy ─────────────┐  │
            └────────────────────────────────│──┘
                                             │
            ┌────────────────────────────────▼──┐
            │  backend (Express :3001)           │
            │  JWT · Zod · rate limit · Resend   │
            └────────────────┬──────────────────┘
                             │
            ┌────────────────▼──────────────────┐
            │  PostgreSQL 16 (volumen pgdata)    │
            │  migraciones automáticas al boot   │
            └───────────────────────────────────┘
```

---

## Estructura

```
├── frontend/
│   └── src/
│       ├── api/            # apiClient + funciones por recurso
│       ├── components/     # NavigationBar, ParticlesBackground, Toast, secciones…
│       ├── hooks/          # useProjects, useMessages, useWorkStatus
│       ├── motion/         # tokens, variantes y hooks de animación
│       └── pages/admin/    # Login, Layout, Projects, Messages, Settings
├── backend/
│   └── src/
│       ├── middleware/     # auth (JWT), validate (Zod), validateUuid, rate limiters
│       ├── routes/         # auth, projects, messages, contact, status, health
│       ├── schemas/        # Zod schemas
│       └── utils/          # runMigrations, helpers
├── database/migrations/    # 001_init · 002_site_settings · 003_repo_url
├── infra/
│   ├── docker/             # Dockerfile del frontend
│   ├── nginx/              # nginx.conf (contenedor) + freire.conf (host)
│   └── rotate-secrets.sh   # rotación de secretos en producción
└── docker-compose.yml
```

---

## Tests

```bash
cd frontend && npx vitest --run   # 111 tests (unitarios + property-based)
cd backend  && npm run test       # 44 tests (rutas con supertest, DB mockeada)
```

---

## Seguridad

- Queries 100 % parametrizadas, validación Zod en todos los endpoints públicos
- JWT con algoritmo fijado (HS256) y expiración verificada en backend y frontend
- Rate limiting por IP real (`trust proxy` detrás de Nginx)
- Login con comparación bcrypt de tiempo constante (sin filtrar usuarios válidos)
- CORS restringido al dominio exacto de producción
- Rotación de secretos guiada: `./infra/rotate-secrets.sh`

---

## Contacto

- LinkedIn: [linkedin.com/in/augusto-freire-web](https://www.linkedin.com/in/augusto-freire-web)
- GitHub: [github.com/Guss-dev-py](https://github.com/Guss-dev-py)
- Email: augustofreire02@gmail.com
