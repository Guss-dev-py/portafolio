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
const CONN_ALPHA = 0.18;
const MOUSE_REPEL = 230;
const MOUSE_REPEL_BASE = 6.0;
const POP_RADIUS = 140;
const DENSITY = 0.9;

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

    const mouse = { x: -9999, y: -9999, nx: 0, ny: 0 };
    const cam = { x: 0, y: 0 };

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      // Escalar por devicePixelRatio (cap 2): sin esto el canvas se ve
      // borroso en pantallas retina. El resto del código sigue en px CSS.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_REPEL && dist > 0.01) {
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

      const scaleFor = (p: Particle) => {
        let s = 1;
        s += Math.sin(now * 0.001 * p.zSpeed * 1000 + p.zPhase) * 0.10 * p.depth;
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < POP_RADIUS) {
          const t2 = 1 - dist / POP_RADIUS;
          s += t2 * t2 * 0.7 * p.depth;
        }
        return s;
      };

      // Draw connections — use globalAlpha to avoid per-connection string allocation
      ctx.strokeStyle = 'rgb(22,20,18)';
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.L === 0) continue;
        const px = p.x + layerOx[p.L];
        const py = p.y + layerOy[p.L];

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          if (Math.abs(p.L - q.L) > 1) continue;
          const qx = q.x + layerOx[q.L];
          const qy = q.y + layerOy[q.L];

          const dx = px - qx;
          const dy = py - qy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > CONN_DIST) continue;

          const t = 1 - dist / CONN_DIST;
          const depthAvg = (p.depth + q.depth) * 0.5;

          ctx.globalAlpha = t * t * CONN_ALPHA * (0.5 + depthAvg * 0.8);
          ctx.lineWidth = 0.6 + depthAvg * 0.8;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(qx, qy);
          ctx.stroke();
        }
      }

      // Draw dots back-to-front (particles already sorted by depth in buildParticles)
      ctx.fillStyle = 'rgb(22,20,18)';
      for (const p of particles) {
        const s = scaleFor(p);
        const drawX = p.x + layerOx[p.L];
        const drawY = p.y + layerOy[p.L];
        const radius = p.r * s;

        ctx.globalAlpha = Math.min(0.85, p.a * (0.85 + (s - 1) * 0.8));
        ctx.beginPath();
        ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
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
