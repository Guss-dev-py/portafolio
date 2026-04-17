# Augusto Joaquín Freire — Portafolio Personal

Portafolio personal full-stack con panel de administración privado. Construido con React + Vite en el frontend y Node.js + Express + PostgreSQL en el backend. Incluye sistema de animaciones, modo oscuro/claro, formulario de contacto y gestión de proyectos y mensajes desde un panel admin protegido con JWT.

---

## Qué problema resuelve

Un portafolio estático no permite actualizar proyectos ni ver mensajes de contacto sin tocar el código. Este proyecto resuelve eso con un panel admin privado que permite gestionar el contenido en tiempo real desde cualquier dispositivo, sin redeploy.

---

## Stack tecnológico

### Frontend
- **React 19** + **TypeScript** — componentes tipados y hooks personalizados
- **Vite 8** — bundler y dev server
- **React Router v7** — navegación SPA con rutas protegidas
- **Framer Motion** — sistema de animaciones con tokens y variantes reutilizables
- **CSS Modules** + **CSS custom properties** — sistema de diseño con soporte de temas
- **Vitest** + **Testing Library** + **fast-check** — tests unitarios y property-based

### Backend
- **Node.js** + **Express** + **TypeScript** — API REST tipada
- **PostgreSQL** + **node-postgres (pg)** — persistencia con queries SQL directas
- **JWT** + **bcrypt** — autenticación stateless segura
- **Zod** — validación de schemas con tipado estático
- **Resend** — envío de emails de notificación
- **Vitest** + **fast-check** — property-based testing

### Infraestructura
- **Docker** + **Docker Compose** — contenedores para frontend y backend
- **Nginx** — servidor estático del frontend + reverse proxy del host
- **Netlify** — deploy alternativo del frontend

---

## Arquitectura general

```
                    ┌─────────────────────────────────────┐
                    │         freire.ucielbustamante.com   │
                    │         Nginx (reverse proxy)        │
                    └──────────┬──────────────┬────────────┘
                               │              │
                    ┌──────────▼──────┐  ┌────▼──────────────┐
                    │  Frontend       │  │  Backend           │
                    │  React + Vite   │  │  Express + Node.js │
                    │  :8080          │  │  :3000             │
                    └─────────────────┘  └────────┬──────────┘
                                                  │
                                         ┌────────▼──────────┐
                                         │  PostgreSQL        │
                                         │  :5432             │
                                         └───────────────────┘
```

El frontend es una SPA que consume la API del backend en `/api/*`. En producción, Nginx actúa como reverse proxy: sirve el frontend en `/` y redirige `/api` al backend.

---

## Estructura del proyecto

```
project-root/
├── frontend/                   # SPA React + Vite
│   ├── src/
│   │   ├── api/                # Cliente HTTP y funciones de API
│   │   ├── components/
│   │   │   ├── NavigationBar/
│   │   │   ├── ProjectCard/
│   │   │   └── sections/       # Hero, About, Projects, Contact
│   │   ├── data/               # Datos estáticos (perfil, skills, contacto)
│   │   ├── hooks/              # useTheme, useActiveSection, useProjects, useMessages
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
│   ├── .env.example
│   └── .env                    # No commitear
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
│   │   ├── nginx.conf          # Config interna del contenedor frontend
│   │   └── freire.conf         # Reverse proxy del host
│   ├── docker-compose.yml
│   └── docker-compose.postgres.yml
│
├── .gitignore
├── .dockerignore
├── netlify.toml
└── README.md
```

---

## Cómo levantar el frontend

### Requisitos
- Node.js 18+

```bash
cd frontend

# Configurar variables de entorno
cp .env.example .env
# Editar .env: VITE_API_URL=http://localhost:3000

npm install
npm run dev
# → http://localhost:5173
```

---

## Cómo levantar el backend

### Requisitos
- Node.js 18+
- PostgreSQL 14+

```bash
cd backend

# Configurar variables de entorno
cp .env.example .env
# Completar: DATABASE_URL, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD_HASH, PORT, CORS_ORIGIN, RESEND_API_KEY

npm install
npm run dev
# → http://localhost:3000
```

---

## Base de datos

El backend usa **PostgreSQL** con queries SQL directas a través de `node-postgres`. No hay ORM.

### Crear las tablas

```bash
psql -U postgres -d portfolio -f database/migrations/001_init.sql
```

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `projects` | Proyectos del portafolio (nombre, descripción, tecnologías, URL, imagen) |
| `messages` | Mensajes recibidos desde el formulario de contacto |
| `admin_users` | Usuarios del panel de administración |

### Crear usuario admin

```bash
# Generar hash bcrypt de la contraseña
node -e "const b = require('bcrypt'); b.hash('TU_CONTRASEÑA', 12).then(console.log)"

# Insertar en la base de datos
psql -U postgres -d portfolio -c \
  "INSERT INTO admin_users (username, password_hash) VALUES ('tu-usuario', 'EL_HASH');"
```

---

## Variables de entorno

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
```

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/portfolio
JWT_SECRET=string-aleatorio-de-al-menos-32-chars
ADMIN_USERNAME=tu-usuario-admin
ADMIN_PASSWORD_HASH=hash-bcrypt-de-tu-contraseña
PORT=3000
CORS_ORIGIN=http://localhost:5173
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

Ver `frontend/.env.example` y `backend/.env.example` para la lista completa. **Nunca commitear archivos `.env`.**

---

## Cómo usar Docker / Infra

Los comandos de Docker se ejecutan desde la carpeta `infra/`. El build context apunta a la raíz del repo para que el Dockerfile pueda acceder tanto a `frontend/` como a `infra/nginx/`.

### Sin PostgreSQL (base de datos externa)

```bash
cd infra
docker compose -f docker-compose.yml up --build
```

### Con PostgreSQL incluido

```bash
cd infra
POSTGRES_PASSWORD=tu_password docker compose -f docker-compose.postgres.yml up --build
```

### Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| `frontend` | 8080 | SPA React servida por Nginx |
| `backend` | 3000 | API Express |
| `postgres` | — | PostgreSQL (solo en docker-compose.postgres.yml) |

### Nginx en el host (producción)

El archivo `infra/nginx/freire.conf` es la configuración del reverse proxy del host para `freire.ucielbustamante.com`.

```bash
# Copiar al servidor
sudo cp infra/nginx/freire.conf /etc/nginx/sites-available/freire.ucielbustamante.com
sudo ln -s /etc/nginx/sites-available/freire.ucielbustamante.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Cómo correr tests

### Frontend

```bash
cd frontend
npm run test          # watch mode
npx vitest --run      # single run
```

### Backend

```bash
cd backend
npm run test          # single run (vitest --run)
```

---

## Funcionalidades principales

### Portafolio público
- **Hero** — presentación con animación de entrada escalonada
- **Sobre mí** — biografía, metas y habilidades agrupadas por categoría
- **Proyectos** — galería con hover expandible, datos desde la API
- **Contacto** — links sociales + formulario con validación y envío por email (Resend)
- **Modo oscuro/claro** — detección automática del sistema + persistencia en `localStorage`
- **Animaciones** — sistema cohesivo con Framer Motion, tokens compartidos y soporte de `prefers-reduced-motion`

### Panel de administración (`/admin`)
- **Login** — autenticación con JWT, sesión de 8 horas
- **Proyectos** — crear, editar y eliminar proyectos del portafolio
- **Mensajes** — ver y gestionar mensajes recibidos desde el formulario de contacto
- **Rutas protegidas** — `AuthGuard` redirige a login si no hay sesión válida

---

## Próximos pasos

- [ ] Agregar proyectos reales con imágenes y descripciones completas
- [ ] Implementar paginación en la lista de mensajes del admin
- [ ] Agregar soporte para imágenes de proyectos con upload a S3 o Cloudinary
- [ ] Configurar HTTPS con Certbot en el servidor de producción
- [ ] Agregar rate limiting al endpoint de contacto
- [ ] Implementar refresh tokens para extender sesiones del admin
- [ ] Agregar CI/CD con GitHub Actions

---

## Contacto

- LinkedIn: [linkedin.com/in/augusto-freire-web](https://www.linkedin.com/in/augusto-freire-web)
- GitHub: [github.com/Guss-dev-py](https://github.com/Guss-dev-py)
- Email: augustofreire02@gmail.com
