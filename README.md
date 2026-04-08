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

## Tecnologías utilizadas

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![CSS Modules](https://img.shields.io/badge/CSS_Modules-000000?style=flat&logo=cssmodules&logoColor=white)

- **React 19** + **TypeScript** — componentes tipados y hooks personalizados
- **Vite** — bundler y dev server
- **CSS Modules** + **CSS custom properties** — sistema de diseño con variables para temas
- **Intersection Observer API** — detección de sección activa sin librerías externas

---

## Estructura del proyecto

```
src/
├── components/
│   ├── NavigationBar/       # Barra fija con toggle de tema
│   ├── ProjectCard/         # Tarjeta de proyecto con hover interactivo
│   └── sections/
│       ├── HeroSection/
│       ├── AboutSection/
│       ├── ProjectsSection/
│       └── ContactSection/
├── data/                    # Contenido estático (perfil, proyectos, contacto)
├── hooks/                   # useTheme, useActiveSection
└── types/                   # Interfaces TypeScript compartidas
```

---

## Cómo correrlo localmente

```bash
npm install
npm run dev
```

---

## Contacto

- LinkedIn: [linkedin.com/in/augusto-freire-web](https://www.linkedin.com/in/augusto-freire-web)
- GitHub: [github.com/Guss-dev-py](https://github.com/Guss-dev-py)
- Email: augustofreire02@gmail.com

---

> Este portafolio está en desarrollo activo. Se irán agregando proyectos reales y nuevas secciones conforme avance.
