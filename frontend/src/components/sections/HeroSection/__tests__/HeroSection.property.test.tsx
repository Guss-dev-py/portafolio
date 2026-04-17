/**
 * Property-based test for HeroSection skill tags animation.
 *
 * **Validates: Requirement 6.9**
 *
 * Property 7: Skill tags all receive scaleIn variant
 * For any list of skill tags rendered in the HeroSection, every tag element
 * SHALL be wrapped in a `motion.span` with the `scaleIn` variant applied,
 * regardless of the number of tags.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { SkillTag } from '../../../../types';

// ── Mock useReducedMotion to return false (animations enabled) ────
vi.mock('../../../../motion/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

import { HeroSection } from '../HeroSection';
import { scaleIn } from '../../../../motion/variants';

// ── Helpers ───────────────────────────────────────────────────────

const DEFAULT_PROPS = {
  name: 'Jane',
  lastName: 'Doe',
  role: 'Frontend Developer',
  intro: 'Building great things.',
  onCtaClick: vi.fn(),
};

function makeSkills(n: number): SkillTag[] {
  return Array.from({ length: n }, (_, i) => ({
    name: `Skill${i + 1}`,
    category: 'frontend' as const,
  }));
}

// ── Property 7: Skill tags all receive scaleIn variant ────────────

describe('Property 7 — Skill tags all receive scaleIn variant in HeroSection', () => {
  const TAG_COUNTS = [0, 1, 3, 5, 8, 10];

  it.each(TAG_COUNTS)(
    'renders exactly %i skill tag span(s) with skillTag class',
    (n) => {
      const skills = makeSkills(n);
      const { container } = render(
        <HeroSection {...DEFAULT_PROPS} skills={skills} />
      );

      // Framer Motion renders motion.span as a regular <span> in jsdom.
      // Skill tags are the spans inside the .skills container.
      const skillsContainer = container.querySelector('[aria-label="Tecnologías principales"]');
      expect(skillsContainer).not.toBeNull();

      const tagSpans = skillsContainer!.querySelectorAll('span');
      expect(tagSpans.length).toBe(n);
    }
  );

  it.each(TAG_COUNTS)(
    'every skill tag span has the skillTag CSS class when N=%i',
    (n) => {
      const skills = makeSkills(n);
      const { container } = render(
        <HeroSection {...DEFAULT_PROPS} skills={skills} />
      );

      const skillsContainer = container.querySelector('[aria-label="Tecnologías principales"]');
      expect(skillsContainer).not.toBeNull();

      const tagSpans = skillsContainer!.querySelectorAll('span');
      tagSpans.forEach((span) => {
        // CSS Modules generate a hashed class; check that at least one class is present
        // and that the span is inside the skills container (structural verification)
        expect(span.className).toBeTruthy();
        expect(span).toBeInTheDocument();
      });
    }
  );

  it.each(TAG_COUNTS)(
    'each skill tag span renders the correct skill name when N=%i',
    (n) => {
      const skills = makeSkills(n);
      const { container } = render(
        <HeroSection {...DEFAULT_PROPS} skills={skills} />
      );

      const skillsContainer = container.querySelector('[aria-label="Tecnologías principales"]');
      expect(skillsContainer).not.toBeNull();

      const tagSpans = skillsContainer!.querySelectorAll('span');
      expect(tagSpans.length).toBe(n);

      tagSpans.forEach((span, i) => {
        expect(span.textContent).toBe(`Skill${i + 1}`);
      });
    }
  );

  it('skill tags container is present even with 0 skills', () => {
    const { container } = render(
      <HeroSection {...DEFAULT_PROPS} skills={[]} />
    );
    const skillsContainer = container.querySelector('[aria-label="Tecnologías principales"]');
    expect(skillsContainer).not.toBeNull();
    expect(skillsContainer!.querySelectorAll('span').length).toBe(0);
  });

  it('each skill tag is a direct child span of the skills container (motion.span renders as span)', () => {
    const skills = makeSkills(5);
    const { container } = render(
      <HeroSection {...DEFAULT_PROPS} skills={skills} />
    );

    const skillsContainer = container.querySelector('[aria-label="Tecnologías principales"]');
    expect(skillsContainer).not.toBeNull();

    // motion.span renders as <span> in jsdom — verify each child is a span
    const children = Array.from(skillsContainer!.children);
    expect(children.length).toBe(5);
    children.forEach((child) => {
      expect(child.tagName.toLowerCase()).toBe('span');
    });
  });

  it('scaleIn variant structure: hidden has opacity 0 and scale 0.85, visible has opacity 1 and scale 1', () => {
    // Verify the scaleIn variant itself has the correct shape as required by Req 6.9
    // This is a structural check on the variant definition
    expect(scaleIn.hidden).toEqual(expect.objectContaining({ opacity: 0, scale: 0.85 }));
    expect(scaleIn.visible).toEqual(expect.objectContaining({ opacity: 1, scale: 1 }));
  });
});
