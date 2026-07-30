# Optimización del canvas de partículas — investigación

**Fecha:** 2026-07-29 · Detectado durante la verificación de 60 fps de la Fase 2.
**Harness:** réplica fiel del algoritmo con variantes conmutables por query param, medido con `requestAnimationFrame` en Chromium headless, 1440×900, con el mouse en movimiento (activa repulsión y parallax, que es el caso real).

---

## El problema

`ParticlesBackground` degrada el sitio público de **60 a 19 fps**. Medición de control, mismo navegador, misma interacción (hover sobre una fila de proyecto):

| | Canvas | fps | Peor frame | Jank |
|---|---|---|---|---|
| Normal | presente | **19** | 66,8 ms | 40 |
| `prefers-reduced-motion: reduce` | no se monta | **60** | 18,5 ms | 0 |

En 1440×900 el sistema crea **881 partículas**: `(1440·900/3800)·0.9 = 307` de base, multiplicado por 2.87 que es la suma de los `count` de las 5 capas.

---

## 🏆 El diagnóstico obvio, y por qué estaba equivocado

El bucle de conexiones compara partículas contra partículas y llama a `Math.sqrt` en cada iteración. Contando: **136.854 comparaciones por frame**, o sea **8,2 millones de raíces cuadradas por segundo** a 60 fps.

*(La estimación inicial fue peor todavía —"23 millones de raíces cuadradas por segundo", calculado sobre 881²/2 sin descontar el filtro de capas que ya recortaba dos tercios de los pares. Queda acá como recuerdo del entusiasmo.)*

Parecía tan obvio que era el culpable. **No lo era.**

| Variante | fps | Comparaciones/frame | |
|---|---|---|---|
| v0 baseline | **39** | 136.854 | punto de partida |
| v1 — descartar con `dist²`, sin `sqrt`, capa 0 fuera del array | **38** | 136.854 | **sin efecto** |
| v2 — grid espacial (celdas de `CONN_DIST`) | **41** | **20.175** | +5% con 6,8× menos comparaciones |
| v4 — v2 + batching de draw calls | **57** | 20.046 | **+46%** |

*(Todas a `deviceScaleFactor: 1`, la misma condición en que se midió el sitio real.)*

Eliminar el 85% de las comparaciones dio **un 5% de mejora**. La matemática no era el cuello de botella: **eran las llamadas de dibujo**. El baseline hacía un `beginPath()` + `stroke()` por cada línea y un `beginPath()` + `fill()` por cada partícula — miles de draw calls por frame. Agruparlas en unos pocos paths por nivel de alpha dio el 46%.

**Moraleja:** en canvas 2D, contar operaciones aritméticas es mirar el lugar equivocado. El costo vive en el rasterizado y en la cantidad de draw calls.

---

## El segundo factor: `devicePixelRatio`

El componente hace `Math.min(devicePixelRatio || 1, 2)`. En una pantalla retina el canvas pasa de 1440×900 (1,3 Mpx) a 2880×1800 (**5,2 Mpx, 4× más píxeles que pintar**).

| Variante | DPR 1 | DPR 2 |
|---|---|---|
| v0 baseline | 39 fps | **9 fps** |
| v2 grid | 41 fps | 12 fps |
| v4 batching | **57 fps** | **2 fps** ⚠️ |
| v4 + DPR forzado a 1 | — | **59 fps** |

⚠️ **El batching es contraproducente a DPR 2** (2 fps): un único path con miles de subpaths se rasteriza sobre el bounding box completo, y a 5,2 Mpx eso es peor que muchos strokes chicos. La optimización correcta a una resolución es la equivocada a otra.

---

## 🎯 El culpable de verdad: un `backdrop-filter` de medio píxel

Aplicadas las tres optimizaciones al componente real, el sitio siguió a **19 fps**. El harness daba 57. Algo del sitio real no estaba en el harness.

Era `index.css`:

```css
body[data-particles="on"] .page { background: var(--bg-veil); backdrop-filter: blur(0.5px); }
```

`.page` envuelve **toda** la página. Un `backdrop-filter` sobre una superficie de ese tamaño, con un canvas animándose debajo, obliga al navegador a recomponer la página completa con blur **en cada frame**.

| | fps |
|---|---|
| Con `backdrop-filter` | **17** |
| Sin `backdrop-filter` en `.page` | **43** |
| Sin ningún `backdrop-filter` | 41 |

**Un blur de 0,5 píxeles costaba 26 fps.** El de `.regbar`/`.topnav` (blur 2px) no aporta costo medible: son elementos chicos. La veladura semitransparente de `--bg-veil` ya hacía todo el trabajo visual de atenuar las partículas; el filtro no agregaba nada perceptible.

### Resultado final, medido en el sitio completo

| | fps (hover) | Retina |
|---|---|---|
| Antes | 19 | peor |
| Optimizaciones de canvas solas | 19 | — |
| **+ sin `backdrop-filter`** | **51** | **51** |

Lighthouse móvil, progresión de todo el ciclo:

| | Base | Tras bloque FIX | Tras partículas |
|---|---|---|---|
| Performance | 57 | 76 | **87** |
| Total Blocking Time | 1.170 ms | 740 ms | **320 ms** |
| Time to Interactive | 7,9 s | 7,2 s | **3,1 s** |

---

## Recomendación

Tres cambios, **sin perder interactividad, parallax, repulsión, las 5 capas ni la cantidad de partículas**:

1. **Batching de draw calls** — agrupar líneas en 6 niveles de alpha y puntos en 8, con un `stroke()`/`fill()` por nivel. Es el que más aporta (+46%).
2. **Cap de `devicePixelRatio` a 1 para este canvas** — es un fondo difuso con opacidades de 0.08 a 0.52, no texto. Combinado con el batching: **59 fps en pantalla retina**.
3. **Grid espacial** — aporta poco (+5%), pero es gratis y evita que el costo explote si algún día sube la densidad.

### Costo visual: ninguno perceptible

El alpha queda cuantizado, así que hay una redistribución mínima:

| | Píxeles con tinta | Alpha medio | Tinta total |
|---|---|---|---|
| v0 baseline | 34,39% del canvas | 10,6 | 364 |
| v4 batching | 41,65% | 8,6 | 358 |

**1,6% de diferencia en tinta total.** Más píxeles tocados, cada uno más tenue: el mismo peso visual. Comparación en `.baseline/particulas/`.

---

## Lo que se descartó

- **Bajar la densidad de partículas** — pérdida directa del efecto, y no era el cuello.
- **Throttle a 30 fps** — mataría la suavidad del parallax, que es justo la parte interactiva.
- **Montar el canvas sólo en desktop** — innecesario si las tres medidas de arriba alcanzan.
- **Evitar `sqrt`** — medido: cero efecto (v1 = v0).

---

## Nota metodológica

Las mediciones son en Chromium headless con CPU compartida; una máquina real con GPU rinde mejor en términos absolutos. Lo que se sostiene es la **comparación relativa** entre variantes, que es de lo que trata este documento.
