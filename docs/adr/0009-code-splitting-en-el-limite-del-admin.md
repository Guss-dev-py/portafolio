# ADR 0009 — El code splitting corta en el límite del admin

- **Estado:** aceptada
- **Fecha de la decisión:** 2026-07-30 (Fase 3 de `PLAN_MEJORAS_2026-07.md`, tarea 3.6)

## Contexto

`App.tsx` importaba las páginas del admin de forma estática, así que el panel entero —layout, tablas, formularios, paleta de comandos, CSS del admin— viajaba en el chunk inicial del sitio público. Cada visitante descargaba una herramienta de uso interno que nunca iba a ver.

Medido antes del cambio: **454,08 kB raw / 141,04 kB gzip** de JavaScript en la carga inicial. El único `lazy()` del proyecto era `ParticlesBackground`.

La Fase 0 había registrado esto como sospechoso del TBT de 1.170 ms en móvil. Para cuando se llegó a la tarea, el TBT ya había bajado a 320 ms por otras causas (la cadena de fuentes y la optimización del canvas), así que la justificación dejó de ser el tiempo de bloqueo y pasó a ser el peso transferido, que sigue siendo real.

## Decisión

El corte va en el **límite del admin**, no por página del sitio público.

- `lazy()` sobre `LoginPage`, `AdminLayout`, `ProjectsPage`, `MessagesPage`, `SettingsPage` y `LogsPage`.
- **`AuthGuard` queda eager.** Son 20 líneas que leen el token de `localStorage` y deciden el redirect. Ponerlo en un chunk agregaría un roundtrip de red antes de poder rechazar a un visitante sin sesión.
- **El sitio público queda entero en el chunk inicial.** Es un one-page: todas las secciones se ven en el primer scroll, diferirlas sólo agregaría saltos de layout.
- **Dos límites de `Suspense` anidados**: uno espera el layout del admin, otro el chunk de cada página. El shell aparece una vez y navegar entre secciones no lo desmonta.
- **El fallback usa estilos inline**, no CSS modules del admin: ese CSS viaja en el mismo chunk que se está esperando. Color y tipografía salen de las custom properties de `index.css`, que sí está en el chunk inicial.
- **Preload por intención**: la NavigationBar pública tiene un link a `/admin/login`, así que el chunk se pide en `onMouseEnter`/`onFocus` con el mismo especificador de import que el `lazy()`, para que Vite lo resuelva al mismo chunk y no a una copia.

## Fundamento

1. **El admin es el único código con una audiencia distinta al resto.** Lo usa una persona; el sitio público lo usa todo el mundo. Es el único límite del proyecto donde "esto no lo necesita quien está mirando" es cierto por definición y no una apuesta sobre el comportamiento del usuario.
2. **Cortar el sitio público no tendría sentido.** Es una sola página con cuatro secciones visibles de entrada.
3. **El resultado se midió, aislando la tarea con `git stash`:**

   | | Raw | Gzip |
   |---|---|---|
   | Antes | 454,08 kB | 141,04 kB |
   | Después | **399,88 kB** | **128,76 kB** |
   | Delta | **−54,20 kB (−11,9%)** | **−12,28 kB (−8,7%)** |

   Contra la línea base de Fase 0 (505 kB / 148 kB): −105 kB raw / −19 kB gzip.

## Consecuencias

**Positivas:** el visitante público descarga 54 kB menos; el admin se puede engordar sin que lo pague el sitio; Vite sacó además `admin.module.css`, `adminContext` y `ConfirmDialog` a chunks propios sin intervención.

**Negativas:**

- **El admin paga un roundtrip por sección** la primera vez que se entra. Mitigado en el login por el preload; en las páginas internas no, y es aceptable para una herramienta de uso diario que queda en caché.
- **Los tests no cubren este cambio.** Importan las páginas directamente, así que un `lazy()` mal armado (default vs named export) sólo falla en runtime. Se verificó en el navegador contra el build servido con `vite preview` + Playwright: cero chunks de admin en la carga pública, `/admin/login` baja su chunk y renderiza el form, cero errores de página, el preload por hover dispara. **Cualquier cambio futuro a estas rutas necesita la misma verificación manual.**
- **Un fallo de red bajando un chunk cae en el `ErrorBoundary` global**, que ofrece recargar la página. Funciona, pero es más brusco que un retry del chunk. Queda anotado.

## Lo que sigue siendo grande

El chunk que Vite nombró `useProjects-*.js` pesa **127 kB** y es framer-motion. Sigue en la carga inicial porque las secciones públicas lo usan de verdad. Es el único bloque grande que queda y la próxima palanca si el peso vuelve a ser un problema; tocarlo implica revisar el ADR 0002.
