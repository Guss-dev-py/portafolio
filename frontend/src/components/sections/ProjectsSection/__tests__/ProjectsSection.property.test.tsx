/**
 * Property-based test for ProjectsSection index list rendering.
 *
 * **Validates: Requirement 8.6**
 *
 * Property 8: All projects render as index rows in ProjectsSection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { Project } from '../../../../types';

// ── Mock useReducedMotion to return false (animations enabled) ────
vi.mock('../../../../motion/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

// ── Mock useProjects hook ─────────────────────────────────────────
vi.mock('../../../../hooks/useProjects', () => ({
  useProjects: vi.fn(),
}));

import { ProjectsSection } from '../ProjectsSection';
import { useProjects } from '../../../../hooks/useProjects';
import { fadeUp } from '../../../../motion/variants';

// ── Helpers ───────────────────────────────────────────────────────

function makeProjects(n: number): Project[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `proj-${i + 1}`,
    name: `Project ${i + 1}`,
    description: `Description for project ${i + 1}`,
    technologies: ['React', 'TypeScript'],
    url: `https://example.com/project-${i + 1}`,
    repoUrl: `https://github.com/example/project-${i + 1}`,
    imageUrl: '',
    imageAlt: `Project ${i + 1} image`,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  }));
}

const mockedUseProjects = vi.mocked(useProjects);

// ── Property 8: All projects render as index rows ─────────────────

describe('Property 8 — All projects render as index rows in ProjectsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const PROJECT_COUNTS = [1, 3, 5, 6];

  it.each(PROJECT_COUNTS)(
    'renders exactly %i row(s) inside the index list when N=%i projects are returned',
    (n) => {
      mockedUseProjects.mockReturnValue({
        projects: makeProjects(n),
        loading: false,
        error: null,
        refetch: vi.fn(),
        addProject: vi.fn(),
        editProject: vi.fn(),
        removeProject: vi.fn(),
      });

      const { container } = render(<ProjectsSection />);
      // Rows are <a> elements in the indexList
      const rows = container.querySelectorAll('[class*="indexRow"]');
      expect(rows.length).toBe(n);
    }
  );

  it.each(PROJECT_COUNTS)(
    'every row is an anchor element when N=%i',
    (n) => {
      mockedUseProjects.mockReturnValue({
        projects: makeProjects(n),
        loading: false,
        error: null,
        refetch: vi.fn(),
        addProject: vi.fn(),
        editProject: vi.fn(),
        removeProject: vi.fn(),
      });

      const { container } = render(<ProjectsSection />);
      const rows = container.querySelectorAll('[class*="indexRow"]');
      rows.forEach((row) => {
        expect(row.tagName.toLowerCase()).toBe('a');
      });
    }
  );

  it('index list is not rendered when 0 projects are returned', () => {
    mockedUseProjects.mockReturnValue({
      projects: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
      addProject: vi.fn(),
      editProject: vi.fn(),
      removeProject: vi.fn(),
    });

    const { container } = render(<ProjectsSection />);
    const rows = container.querySelectorAll('[class*="indexRow"]');
    expect(rows.length).toBe(0);
  });

  it('shows skeleton rows while loading', () => {
    mockedUseProjects.mockReturnValue({
      projects: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
      addProject: vi.fn(),
      editProject: vi.fn(),
      removeProject: vi.fn(),
    });

    const { container } = render(<ProjectsSection />);
    const skeletons = container.querySelectorAll('[class*="skeletonRow"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('section has id="proyectos"', () => {
    mockedUseProjects.mockReturnValue({
      projects: makeProjects(3),
      loading: false,
      error: null,
      refetch: vi.fn(),
      addProject: vi.fn(),
      editProject: vi.fn(),
      removeProject: vi.fn(),
    });

    const { container } = render(<ProjectsSection />);
    expect(container.querySelector('#proyectos')).toBeInTheDocument();
  });

  it('fadeUp variant has the correct shape (hidden: opacity 0 + y offset, visible: opacity 1 + y 0)', () => {
    expect(fadeUp.hidden).toEqual(expect.objectContaining({ opacity: 0 }));
    expect(fadeUp.hidden).toHaveProperty('y');
    expect(fadeUp.visible).toEqual(expect.objectContaining({ opacity: 1, y: 0 }));
  });

  it('each row links to the project URL', () => {
    const projects = makeProjects(3);
    mockedUseProjects.mockReturnValue({
      projects,
      loading: false,
      error: null,
      refetch: vi.fn(),
      addProject: vi.fn(),
      editProject: vi.fn(),
      removeProject: vi.fn(),
    });

    const { container } = render(<ProjectsSection />);
    const rows = Array.from(container.querySelectorAll('[class*="indexRow"]'));
    rows.forEach((row, i) => {
      expect(row.getAttribute('href')).toBe(projects[i].url);
    });
  });

  it('shows +N for hidden technologies, expands on hover and collapses on mouse leave', () => {
    const projects = makeProjects(1);
    projects[0].technologies = ['React', 'TypeScript', 'Node.js', 'Docker', 'Zod'];
    mockedUseProjects.mockReturnValue({
      projects,
      loading: false,
      error: null,
      refetch: vi.fn(),
      addProject: vi.fn(),
      editProject: vi.fn(),
      removeProject: vi.fn(),
    });

    const { container } = render(<ProjectsSection />);
    const chips = () => container.querySelectorAll('[class*="techChip"]');
    const more = container.querySelector('[class*="techMore"]')!;

    expect(chips().length).toBe(3);
    expect(more.textContent).toBe('+2');

    fireEvent.mouseEnter(more);
    expect(chips().length).toBe(5);
    expect(container.querySelector('[class*="techMore"]')).toBeNull();

    fireEvent.mouseLeave(container.querySelector('[class*="rowTech"]')!);
    expect(chips().length).toBe(3);
    expect(container.querySelector('[class*="techMore"]')).not.toBeNull();
  });

  it('"Ver repo" opens the repository in a new tab without navigating the row', () => {
    const projects = makeProjects(1);
    mockedUseProjects.mockReturnValue({
      projects,
      loading: false,
      error: null,
      refetch: vi.fn(),
      addProject: vi.fn(),
      editProject: vi.fn(),
      removeProject: vi.fn(),
    });
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const { container } = render(<ProjectsSection />);
    const verRepo = container.querySelector('[class*="verRepo"]')!;
    fireEvent.click(verRepo);

    expect(openSpy).toHaveBeenCalledWith(projects[0].repoUrl, '_blank', 'noopener,noreferrer');
    openSpy.mockRestore();
  });

  it('"Ver repo" is not rendered when the project has no repoUrl', () => {
    const projects = makeProjects(1);
    projects[0].repoUrl = '';
    mockedUseProjects.mockReturnValue({
      projects,
      loading: false,
      error: null,
      refetch: vi.fn(),
      addProject: vi.fn(),
      editProject: vi.fn(),
      removeProject: vi.fn(),
    });

    const { container } = render(<ProjectsSection />);
    expect(container.querySelector('[class*="verRepo"]')).toBeNull();
  });

  it('grid is not rendered while loading', () => {
    mockedUseProjects.mockReturnValue({
      projects: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
      addProject: vi.fn(),
      editProject: vi.fn(),
      removeProject: vi.fn(),
    });

    const { container } = render(<ProjectsSection />);
    const rows = container.querySelectorAll('[class*="indexRow"]');
    expect(rows.length).toBe(0);
  });
});
