# ADR 0007 — React 19 estable; no se adopta la View Transition API

- **Estado:** aceptada, **con condición de reevaluación**
- **Fecha de la decisión:** 2026-07-29 (Fase 0 del plan de mejoras)

## Contexto

La View Transition API de React (`<ViewTransition>`, `addTransitionType`) permite transiciones de ruta y animaciones de elemento compartido con muy poco código, delegando el trabajo al navegador. Sería una mejora natural para el panel admin.

**Pero fuera de Next.js requiere `react@canary` y `react-dom@canary`.** No está en React estable. Next.js la trae porque el App Router ya empaqueta una canary internamente; este proyecto es Vite + React Router.

Estado actual: **React 19.2 estable**, 187 tests de frontend en verde.

## Decisión

**Quedarse en React estable.** No se adopta la View Transition API en este ciclo. La skill `react-view-transitions` queda instalada pero **sin usar**.

Para transiciones y animaciones de salida se usa `AnimatePresence` de framer-motion, que ya es dependencia del proyecto (ADR 0002) y hoy está sin utilizar.

## Fundamento

1. **El riesgo no se paga con el beneficio.** Pasar a canary pone 187 tests y el build de producción sobre una rama inestable de React, a cambio de una mejora estética en una superficie **privada** que usa una sola persona.
2. **El sitio público es one-page.** No hay navegación entre rutas que animar. El beneficio se limita al admin.
3. **Ya existe una herramienta capaz.** `AnimatePresence` cubre enter/exit y transiciones compartidas sin tocar la versión de React.
4. **Las canary de React no tienen garantía de estabilidad de API.** Una actualización puede romper el build sin aviso, en un proyecto que se despliega con Docker y se toca de a ratos.

## Consecuencias

**Positivas:** el build se mantiene sobre una base soportada; nada de sorpresas al actualizar; la suite de tests sigue siendo confiable.

**Negativas:** se renuncia a transiciones morph de elemento compartido entre rutas del admin, que hoy no tienen buen equivalente en framer-motion sin bastante trabajo manual. Queda una limitación conocida: durante una transición de padre, las view transitions anidadas no disparan enter/exit propias — o sea que los staggers por ítem durante una navegación tampoco serían posibles hoy aunque se adoptara.

## Condición de reevaluación

**Reabrir esta decisión cuando `ViewTransition` llegue a React estable.** En ese momento, comparar contra lo que se haya construido con `AnimatePresence` en la Fase 2 antes de migrar nada.
