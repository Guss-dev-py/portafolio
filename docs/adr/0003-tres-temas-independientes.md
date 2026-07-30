# ADR 0003 — Tres temas independientes, con el admin aislado del público

- **Estado:** aceptada
- **Fecha de la decisión:** 2026-06-12 (documentada retroactivamente el 2026-07-29)

## Contexto

El proyecto tiene dos superficies con audiencias y frecuencias de uso opuestas: el sitio público (visitado una vez por un reclutador) y el panel admin (usado a diario por una sola persona).

Al agregar el modo oscuro público y el "modo hacker" del admin, había que decidir si eran un mismo sistema de temas o dos.

## Decisión

**Tres temas en dos sistemas independientes:**

| Tema | Atributo en `<html>` | Alcance | Clave en localStorage |
|---|---|---|---|
| Papel | *(default)* | Público | `theme` |
| Oscuro | `data-theme="dark"` | Público | `theme` |
| Hacker | `data-admin-theme="hacker"` | **Solo** admin | `admin-theme` |

`useAdminTheme` aplica `data-admin-theme` al montar `AdminLayout` y **lo remueve al desmontar**.

## Fundamento

1. **Las dos superficies quieren cosas distintas.** El sitio público quiere una impresión estética; el admin quiere densidad y legibilidad a las dos de la mañana. Forzar un tema único sirve mal a las dos.
2. **El modo hacker sería hostil en público.** Fósforo verde con scanlines es divertido en una herramienta propia e ilegible como carta de presentación.
3. **Atributos separados evitan la explosión combinatoria.** Con un solo atributo habría cuatro combinaciones (público claro/oscuro × admin normal/hacker) en la misma cascada.
4. **La limpieza al desmontar preserva el contrato:** salir del admin nunca contamina el sitio público.

## Consecuencias

**Positivas:** cada superficie evoluciona sola; el admin puede tener personalidad propia sin arriesgar la marca pública.

**Negativas:** **todo cambio visual hay que verificarlo tres veces.** La barra de estado del admin necesitó tokens propios (`--statusbar-*`) para renderizar bien bajo los tres. Es el costo permanente de esta decisión, y aparece como regla explícita en cada fase del plan.
