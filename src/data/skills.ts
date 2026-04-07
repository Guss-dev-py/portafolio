import type { SkillGroup } from '../types';

export const skillGroups: SkillGroup[] = [
  {
    category: 'Frontend',
    skills: [
      { name: 'React', category: 'frontend' },
      { name: 'JavaScript', category: 'frontend' },
      { name: 'HTML5', category: 'frontend' },
      { name: 'CSS3', category: 'frontend' },
    ],
  },
  {
    category: 'Backend',
    skills: [
      { name: 'Python', category: 'backend' },
      { name: 'Node.js', category: 'backend' },
      { name: 'Express.js', category: 'backend' },
      { name: 'Django', category: 'backend' },
      { name: 'MongoDB', category: 'backend' },
      { name: 'PostgreSQL', category: 'backend' },
    ],
  },
  {
    category: 'Herramientas',
    skills: [
      { name: 'Linux', category: 'herramientas' },
      { name: 'Git', category: 'herramientas' },
      { name: 'APIs REST', category: 'herramientas' },
      { name: 'Cloud', category: 'herramientas' },
    ],
  },
];

export const heroSkills = skillGroups.flatMap((g) => g.skills).slice(0, 5);
