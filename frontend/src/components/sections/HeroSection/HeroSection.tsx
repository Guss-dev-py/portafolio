import { motion, type Variants } from 'framer-motion';
import type { SkillTag } from '../../../types';
import { spring, stagger } from '../../../motion/tokens';
import { fadeUp, cinematicFadeUp, scaleIn, staggerContainer } from '../../../motion/variants';
import { useReducedMotion } from '../../../motion/hooks/useReducedMotion';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  name: string;
  lastName: string;
  role: string;
  intro: string;
  skills: SkillTag[];
  onCtaClick: () => void;
}

const NOOP: Variants = { hidden: {}, visible: {} };

export function HeroSection({ name, lastName, role, intro, onCtaClick, skills }: HeroSectionProps) {
  const prefersReduced = useReducedMotion();

  const resolvedFadeUp = prefersReduced ? NOOP : fadeUp;
  const resolvedCinematicFadeUp = prefersReduced ? NOOP : cinematicFadeUp;
  const resolvedScaleIn = prefersReduced ? NOOP : scaleIn;
  const resolvedStaggerAll = prefersReduced ? NOOP : staggerContainer();
  const resolvedStaggerSkills = prefersReduced ? NOOP : staggerContainer(stagger.tight, 0.55);

  return (
    <section id="inicio" className={styles.section} aria-label="Inicio">
      <motion.div
        className={styles.content}
        variants={resolvedStaggerAll}
        initial="hidden"
        animate="visible"
      >
        <motion.p
          className={styles.greeting}
          variants={resolvedFadeUp}
          transition={{ delay: 0.10 }}
        >
          Hola, soy
        </motion.p>

        <motion.h1
          className={styles.name}
          variants={resolvedCinematicFadeUp}
          transition={{ delay: 0.20 }}
        >
          {name} {lastName}
        </motion.h1>

        <motion.p
          className={styles.role}
          variants={resolvedFadeUp}
          transition={{ delay: 0.35 }}
        >
          {role}
        </motion.p>

        <motion.p
          className={styles.intro}
          variants={resolvedFadeUp}
          transition={{ delay: 0.45 }}
        >
          {intro}
        </motion.p>

        <motion.div
          className={styles.skills}
          aria-label="Tecnologías principales"
          variants={resolvedStaggerSkills}
        >
          {skills.map((s) => (
            <motion.span key={s.name} className={styles.skillTag} variants={resolvedScaleIn}>
              {s.name}
            </motion.span>
          ))}
        </motion.div>

        <motion.button
          type="button"
          className={styles.cta}
          onClick={onCtaClick}
          variants={resolvedFadeUp}
          transition={{ delay: 0.75 }}
          whileHover={prefersReduced ? {} : { y: -3, scale: 1.02, transition: spring.gentle }}
          whileTap={prefersReduced ? {} : { scale: 0.97, transition: spring.press }}
        >
          Ver mis proyectos
        </motion.button>
      </motion.div>
    </section>
  );
}
