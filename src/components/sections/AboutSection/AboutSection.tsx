import type { SkillGroup } from '../../../types';
import styles from './AboutSection.module.css';

interface AboutSectionProps {
  biography: string;
  goals: string;
  aspirationSector: string;
  skillGroups: SkillGroup[];
}

export function AboutSection({ biography, goals, aspirationSector, skillGroups }: AboutSectionProps) {
  return (
    <section id="sobre-mi" className={styles.section} aria-label="Sobre mí">
      <div className={styles.container}>
        <h2 className={styles.title}>Sobre mí</h2>

        <div className={styles.bio}>
          {biography.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <div className={styles.block}>
          <h3 className={styles.subtitle}>Metas profesionales</h3>
          <p>{goals}</p>
        </div>

        <div className={styles.block}>
          <h3 className={styles.subtitle}>Sector al que aspiro</h3>
          <p className={styles.sector}>{aspirationSector}</p>
        </div>

        <div className={styles.block}>
          <h3 className={styles.subtitle}>Habilidades técnicas</h3>
          <div className={styles.skillGroups}>
            {skillGroups.map((group) => (
              <div key={group.category} className={styles.skillGroup}>
                <span className={styles.groupLabel}>{group.category}</span>
                <div className={styles.tags}>
                  {group.skills.map((s) => (
                    <span key={s.name} className={styles.tag}>{s.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
