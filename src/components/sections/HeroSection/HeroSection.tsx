import type { SkillTag } from '../../../types';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  name: string;
  lastName: string;
  role: string;
  intro: string;
  skills: SkillTag[];
  onCtaClick: () => void;
}

export function HeroSection({ name, lastName, role, intro, onCtaClick, skills }: HeroSectionProps) {
  const displayIntro = intro.slice(0, 160);

  return (
    <section id="inicio" className={styles.section} aria-label="Inicio">
      <div className={styles.content}>
        <p className={styles.greeting}>Hola, soy</p>
        <h1 className={styles.name}>{name} {lastName}</h1>
        <p className={styles.role}>{role}</p>
        <p className={styles.intro}>{displayIntro}</p>
        <div className={styles.skills} aria-label="Tecnologías principales">
          {skills.map((s) => (
            <span key={s.name} className={styles.skillTag}>{s.name}</span>
          ))}
        </div>
        <button type="button" className={styles.cta} onClick={onCtaClick}>
          Ver mis proyectos
        </button>
      </div>
    </section>
  );
}
