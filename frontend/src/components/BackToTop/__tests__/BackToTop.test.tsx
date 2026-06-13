/**
 * Botón "volver arriba": aparece tras scrollear más de un viewport,
 * vuelve al inicio al hacer clic. Pensado para el one-page en mobile.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

import { BackToTop } from '../BackToTop';

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  act(() => {
    fireEvent.scroll(window);
  });
}

describe('BackToTop', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  it('arranca oculto (sin scroll)', () => {
    render(<BackToTop />);
    expect(screen.queryByRole('button', { name: 'Volver arriba' })).not.toBeInTheDocument();
  });

  it('aparece después de scrollear más de 600px', async () => {
    render(<BackToTop />);

    scrollTo(700);

    expect(await screen.findByRole('button', { name: 'Volver arriba' })).toBeInTheDocument();
  });

  it('se oculta de nuevo al volver cerca del inicio', async () => {
    render(<BackToTop />);

    scrollTo(700);
    await screen.findByRole('button', { name: 'Volver arriba' });

    scrollTo(100);
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Volver arriba' })).not.toBeInTheDocument(),
    );
  });

  it('al hacer clic scrollea al inicio', async () => {
    const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<BackToTop />);

    scrollTo(900);
    fireEvent.click(await screen.findByRole('button', { name: 'Volver arriba' }));

    expect(scrollSpy).toHaveBeenCalled();
  });
});
