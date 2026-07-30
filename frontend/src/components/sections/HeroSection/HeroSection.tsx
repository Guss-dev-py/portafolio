import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '../../../motion/hooks/useReducedMotion';
import type { WorkStatus } from '../../../api/status';
import { getWorkStatus } from '../../../api/status';
import styles from './HeroSection.module.css';

interface ScriptLine {
  type: 'cmd' | 'out' | 'out_h' | 'blank';
  text?: string;
  /** Ancla a la que navega la línea. Convierte el comando en un link real. */
  href?: string;
}

const STATUS_LINE: Record<WorkStatus, string> = {
  open:     '> open to work · freelance · full-time',
  working:  '> working · respondiendo con demoras · GMT-3',
  occupied: '> occupied · no disponible por ahora',
};

const STATUS_LABEL: Record<WorkStatus, string> = {
  open:     'Open to work',
  working:  'Working · con demoras',
  occupied: 'Occupied',
};

function buildScript(status: WorkStatus): ScriptLine[] {
  return [
    { type: 'cmd',   text: 'whoami' },
    { type: 'out',   text: 'augusto.freire - fullstack developer · buenos aires, ar' },
    { type: 'blank' },
    { type: 'cmd',   text: 'cat about.md | head -3' },
    { type: 'out',   text: '# Apasionado y entusiasta en todo lo que hago.' },
    { type: 'out',   text: '# Construyo productos digitales de punta a punta.' },
    { type: 'out',   text: '# Foco: sistemas limpios, escalables y con buena UX.' },
    { type: 'blank' },
    { type: 'cmd',   text: 'ls stack/' },
    { type: 'out_h', text: 'frontend/   backend/   data/   devops/' },
    { type: 'out',   text: 'react       node       postgres pg   docker' },
    { type: 'out',   text: 'typescript  express    zod           nginx' },
    { type: 'out',   text: 'vite        python                   linux' },
    { type: 'blank' },
    { type: 'cmd',   text: 'status' },
    { type: 'out_h', text: STATUS_LINE[status] },
    { type: 'out',   text: '> ubicación: buenos aires, AR (GMT-3)' },
    { type: 'out',   text: '> estudios:  ing. informática · UNPAZ' },
    { type: 'out',   text: '> focos:     fintech · saas b2b · ciberseguridad' },
    { type: 'blank' },
    { type: 'cmd',   text: 'contact --form', href: '#contacto' },
  ];
}

const DELAY_MAP: Record<string, number> = {
  cmd: 220,
  out: 90,
  out_h: 90,
  blank: 80,
};

/**
 * Tiempos del typewriter, uno por línea. Se derivan una vez del script porque
 * la secuencia de tipos —y con ella el largo y los tiempos— es idéntica en los
 * tres estados de trabajo: lo único que cambia es el TEXTO de la línea de
 * status. Agendar la animación desde acá y no desde el script vivo es lo que
 * permite que cambiar el estado desde el admin actualice esa línea en el lugar
 * en vez de re-tipear la terminal entera.
 *
 * Se deriva de `buildScript` en lugar de escribirse a mano para que no puedan
 * quedar desincronizados.
 */
const LINE_DELAYS: number[] = buildScript('open').map(l => DELAY_MAP[l.type] ?? 90);

function useTimestamp() {
  const [ts, setTs] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  });
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setTs(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  return ts;
}

export function HeroSection() {
  const reduced = useReducedMotion();
  const [workStatus, setWorkStatus] = useState<WorkStatus>('open');
  const script = buildScript(workStatus);
  const [visibleCount, setVisibleCount] = useState(reduced ? LINE_DELAYS.length : 0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timestamp = useTimestamp();

  useEffect(() => {
    const controller = new AbortController();
    getWorkStatus(controller.signal)
      .then((r) => setWorkStatus(r.status))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    // Los seteos de estado van siempre dentro de timers (nunca síncronos en
    // el cuerpo del effect) para no disparar renders en cascada.
    if (reduced) {
      timerRef.current = setTimeout(() => setVisibleCount(LINE_DELAYS.length), 0);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    let current = 0;
    const showNext = () => {
      if (current >= LINE_DELAYS.length) return;
      current++;
      setVisibleCount(current);
      timerRef.current = setTimeout(showNext, LINE_DELAYS[current - 1]);
    };
    timerRef.current = setTimeout(() => {
      setVisibleCount(0);
      timerRef.current = setTimeout(showNext, 300);
    }, 0);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // Ya no depende de `workStatus`: sólo del modo de movimiento reducido. El
    // `eslint-disable` que había acá tapaba justamente eso.
  }, [reduced]);

  const lines = script.slice(0, visibleCount);

  return (
    <section id="inicio" className={styles.section}>
      <div className={styles.grid}>
        <div className={styles.termBox}>
          <div className={styles.termHead}>
            <div className={styles.termDots}>
              <i className={styles.dot} />
              <i className={styles.dot} />
              <i className={`${styles.dot} ${styles.dotFilled}`} />
            </div>
            <span className={styles.termLabel}>augusto@portafolio:~$</span>
            <span className={styles.termSession}>SESSION · LIVE</span>
          </div>
          <div className={styles.termBody}>
            {lines.map((line, i) => {
              if (line.type === 'blank') return <div key={`blank-${i}`} className={styles.blankLine} />;
              return (
                <div key={`${line.type}-${i}`} className={`${styles.termLine} ${styles[line.type]}`}>
                  {line.type === 'cmd' && <span className={styles.prompt}>$ </span>}
                  {/* El hero no tenía ningún elemento interactivo: el comando final
                      es un link real al formulario, no texto que lo aparenta. */}
                  {line.href
                    ? <a href={line.href} className={styles.cmdLink}>{line.text}</a>
                    : <span>{line.text}</span>}
                </div>
              );
            })}
            <div className={styles.termLine}>
              <span className={styles.prompt}>$ </span>
              <span className={styles.cursor} />
            </div>
          </div>
          <div className={styles.termFooter}>
            <span>JetBrains Mono · UTF-8 · LF</span>
            <span>{timestamp}</span>
          </div>
        </div>

        <div className={styles.infoCol}>
          <h1 className={styles.nameBlock}>
            <span className={styles.nameLine1}>AUGUSTO</span>
            <span className={styles.nameLine2}><em>Freire.</em></span>
          </h1>

          <p className={styles.lede}>
            <em>FullStack Developer</em>. Construyo productos digitales de punta a punta con{' '}
            <span className={styles.tech}>Python</span>,{' '}
            <span className={styles.tech}>Node</span>,{' '}
            <span className={styles.tech}>React</span> y{' '}
            <span className={styles.tech}>PostgreSQL</span>.{' '}
            Foco en sistemas limpios y escalables.
          </p>

          <div className={styles.dataStrip}>
            <div className={styles.dataCell}>
              <span className={styles.dataKey}>STATUS</span>
              <span className={styles.dataVal}>
                <span className={`${styles.statusDot} ${styles[`statusDot_${workStatus}`]}`} />
                {STATUS_LABEL[workStatus]}
              </span>
            </div>
            <div className={styles.dataCell}>
              <span className={styles.dataKey}>UBICACIÓN</span>
              <span className={styles.dataVal}>Buenos Aires, AR</span>
            </div>
            <div className={styles.dataCell}>
              <span className={styles.dataKey}>FORMACIÓN</span>
              <span className={styles.dataVal}>Ing. Informática · UNPAZ</span>
            </div>
            <div className={styles.dataCell}>
              <span className={styles.dataKey}>SECTORES</span>
              <span className={styles.dataVal}>FinTech · SaaS · CiberSeg.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
