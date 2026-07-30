# Architecture Decision Records

Decisiones de arquitectura del portfolio, con su contexto y sus consecuencias.

Los **0008 y 0009** se escribieron el 2026-07-30, junto con las decisiones que documentan (Fase 3). El **0010** ese mismo día, al cerrar el hallazgo de GEO que la Fase 4 había dejado abierto.

Los ADR 0001–0006 se escribieron **retroactivamente** el 2026-07-29 (Fase 0 de `PLAN_MEJORAS_2026-07.md`): documentan decisiones que ya estaban tomadas y funcionando, pero que no estaban escritas en ningún lado. El riesgo que cubren es concreto — un refactor futuro puede deshacerlas por ignorancia, creyendo que corrige un descuido.

| # | Decisión | Estado |
|---|---|---|
| [0001](0001-css-modules-sobre-tailwind.md) | CSS Modules y tokens CSS, no Tailwind | aceptada |
| [0002](0002-framer-motion-unica-capa-de-animacion.md) | framer-motion como única capa de animación, con tokens propios | aceptada |
| [0003](0003-tres-temas-independientes.md) | Tres temas independientes, con el admin aislado del público | aceptada |
| [0004](0004-soft-delete-de-mensajes.md) | Papelera para mensajes, borrado duro para proyectos | aceptada |
| [0005](0005-login-fallback-por-env.md) | Login con fallback a variables de entorno | aceptada |
| [0006](0006-migraciones-idempotentes-al-arrancar.md) | Migraciones idempotentes aplicadas al arrancar el backend | aceptada |
| [0007](0007-react-19-estable-sin-canary.md) | React 19 estable; no se adopta la View Transition API | aceptada, con condición de reevaluación |
| [0008](0008-estado-de-pagina-por-contexto.md) | Estado de página en un provider por contexto, no en props | aceptada |
| [0009](0009-code-splitting-en-el-limite-del-admin.md) | El code splitting corta en el límite del admin | aceptada |
| [0010](0010-app-shell-para-crawlers-sin-javascript.md) | Un app shell en el HTML para los crawlers que no ejecutan JavaScript | aceptada, con revisión declarada |

## Cómo agregar uno

Numeración correlativa, y siempre estas cuatro secciones: **Contexto** (qué fuerzas había en juego), **Decisión** (qué se hizo), **Fundamento** (por qué) y **Consecuencias** (lo bueno **y lo malo** — un ADR sin costos declarados no sirve). Sumar *Alternativas descartadas* cuando la opción rechazada sea la que un lector esperaría ver.

Escribir un ADR cuando la decisión sea **cara de revertir** o cuando alguien razonable, al leer el código, podría pensar que es un error.
