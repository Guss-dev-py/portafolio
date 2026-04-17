import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from '../../motion/hooks/useReducedMotion';
import styles from './ParticlesBackground.module.css';

// ── Layer definitions ─────────────────────────────────────────────
const LAYERS = [
  { count: 120, zRange: [-14, -4] as [number,number], speedMult: 0.6, sizeDark: 1.8,  sizeLight: 2.0,  opacityDark: 0.38, opacityLight: 0.48 },
  { count: 120, zRange: [-4,   4] as [number,number], speedMult: 1.0, sizeDark: 2.6,  sizeLight: 2.8,  opacityDark: 0.52, opacityLight: 0.60 },
  { count:  80, zRange: [4,   14] as [number,number], speedMult: 1.6, sizeDark: 3.6,  sizeLight: 3.8,  opacityDark: 0.65, opacityLight: 0.70 },
];

const TOTAL      = LAYERS.reduce((s, l) => s + l.count, 0);
const SPREAD_XY  = 30;
const BASE_SPEED = 0.0062;
const CONN_DIST  = 4.0;
const MAX_CONN   = 5;
const MOUSE_STR  = 0.0018;

// ── Shaders — circle via gl_PointCoord ───────────────────────────
const VERT = /* glsl */`
  attribute float aSize;
  attribute float aOpacity;
  varying float vOpacity;

  void main() {
    vOpacity = aOpacity;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (60.0 / -mvPos.z);
    gl_Position  = projectionMatrix * mvPos;
  }
`;

const FRAG = /* glsl */`
  uniform vec3  uColor;
  varying float vOpacity;

  void main() {
    vec2  uv   = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    if (dist > 0.5) discard;

    // Tight glow: sharp center, minimal halo
    float alpha = vOpacity * (1.0 - smoothstep(0.38, 0.5, dist));
    gl_FragColor = vec4(uColor, alpha);
  }
`;

// ── Theme ─────────────────────────────────────────────────────────
const THEME = {
  dark:  { dot: new THREE.Color(0xc084fc), lineR: 0.72, lineG: 0.48, lineB: 0.98, lineMax: 0.28, blend: THREE.NormalBlending },
  light: { dot: new THREE.Color(0x7c3aed), lineR: 0.55, lineG: 0.30, lineB: 0.85, lineMax: 0.18, blend: THREE.NormalBlending },
} as const;

function getTheme(): 'dark' | 'light' {
  const a = document.documentElement.getAttribute('data-theme');
  if (a === 'dark' || a === 'light') return a;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

interface PData { vx: number; vy: number; vz: number }

export function ParticlesBackground() {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const mouseRef       = useRef({ x: 0, y: 0 });
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);
    camera.position.z = 18;

    // ── Build flat particle arrays ────────────────────────────────
    const positions  = new Float32Array(TOTAL * 3);
    const sizes      = new Float32Array(TOTAL);
    const opacities  = new Float32Array(TOTAL);
    const particles: PData[] = [];
    const layerOf: number[]  = [];   // which layer index each particle belongs to

    let off = 0;
    for (let li = 0; li < LAYERS.length; li++) {
      const layer = LAYERS[li];
      const [zMin, zMax] = layer.zRange;
      const t = getTheme();

      for (let i = 0; i < layer.count; i++) {
        const idx = off + i;
        positions[idx * 3]     = (Math.random() - 0.5) * SPREAD_XY;
        positions[idx * 3 + 1] = (Math.random() - 0.5) * SPREAD_XY;
        positions[idx * 3 + 2] = zMin + Math.random() * (zMax - zMin);

        sizes[idx]    = t === 'dark' ? layer.sizeDark    : layer.sizeLight;
        opacities[idx] = t === 'dark' ? layer.opacityDark : layer.opacityLight;

        const s = BASE_SPEED * layer.speedMult * (0.7 + Math.random() * 0.6);
        particles.push({ vx: (Math.random() - 0.5) * s, vy: (Math.random() - 0.5) * s, vz: (Math.random() - 0.5) * s * 0.25 });
        layerOf.push(li);
      }
      off += layer.count;
    }

    // ── Dot geometry + ShaderMaterial ────────────────────────────
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    dotGeo.setAttribute('aSize',    new THREE.BufferAttribute(sizes,     1));
    dotGeo.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));

    const t0 = getTheme();
    const dotMat = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms: { uColor: { value: THEME[t0].dot.clone() } },
      transparent: true,
      depthWrite:  false,
      blending:    THEME[t0].blend,
    });

    const dots = new THREE.Points(dotGeo, dotMat);
    scene.add(dots);

    // ── Lines geometry ────────────────────────────────────────────
    const maxSeg   = TOTAL * MAX_CONN;
    const linePos  = new Float32Array(maxSeg * 6);
    const lineCol  = new Float32Array(maxSeg * 6);
    const lineGeo  = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    lineGeo.setAttribute('color',    new THREE.BufferAttribute(lineCol, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 1,
      blending: THEME[t0].blend, depthWrite: false,
    });
    const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineMesh);

    // ── Theme observer ────────────────────────────────────────────
    let curTheme = t0;
    const applyTheme = (t: 'dark' | 'light') => {
      curTheme = t;
      const tc = THEME[t];
      dotMat.uniforms['uColor'].value.set(tc.dot);
      dotMat.blending = tc.blend;
      dotMat.needsUpdate = true;
      lineMat.blending = tc.blend;
      lineMat.needsUpdate = true;

      const posAttr = dotGeo.attributes['aSize']    as THREE.BufferAttribute;
      const opAttr  = dotGeo.attributes['aOpacity'] as THREE.BufferAttribute;
      for (let i = 0; i < TOTAL; i++) {
        const layer = LAYERS[layerOf[i]];
        (posAttr.array as Float32Array)[i] = t === 'dark' ? layer.sizeDark    : layer.sizeLight;
        (opAttr.array  as Float32Array)[i] = t === 'dark' ? layer.opacityDark : layer.opacityLight;
      }
      posAttr.needsUpdate = true;
      opAttr.needsUpdate  = true;
    };

    const obs = new MutationObserver(() => { const t = getTheme(); if (t !== curTheme) applyTheme(t); });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // ── Events ────────────────────────────────────────────────────
    const onMouse  = (e: MouseEvent) => { mouseRef.current = { x: (e.clientX / window.innerWidth - 0.5) * 2, y: (e.clientY / window.innerHeight - 0.5) * 2 }; };
    const onResize = () => { renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); };
    window.addEventListener('mousemove', onMouse,  { passive: true });
    window.addEventListener('resize',   onResize, { passive: true });

    // ── Reusable ──────────────────────────────────────────────────
    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    let rafId: number;

    const posAttr = dotGeo.attributes['position'] as THREE.BufferAttribute;
    const lpAttr  = lineGeo.attributes['position'] as THREE.BufferAttribute;
    const lcAttr  = lineGeo.attributes['color']    as THREE.BufferAttribute;

    // ── Animate ───────────────────────────────────────────────────
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const halfXY = SPREAD_XY / 2;

      // Move
      for (let li = 0; li < LAYERS.length; li++) {
        const layer = LAYERS[li];
        const [zMin, zMax] = layer.zRange;
        const zMid = (zMin + zMax) / 2;
        const halfZ = (zMax - zMin) / 2;
        const base = LAYERS.slice(0, li).reduce((s, l) => s + l.count, 0);

        for (let i = 0; i < layer.count; i++) {
          const gi = base + i;
          const gx = gi * 3, gy = gx + 1, gz = gx + 2;
          const pa = posAttr.array as Float32Array;

          pa[gx] += particles[gi].vx;
          pa[gy] += particles[gi].vy;
          pa[gz] += particles[gi].vz;

          if (pa[gx] >  halfXY) pa[gx] = -halfXY;
          if (pa[gx] < -halfXY) pa[gx] =  halfXY;
          if (pa[gy] >  halfXY) pa[gy] = -halfXY;
          if (pa[gy] < -halfXY) pa[gy] =  halfXY;
          if (pa[gz] > zMid + halfZ) pa[gz] = zMid - halfZ;
          if (pa[gz] < zMid - halfZ) pa[gz] = zMid + halfZ;
        }
      }
      posAttr.needsUpdate = true;

      // Connections
      const tc = THEME[curTheme];
      let seg = 0;
      const cc = new Uint8Array(TOTAL);
      const pa = posAttr.array as Float32Array;

      for (let i = 0; i < TOTAL; i++) {
        if (cc[i] >= MAX_CONN) continue;
        vA.set(pa[i*3], pa[i*3+1], pa[i*3+2]);

        for (let j = i + 1; j < TOTAL; j++) {
          if (cc[i] >= MAX_CONN) break;
          if (cc[j] >= MAX_CONN) continue;
          vB.set(pa[j*3], pa[j*3+1], pa[j*3+2]);

          const d = vA.distanceTo(vB);
          if (d > CONN_DIST) continue;

          const a = (1 - d / CONN_DIST) * tc.lineMax;
          const base = seg * 6;
          lpAttr.array[base]   = vA.x; lpAttr.array[base+1] = vA.y; lpAttr.array[base+2] = vA.z;
          lcAttr.array[base]   = tc.lineR*a; lcAttr.array[base+1] = tc.lineG*a; lcAttr.array[base+2] = tc.lineB*a;
          lpAttr.array[base+3] = vB.x; lpAttr.array[base+4] = vB.y; lpAttr.array[base+5] = vB.z;
          lcAttr.array[base+3] = tc.lineR*a; lcAttr.array[base+4] = tc.lineG*a; lcAttr.array[base+5] = tc.lineB*a;

          seg++; cc[i]++; cc[j]++;
          if (seg >= maxSeg) break;
        }
        if (seg >= maxSeg) break;
      }

      lineGeo.setDrawRange(0, seg * 2);
      lpAttr.needsUpdate = true;
      lcAttr.needsUpdate = true;

      // Camera parallax
      camera.position.x += (mouseRef.current.x * 1.8 - camera.position.x) * MOUSE_STR;
      camera.position.y += (-mouseRef.current.y * 1.2 - camera.position.y) * MOUSE_STR;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize',   onResize);
      obs.disconnect();
      dotGeo.dispose();
      dotMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      renderer.dispose();
    };
  }, [prefersReduced]);

  if (prefersReduced) return null;
  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
