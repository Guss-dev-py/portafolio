/**
 * Property-based test for ContactSection.
 *
 * **Validates: Requirement 9.9**
 *
 * ContactSection now uses hardcoded contact links and inline form.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock useReducedMotion to return false (animations enabled) ────
vi.mock('../../../../motion/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

import { ContactSection } from '../ContactSection';
import { spring } from '../../../../motion/tokens';

function renderContactSection() {
  return render(
    <MemoryRouter>
      <ContactSection />
    </MemoryRouter>
  );
}

describe('ContactSection — brutalist paper variant', () => {
  it('renders without throwing', () => {
    expect(() => renderContactSection()).not.toThrow();
  });

  it('renders section with id="contacto"', () => {
    const { container } = renderContactSection();
    expect(container.querySelector('#contacto')).toBeInTheDocument();
  });

  it('renders section number 03', () => {
    const { getByText } = renderContactSection();
    expect(getByText('03')).toBeInTheDocument();
  });

  it('renders the contact form', () => {
    const { container } = renderContactSection();
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
  });

  it('renders the submit button', () => {
    const { getByText } = renderContactSection();
    expect(getByText('Enviar mensaje →')).toBeInTheDocument();
  });

  it('spring.gentle has the correct shape', () => {
    expect(spring.gentle).toEqual(
      expect.objectContaining({
        type: 'spring',
        stiffness: 200,
        damping: 22,
        mass: 1,
      })
    );
  });
});
