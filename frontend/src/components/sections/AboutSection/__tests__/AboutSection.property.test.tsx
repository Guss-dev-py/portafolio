/**
 * Property-based test for AboutSection.
 *
 * **Validates: Requirement 7.7**
 *
 * Property 10: AboutSection renders hardcoded content correctly.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// ── Mock useReducedMotion to return false (animations enabled) ────
vi.mock('../../../../motion/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

import { AboutSection } from '../AboutSection';

describe('AboutSection — brutalist paper variant', () => {
  it('renders without throwing', () => {
    expect(() => render(<AboutSection />)).not.toThrow();
  });

  it('renders section with id="sobre"', () => {
    const { container } = render(<AboutSection />);
    const section = container.querySelector('#sobre');
    expect(section).toBeInTheDocument();
  });

  it('bio text is present in the DOM', () => {
    const { container } = render(<AboutSection />);
    const section = container.querySelector('section');
    expect(section).not.toBeNull();
    // The about section has content
    expect(section!.textContent!.length).toBeGreaterThan(50);
  });

  it('section head with number "01" is rendered', () => {
    const { getByText } = render(<AboutSection />);
    expect(getByText('01')).toBeInTheDocument();
  });

  it('renders skill tags for stack section', () => {
    const { getByText } = render(<AboutSection />);
    expect(getByText('React')).toBeInTheDocument();
    expect(getByText('TypeScript')).toBeInTheDocument();
    expect(getByText('Python')).toBeInTheDocument();
  });
});
