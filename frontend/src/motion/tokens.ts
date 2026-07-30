// ── Durations (seconds) ─────────────────────────────────────────
export const duration = {
  instant:   0.08,
  fast:      0.18,
  base:      0.30,
  moderate:  0.45,
  slow:      0.65,
  cinematic: 0.90,
} as const;

// ── Easing ──────────────────────────────────────────────────────
export const ease = {
  out:    [0.0, 0.0, 0.2, 1.0],
  inOut:  [0.4, 0.0, 0.2, 1.0],
  sharp:  [0.4, 0.0, 0.6, 1.0],
  expo:   [0.16, 1, 0.3, 1],
  back:   [0.34, 1.56, 0.64, 1],
  smooth: [0.25, 0.46, 0.45, 0.94],
} as const;

// ── Spring Configs ───────────────────────────────────────────────
export const spring = {
  card:         { type: 'spring', stiffness: 400, damping: 28, mass: 0.8 },
  press:        { type: 'spring', stiffness: 600, damping: 30 },
  navIndicator: { type: 'spring', stiffness: 350, damping: 30 },
  gentle:       { type: 'spring', stiffness: 200, damping: 22, mass: 1 },
} as const;

// ── Springs de gesto ─────────────────────────────────────────────
// Expresados con la API `bounce`/`duration`, que mapea los dos parámetros que usa
// Apple (damping ratio / response) en lugar del triplete stiffness-damping-mass.
// `bounce: 0` = críticamente amortiguado, sin overshoot. Acá `duration` NO es una
// duración fija: es la *respuesta* del spring, el tiempo característico de asentado.
//
// Regla: overshoot SOLO cuando el gesto traía impulso (un flick, una suelta).
// Un panel que apareció con un fade no rebota.
export const gestureSpring = {
  /** Reposicionar algo bajo el dedo. Apple: damping 1.0 / response 0.4 */
  reposition: { type: 'spring', bounce: 0,   duration: 0.4 },
  /** Drawer o sheet. Apple: damping 0.8 / response 0.3 */
  drawer:     { type: 'spring', bounce: 0.2, duration: 0.3 },
  /** Suelta con impulso: el único caso donde el rebote está justificado */
  flick:      { type: 'spring', bounce: 0.2, duration: 0.4 },
  /** Volver al origen tras un arrastre cancelado */
  snap:       { type: 'spring', bounce: 0,   duration: 0.25 },
} as const;

// ── Constantes de gesto ──────────────────────────────────────────
export const gesture = {
  /** Histéresis: px de movimiento antes de comprometerse a una dirección */
  threshold: 10,
  /** Tasa de desaceleración para proyectar momentum (0.998 ≈ scroll normal) */
  decelerationRate: 0.998,
  /** Constante de rubber-banding en los bordes */
  rubberband: 0.55,
  /** Muestras de posición que se guardan para calcular velocidad de suelta */
  velocitySamples: 5,
} as const;

// ── Stagger ──────────────────────────────────────────────────────
export const stagger = {
  tight:   0.04,
  base:    0.08,
  relaxed: 0.12,
  loose:   0.18,
} as const;

// ── Offsets (initial translate for entrances, in px) ─────────────
export const offset = {
  subtle: 12,
  base:   20,
  medium: 32,
  large:  48,
} as const;
