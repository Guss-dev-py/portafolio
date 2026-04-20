# Augusto Freire — Portafolio Personal

Portafolio personal full-stack con panel de administración privado. Construido con React + Vite en el frontend y Node.js + Express + PostgreSQL en el backend. Incluye sistema de animaciones con partículas Three.js, modo oscuro fijo, formulario de contacto funcional y gestión de proyectos y mensajes desde un panel admin protegido con JWT.

---

## Stack tecnológico

### Frontend
- **React 19** + **TypeScript** — componentes tipados y hooks personalizados
- **Vite 8** — bundler y dev server
- **React Router v7** — navegación SPA con rutas protegidas
- **Framer Motion** — sistema de animaciones con tokens y variantes reutilizables
- **Three.js** — fondo de partículas 3D con ShaderMaterial, conexiones dinámicas y parallax al mouse
- **CSS Modules** + **CSS custom properties** — sistema de diseño con tema oscuro fijo
- **Inter** — tipografía principal via Google Fonts
- **Vitest** + **Testing Library** + **fast-check** — tests unitarios y property-based

### Backend
- **Node.js** + **Express** + **TypeScript** — API REST tipada
- **PostgreSQL** + **node-postgres (pg)** — persistencia con queries SQL directas
- **JWT** + **bcrypt** — autenticación stateless segura
- **Zod** — validación de schemas con tipado estático
- **Resend** — envío de emails de notificación desde el formulario de contacto
- **Vitest** + **fast-check** — property-based testing

### Infraestructura
- **Docker** + **Docker Compose** — stack autocontenido (frontend + backend + PostgreSQL)
- **Nginx** — servidor estático del frontend + reverse proxy interno hacia el backend en `:3001`
- **PostgreSQL 16** — base de datos dentro del stack Docker con volumen persistente

---

## Funcionalidades

### Portafolio público
- **Hero** — presentación con animación de entrada escalonada y fondo de partículas 3D
- **Sobre mí** — biografía, educación, metas, áreas de interés y stack técnico
- **Proyectos** — lista numerada con datos desde la API, link a GitHub
- **Contacto** — links sociales + formulario funcional con envío por email (Resend)
- **Partículas Three.js** — fondo global con ShaderMaterial (círculos reales), conexiones dinámicas, profundidad por capas y parallax al mouse
- **Tema oscuro fijo** — diseño premium con paleta violeta/lavanda

### Panel de administración (`/admin`)
- **Login** — autenticación con JWT, sesión de 8 horas
- **Proyectos** — crear, editar y eliminar proyectos del portafolio
- **Mensajes** — ver y gestionar mensajes recibidos desde el formulario de contacto
- **Rutas protegidas** — `AuthGuard` redirige a login si no hay sesión válida
- **Acceso** — punto `·` discreto en la barra de navegación

---

## Cómo levantar el portfolio

### Opción A — Docker (recomendado)

**Requisitos:** Docker Desktop corriendo + Git

```bash
# 1. Clonar
git clone https://github.com/Guss-dev-py/portafolio.git
cd portafolio

# 2. Crear variables de entorno
cp infra/.env.example infra/.env
# Editar infra/.env con los valores reales (ver sección Variables de entorno)

# 3. Levantar el stack completo
cd infra
docker compose -f docker-compose.postgres.yml --env-file .env up -d --build
```

El portfolio estará en `http://localhost:8080` y el panel admin en `http://localhost:8080/admin/login`.

La primera vez que se levanta el stack, insertar el usuario admin en la DB:

```bash
docker exec -it infra-postgres-1 psql -U portfolio_user -d portfolio -c \
  "INSERT INTO admin_users (username, password_hash) VALUES ('tu-usuario', 'EL_HASH_BCRYPT');"
```

Para generar el hash:
```bash
node -e "const b = require('bcrypt'); b.hash('TU_CONTRASEÑA', 12).then(console.log)"
```

---

### Opción B — Desarrollo local (sin Docker)

**Requisitos:** Node.js 20+ + PostgreSQL 14+ corriendo localmente

**Frontend:**
```bash
cd frontend
cp .env.example .env
# Editar .env: VITE_API_URL=http://localhost:3001
npm install
npm run dev
# → http://localhost:5173
```

**Backend:**
```bash
cd backend
cp .env.example .env
# Completar todas las variables (ver sección Variables de entorno)
npm install
npm run dev
# → http://localhost:3001
```

**Crear las tablas (primera vez):**
```bash
psql -U postgres -d portfolio -f database/migrations/001_init.sql
```

---

## Arquitectura

```
                    ┌─────────────────────────────────────┐
                    │         freire.ucielbustamante.com   │
                    │         Nginx (reverse proxy host)   │
                    └──────────┬──────────────┬────────────┘
                               │              │
                    ┌──────────▼──────┐  ┌────▼──────────────┐
                    │  Frontend       │  │  Backend           │
                    │  React + Vite   │  │  Express + Node.js │
                    │  Nginx :8080    │  │  :3001             │
                    └─────────────────┘  └────────┬──────────┘
                                                  │
                                         ┌────────▼──────────┐
                                         │  PostgreSQL 16     │
                                         │  :5432 (interno)   │
                                         └───────────────────┘
```

El frontend corre en Nginx en el puerto 8080. Nginx actúa como reverse proxy interno: sirve la SPA en `/` y redirige `/api/*` al backend en `backend:3001`. En producción, un segundo Nginx en el host redirige el dominio al contenedor frontend.

---

## Estructura del proyecto

```
project-root/
├── frontend/                   # SPA React + Vite
│   ├── src/
│   │   ├── api/                # Cliente HTTP y funciones de API
│   │   ├── components/
│   │   │   ├── NavigationBar/
│   │   │   ├── ParticlesBackground/  # Three.js ShaderMaterial
│   │   │   ├── ProjectCard/
│   │   │   └── sections/       # Hero, About, Projects, Contact
│   │   ├── data/               # Datos estáticos (perfil, skills, contacto)
│   │   ├── hooks/              # useActiveSection, useProjects, useMessages
│   │   ├── motion/             # Sistema de animaciones (tokens, variants, hooks)
│   │   ├── pages/
│   │   │   └── admin/          # Login, AdminLayout, ProjectsPage, MessagesPage
│   │   └── types/              # Interfaces TypeScript compartidas
│   ├── public/                 # Assets estáticos (favicon, icons)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── eslint.config.js
│   ├── tsconfig.json
│   └── .env.example
│
├── backend/                    # API REST Node.js + Express
│   └── src/
│       ├── middleware/         # auth.ts (JWT), validate.ts (Zod)
│       ├── routes/             # auth, projects, messages, contact, health
│       └── schemas/            # Zod schemas para validación de requests
│
├── database/
│   └── migrations/
│       └── 001_init.sql        # Creación de tablas (projects, messages, admin_users)
│
├── infra/                      # Docker, Nginx, deploy
│   ├── docker/
│   │   └── Dockerfile.frontend
│   ├── nginx/
│   │   ├── nginx.conf          # Config interna del contenedor frontend (proxy → backend:3001)
│   │   └── freire.conf         # Reverse proxy del host (freire.ucielbustamante.com)
│   ├── docker-compose.postgres.yml   # Stack completo: frontend + backend + PostgreSQL
│   ├── docker-compose.yml            # Stack sin PostgreSQL (DB externa)
│   ├── .env                    # Variables para Docker Compose (NO commitear)
│   └── .env.example            # Plantilla de variables
│
├── .gitignore
├── .dockerignore
└── README.md
```

---

## Variables de entorno

### `infra/.env` (Docker Compose)

| Variable | Descripción |
|----------|-------------|
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL |
| `DATABASE_URL` | URL de conexión a la DB |
| `JWT_SECRET` | Secreto para firmar tokens JWT (mín. 32 chars) |
| `ADMIN_USERNAME` | Usuario del panel admin |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt de la contraseña (escapar `$` → `$$` en el archivo) |
| `PORT` | Puerto del backend (3001) |
| `CORS_ORIGIN` | Dominio del frontend en producción |
| `RESEND_API_KEY` | API key de Resend para emails |

> **Importante:** Docker Compose interpola los `$` como variables de entorno. El hash bcrypt `$2b$12$...` debe escribirse como `$$2b$$12$$...` en `infra/.env`.

### `frontend/.env`

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL base de la API (`http://localhost:3001` en dev, `/api` en Docker) |

Ver `infra/.env.example` y `frontend/.env.example` para la lista completa. **Nunca commitear archivos `.env`.**

---

## Base de datos

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `projects` | Proyectos del portafolio |
| `messages` | Mensajes del formulario de contacto |
| `admin_users` | Usuarios del panel de administración |

### Actualizar el hash del admin

```bash
docker exec -it infra-postgres-1 psql -U portfolio_user -d portfolio

UPDATE admin_users
SET password_hash = '$2b$12$...'
WHERE username = 'tu-usuario';
```

---

## Tests

```bash
# Frontend
cd frontend && npx vitest --run

# Backend
cd backend && npm run test
```

---

## Comandos Docker útiles

```bash
# Levantar stack
docker compose -f docker-compose.postgres.yml --env-file .env up -d --build

# Reiniciar sin rebuild
docker compose -f docker-compose.postgres.yml --env-file .env up -d

# Ver logs
docker compose -f docker-compose.postgres.yml logs -f --tail=50

# Detener
docker compose -f docker-compose.postgres.yml down

# Detener y borrar la DB
docker compose -f docker-compose.postgres.yml down -v

# Rebuild de un servicio
docker compose -f docker-compose.postgres.yml --env-file .env up -d --build backend
```

---

## Nginx en el host (producción)

```bash
sudo cp infra/nginx/freire.conf /etc/nginx/sites-available/freire.ucielbustamante.com
sudo ln -s /etc/nginx/sites-available/freire.ucielbustamante.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Próximos pasos

- [ ] Agregar proyectos reales con imágenes y descripciones completas
- [ ] Implementar paginación en la lista de mensajes del admin
- [ ] Agregar soporte para imágenes de proyectos con upload a S3 o Cloudinary
- [ ] Configurar HTTPS con Certbot en el servidor de producción
- [ ] Agregar rate limiting al endpoint de contacto
- [ ] Implementar refresh tokens para extender sesiones del admin
- [ ] CI/CD con GitHub Actions

---

## Contacto

- LinkedIn: [linkedin.com/in/augusto-freire-web](https://www.linkedin.com/in/augusto-freire-web)
- GitHub: [github.com/Guss-dev-py](https://github.com/Guss-dev-py)
- Email: augustofreire02@gmail.com
