# ADR 0011 — Los targets crecen sin aflojar la densidad de la tabla

- **Estado:** aceptada
- **Fecha de la decisión:** 2026-07-30 (Fase 5 de `PLAN_MEJORAS_2026-07.md`, tarea 5.3)

## Contexto

WCAG 2.5.8 (AA, nuevo en 2.2) pide que todo target apuntable mida al menos **24 × 24 px**, salvo excepciones: links en línea dentro de texto, controles cuyo tamaño decide el navegador, y targets con separación suficiente como para que un círculo de 24px centrado no pise al vecino.

La tabla del admin es deliberadamente densa: es una herramienta de uso interno, con filas cortas y mucha información por pantalla. Esa densidad es una decisión de diseño, no un descuido — el sitio es una pieza editorial brutalista y el panel comparte el lenguaje.

Medido sobre el stack, con el panel abierto:

| Control | Tamaño | ¿Cumple 24×24? |
|---|---|---|
| Botón `Editar` / `Eliminar` de fila | 73 × 31 · 89 × 31 | sí |
| Botones de filtro y de orden | ~31 de alto | sí |
| Toggle de tema del menubar | 119 × **23** | no, pasaba sólo por separación |
| Asa de reordenamiento `⠿` | 48 × **20** | no |
| Checkbox de fila y de "seleccionar todos" | **14 × 14** | no |

axe no marcaba ninguno: los tres entraban por la excepción de separación, porque las filas están a 66px una de otra. Pero la excepción describe cuándo *no se puede fallar*, no cuándo el control está bien dimensionado. El asa es justamente el control donde la precisión más importa —es el que se arrastra— y era el más chico de los tres.

El checkbox tenía además un problema propio: su tamaño estaba fijado por CSS (`width: 14px`), así que la excepción de "control del navegador" tampoco aplicaba.

## Decisión

**Los targets crecen; la retícula no se toca.**

1. **Asa de reordenamiento** → `min-height: 24px` con el glifo centrado por flexbox. El `⠿` no cambia de tamaño: sólo se centra dentro de una caja que llega al mínimo. La celda ya medía 48px de ancho, así que en pantalla no se mueve nada.
2. **Toggle de tema** → `min-height: 24px`. Era un píxel. Ahora cumple por tamaño y no depende de dónde caigan los vecinos.
3. **Checkbox** → **crece de 14 a 24 px**. Es el único caso donde el cambio se ve. Un checkbox nativo no puede separar su caja visual de su caja de toque sin reimplementarlo con `appearance: none`, y reimplementarlo era más superficie de la que justifica el problema. En una fila de 66px de alto, 24px no aprieta nada.
4. **Punteros gruesos** → un bloque `@media (pointer: coarse)` lleva checkbox a 32, asa a 44 × 44 y los botones de acción y filtro a 44 de alto. El sitio público ya había resuelto esto así en el bloque FIX; **el admin nunca lo había recibido**.

## Fundamento

1. **La densidad que importa es la visual, no la de las cajas de toque.** Tres de los cuatro cambios son invisibles en escritorio: agrandan el área sensible sin mover un píxel de la retícula.
2. **`pointer: coarse` separa los dos mundos.** En escritorio manda la densidad; en un dispositivo táctil manda el dedo. No hay que elegir uno.
3. **La excepción de separación es frágil.** Depende de que los vecinos no se muevan. Cualquier cambio futuro de layout que junte dos filas convierte un control que "pasaba" en una violación, sin que nadie toque el control.
4. **Coherencia con lo ya decidido.** El bloque FIX ya había fijado 44×44 en `pointer: coarse` para el sitio público. Que el admin no lo tuviera era una omisión, no una decisión.

## Consecuencias

**Positivas**

- Cero violaciones de `target-size` en las cuatro pantallas del admin y en los tres temas, sin depender de excepciones.
- El asa de arrastre pasa a ser cómoda en touch, que es donde el arrastre se usa de verdad.
- El admin queda alineado con la regla de punteros gruesos que ya seguía el sitio público.

**Negativas**

- **El checkbox se ve más grande.** Es el único cambio visible en escritorio y toca la primera columna de la tabla de mensajes.
- El bloque `pointer: coarse` es CSS que no se ejercita en el desarrollo diario: se rompe en silencio si cambian los nombres de clase. Las reglas apuntan a `.filterBtn`, `.btnEdit`, `.btnDanger`, `.btnDangerSm` y `.techFilter`, todos verificados como existentes al escribir esto.

**Mitigación**

- Si el checkbox de 24px molesta, la salida es reimplementarlo con `appearance: none` y dibujar un cuadro de 14px de tinta dentro de una caja de 24 — más acorde al lenguaje del sitio que el `accent-color` nativo, y sin costo de accesibilidad. Se descartó ahora por superficie, no por criterio.

## Alternativas descartadas

| Opción | Por qué no |
|---|---|
| **Dejarlo como estaba** | axe pasaba, pero por la excepción de separación. Cumplir por accidente no es cumplir. |
| **Bajar la densidad de la tabla** | Ataca el síntoma equivocado: el problema era el tamaño de tres controles, no el interlineado de la tabla. Y la densidad es una decisión de diseño explícita. |
| **`appearance: none` en el checkbox** | Es la solución más fina y probablemente la correcta a futuro, pero implica dibujar los estados `:checked`, `:indeterminate` y `:focus-visible` a mano en tres temas. Desproporcionado para cerrar 2.5.8 hoy. |
| **Agrandar el área con un `::before` invisible** | En un `<input>` los pseudo-elementos no tienen soporte consistente, y en los demás controles habría dejado zonas clickeables que no se ven — peor que el problema. |

## Revisión

Reevaluar si la tabla incorpora más controles por fila. El margen que hoy hace que 24px "no apriete" es el alto de fila de 66px; con más de tres o cuatro controles por fila, la conversación vuelve a ser densidad contra target y probablemente gane reimplementar el checkbox.
