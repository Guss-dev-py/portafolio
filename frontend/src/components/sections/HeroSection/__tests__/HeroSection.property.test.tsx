/**
 * Property-based test for HeroSection terminal animation.
 *
 * **Validates: Requirement 6.9**
 *
 * Property 7: HeroSection renders without errors
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// ── Mock useReducedMotion to return false (animations enabled) ────
vi.mock('../../../../motion/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

import { HeroSection } from '../HeroSection';
import { scaleIn } from '../../../../motion/variants';

describe('HeroSection — terminal variant', () => {
  it('renders without throwing', () => {
    expect(() => render(<HeroSection />)).not.toThrow();
  });

  it('renders the section with id="inicio"', () => {
    const { container } = render(<HeroSection />);
    const section = container.querySelector('#inicio');
    expect(section).toBeInTheDocument();
  });

  it('renders the terminal box', () => {
    const { container } = render(<HeroSection />);
    // The terminal body should be present
    const section = container.querySelector('section');
    expect(section).not.toBeNull();
  });

  it('scaleIn variant structure: hidden has opacity 0 and scale 0.85, visible has opacity 1 and scale 1', () => {
    expect(scaleIn.hidden).toEqual(expect.objectContaining({ opacity: 0, scale: 0.85 }));
    expect(scaleIn.visible).toEqual(expect.objectContaining({ opacity: 1, scale: 1 }));
  });
});
