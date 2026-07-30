# ADR 0001 — CSS Modules y tokens CSS, no Tailwind

- **Estado:** aceptada
- **Fecha de la decisión:** original del proyecto (documentada retroactivamente el 2026-07-29)
- **Decide:** Augusto Freire

## Contexto

El sitio tiene una identidad visual muy específica: *"terminal impresa sobre papel"*, definida en `DESIGN.md` (paleta papel/tinta/sello rojo, JetBrains Mono en todo, escalas tipográficas extremas). Además soporta tres temas que intercambian la paleta completa en caliente.

Tailwind es el default de la industria y casi todas las skills y guías de diseño asumen que está presente.

## Decisión

Usar **CSS Modules** (un `.module.css` por componente) más un bloque de **custom properties** en `src/index.css` como única fuente de verdad para colores, espaciados y transiciones.

## Fundamento

1. **El cambio de tema es trivial con custom properties.** `[data-theme='dark']` redefine el bloque de tokens y todo el sitio cambia sin tocar un solo componente. Con Tailwind habría que duplicar clases `dark:` en cada elemento, y encima existe un tercer tema (`data-admin-theme`) que no encaja en el modelo de dos modos de Tailwind.
2. **La identidad no se expresa con utilidades.** Valores como `letter-spacing: -0.045em` y `line-height: 1.05` sobre `clamp(48px, 7.5vw, 116px)` terminan en clases arbitrarias `[...]` en Tailwind, que es peor que escribir CSS.
3. **Cero dependencias de build para estilos.** El proyecto ya es Vite puro.

## Consecuencias

**Positivas:** temas triviales, CSS legible y con scope automático, sin costo de build, sin purga de clases.

**Negativas:** las skills y ejemplos de diseño que asumen Tailwind **no aplican tal cual** — hay que traducir. Sin sistema de utilidades, es más fácil que se cuele un valor hardcodeado (mitigado por la regla de tokens en `CLAUDE.md`).

**Regla derivada:** ningún componente escribe un color literal. Todo sale de las custom properties.

## Alternativas descartadas

- **Tailwind** — el modelo de dos modos no cubre tres temas; clases arbitrarias en todos lados.
- **styled-components / CSS-in-JS** — costo en runtime y peso de bundle sin beneficio a cambio.
