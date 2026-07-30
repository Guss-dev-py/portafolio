import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../motion/hooks/useReducedMotion';
import styles from './ParticlesBackground.module.css';

const LAYERS = [
  { count: 0.90, sizeMin: 0.3, sizeMax: 0.9, alpha: 0.08, speed: 0.07, parallax: -0.22, depth: 0.12 }, // very far
  { count: 1.00, sizeMin: 0.7, sizeMax: 1.6, alpha: 0.20, speed: 0.14, parallax: -0.12, depth: 0.35 }, // far
  { count: 0.55, sizeMin: 1.5, sizeMax: 2.8, alpha: 0.30, speed: 0.22, parallax:  0.10, depth: 0.65 }, // mid
  { count: 0.30, sizeMin: 2.6, sizeMax: 5.0, alpha: 0.46, speed: 0.34, parallax:  0.42, depth: 1.00 }, // near
  { count: 0.12, sizeMin: 5.5, sizeMax: 9.5, alpha: 0.52, speed: 0.40, parallax:  0.68, depth: 1.35 }, // very close
];

const CONN_DIST = 165;
const CONN_DIST2 = CONN_DIST * CONN_DIST;
const CONN_ALPHA = 0.18;
const MOUSE_REPEL = 230;
const MOUSE_REPEL2 = MOUSE_REPEL * MOUSE_REPEL;
const MOUSE_REPEL_BASE = 6.0;
const POP_RADIUS = 140;
const POP_RADIUS2 = POP_RADIUS * POP_RADIUS;
const DENSITY = 0.9;
const DOT_ALPHA_MAX = 0.85;

// ── Presupuesto de dibujo ────────────────────────────────────────
// El costo de este canvas no está en la aritmética sino en la cantidad de draw
// calls: hacía un beginPath()+stroke() por línea y un beginPath()+fill() por
// partícula, miles por frame. Agrupando por nivel de alpha se dibuja todo en
// unos pocos paths. Medido: +46% de fps. Detalle en docs/PARTICULAS-BENCHMARK.md
const LINE_LEVELS = 6;
const DOT_LEVELS = 8;
/** Lado de celda del grid espacial. Igual a CONN_DIST: así una partícula sólo
 *  puede conectar con las de su celda y las 8 vecinas. */
const CELL = CONN_DIST;
/** Media vecindad (dx,dy aplanados). Recorrer sólo 4 de las 8 celdas vecinas
 *  alcanza: el par (A,B) se evalúa desde A, y el simétrico nunca se repite. */
const NEIGHBOURS = [1, 0, 0, 1, 1, 1, 1, -1];

interface Particle {
  x: number; y: number;
  dvx: number; dvy: number;  // current drift vector — updated each frame by wander
  evx: number; evy: number;  // repulsion excess — decays with friction
  dSpeed: number;            // drift magnitude (constant)
  wAngle: number;            // current drift direction in radians — random-walks each frame
  r: number; a: number;
  L: number;
  zPhase: number; zSpeed: number;
  depth: number;
}

export function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;

    document.body.setAttribute('data-particles', 'on');

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    let rafId = 0;
    let particles: Particle[] = [];
    /** Subconjunto que participa de las conexiones (todo menos la capa 0). */
    let connectable: Particle[] = [];
    /** Grid espacial reutilizado entre frames: clave de celda → índices. */
    const cells = new Map<number, number[]>();
    /** Buffers de dibujo, reusados para no asignar arrays en cada frame. */
    const lineBuf: number[][] = Array.from({ length: LINE_LEVELS }, () => []);
    const dotBuf: number[][] = Array.from({ length: DOT_LEVELS }, () => []);

    // Color de tinta del tema activo; se refresca cuando cambia data-theme.
    let inkColor = 'rgb(22,20,18)';
    const readInk = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
      if (v) inkColor = v;
    };
    readInk();
    const themeObserver = new MutationObserver(readInk);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const mouse = { x: -9999, y: -9999, nx: 0, ny: 0 };
    const cam = { x: 0, y: 0 };

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      // DPR fijo en 1, a propósito. Con cap 2, en una pantalla retina el canvas
      // pasaba de 1,3 a 5,2 megapíxeles — 4× más píxeles que pintar por frame —
      // y el fill rate se convertía en el techo de todo: 9 fps contra 39.
      // Esto es un fondo difuso con alphas de 0.08 a 0.52, no texto: la nitidez
      // extra no se percibe y cuesta cuatro veces el trabajo.
      const dpr = 1;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
    };

    const buildParticles = () => {
      particles = [];
      const baseCount = Math.round((W * H / 3800) * DENSITY);
      for (let li = 0; li < LAYERS.length; li++) {
        const layer = LAYERS[li];
        const n = Math.round(baseCount * layer.count);
        for (let i = 0; i < n; i++) {
          const wAngle = Math.random() * Math.PI * 2;
          const dSpeed = layer.speed * (0.3 + Math.random() * 0.4);
          particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            dvx: Math.cos(wAngle) * dSpeed,
            dvy: Math.sin(wAngle) * dSpeed,
            evx: 0,
            evy: 0,
            dSpeed,
            wAngle,
            r: layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin),
            a: layer.alpha * (0.7 + Math.random() * 0.5),
            L: li,
            zPhase: Math.random() * Math.PI * 2,
            zSpeed: 0.0008 + Math.random() * 0.0016,
            depth: layer.depth,
          });
        }
      }
      // depth never changes — sort once so draw loop reuses the order
      particles.sort((a, b) => a.depth - b.depth);
      // La capa 0 nunca se conecta: manteniéndola fuera de este array, el
      // recorrido de conexiones no la visita.
      connectable = particles.filter(p => p.L !== 0);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.nx = (e.clientX / W) * 2 - 1;
      mouse.ny = (e.clientY / H) * 2 - 1;
    };

    const onMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
      mouse.nx = 0;
      mouse.ny = 0;
    };

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      const now = performance.now();

      ctx.clearRect(0, 0, W, H);

      cam.x += (mouse.nx * 28 - cam.x) * 0.05;
      cam.y += (mouse.ny * 18 - cam.y) * 0.05;

      const layerOx = LAYERS.map(l => cam.x * l.parallax);
      const layerOy = LAYERS.map(l => cam.y * l.parallax);

      for (const p of particles) {
        // wander: random-walk the drift angle each frame → non-circular, unpredictable paths
        p.wAngle += (Math.random() - 0.5) * 0.04;
        p.dvx = Math.cos(p.wAngle) * p.dSpeed;
        p.dvy = Math.sin(p.wAngle) * p.dSpeed;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_REPEL2 && d2 > 0.0001) {
          const dist = Math.sqrt(d2);
          const t = 1 - dist / MOUSE_REPEL;
          const force = t * t * MOUSE_REPEL_BASE * (0.4 + p.depth * 1.4);
          p.evx += (dx / dist) * force * 0.038;
          p.evy += (dy / dist) * force * 0.038;
        }

        p.evx *= 0.88;
        p.evy *= 0.88;

        p.x += p.dvx + p.evx;
        p.y += p.dvy + p.evy;

        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
      }

      // ── Conexiones ────────────────────────────────────────────────
      // Grid espacial: cada partícula sólo se compara con su celda y 4 vecinas
      // (media vecindad, para no evaluar cada par dos veces). Recorta ~85% de
      // las comparaciones. Los pares se acumulan por nivel de alpha y se
      // dibujan con un stroke() por nivel — eso es lo que realmente ahorra.
      for (let n = 0; n < LINE_LEVELS; n++) lineBuf[n].length = 0;
      cells.clear();
      for (let i = 0; i < connectable.length; i++) {
        const p = connectable[i];
        const cx = ((p.x + layerOx[p.L]) / CELL) | 0;
        const cy = ((p.y + layerOy[p.L]) / CELL) | 0;
        const key = cx * 100000 + cy;
        const bucket = cells.get(key);
        if (bucket) bucket.push(i);
        else cells.set(key, [i]);
      }

      const pushLine = (p: Particle, q: Particle) => {
        if (Math.abs(p.L - q.L) > 1) return;
        const px = p.x + layerOx[p.L];
        const py = p.y + layerOy[p.L];
        const qx = q.x + layerOx[q.L];
        const qy = q.y + layerOy[q.L];
        const dx = px - qx;
        const dy = py - qy;
        const d2 = dx * dx + dy * dy;
        if (d2 > CONN_DIST2) return;
        const t = 1 - Math.sqrt(d2) / CONN_DIST;
        const depthAvg = (p.depth + q.depth) * 0.5;
        const alpha = t * t * CONN_ALPHA * (0.5 + depthAvg * 0.8);
        const level = Math.min(LINE_LEVELS - 1, ((alpha / CONN_ALPHA) * LINE_LEVELS) | 0);
        lineBuf[level].push(px, py, qx, qy);
      };

      for (const [key, idxs] of cells) {
        const cx = Math.floor(key / 100000);
        const cy = key - cx * 100000;
        for (let a = 0; a < idxs.length; a++) {
          const p = connectable[idxs[a]];
          for (let b = a + 1; b < idxs.length; b++) pushLine(p, connectable[idxs[b]]);
          for (let k = 0; k < NEIGHBOURS.length; k += 2) {
            const arr = cells.get((cx + NEIGHBOURS[k]) * 100000 + (cy + NEIGHBOURS[k + 1]));
            if (!arr) continue;
            for (const bi of arr) pushLine(p, connectable[bi]);
          }
        }
      }

      ctx.strokeStyle = inkColor;
      for (let n = 0; n < LINE_LEVELS; n++) {
        const arr = lineBuf[n];
        if (arr.length === 0) continue;
        const mid = (n + 0.5) / LINE_LEVELS;
        ctx.globalAlpha = CONN_ALPHA * mid;
        ctx.lineWidth = 0.6 + mid * 0.8;
        ctx.beginPath();
        for (let k = 0; k < arr.length; k += 4) {
          ctx.moveTo(arr[k], arr[k + 1]);
          ctx.lineTo(arr[k + 2], arr[k + 3]);
        }
        ctx.stroke();
      }

      // ── Puntos ────────────────────────────────────────────────────
      // Mismo criterio: agrupados por alpha, un fill() por nivel. Se conserva
      // el orden por profundidad porque los niveles van de tenue a opaco, que
      // coincide con lejano a cercano.
      for (let n = 0; n < DOT_LEVELS; n++) dotBuf[n].length = 0;
      for (const p of particles) {
        let s = 1 + Math.sin(now * 0.001 * p.zSpeed * 1000 + p.zPhase) * 0.10 * p.depth;
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < POP_RADIUS2) {
          const t2 = 1 - Math.sqrt(d2) / POP_RADIUS;
          s += t2 * t2 * 0.7 * p.depth;
        }
        const alpha = Math.min(DOT_ALPHA_MAX, p.a * (0.85 + (s - 1) * 0.8));
        const level = Math.min(DOT_LEVELS - 1, ((alpha / DOT_ALPHA_MAX) * DOT_LEVELS) | 0);
        dotBuf[level].push(p.x + layerOx[p.L], p.y + layerOy[p.L], p.r * s);
      }

      ctx.fillStyle = inkColor;
      for (let n = 0; n < DOT_LEVELS; n++) {
        const arr = dotBuf[n];
        if (arr.length === 0) continue;
        ctx.globalAlpha = DOT_ALPHA_MAX * ((n + 0.5) / DOT_LEVELS);
        ctx.beginPath();
        for (let k = 0; k < arr.length; k += 3) {
          // moveTo antes de arc: sin esto, arc() traza una línea desde el punto
          // anterior y todos los círculos del nivel quedan encadenados.
          ctx.moveTo(arr[k] + arr[k + 2], arr[k + 1]);
          ctx.arc(arr[k], arr[k + 1], arr[k + 2], 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    resize();
    draw();

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave, { passive: true });
    window.addEventListener('resize', resize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      themeObserver.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', resize);
      document.body.removeAttribute('data-particles');
    };
  }, [prefersReduced]);

  if (prefersReduced) return null;

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      aria-hidden="true"
    />
  );
}
