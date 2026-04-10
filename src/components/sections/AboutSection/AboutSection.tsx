import { motion } from 'framer-motion';
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

const noOp = { hidden: {}, visible: {} };

export function AboutSection({ biography, goals, aspirationSector, skillGroups }: AboutSectionProps) {
  const prefersReduced = useReducedMotion();
  const { ref, isInView } = useInView();

  const animateState = isInView ? 'visible' : 'hidden';

  const heading    = prefersReduced ? noOp : slideInLeft;
  const fadeUpVar  = prefersReduced ? noOp : fadeUp;
  const scaleInVar = prefersReduced ? noOp : scaleIn;
  const slideLeft  = prefersReduced ? noOp : slideInLeft;

  const bioContainer      = prefersReduced ? noOp : staggerContainer(stagger.loose);
  const blocksContainer   = prefersReduced ? noOp : staggerContainer(stagger.loose);
  const skillRowContainer = prefersReduced ? noOp : staggerContainer(stagger.loose);
  const tagContainer      = prefersReduced ? noOp : staggerContainer(stagger.tight);

  return (
    <section
      id="sobre-mi"
      className={styles.section}
      aria-label="Sobre mí"
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div className={styles.container}>
        <motion.h2
          className={styles.title}
          variants={heading}
          initial="hidden"
          animate={animateState}
        >
          Sobre mí
        </motion.h2>

        <motion.div
          className={styles.bio}
          variants={bioContainer}
          initial="hidden"
          animate={animateState}
        >
          {biography.split('\n\n').map((paragraph, i) => (
            <motion.p key={i} variants={fadeUpVar}>
              {paragraph}
            </motion.p>
          ))}
        </motion.div>

        <motion.div
          variants={blocksContainer}
          initial="hidden"
          animate={animateState}
        >
          <motion.div className={styles.block} variants={fadeUpVar}>
            <h3 className={styles.subtitle}>Metas profesionales</h3>
            <p>{goals}</p>
          </motion.div>

          <motion.div className={styles.block} variants={fadeUpVar}>
            <h3 className={styles.subtitle}>Sector al que aspiro</h3>
            <p className={styles.sector}>{aspirationSector}</p>
          </motion.div>

          <motion.div className={styles.block} variants={fadeUpVar}>
            <h3 className={styles.subtitle}>Habilidades técnicas</h3>
            <motion.div
              className={styles.skillGroups}
              variants={skillRowContainer}
              initial="hidden"
              animate={animateState}
            >
              {skillGroups.map((group) => (
                <motion.div
                  key={group.category}
                  className={styles.skillGroup}
                  variants={slideLeft}
                >
                  <span className={styles.groupLabel}>{group.category}</span>
                  <motion.div
                    className={styles.tags}
                    variants={tagContainer}
                    initial="hidden"
                    animate={animateState}
                  >
                    {group.skills.map((s) => (
                      <motion.span
                        key={s.name}
                        className={styles.tag}
                        variants={scaleInVar}
                      >
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
    </section>
  );
}
