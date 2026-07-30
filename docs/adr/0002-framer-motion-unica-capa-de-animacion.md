# ADR 0002 — framer-motion como única capa de animación, con tokens propios

- **Estado:** aceptada
- **Fecha de la decisión:** original del proyecto (documentada retroactivamente el 2026-07-29)

## Contexto

El sitio necesita animaciones de entrada por scroll, micro-interacciones y (a futuro) gestos con física. Las opciones típicas son GSAP, framer-motion, CSS puro o la View Transition API.

## Decisión

**framer-motion** es la única librería de animación del proyecto, y toda animación se compone desde `src/motion/`:

- `tokens.ts` — duraciones, curvas de easing, configuraciones de spring, staggers, offsets.
- `variants.ts` — variantes reutilizables construidas *desde* los tokens.
- `hooks/useInView.ts`, `hooks/useReducedMotion.ts`.

**Está prohibido hardcodear una duración o una curva en un componente.**

## Fundamento

1. **Una sola librería.** Mezclar GSAP y framer-motion significa dos motores de animación, dos modelos mentales y dos veces el peso.
2. **framer-motion encaja con React.** Es declarativa y basada en estado; GSAP es imperativa y requiere refs y limpieza manual.
3. **Los tokens hacen la coherencia obligatoria en vez de opcional.** Si cada componente elige su duración, el sitio termina con quince timings distintos.
4. **`motion/` es una capa hoja.** No importa de ningún otro módulo del proyecto, así que puede evolucionar sin arrastrar nada.

## Consecuencias

**Positivas:** motion coherente por construcción; un único lugar donde ajustar la personalidad del movimiento; sin conflicto entre motores.

**Negativas:** las skills basadas en GSAP (`gpt-tasteskill`) quedan **inaplicables** — se descartaron por esto. Los efectos de scroll muy elaborados (pinning, scrub horizontal) son más trabajosos en framer-motion que en ScrollTrigger.

**Deuda conocida (2026-07-29):** los tokens están casi sin usar. No hay una sola animación de salida (`AnimatePresence`), ni `whileHover`/`whileTap` en todo el proyecto, y `HeroSection` no usa framer-motion en absoluto. Es el objeto de la Fase 2 del plan.

## Alternativas descartadas

- **GSAP + ScrollTrigger** — imperativa, pesada, y duplicaría motores.
- **Solo CSS** — no cubre gestos, interrupción ni física de springs.
- **View Transition API** — ver ADR 0007.
