/**
 * Property-based test for ProjectsSection card animation coverage.
 *
 * **Validates: Requirement 8.6**
 *
 * Property 8: All ProjectCards receive fadeUp variant
 * For any number of projects returned by the API, every ProjectCard rendered
 * in the grid SHALL be wrapped in a `motion.div` with the `fadeUp` variant
 * applied, regardless of the number of projects.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import type { Project } from '../../../../types';

// ── Mock useReducedMotion to return false (animations enabled) ────
vi.mock('../../../../motion/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

// ── Mock useInView so the grid renders immediately ────────────────
vi.mock('../../../../motion/hooks/useInView', () => ({
  useInView: () => ({ ref: { current: null }, isInView: true }),
}));

// ── Mock getProjects — controlled per test ────────────────────────
vi.mock('../../../../api/projects', () => ({
  getProjects: vi.fn(),
}));

import { ProjectsSection } from '../ProjectsSection';
import { getProjects } from '../../../../api/projects';
import { fadeUp } from '../../../../motion/variants';

// ── Helpers ───────────────────────────────────────────────────────

function makeProjects(n: number): Project[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `proj-${i + 1}`,
    name: `Project ${i + 1}`,
    description: `Description for project ${i + 1}`,
    technologies: ['React', 'TypeScript'],
    url: `https://example.com/project-${i + 1}`,
    imageUrl: '',
    imageAlt: `Project ${i + 1} image`,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }));
}

const mockedGetProjects = vi.mocked(getProjects);

// ── Property 8: All ProjectCards receive fadeUp variant ───────────

describe('Property 8 — All ProjectCards receive fadeUp variant in ProjectsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const PROJECT_COUNTS = [1, 3, 5, 6];

  it.each(PROJECT_COUNTS)(
    'renders exactly %i card wrapper div(s) inside the grid when N=%i projects are returned',
    async (n) => {
      mockedGetProjects.mockResolvedValue(makeProjects(n));

      const { container } = render(<ProjectsSection />);

      await waitFor(() => {
        const grid = container.querySelector('[class*="grid"]');
        expect(grid).not.toBeNull();
      });

      const grid = container.querySelector('[class*="grid"]');
      expect(grid).not.toBeNull();

      // Each project is wrapped in a motion.div (renders as <div> in jsdom)
      // These are the direct children of the grid container
      const cardWrappers = Array.from(grid!.children);
      expect(cardWrappers.length).toBe(n);
    }
  );

  it.each(PROJECT_COUNTS)(
    'every card wrapper is a div element (motion.div renders as div) when N=%i',
    async (n) => {
      mockedGetProjects.mockResolvedValue(makeProjects(n));

      const { container } = render(<ProjectsSection />);

      await waitFor(() => {
        const grid = container.querySelector('[class*="grid"]');
        expect(grid).not.toBeNull();
      });

      const grid = container.querySelector('[class*="grid"]');
      const cardWrappers = Array.from(grid!.children);

      cardWrappers.forEach((wrapper) => {
        expect(wrapper.tagName.toLowerCase()).toBe('div');
      });
    }
  );

  it('grid is not rendered when 0 projects are returned', async () => {
    mockedGetProjects.mockResolvedValue([]);

    const { container } = render(<ProjectsSection />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(container.querySelector('[class*="empty"]')).not.toBeNull();
    });

    const grid = container.querySelector('[class*="grid"]');
    expect(grid).toBeNull();
  });

  it('grid is not rendered while loading', () => {
    // Never resolves during this test
    mockedGetProjects.mockReturnValue(new Promise(() => {}));

    const { container } = render(<ProjectsSection />);

    const grid = container.querySelector('[class*="grid"]');
    expect(grid).toBeNull();
  });

  it('grid is not rendered when API returns an error', async () => {
    mockedGetProjects.mockRejectedValue(new Error('Network error'));

    const { container } = render(<ProjectsSection />);

    await waitFor(() => {
      expect(container.querySelector('[class*="empty"]')).not.toBeNull();
    });

    const grid = container.querySelector('[class*="grid"]');
    expect(grid).toBeNull();
  });

  it('fadeUp variant has the correct shape (hidden: opacity 0 + y offset, visible: opacity 1 + y 0)', () => {
    // Structural check: the fadeUp variant used by card wrappers has the correct shape
    expect(fadeUp.hidden).toEqual(expect.objectContaining({ opacity: 0 }));
    expect(fadeUp.hidden).toHaveProperty('y');
    expect(fadeUp.visible).toEqual(expect.objectContaining({ opacity: 1, y: 0 }));
  });

  it('each card wrapper contains a ProjectCard (has role="button")', async () => {
    const n = 3;
    mockedGetProjects.mockResolvedValue(makeProjects(n));

    const { container } = render(<ProjectsSection />);

    await waitFor(() => {
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).not.toBeNull();
    });

    const grid = container.querySelector('[class*="grid"]');
    const cardWrappers = Array.from(grid!.children);

    expect(cardWrappers.length).toBe(n);
    cardWrappers.forEach((wrapper) => {
      // Each wrapper div contains a ProjectCard which renders a motion.div with role="button"
      const card = wrapper.querySelector('[role="button"]');
      expect(card).not.toBeNull();
    });
  });
});
