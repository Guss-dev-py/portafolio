# Augusto Joaquín Freire — Portafolio Personal

Soy **FullStack Developer** con foco en Python, React, Node.js y proyectos orientados a APIs seguras y cloud. Actualmente curso **Ingeniería Informática en UNPAZ** y busco seguir creciendo en entornos dinámicos, con especial interés en **ciberseguridad** y **FinTech**.

Este repositorio es mi portafolio personal: un espacio donde presento quién soy, mis habilidades técnicas, los proyectos en los que trabajé y mis canales de contacto.

---

## Sobre el portafolio

La aplicación está construida como una **Single Page Application (SPA)** con cuatro secciones navegables mediante scroll suave:

| Sección | Contenido |
|---|---|
| **Inicio** | Nombre, rol, tecnologías principales y acceso rápido a proyectos |
| **Sobre mí** | Biografía, metas profesionales y habilidades agrupadas por categoría |
| **Proyectos** | Galería interactiva con hover expandible y acceso directo a cada proyecto |
| **Contacto** | Links de LinkedIn, GitHub, email y formulario de contacto |

Incluye **modo oscuro/claro** con detección automática de la preferencia del sistema y persistencia en `localStorage`.

---

## Panel de Administración

El portafolio incluye un panel admin privado en `/admin` que permite gestionar el contenido sin tocar el código fuente.

### Funcionalidades

- **Proyectos** — crear, editar y eliminar proyectos del portafolio
- **Mensajes** — ver y gestionar los mensajes recibidos desde el formulario de contacto
- **Autenticación** — login con JWT, sesión de 8 horas, cierre de sesión

### Arquitectura

```
Netlify (frontend)          Railway / Render (backend)
┌─────────────────┐         ┌──────────────────────────┐
│  React + Vite   │ ──API── │  Node.js + Express       │
│  /admin/*       │         │  PostgreSQL               │
└─────────────────┘         └──────────────────────────┘
```

### Stack del backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)

- **Express** + **TypeScript** — API REST con rutas tipadas
- **PostgreSQL** + **node-postgres** — persistencia con queries SQL directas
- **JWT** + **bcrypt** — autenticación segura sin estado
- **Zod** — validación de schemas con tipado estático

---

## Tecnologías del frontend

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![CSS Modules](https://img.shields.io/badge/CSS_Modules-000000?style=flat&logo=cssmodules&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat&logo=framer&logoColor=white)

- **React 19** + **TypeScript** — componentes tipados y hooks personalizados
- **React Router v6** — navegación SPA con rutas protegidas
- **Vite** — bundler y dev server
- **CSS Modules** + **CSS custom properties** — sistema de diseño con variables para temas
- **Framer Motion** — sistema de animaciones con tokens compartidos, variantes reutilizables y revelación por scroll
- **Intersection Observer API** — detección de sección activa sin librerías externas

---

## Sistema de Movimiento

El portafolio incluye un sistema de animaciones cohesivo construido sobre Framer Motion, diseñado para rendimiento a 60fps y accesibilidad completa.

### Arquitectura

```
src/motion/
  tokens.ts       ← duraciones, easing, springs, stagger, offsets
  variants.ts     ← variantes reutilizables (fadeUp, scaleIn, slideInLeft, etc.)
  hooks/
    useInView.ts          ← revelación por scroll (dispara una sola vez)
    useReducedMotion.ts   ← respeta prefers-reduced-motion
```

### Animaciones por componente

| Componente | Animaciones |
|---|---|
| **NavigationBar** | Entrada con fade+slide, links escalonados, píldora indicadora activa con `layoutId`, spin-in del toggle de tema, sombra al hacer scroll |
| **HeroSection** | Entrada cinematográfica escalonada (saludo → nombre → rol → intro → habilidades → CTA), hover/tap spring en el botón |
| **AboutSection** | Revelación por scroll con `useInView`, `slideInLeft` en encabezado, stagger en bio, bloques y grupos de habilidades |
| **ProjectsSection** | Entrada escalonada de la grilla al hacer scroll, hover elástico con spring en tarjetas, overlay animado con `AnimatePresence` |
| **ContactSection** | Revelación por scroll, stagger en links sociales y campos del formulario, anillo de brillo en foco, pulso de envío, confirmación de éxito animada |

### Accesibilidad

- Regla `@media (prefers-reduced-motion: reduce)` en `index.css` — deshabilita todas las transiciones CSS
- Hook `useReducedMotion()` en cada componente — reemplaza variantes de Framer Motion con no-ops cuando el usuario prefiere movimiento reducido
- Ninguna animación transmite información que no esté también disponible de forma estática

---

## Estructura del proyecto

```
├── src/                        # Frontend React
│   ├── api/                    # Cliente HTTP y funciones de API
│   ├── components/
│   │   ├── NavigationBar/
│   │   ├── ProjectCard/
│   │   └── sections/           # HeroSection, AboutSection, ProjectsSection, ContactSection
│   ├── hooks/                  # useTheme, useActiveSection, useProjects, useMessages
│   ├── motion/                 # Sistema de animaciones
│   │   ├── tokens.ts           # Duraciones, easing, springs, stagger, offsets
│   │   ├── variants.ts         # Variantes reutilizables de Framer Motion
│   │   └── hooks/              # useInView, useReducedMotion
│   ├── pages/
│   │   └── admin/              # LoginPage, AdminLayout, ProjectsPage, MessagesPage, AuthGuard
│   └── types/                  # Interfaces TypeScript compartidas
│
└── backend/                    # API REST Node.js
    ├── src/
    │   ├── middleware/          # auth.ts (JWT), validate.ts (Zod)
    │   ├── routes/              # auth, projects, messages, contact, health
    │   └── schemas/             # Zod schemas para validación
    └── migrations/
        └── 001_init.sql         # Creación de tablas
```

---

## Cómo correrlo localmente

### Requisitos
- Node.js 18+
- PostgreSQL 14+

### Frontend

```bash
# Crear .env en la raíz (ver .env.example)
cp .env.example .env

npm install
npm run dev
```

### Backend

```bash
# Crear .env en backend/ (ver backend/.env.example)
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales

# Crear las tablas en PostgreSQL
psql -U postgres -d portfolio -f backend/migrations/001_init.sql

# Generar hash de contraseña para el usuario admin
node -e "const b = require('bcrypt'); b.hash('TU_CONTRASEÑA', 12).then(console.log)"

# Insertar usuario admin en la DB
psql -U postgres -d portfolio -c "INSERT INTO admin_users (username, password_hash) VALUES ('tu-usuario', 'EL_HASH_GENERADO');"

cd backend
npm install
npm run dev
```

El backend corre en `http://localhost:3000` y el frontend en `http://localhost:5173`.

El panel admin está disponible en `http://localhost:5173/admin/login`.

---

## Variables de entorno

Ver `.env.example` y `backend/.env.example` para la lista completa de variables requeridas. **Nunca subas los archivos `.env` al repositorio.**

---

## Contacto

- LinkedIn: [linkedin.com/in/augusto-freire-web](https://www.linkedin.com/in/augusto-freire-web)
- GitHub: [github.com/Guss-dev-py](https://github.com/Guss-dev-py)
- Email: augustofreire02@gmail.com

---

> Este portafolio está en desarrollo activo. Se irán agregando proyectos reales y nuevas funcionalidades conforme avance.
