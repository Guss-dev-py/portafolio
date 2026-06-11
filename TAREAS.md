# Tareas pendientes — Portfolio

Prioridad de rojo (urgente) a verde (mejora).
Fuente: code review · visual audit · security review · análisis de features.

---

## ✅ Resuelto (esta sesión)

- [x] **LinkedIn URL incorrecta** — corregido a `augusto-freire-web` en ContactSection y Footer.
- [x] **`/cv.pdf` da 404** — archivo presente, retorna 200.
- [x] **Mobile nav sin hamburger** — menú hamburger implementado y funcional.
- [x] **`imageUrl` no se usa en ProjectsSection** — thumbnail 60px visible en cada fila.
- [x] **Sin Error Boundary** — `<ErrorBoundary>` en App.tsx.
- [x] **LoginPage sin validación previa** — valida campos vacíos antes del fetch.
- [x] **Email hardcodeado en contact.ts** — movido a `RECIPIENT_EMAIL` env var.
- [x] **Test roto en CI** — `imageUrl` arbitrary corregido con `fc.webUrl()`.
- [x] **base64url en AuthGuard** — `atob` ahora maneja `-` y `_` correctamente.
- [x] **Mínimo de mensaje inconsistente** — alineado a 12 chars en schema Zod y frontend.
- [x] **Work status feature** — endpoint `/api/status`, terminal dinámica, página de Ajustes en admin.

---

## 🔴 Crítico

- [ ] **SEO: sin meta tags** — No hay `<meta name="description">`, Open Graph (`og:title`, `og:image`, `og:description`) ni Twitter Card. El portfolio no se previsualiza correctamente al compartir en redes o LinkedIn.

- [ ] **`src/data/skills.ts` faltante** — AboutSection muestra skills hardcodeadas en el JSX. Crear el archivo para que el conteo sea dinámico y editable sin tocar el componente.

---

## 🟡 Importante

- [ ] **Mobile menu: espacio muerto** — El menú hamburger deja un área en blanco grande arriba y abajo de los 4 links. Los items deberían distribuirse con mejor balance vertical (visual audit, 390px).

- [ ] **Hero grid en tablet (768px)** — El layout de dos columnas se mantiene en 768px y queda muy apretado. Cambiar a una sola columna antes de 900px.

- [ ] **Año del footer hardcodeado** — `© 2026` estático. Reemplazar con `new Date().getFullYear()` para que se actualice solo.

- [ ] **Email del footer sin clipboard** — En ContactSection el email copia al portapapeles + toast. En el Footer es un `<a href="mailto:">`. Unificar comportamiento.

- [ ] **Animaciones Framer Motion sin usar** — El sistema `motion/` tiene `variants.ts`, `tokens.ts` e `useInView` pero ninguna sección (About, Projects, Contact) los usa. Agregar entrances animadas con `fadeUp` + `staggerContainer` al hacer scroll.

- [ ] **Tests de páginas admin faltantes** — `LoginPage`, `MessagesPage`, `ProjectsPage` y `SettingsPage` no tienen tests. Agregar al menos property tests básicos.

- [ ] **Test del endpoint `/api/status`** — El nuevo route `status.ts` no tiene tests de integración. Agregar tests para GET y PATCH (incluyendo 401 sin JWT y 400 con valor inválido).

- [ ] **`$` rojo en terminal** — `.prompt` usa `var(--accent)` (rojo). En terminales Unix, rojo = error/root. Considerar `var(--status-open)` (verde) o un neutro.

- [ ] **Título About: `sobre mí` → `sobre.mí`** — Consistente con el estilo brutalist `FREIRE.AF` y `Freire.`.

---

## 🟢 Mejoras de features

- [ ] **Dashboard con métricas en admin** — Mostrar mensajes recibidos por día (sparkline), total de proyectos, último mensaje, uptime. Reemplazar la franja de stats vacía del AdminLayout.

- [ ] **Bulk delete de mensajes** — Checkboxes en MessagesPage para eliminar varios mensajes leídos de una vez.

- [ ] **Reply rápido en mensajes** — Botón "Responder" en MessagesPage que abre `mailto:email?subject=Re:...` con el nombre pre-cargado.

- [ ] **Reordenamiento de proyectos** — Drag-and-drop en ProjectsPage para cambiar el orden de aparición en el portfolio público. Requiere columna `position` en DB.

- [ ] **Image upload para proyectos** — Hoy solo acepta URL. Agregar upload directo (multer + almacenamiento local o S3) para no depender de hosting externo de imágenes.

- [ ] **Skeleton loading states** — Reemplazar "Cargando proyectos..." en texto plano con componentes skeleton (barras animadas) mientras se fetchea.

- [ ] **Modo oscuro / claro** — Toggle en el navbar. El sistema de CSS custom properties ya está preparado para soportarlo.

- [ ] **Contraste tagline footer** — `rgba(243,239,229,0.5)` sobre fondo oscuro da ~2.5:1, por debajo de WCAG AA (4.5:1). Subir opacidad a al menos `0.70`.

---

## 🔵 DevOps / Calidad

- [ ] **CI/CD con GitHub Actions** — Pipeline que corra `tsc --noEmit` + `vitest --run` en frontend y backend en cada push a `main`.

- [ ] **Migration runner automático** — Hoy las migraciones nuevas (ej: `002_site_settings.sql`) no se aplican en containers existentes. Integrar un runner de migraciones al arranque del backend (ej: `node-pg-migrate` o script propio que aplique archivos nuevos).

- [ ] **Health check del backend más completo** — El endpoint `/api/health` podría incluir estado de la DB (`pool.query('SELECT 1')`) para que Docker detecte si la conexión se pierde.

- [ ] **E2E tests con Playwright** — Tests de flujos completos: login → crear proyecto → verlo en el portfolio público → eliminarlo.
