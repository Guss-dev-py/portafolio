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
