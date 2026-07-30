import { gesture } from './tokens';

/**
 * Helpers de física para gestos, traducidos del código de ejemplo de
 * *Designing Fluid Interfaces* (WWDC 2018) al navegador.
 *
 * La idea central: cuando el usuario suelta algo, la animación no arranca de
 * cero — continúa a la velocidad exacta que traía el dedo, y aterriza donde el
 * gesto *iba*, no donde terminó.
 */

/**
 * Proyecta dónde se detendría algo lanzado a `initialVelocity` px/s.
 *
 * Es decaimiento exponencial, igual que la desaceleración del scroll — NO la
 * fórmula de manual `v²/(2·a)`, que da otro resultado y se siente peor.
 */
export function project(
  initialVelocity: number,
  decelerationRate: number = gesture.decelerationRate,
): number {
  return ((initialVelocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Resistencia progresiva pasada una frontera. Cuanto más lejos del borde, menos
 * sigue el elemento al dedo: un tope duro se lee como "se congeló"; la
 * resistencia continua se lee como "responde, pero no hay más".
 */
export function rubberband(
  overshoot: number,
  dimension: number,
  constant: number = gesture.rubberband,
): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

interface Sample {
  value: number;
  time: number;
}

/**
 * Ventana corta de muestras posición/tiempo para calcular la velocidad al
 * soltar. Hace falta el historial, no solo el último punto: un único delta entre
 * dos eventos `pointermove` da una velocidad ruidosa e inservible.
 */
export class VelocityTracker {
  private samples: Sample[] = [];

  constructor(private readonly max: number = gesture.velocitySamples) {}

  add(value: number, time: number = performance.now()): void {
    this.samples.push({ value, time });
    if (this.samples.length > this.max) this.samples.shift();
  }

  /** Velocidad en px/s sobre la ventana disponible. 0 si no hay con qué. */
  get velocity(): number {
    if (this.samples.length < 2) return 0;
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const dt = last.time - first.time;
    if (dt <= 0) return 0;
    return ((last.value - first.value) / dt) * 1000;
  }

  reset(): void {
    this.samples = [];
  }
}

/** Índice del valor de `points` más cercano a `value`. */
export function nearestIndex(points: readonly number[], value: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const d = Math.abs(points[i] - value);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}
