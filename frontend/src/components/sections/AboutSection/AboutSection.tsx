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
            Mi interés por la programación nació con mis primeros ejercicios en Python. Lo que comenzó como curiosidad rápidamente se convirtió en el deseo de comprender cómo se construyen las herramientas digitales que utilizamos todos los días. Descubrir que podía transformar una idea en un programa, una aplicación web o un sistema completo fue lo que me impulsó a seguir aprendiendo y a interesarme también por áreas como la ciberseguridad.
          </motion.p>
          <motion.p className={styles.bioPara} variants={fadeUp}>
            Actualmente curso el segundo año de <strong>Ingeniería Informática en la UNPAZ</strong> y desarrollo proyectos full stack, tiendas de comercio electrónico y sistemas adaptados a necesidades específicas. Trabajo con tecnologías como React, TypeScript, Node.js, Express, Python y PostgreSQL, complementándolas con herramientas de infraestructura como Docker, Nginx y Linux. Lo que más disfruto del desarrollo es aplicar la creatividad dentro de un proceso técnico para convertir una necesidad abstracta en una solución real, funcional y útil para quien la utiliza.
          </motion.p>
          <motion.p className={styles.bioPara} variants={fadeUp}>
            Fuera de la tecnología, disfruto de la pesca, el trekking, la música, tocar la guitarra y compartir un mate. También intento mantener un equilibrio entre la universidad, mis proyectos, el gimnasio y el tiempo con amigos. Mi objetivo profesional es continuar creciendo como desarrollador, especializarme en <strong>ciberseguridad</strong> y participar en proyectos de gran escala dentro de una empresa donde pueda asumir desafíos cada vez más complejos.
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
                Continuar creciendo como desarrollador, especializarme en ciberseguridad y participar en proyectos de gran escala dentro de una empresa donde pueda asumir desafíos cada vez más complejos.
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
