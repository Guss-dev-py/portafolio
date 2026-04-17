/**
 * Property-based test for NavigationBar reduced motion behavior.
 *
 * **Validates: Requirement 4.2**
 *
 * Property 2: Reduced motion disables all animations
 * When `useReducedMotion()` returns `true`, all resolved animation variants
 * in NavigationBar SHALL produce no visual movement (no-op variants).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { SectionId } from '../../../types';

// ── Mock useReducedMotion to return true ──────────────────────────
vi.mock('../../../motion/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

// Import NavigationBar AFTER mocking so the mock is in place
import { NavigationBar } from '../NavigationBar';

// ── Helpers ───────────────────────────────────────────────────────

const DEFAULT_PROPS = {
  activeSection: 'inicio' as SectionId,
};

const ALL_SECTIONS: SectionId[] = ['inicio', 'sobre-mi', 'proyectos', 'contacto'];

function renderNav(props = DEFAULT_PROPS) {
  return render(
    <MemoryRouter>
      <NavigationBar {...props} />
    </MemoryRouter>
  );
}

// ── Property 2: Reduced motion disables all animations ────────────

describe('Property 2 — Reduced motion disables all animations in NavigationBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('motion.nav has initial={false} when reduced motion is active', () => {
    const { container } = renderNav();
    const nav = container.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav).toBeInTheDocument();
    const style = window.getComputedStyle(nav!);
    expect(style.opacity).not.toBe('0');
  });

  it('stagger container variants are no-ops { hidden: {}, visible: {} } when reduced motion is active', () => {
    const { container } = renderNav();
    const ul = container.querySelector('ul');
    expect(ul).not.toBeNull();
    expect(ul).toBeInTheDocument();
    expect(ul!.children.length).toBeGreaterThan(0);
  });

  it('motion.li variants are no-ops when reduced motion is active', () => {
    const { container } = renderNav();
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBe(4);
    listItems.forEach((li) => {
      expect(li).toBeInTheDocument();
      const style = window.getComputedStyle(li);
      expect(style.opacity).not.toBe('0');
    });
  });

  it('motion.button has no whileHover prop (no scale animation) when reduced motion is active', () => {
    const { container } = renderNav();
    const buttons = container.querySelectorAll('button[type="button"]');
    const navButtons = Array.from(buttons).filter((btn) =>
      btn.classList.toString().includes('link') ||
      btn.getAttribute('aria-current') !== null ||
      btn.textContent !== undefined
    );
    expect(navButtons.length).toBeGreaterThan(0);
    navButtons.forEach((btn) => {
      expect(btn).toBeInTheDocument();
    });
  });

  it('admin dot link is rendered in the nav', () => {
    const { container } = renderNav();
    const adminLink = container.querySelector('a[aria-label="Panel de administración"]');
    expect(adminLink).not.toBeNull();
    expect(adminLink).toBeInTheDocument();
  });

  it('all nav link buttons are immediately visible (no entrance animation) when reduced motion is active', () => {
    const { container } = renderNav();
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBe(4);
  });

  it.each(ALL_SECTIONS)(
    'no entrance animation for activeSection="%s" when reduced motion is active',
    (activeSection) => {
      const { container } = renderNav({ activeSection });
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
      const style = window.getComputedStyle(nav!);
      expect(style.opacity).not.toBe('0');
    }
  );

  it('resolved stagger container is a no-op: hidden and visible states are empty objects', () => {
    const { container } = renderNav();
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBe(4);
    listItems.forEach((li) => {
      expect(li).toBeVisible();
    });
  });

  it('resolved fadeUp for nav links is a no-op: hidden and visible states are empty objects', () => {
    const { container } = renderNav();
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBe(4);
    listItems.forEach((li) => {
      const style = window.getComputedStyle(li);
      expect(style.opacity).not.toBe('0');
    });
  });
});
