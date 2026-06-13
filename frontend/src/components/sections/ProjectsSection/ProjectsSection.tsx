import { useState, type RefObject } from 'react';
import { motion } from 'framer-motion';
import { useProjects } from '../../../hooks/useProjects';
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

  const openRepo = (e: React.SyntheticEvent) => {
    // El "Ver repo" vive dentro del <a> de la fila: hay que frenar la navegación al sitio.
    e.preventDefault();
    e.stopPropagation();
    window.open(p.repoUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.indexRow}
      variants={fadeUp}
    >
      <span className={styles.rowNum}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className={styles.rowName}>
        {p.imageUrl && (
          <img src={resolveAssetUrl(p.imageUrl)} alt={p.imageAlt || p.name} className={styles.rowThumb} />
        )}
        <div>
          <span className={styles.projName}>
            {p.name}<span className={styles.ext}> .proj</span>
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
          <span
            className={styles.techMore}
            onMouseEnter={() => setTechsExpanded(true)}
            aria-label={`Mostrar ${hiddenCount} tecnología(s) más`}
          >
            +{hiddenCount}
          </span>
        )}
      </div>
      <div className={styles.rowYear}>
        <span>{relYear(p.createdAt)}</span>
        {p.repoUrl && (
          <span
            role="link"
            tabIndex={0}
            className={styles.verRepo}
            onClick={openRepo}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') openRepo(e); }}
            aria-label={`Ver repositorio de ${p.name} (abre en nueva pestaña)`}
          >
            Ver repo →
          </span>
        )}
      </div>
    </motion.a>
  );
}

export function ProjectsSection() {
  const { projects, loading, error, refetch } = useProjects();
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
        <span>─── FIN DEL LISTADO · {projects.length} REGISTRO(S) ───</span>
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
