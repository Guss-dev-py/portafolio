import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from '../../motion/hooks/useReducedMotion';
import styles from './ParticlesBackground.module.css';

const PARTICLE_COUNT = 120;
const PARTICLE_SPREAD = 20;

export function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    // ── Scene + Camera ────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.z = 12;

    // ── Particles ─────────────────────────────────────────────────
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities: { vx: number; vy: number }[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * PARTICLE_SPREAD;
      positions[i * 3 + 1] = (Math.random() - 0.5) * PARTICLE_SPREAD;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      velocities.push({
        vx: (Math.random() - 0.5) * 0.004,
        vy: (Math.random() - 0.5) * 0.004,
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xaa3bff,
      size: 0.06,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // ── Resize handler ────────────────────────────────────────────
    const handleResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // ── Animation loop ────────────────────────────────────────────
    let rafId: number;
    const posAttr = geometry.attributes['position'] as THREE.BufferAttribute;

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        posAttr.array[i * 3]     += velocities[i].vx;
        posAttr.array[i * 3 + 1] += velocities[i].vy;

        // Wrap around edges
        const half = PARTICLE_SPREAD / 2;
        if ((posAttr.array[i * 3] as number) > half)  posAttr.array[i * 3]     = -half;
        if ((posAttr.array[i * 3] as number) < -half) posAttr.array[i * 3]     = half;
        if ((posAttr.array[i * 3 + 1] as number) > half)  posAttr.array[i * 3 + 1] = -half;
        if ((posAttr.array[i * 3 + 1] as number) < -half) posAttr.array[i * 3 + 1] = half;
      }
      posAttr.needsUpdate = true;

      particles.rotation.y += 0.0003;
      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ───────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [prefersReduced]);

  if (prefersReduced) return null;

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
