# Implementation Plan: Personal Portfolio

## Overview

Implementación incremental de la SPA con React + TypeScript. Cada tarea construye sobre la anterior, comenzando por la base del proyecto y los tipos, avanzando sección por sección, y terminando con la integración completa.

## Tasks

- [ ] 1. Scaffolding del proyecto y sistema de diseño
  - Inicializar proyecto con Vite + React + TypeScript
  - Crear `src/types/index.ts` con todos los tipos e interfaces del diseño (`SectionId`, `Theme`, `SkillTag`, `SkillGroup`, `Project`, `ContactLink`, `ContactFormData`, `PaginationState`, `FieldError`)
  - Crear `src/styles/tokens.css` con variables CSS para paleta de colores (dark/light), tipografía y espaciado
  - Crear `src/styles/global.css` con reset y estilos base
  - Crear archivos de datos estáticos: `src/data/profile.ts`, `src/data/projects.ts`, `src/data/skills.ts`
  - _Requirements: 1.1, 6.1_

- [ ] 2. Hook `useTheme` y ThemeProvider
  - [ ] 2.1 Implementar `src/hooks/useTheme.ts`
    - Leer `prefers-color-scheme` como valor inicial
    - Persistir preferencia en `localStorage`
    - Exponer `theme` y función `toggle`
    - Aplicar atributo `data-theme` al `<html>` para activar variables CSS
    - _Requirements: 6.2, 6.3_

  - [ ]* 2.2 Escribir property test para `useTheme` — Property 11
    - **Property 11: Round-trip del toggle de tema**
    - **Validates: Requirements 6.2**

  - [ ] 2.3 Crear `src/components/NavigationBar/ThemeToggle.tsx`
    - Botón accesible (`aria-label`) que llama a `toggle`
    - _Requirements: 6.2_

- [ ] 3. Hook `useActiveSection` y NavigationBar
  - [ ] 3.1 Implementar `src/hooks/useActiveSection.ts`
    - Usar `IntersectionObserver` con threshold 0.5
    - Retornar el `SectionId` de la sección con mayor visibilidad
    - _Requirements: 1.4_

  - [ ]* 3.2 Escribir property test para `useActiveSection` — Property 2
    - **Property 2: Detección de sección activa**
    - **Validates: Requirements 1.4**

  - [ ] 3.3 Implementar `src/components/NavigationBar/NavigationBar.tsx` y su CSS Module
    - `position: fixed; top: 0` con z-index adecuado
    - Resaltar enlace activo según `activeSection`
    - Al hacer clic, llamar `scrollIntoView({ behavior: 'smooth' })` sobre la sección destino
    - Incluir `ThemeToggle`
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ]* 3.4 Escribir property test para NavigationBar — Property 1
    - **Property 1: Smooth scroll para cualquier enlace de navegación**
    - **Validates: Requirements 1.3**

- [ ] 4. HeroSection
  - [ ] 4.1 Implementar `src/components/sections/HeroSection/HeroSection.tsx` y su CSS Module
    - Mostrar nombre como `<h1>`, rol, intro (truncada a 160 chars), skill tags y botón CTA
    - Animación fade-in con Framer Motion (≤ 800 ms) al montar
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 4.2 Escribir property test para HeroSection — Property 3
    - **Property 3: Restricción de longitud del texto de introducción**
    - **Validates: Requirements 2.3**

  - [ ]* 4.3 Escribir property test para HeroSection — Property 4
    - **Property 4: Renderizado completo de skill tags**
    - **Validates: Requirements 2.4**

- [ ] 5. AboutSection
  - [ ] 5.1 Implementar `src/components/sections/AboutSection/AboutSection.tsx` y su CSS Module
    - Mostrar biografía, metas profesionales y sector de aspiración en subsecciones diferenciadas
    - Renderizar `SkillGroup[]` agrupados por categoría
    - Animación slide-in con Framer Motion al entrar al viewport (via `useInView` de Framer Motion)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 5.2 Escribir property test para AboutSection — Property 5
    - **Property 5: Renderizado de grupos de habilidades por categoría**
    - **Validates: Requirements 3.4**

- [ ] 6. Hook `usePagination` y ProjectsSection
  - [ ] 6.1 Implementar `src/hooks/usePagination.ts`
    - Dividir array en páginas de tamaño `pageSize` (default 6)
    - Exponer `currentPage`, `totalPages`, `visibleItems`, `hasMore`, `loadMore`
    - _Requirements: 4.7_

  - [ ]* 6.2 Escribir property test para `usePagination` — Property 8
    - **Property 8: Paginación para listas grandes de proyectos**
    - **Validates: Requirements 4.7**

  - [ ] 6.3 Implementar `src/components/ProjectCard/ProjectCard.tsx` y su CSS Module
    - Mostrar nombre, descripción y tecnologías
    - Efecto hover de expansión de imagen con CSS transition (≤ 300 ms)
    - `tabIndex={0}` y handler de `keydown` para tecla Enter
    - Fallback placeholder cuando la imagen falla (`onError`)
    - `onActivate` abre URL en nueva pestaña; deshabilitar si URL vacía/inválida
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 6.6_

  - [ ]* 6.4 Escribir property test para ProjectCard — Property 6
    - **Property 6: Renderizado correcto de tarjetas de proyectos**
    - **Validates: Requirements 4.1, 4.5**

  - [ ]* 6.5 Escribir property test para ProjectCard — Property 7
    - **Property 7: Activación de tarjeta de proyecto (click y teclado)**
    - **Validates: Requirements 4.4, 4.6**

  - [ ]* 6.6 Escribir property test para ProjectCard — Property 12
    - **Property 12: Fallback de imagen en caso de error de carga**
    - **Validates: Requirements 6.6**

  - [ ] 6.7 Implementar `src/components/sections/ProjectsSection/ProjectsSection.tsx` y su CSS Module
    - Grid responsivo de `ProjectCard`
    - Usar `usePagination` para mostrar control "Load more" cuando `hasMore = true`
    - Mostrar mensaje de estado vacío si el array de proyectos está vacío
    - _Requirements: 4.1, 4.7_

- [ ] 7. Checkpoint — Verificar tests y funcionalidad core
  - Asegurarse de que todos los tests pasen. Consultar al usuario si surgen dudas.

- [ ] 8. ContactSection y ContactForm
  - [ ] 8.1 Implementar `src/components/ContactForm/ContactForm.tsx` y su CSS Module
    - Campos: name, email, message
    - Validación inline sin recarga: campo vacío/solo espacios → `FieldError` por campo
    - Validación de formato email (RFC 5322 simplificado)
    - Al envío válido, mostrar mensaje de confirmación
    - _Requirements: 5.5, 5.6, 5.7_

  - [ ]* 8.2 Escribir property test para ContactForm — Property 10
    - **Property 10: Validación de campos vacíos en el formulario de contacto**
    - **Validates: Requirements 5.7**

  - [ ] 8.3 Implementar `src/components/sections/ContactSection/ContactSection.tsx` y su CSS Module
    - Renderizar `ContactLink[]` (LinkedIn, GitHub, email, website) con `target="_blank"`
    - Omitir lista de enlaces si el array está vacío
    - Incluir `ContactForm`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 8.4 Escribir property test para ContactSection — Property 9
    - **Property 9: Renderizado de todos los enlaces de contacto**
    - **Validates: Requirements 5.4**

- [ ] 9. Layout, App y wiring final
  - [ ] 9.1 Crear `src/components/NavigationBar/` — integrar `useActiveSection` con `NavigationBar`
    - Pasar `activeSection` y `onNavigate` desde `App.tsx`
    - _Requirements: 1.3, 1.4_

  - [ ] 9.2 Crear `src/App.tsx`
    - Componer `ThemeProvider`, `Layout`, `NavigationBar` y las cuatro secciones en orden
    - Pasar datos estáticos desde `src/data/` a cada sección
    - _Requirements: 1.1_

  - [ ]* 9.3 Escribir tests de ejemplo (Vitest + React Testing Library)
    - Renderizado de las cuatro secciones en orden correcto (1.1)
    - `NavigationBar` tiene `position: fixed` (1.2)
    - `HeroSection` muestra nombre como `h1`, rol y botón CTA (2.1, 2.2, 2.5)
    - `AboutSection` muestra biografía, metas y sector de aspiración (3.1, 3.2, 3.3)
    - `ContactSection` muestra enlaces de LinkedIn, GitHub y email con `target="_blank"` (5.1, 5.2, 5.3)
    - `ContactSection` contiene formulario con campos name, email, message (5.5)
    - Envío válido del formulario muestra mensaje de confirmación (5.6)
    - `useTheme` inicializa en `'dark'` cuando `prefers-color-scheme: dark` (6.3)

  - [ ]* 9.4 Configurar snapshot tests de responsividad
    - Snapshots a 320px, 768px y 1280px
    - _Requirements: 1.5_

- [ ] 10. Checkpoint final — Todos los tests pasan
  - Asegurarse de que todos los tests pasen. Consultar al usuario si surgen dudas.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos para trazabilidad
- Los property tests usan Vitest + fast-check con mínimo 100 iteraciones por propiedad
- Los tests de ejemplo usan Vitest + React Testing Library
- Twitter/X no está incluido en los canales de contacto (`ContactLink.platform` no incluye esa plataforma)
