/**
 * Property-based test for NavigationBar reduced motion behavior.
 *
 * **Validates: Requirement 4.2**
 *
 * Property 2: NavigationBar renders correctly in all conditions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock useReducedMotion to return true ──────────────────────────
vi.mock('../../../motion/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

// Import NavigationBar AFTER mocking so the mock is in place
import { NavigationBar } from '../NavigationBar';

function renderNav() {
  return render(
    <MemoryRouter>
      <NavigationBar />
    </MemoryRouter>
  );
}

describe('Property 2 — NavigationBar renders correctly', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without throwing', () => {
    expect(() => renderNav()).not.toThrow();
  });

  it('renders a nav element', () => {
    const { container } = renderNav();
    const nav = container.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav).toBeInTheDocument();
  });

  it('renders all 4 nav links', () => {
    const { container } = renderNav();
    // Nav links are rendered as <a> elements
    const nav = container.querySelector('nav');
    expect(nav).not.toBeNull();
    const links = nav!.querySelectorAll('a');
    expect(links.length).toBeGreaterThanOrEqual(4);
  });

  it('renders the brand name', () => {
    const { container } = renderNav();
    // Brand contains FREIRE.AF
    const nav = container.querySelector('nav');
    expect(nav!.textContent).toContain('FREIRE');
  });

  it('renders CV button that opens the PDF in a new tab', () => {
    const { container } = renderNav();
    const cvLink = container.querySelector('a[href="/cv.pdf"]');
    expect(cvLink).not.toBeNull();
    expect(cvLink!.getAttribute('target')).toBe('_blank');
    expect(cvLink!.hasAttribute('download')).toBe(false);
  });

  it('nav links are visible', () => {
    const { container } = renderNav();
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    const style = window.getComputedStyle(nav!);
    expect(style.opacity).not.toBe('0');
  });
});
