import { useState, type RefObject } from 'react';
import { motion } from 'framer-motion';
import { useProjects } from '../../../hooks/useProjects';
import { useProjectsJsonLd } from '../../../hooks/useProjectsJsonLd';
import { useInView } from '../../../motion/hooks/useInView';
import { useReducedMotion } from '../../../motion/hooks/useReducedMotion';
import { fadeUp, staggerContainer } from '../../../motion/variants';
import { duration, ease, stagger, offset } from '../../../motion/tokens';
import { resolveAssetUrl } from '../../../api/client';
import type { Project } from '../../../types';
import styles from './ProjectsSection.module.css';

const VISIBLE_TECHS = 3;

function relYear(iso: string): string {
  const y = new Date(iso).getFullYear();
  return isNaN(y) ? '—' : y.toString();
}

function ProjectRow({ project: p, index }: { project: Project; index: number }) {
  const [techsExpanded, setTechsExpanded] = useState(false);
  const reduced = useReducedMotion();
  const hiddenCount = p.technologies.length - VISIBLE_TECHS;
  const visibleTechs = techsExpanded ? p.technologies : p.technologies.slice(0, VISIBLE_TECHS);

  return (
    // La fila era un <a> con un <button> y un <span role="link"> adentro:
    // interactivos anidados dentro de un link, que es HTML inválido y deja a un
    // lector de pantalla sin saber qué está activando. Ahora la fila es un
    // contenedor y el link real es el nombre del proyecto, estirado por CSS
    // para cubrirla entera (`.rowLink::after`). La fila entera sigue siendo
    // clickeable y las acciones propias viven por encima del área estirada.
    <motion.div className={styles.indexRow} variants={fadeUp}>
      <span className={styles.rowNum}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className={styles.rowName}>
        {p.imageUrl && (
          // La sección está debajo del fold, así que la miniatura se difiere;
          // `decoding="async"` evita que el decodificado bloquee el hilo
          // principal. width/height explícitos aunque el CSS ya fija 60×60:
          // si el CSS tarda, el navegador igual reserva la caja.
          <img
            src={resolveAssetUrl(p.imageUrl)}
            alt={p.imageAlt || p.name}
            className={styles.rowThumb}
            width={60}
            height={60}
            loading="lazy"
            decoding="async"
          />
        )}
        <div>
          <span className={styles.projName}>
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.rowLink}
            >
              {p.name}
            </a><span className={styles.ext}> .proj</span>
          </span>
          <span className={styles.projDesc}>{p.description}</span>
        </div>
      </div>
      <div className={styles.rowTech} onMouseLeave={() => setTechsExpanded(false)}>
        {visibleTechs.map((t, ti) => (
          <motion.span
            key={t}
            className={styles.techChip}
            // Solo los chips revelados por el "+N" entran animados; los siempre
            // visibles no deben re-animarse en cada expansión.
            initial={ti >= VISIBLE_TECHS && !reduced
              ? { opacity: 0, transform: `translateX(-${offset.subtle}px) scale(0.9)` }
              : false}
            animate={{ opacity: 1, transform: 'translateX(0px) scale(1)' }}
            transition={{
              duration: duration.base,
              ease: ease.smooth,
              delay: (ti - VISIBLE_TECHS) * stagger.base,
            }}
          >
            {t}
          </motion.span>
        ))}
        {!techsExpanded && hiddenCount > 0 && (
          <button
            type="button"
            className={styles.techMore}
            onMouseEnter={() => setTechsExpanded(true)}
            onClick={() => setTechsExpanded(true)}
            aria-expanded={techsExpanded}
            aria-label={`Mostrar ${hiddenCount} tecnología${hiddenCount === 1 ? '' : 's'} más`}
          >
            +{hiddenCount}
          </button>
        )}
      </div>
      <div className={styles.rowYear}>
        <span>{relYear(p.createdAt)}</span>
        {p.repoUrl && (
          <a
            href={p.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.verRepo}
            aria-label={`Ver repositorio de ${p.name} (abre en nueva pestaña)`}
          >
            Ver repo →
          </a>
        )}
      </div>
    </motion.div>
  );
}

export function ProjectsSection() {
  const { projects, loading, error, refetch } = useProjects();
  // El structured data de proyectos se emite desde acá porque acá están los
  // datos vivos. Ver el docblock de useProjectsJsonLd.
  useProjectsJsonLd(projects);
  const reduced = useReducedMotion();
  const { ref, isInView } = useInView();
  const animate = reduced || isInView ? 'visible' : 'hidden';

  return (
    <section id="proyectos" className={styles.section} aria-label="Proyectos" ref={ref as RefObject<HTMLElement>}>
      <motion.div
        className={styles.sectionHead}
        variants={fadeUp}
        initial="hidden"
        animate={animate}
      >
        <span className={styles.num}>02</span>
        <h2 className={styles.title}><span className={styles.sym}>//</span> proyectos</h2>
      </motion.div>

      {loading && (
        <div className={styles.skeletonList}>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.skeletonRow}>
              <span className={styles.skeletonNum} />
              <div className={styles.skeletonName}>
                <span className={styles.skeletonBar} style={{ width: '40%' }} />
                <span className={styles.skeletonBar} style={{ width: '65%' }} />
              </div>
              <div className={styles.skeletonTech}>
                <span className={styles.skeletonChip} />
                <span className={styles.skeletonChip} />
              </div>
              <span className={styles.skeletonBar} style={{ width: '32px' }} />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className={styles.emptyState} role="alert">
          <span className={styles.emptyIcon}>[!]</span>
          <p className={styles.emptyTitle}>No pude cargar el índice de proyectos.</p>
          <p className={styles.emptyHint}>
            <button type="button" className={styles.retryBtn} onClick={refetch}>
              Reintentar
            </button>
            {' '}o vé directo a{' '}
            <a href="https://github.com/Guss-dev-py" target="_blank" rel="noopener noreferrer">
              github.com/Guss-dev-py →
            </a>
          </p>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <motion.div
          className={styles.indexList}
          variants={staggerContainer(0.08, 0.1)}
          initial="hidden"
          animate={animate}
        >
          <div className={styles.indexHeader}>
            <span>#</span>
            <span>Nombre</span>
            <span>Tecnologías</span>
            <span>Año</span>
          </div>
          {projects.map((p, i) => (
            <ProjectRow key={p.id} project={p} index={i} />
          ))}
        </motion.div>
      )}

      {!loading && !error && projects.length === 0 && (
        <motion.div
          className={styles.emptyState}
          variants={fadeUp}
          initial="hidden"
          animate={animate}
        >
          <span className={styles.emptyIcon}>[ ]</span>
          <p className={styles.emptyTitle}>Sin proyectos cargados aún.</p>
          <p className={styles.emptyHint}>
            Mientras tanto, podés ver todo mi trabajo en{' '}
            <a href="https://github.com/Guss-dev-py" target="_blank" rel="noopener noreferrer">
              github.com/Guss-dev-py →
            </a>
          </p>
        </motion.div>
      )}

      <div className={styles.listFooter}>
        {/* Decía "REGISTRO(S)". El plural con paréntesis es de formulario de
            papel, no de una pieza editorial que cuida la tipografía. */}
        <span>
          ─── FIN DEL LISTADO · {projects.length}{' '}
          {projects.length === 1 ? 'REGISTRO' : 'REGISTROS'} ───
        </span>
        <a
          href="https://github.com/Guss-dev-py"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubLink}
        >
          ver todo en github →
        </a>
      </div>
    </section>
  );
}
