import { duration, ease, stagger, offset } from './tokens';

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
export const staggerContainer = (staggerChildren = stagger.base, delayChildren = 0) => ({
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
