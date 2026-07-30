import { type Variants } from 'framer-motion';
import { duration, ease, stagger, offset, gestureSpring } from './tokens';

// ── Fade + Slide Up (most common entrance) ───────────────────────
export const fadeUp = {
  hidden: { opacity: 0, y: offset.base },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.moderate, ease: ease.expo },
  },
};

// ── Cinematic fade up (hero heading) ────────────────────────────
export const cinematicFadeUp = {
  hidden: { opacity: 0, y: offset.large },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.cinematic, ease: ease.expo },
  },
};

// ── Fade in only (overlays, success states) ──────────────────────
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.moderate, ease: ease.out },
  },
};

// ── Stagger container ────────────────────────────────────────────
export const staggerContainer = (staggerChildren: number = stagger.base, delayChildren: number = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren, delayChildren },
  },
});

// ── Scale in (skill tags, badges) ───────────────────────────────
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.base, ease: ease.back },
  },
};

// ── Slide in from left (about section blocks) ────────────────────
export const slideInLeft = {
  hidden: { opacity: 0, x: -offset.medium },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.slow, ease: ease.expo },
  },
};

// ── Overlay reveal (card overlay text) ──────────────────────────
export const overlayReveal = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.fast, ease: ease.out },
  },
};

// ── Salidas ──────────────────────────────────────────────────────
// Hasta la Fase 2 nada tenía animación de salida: los componentes se
// desmontaban de golpe. Estas variantes se usan con <AnimatePresence>.
//
// Dos reglas que se respetan acá:
//  · Simetría de camino — lo que entra desde un borde sale por el mismo borde.
//  · Asimetría de tiempo — la respuesta del sistema entra rápido; la salida,
//    que nadie está esperando, se toma un poco más para no ser abrupta.

/** Toast: entra desde el borde derecho y se va por donde vino. */
export const toastSlide = {
  hidden: { opacity: 0, x: offset.base },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.fast, ease: ease.out },
  },
  exit: {
    opacity: 0,
    x: offset.base,
    transition: { duration: duration.base, ease: ease.out },
  },
};

/** Scrim de un diálogo modal: sólo opacidad, nunca movimiento. */
export const scrimFade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.fast, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: ease.out } },
};

/**
 * Diálogo modal. Escala desde 0.96, no desde 0: arrancar en `scale(0)` hace que
 * el elemento parezca brotar de un punto en vez de aparecer. Los modales son la
 * excepción a la regla de anclar al origen — se quedan centrados.
 */
export const dialogPop = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.fast, ease: ease.out },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: duration.fast, ease: ease.out },
  },
};

/** Drawer lateral: entra y sale por el mismo borde. */
export const drawerSlide = {
  hidden: { x: '-100%' },
  visible: { x: 0, transition: gestureSpring.drawer },
  exit: { x: '-100%', transition: { duration: duration.base, ease: ease.out } },
};

/**
 * Equivalente con movimiento reducido: conserva la opacidad, que ayuda a
 * entender que algo apareció o se fue, y elimina el desplazamiento.
 * `prefers-reduced-motion` no significa "sin feedback".
 */
export const fadeOnly = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.fast, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: ease.out } },
};
