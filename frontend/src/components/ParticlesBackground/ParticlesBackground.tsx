import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../../motion/hooks/useReducedMotion";
import styles from "./ParticlesBackground.module.css";

// ── Layer definitions ─────────────────────────────────────────────
const LAYERS = [
  {
    count: 120,
    zRange: [-14, -4] as [number, number],
    speedMult: 0.6,
    sizeDark: 1.8,
    sizeLight: 2.0,
    opacityDark: 0.38,
    opacityLight: 0.48,
  },
  {
    count: 120,
    zRange: [-4, 4] as [number, number],
    speedMult: 1.0,
    sizeDark: 2.6,
    sizeLight: 2.8,
    opacityDark: 0.52,
    opacityLight: 0.6,
  },
  {
    count: 80,
    zRange: [4, 14] as [number, number],
    speedMult: 1.6,
    sizeDark: 3.6,
    sizeLight: 3.8,
    opacityDark: 0.65,
    opacityLight: 0.7,
  },
];

const TOTAL = LAYERS.reduce((s, l) => s + l.count, 0);
const SPREAD_XY = 30;
const BASE_SPEED = 0.0062;
const CONN_DIST = 4.0;
const MAX_CONN = 5;
const MOUSE_STR = 0.0018;
const LINE_FADE_IN = 3.5;
const LINE_FADE_OUT = 2.0;

// ── Shaders — circle via gl_PointCoord ───────────────────────────
const VERT = /* glsl */ `
  uniform float uPulse;
  attribute float aSize;
  attribute float aOpacity;
  attribute vec3 aColor;
  varying float vOpacity;
  varying vec3 vColor;
  varying float vViewDepth;

  void main() {
    vOpacity = aOpacity;
    vColor = aColor;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDepth = -mvPos.z;
    gl_PointSize = aSize * (60.0 / -mvPos.z) * (1.0 + uPulse * 0.35);
    gl_Position  = projectionMatrix * mvPos;
  }
`;

const FRAG = /* glsl */ `
  uniform float uPulse;
  varying float vOpacity;
  varying vec3 vColor;
  varying float vViewDepth;

  void main() {
    vec2  uv   = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    if (dist > 0.5) discard;

    // Depth blur: farther particles become softer and less intrusive.
    float depthBlur = smoothstep(11.0, 31.0, vViewDepth);
    float core = 1.0 - smoothstep(0.08, mix(0.26, 0.40, depthBlur), dist);
    float halo = 1.0 - smoothstep(0.18, mix(0.50, 0.64, depthBlur), dist);

    // Depth field: distant particles fade into the background mist.
    float depthFade = 1.0 - smoothstep(10.0, 32.0, vViewDepth);

    // Pulse brightens halo + scales particles (see vertex shader).
    float pulseGlow = uPulse * halo;
    float alpha = vOpacity * (core * 0.76 + halo * (0.24 + pulseGlow * 1.4));
    alpha *= mix(0.12, 1.0, depthFade);

    vec3 color = vColor * (1.0 + pulseGlow * 0.55);
    gl_FragColor = vec4(color, alpha);
  }
`;

// ── Theme ─────────────────────────────────────────────────────────
const THEME = {
  dark: {
    layerColors: [
      new THREE.Color(0x6d28d9),
      new THREE.Color(0xa855f7),
      new THREE.Color(0xe879f9),
    ],
    lineR: 0.88,
    lineG: 0.44,
    lineB: 0.9,
    lineMax: 0.28,
    blend: THREE.AdditiveBlending,
  },
  light: {
    layerColors: [
      new THREE.Color(0x6d28d9),
      new THREE.Color(0x8b5cf6),
      new THREE.Color(0x2563eb),
    ],
    lineR: 0.55,
    lineG: 0.3,
    lineB: 0.85,
    lineMax: 0.18,
    blend: THREE.AdditiveBlending,
  },
} as const;

function getTheme(): "dark" | "light" {
  const a = document.documentElement.getAttribute("data-theme");
  if (a === "dark" || a === "light") return a;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

interface PData {
  vx: number;
  vy: number;
  vz: number;
}

export function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      120,
    );
    camera.position.z = 18;

    // ── Build flat particle arrays ────────────────────────────────
    const positions = new Float32Array(TOTAL * 3);
    const sizes = new Float32Array(TOTAL);
    const opacities = new Float32Array(TOTAL);
    const colors = new Float32Array(TOTAL * 3);
    const particles: PData[] = [];
    const layerOf: number[] = []; // which layer index each particle belongs to
    const t = getTheme();

    let off = 0;
    for (let li = 0; li < LAYERS.length; li++) {
      const layer = LAYERS[li];
      const [zMin, zMax] = layer.zRange;
      const c = THEME[t].layerColors[li];

      for (let i = 0; i < layer.count; i++) {
        const idx = off + i;
        positions[idx * 3] = (Math.random() - 0.5) * SPREAD_XY;
        positions[idx * 3 + 1] = (Math.random() - 0.5) * SPREAD_XY;
        positions[idx * 3 + 2] = zMin + Math.random() * (zMax - zMin);

        sizes[idx] = t === "dark" ? layer.sizeDark : layer.sizeLight;
        opacities[idx] = t === "dark" ? layer.opacityDark : layer.opacityLight;
        colors[idx * 3] = c.r;
        colors[idx * 3 + 1] = c.g;
        colors[idx * 3 + 2] = c.b;

        const s = BASE_SPEED * layer.speedMult * (0.7 + Math.random() * 0.6);
        particles.push({
          vx: (Math.random() - 0.5) * s,
          vy: (Math.random() - 0.5) * s,
          vz: (Math.random() - 0.5) * s * 0.25,
        });
        layerOf.push(li);
      }
      off += layer.count;
    }

    // ── Dot geometry + ShaderMaterial ────────────────────────────
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    dotGeo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    dotGeo.setAttribute("aOpacity", new THREE.BufferAttribute(opacities, 1));
    dotGeo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

    const t0 = getTheme();
    const dotMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uPulse: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THEME[t0].blend,
    });

    const dots = new THREE.Points(dotGeo, dotMat);
    scene.add(dots);

    // ── Lines geometry ────────────────────────────────────────────
    const maxSeg = TOTAL * MAX_CONN;
    const linePos = new Float32Array(maxSeg * 6);
    const lineCol = new Float32Array(maxSeg * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    lineGeo.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THEME[t0].blend,
      depthWrite: false,
    });
    const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineMesh);

    // ── Theme observer ────────────────────────────────────────────
    let curTheme = t0;
    const applyTheme = (t: "dark" | "light") => {
      curTheme = t;
      const tc = THEME[t];
      dotMat.blending = tc.blend;
      dotMat.needsUpdate = true;
      lineMat.blending = tc.blend;
      lineMat.needsUpdate = true;

      const posAttr = dotGeo.attributes["aSize"] as THREE.BufferAttribute;
      const opAttr = dotGeo.attributes["aOpacity"] as THREE.BufferAttribute;
      const colAttr = dotGeo.attributes["aColor"] as THREE.BufferAttribute;
      for (let i = 0; i < TOTAL; i++) {
        const layerIdx = layerOf[i];
        const layer = LAYERS[layerIdx];
        const c = tc.layerColors[layerIdx];
        (posAttr.array as Float32Array)[i] =
          t === "dark" ? layer.sizeDark : layer.sizeLight;
        (opAttr.array as Float32Array)[i] =
          t === "dark" ? layer.opacityDark : layer.opacityLight;

        const ci = i * 3;
        (colAttr.array as Float32Array)[ci] = c.r;
        (colAttr.array as Float32Array)[ci + 1] = c.g;
        (colAttr.array as Float32Array)[ci + 2] = c.b;
      }
      posAttr.needsUpdate = true;
      opAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    };

    const obs = new MutationObserver(() => {
      const t = getTheme();
      if (t !== curTheme) applyTheme(t);
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // ── Events ────────────────────────────────────────────────────
    const onMouse = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    // ── Reusable ──────────────────────────────────────────────────
    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    let rafId: number;

    const posAttr = dotGeo.attributes["position"] as THREE.BufferAttribute;
    const lpAttr = lineGeo.attributes["position"] as THREE.BufferAttribute;
    const lcAttr = lineGeo.attributes["color"] as THREE.BufferAttribute;

    let pulseValue = 0;
    let pulseStart = -Infinity;
    let pulseDuration = 0;
    let pulsePeak = 0;
    let nextPulseAt = performance.now() + 3000 + Math.random() * 2000;

    const connAge = new Map<number, number>();
    let lastTime = performance.now();

    // ── Animate ───────────────────────────────────────────────────
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const halfXY = SPREAD_XY / 2;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (now >= nextPulseAt) {
        pulseStart = now;
        pulseDuration = 2200 + Math.random() * 2600;
        pulsePeak = 0.35 + Math.random() * 0.2;
        nextPulseAt = now + 8000 + Math.random() * 12000;
      }

      if (now < pulseStart + pulseDuration) {
        const p = (now - pulseStart) / pulseDuration;
        pulseValue = Math.sin(Math.PI * p) * pulsePeak;
      } else {
        pulseValue *= 0.9;
      }
      dotMat.uniforms["uPulse"].value = pulseValue;

      // Move
      for (let li = 0; li < LAYERS.length; li++) {
        const layer = LAYERS[li];
        const [zMin, zMax] = layer.zRange;
        const zMid = (zMin + zMax) / 2;
        const halfZ = (zMax - zMin) / 2;
        const base = LAYERS.slice(0, li).reduce((s, l) => s + l.count, 0);

        for (let i = 0; i < layer.count; i++) {
          const gi = base + i;
          const gx = gi * 3,
            gy = gx + 1,
            gz = gx + 2;
          const pa = posAttr.array as Float32Array;

          pa[gx] += particles[gi].vx;
          pa[gy] += particles[gi].vy;
          pa[gz] += particles[gi].vz;

          if (pa[gx] > halfXY) pa[gx] = -halfXY;
          if (pa[gx] < -halfXY) pa[gx] = halfXY;
          if (pa[gy] > halfXY) pa[gy] = -halfXY;
          if (pa[gy] < -halfXY) pa[gy] = halfXY;
          if (pa[gz] > zMid + halfZ) pa[gz] = zMid - halfZ;
          if (pa[gz] < zMid - halfZ) pa[gz] = zMid + halfZ;
        }
      }
      posAttr.needsUpdate = true;

      // Connections — intra-layer only, quadratic fade, animated age
      const tc = THEME[curTheme];
      let seg = 0;
      const cc = new Uint8Array(TOTAL);
      const pa = posAttr.array as Float32Array;
      const activeKeys = new Set<number>();

      // Phase 1: detect in-range pairs within same/adjacent layers
      for (let i = 0; i < TOTAL; i++) {
        if (cc[i] >= MAX_CONN) continue;
        vA.set(pa[i * 3], pa[i * 3 + 1], pa[i * 3 + 2]);

        for (let j = i + 1; j < TOTAL; j++) {
          if (cc[i] >= MAX_CONN) break;
          if (cc[j] >= MAX_CONN) continue;
          if (Math.abs(layerOf[i] - layerOf[j]) > 1) continue;

          vB.set(pa[j * 3], pa[j * 3 + 1], pa[j * 3 + 2]);
          const d = vA.distanceTo(vB);
          if (d > CONN_DIST) continue;

          const key = i * TOTAL + j;
          activeKeys.add(key);
          const prev = connAge.get(key) ?? 0;
          connAge.set(key, Math.min(1, prev + dt * LINE_FADE_IN));
          cc[i]++;
          cc[j]++;
        }
      }

      // Phase 2: fade-out inactive connections + draw all with age > 0
      for (const [key, age] of connAge) {
        let drawAge = age;
        if (!activeKeys.has(key)) {
          drawAge = age - dt * LINE_FADE_OUT;
          if (drawAge <= 0) {
            connAge.delete(key);
            continue;
          }
          connAge.set(key, drawAge);
        }
        if (seg >= maxSeg) continue;

        const i = Math.floor(key / TOTAL);
        const j = key % TOTAL;
        vA.set(pa[i * 3], pa[i * 3 + 1], pa[i * 3 + 2]);
        vB.set(pa[j * 3], pa[j * 3 + 1], pa[j * 3 + 2]);
        const d = vA.distanceTo(vB);

        // Kill fading lines if particles jumped far (wrap-around).
        if (d > CONN_DIST * 2) {
          connAge.delete(key);
          continue;
        }

        const avgViewDepth = 18 - (vA.z + vB.z) * 0.5;
        const lineDepthFade =
          1 - THREE.MathUtils.smoothstep(avgViewDepth, 9, 30);
        const distFade = Math.pow(Math.max(1 - d / CONN_DIST, 0), 2) + 0.06;
        const a =
          distFade *
          tc.lineMax *
          THREE.MathUtils.lerp(0.1, 1, lineDepthFade) *
          drawAge;

        const base = seg * 6;
        lpAttr.array[base] = vA.x;
        lpAttr.array[base + 1] = vA.y;
        lpAttr.array[base + 2] = vA.z;
        lcAttr.array[base] = tc.lineR * a;
        lcAttr.array[base + 1] = tc.lineG * a;
        lcAttr.array[base + 2] = tc.lineB * a;
        lpAttr.array[base + 3] = vB.x;
        lpAttr.array[base + 4] = vB.y;
        lpAttr.array[base + 5] = vB.z;
        lcAttr.array[base + 3] = tc.lineR * a;
        lcAttr.array[base + 4] = tc.lineG * a;
        lcAttr.array[base + 5] = tc.lineB * a;
        seg++;
      }

      lineGeo.setDrawRange(0, seg * 2);
      lpAttr.needsUpdate = true;
      lcAttr.needsUpdate = true;

      // Camera parallax
      camera.position.x +=
        (mouseRef.current.x * 1.8 - camera.position.x) * MOUSE_STR;
      camera.position.y +=
        (-mouseRef.current.y * 1.2 - camera.position.y) * MOUSE_STR;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      obs.disconnect();
      dotGeo.dispose();
      dotMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      renderer.dispose();
    };
  }, [prefersReduced]);

  if (prefersReduced) return null;
  return (
    <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
  );
}
