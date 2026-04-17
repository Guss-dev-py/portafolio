import { motion, type Variants } from 'framer-motion';
import type { SkillGroup } from '../../../types';
import { stagger } from '../../../motion/tokens';
import { fadeUp, slideInLeft, scaleIn, staggerContainer } from '../../../motion/variants';
import { useReducedMotion } from '../../../motion/hooks/useReducedMotion';
import { useInView } from '../../../motion/hooks/useInView';
import styles from './AboutSection.module.css';

interface AboutSectionProps {
  biography: string;
  goals: string;
  aspirationSector: string;
  skillGroups: SkillGroup[];
}

const NOOP: Variants = { hidden: {}, visible: {} };

const INTERESTS = ['FinTech', 'SaaS B2B', 'Ciberseguridad', 'Cloud Security', 'Pentesting'];

export function AboutSection({ biography, goals, skillGroups }: AboutSectionProps) {
  const prefersReduced = useReducedMotion();
  const { ref, isInView } = useInView();

  const animateState = isInView ? 'visible' : 'hidden';

  const heading      = prefersReduced ? NOOP : slideInLeft;
  const fadeUpVar    = prefersReduced ? NOOP : fadeUp;
  const scaleInVar   = prefersReduced ? NOOP : scaleIn;
  const slideLeft    = prefersReduced ? NOOP : slideInLeft;
  const bioContainer = prefersReduced ? NOOP : staggerContainer(stagger.loose);
  const tagContainer = prefersReduced ? NOOP : staggerContainer(stagger.tight);

  // Split biography into paragraphs; extract the quote (3rd paragraph)
  const paragraphs = biography.split('\n\n').filter(Boolean);
  const bioParagraphs = paragraphs.filter((_, i) => i !== 2);
  const quote = paragraphs[2];

  return (
    <section
      id="sobre-mi"
      className={styles.section}
      aria-label="Sobre mí"
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div className={styles.container}>
        <motion.p
          className={styles.eyebrow}
          variants={fadeUpVar}
          initial="hidden"
          animate={animateState}
        >
          // sobre mí
        </motion.p>

        <motion.h2
          className={styles.title}
          variants={heading}
          initial="hidden"
          animate={animateState}
        >
          Augusto Joaquín<br />Freire
        </motion.h2>

        <div className={styles.grid}>
          {/* Left: bio */}
          <motion.div
            className={styles.bio}
            variants={bioContainer}
            initial="hidden"
            animate={animateState}
          >
            {bioParagraphs.map((paragraph, i) => (
              <motion.p key={i} variants={fadeUpVar}>
                {paragraph}
              </motion.p>
            ))}
            {quote && (
              <motion.p className={styles.quote} variants={fadeUpVar}>
                {quote}
              </motion.p>
            )}
          </motion.div>

          {/* Right: sidebar */}
          <motion.div
            className={styles.sidebar}
            variants={bioContainer}
            initial="hidden"
            animate={animateState}
          >
            {/* Education */}
            <motion.div className={styles.block} variants={fadeUpVar}>
              <p className={styles.subtitle}>Educación</p>
              <p className={styles.eduTitle}>Ingeniería Informática</p>
              <p className={styles.eduSub}>Universidad Nacional de José C. Paz (UNPAZ) — En curso</p>
              <span className={styles.eduBadge}>Ingreso Top 18% · CIU 2026</span>
            </motion.div>

            {/* Goals */}
            <motion.div className={styles.block} variants={fadeUpVar}>
              <p className={styles.subtitle}>Objetivo</p>
              <p className={styles.blockText}>{goals}</p>
            </motion.div>

            {/* Interests */}
            <motion.div className={styles.block} variants={fadeUpVar}>
              <p className={styles.subtitle}>Áreas de interés</p>
              <motion.div
                className={styles.interestTags}
                variants={tagContainer}
                initial="hidden"
                animate={animateState}
              >
                {INTERESTS.map((tag) => (
                  <motion.span key={tag} className={styles.interestTag} variants={scaleInVar}>
                    {tag}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>

            {/* Skills */}
            <motion.div className={styles.block} variants={fadeUpVar}>
              <p className={styles.subtitle}>Stack técnico</p>
              <motion.div
                className={styles.skillGroups}
                variants={bioContainer}
                initial="hidden"
                animate={animateState}
              >
                {skillGroups.map((group) => (
                  <motion.div key={group.category} className={styles.skillGroup} variants={slideLeft}>
                    <span className={styles.groupLabel}>{group.category}</span>
                    <motion.div
                      className={styles.tags}
                      variants={tagContainer}
                      initial="hidden"
                      animate={animateState}
                    >
                      {group.skills.map((s) => (
                        <motion.span key={s.name} className={styles.tag} variants={scaleInVar}>
                          {s.name}
                        </motion.span>
                      ))}
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
