import type { RefObject } from 'react';
import { motion } from 'framer-motion';
import { skillGroups } from '../../../data/skills';
import { useInView } from '../../../motion/hooks/useInView';
import { useReducedMotion } from '../../../motion/hooks/useReducedMotion';
import { fadeUp, slideInLeft, staggerContainer, scaleIn } from '../../../motion/variants';
import styles from './AboutSection.module.css';

const totalSkills = skillGroups.reduce((acc, g) => acc + g.skills.length, 0);

export function AboutSection() {
  const reduced = useReducedMotion();
  const { ref, isInView } = useInView();
  const animate = reduced || isInView ? 'visible' : 'hidden';

  return (
    <section id="sobre" className={styles.section} aria-label="Sobre mí" ref={ref as RefObject<HTMLElement>}>
      <motion.div
        className={styles.sectionHead}
        variants={fadeUp}
        initial="hidden"
        animate={animate}
      >
        <span className={styles.num}>01</span>
        <h2 className={styles.title}><span className={styles.sym}>//</span> sobre<span className={styles.sym}>.</span>mí</h2>
      </motion.div>

      <div className={styles.aboutGrid}>
        {/* Left: Bio paragraphs */}
        <motion.div
          className={styles.bioCol}
          variants={staggerContainer(0.12, 0.1)}
          initial="hidden"
          animate={animate}
        >
          <motion.p className={styles.bioPara} variants={fadeUp}>
            ¡Hola! Soy <strong>apasionado y entusiasta</strong> en todo lo que hago. Siempre estoy buscando nuevos desafíos y herramientas para perfeccionarme en mi carrera profesional y proyectos personales.
          </motion.p>
          <motion.p className={styles.bioPara} variants={fadeUp}>
            Me destaco por mi capacidad de adaptación, resolución de problemas y trabajo bajo presión. Tengo experiencia manejando situaciones complejas con clientes y operando con precisión en <em>contextos dinámicos</em>.
          </motion.p>
          <motion.p className={styles.bioPara} variants={fadeUp}>
            Actualmente curso <strong>Ingeniería Informática en UNPAZ</strong>, incorporando un enfoque analítico y facilidad para el uso de sistemas. Busco desarrollarme en entornos donde pueda aprender, asumir responsabilidades y seguir construyendo experiencia profesional.
          </motion.p>
        </motion.div>

        {/* Right: Meta blocks */}
        <motion.div
          className={styles.metaCol}
          variants={staggerContainer(0.15, 0.2)}
          initial="hidden"
          animate={animate}
        >
          <motion.div className={styles.metaBlock} variants={slideInLeft}>
            <div className={styles.mbHead}>
              <span><span className={styles.sym}>//</span> objetivos</span>
              <span>2026 →</span>
            </div>
            <div className={styles.mbBody}>
              <span className={styles.mbBodyText}>
                Seguir creciendo como desarrollador, contribuir a proyectos de impacto real y eventualmente liderar equipos técnicos en entornos ágiles.
              </span>
            </div>
          </motion.div>

          <motion.div className={styles.metaBlock} variants={slideInLeft}>
            <div className={styles.mbHead}>
              <span><span className={styles.sym}>//</span> stack</span>
              <span>{totalSkills} herramientas</span>
            </div>
            <div className={styles.mbBody}>
              {skillGroups.map(group => (
                <div key={group.category} className={styles.srRow}>
                  <span className={styles.srK}>{group.category}</span>
                  <motion.div
                    className={styles.srV}
                    variants={staggerContainer(0.06)}
                    initial="hidden"
                    animate={animate}
                  >
                    {group.skills.map(s => (
                      <motion.span key={s.name} className={styles.srTag} variants={scaleIn}>{s.name}</motion.span>
                    ))}
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className={styles.metaBlock} variants={slideInLeft}>
            <div className={styles.mbHead}>
              <span><span className={styles.sym}>//</span> sectores de interés</span>
              <span>★</span>
            </div>
            <div className={styles.mbBody}>
              <span className={styles.mbBodyText}>
                Tecnología financiera (FinTech), productos SaaS B2B y Ciberseguridad (Secure APIs, Cloud Security, Pentesting).
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
