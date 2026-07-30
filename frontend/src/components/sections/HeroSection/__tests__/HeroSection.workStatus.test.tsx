/**
 * Regresión: cambiar el work_status no debe re-tipear la terminal.
 *
 * El typewriter tenía `workStatus` en las dependencias de su effect. Como el
 * estado llega por fetch después del montaje, cualquier valor distinto del
 * default ('open') reiniciaba la animación a mitad de camino y el visitante
 * veía la terminal tipearse dos veces. Estaba latente porque la DB siempre
 * devolvía 'open' y React descarta un setState con el mismo valor.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('../../../../motion/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

vi.mock('../../../../api/status', () => ({
  getWorkStatus: vi.fn(),
}));

import { HeroSection } from '../HeroSection';
import { WorkStatusProvider } from '../../../../hooks/WorkStatusProvider';
import { getWorkStatus } from '../../../../api/status';

/** El estado laboral llega por contexto: el hero ya no hace su propio fetch. */
function renderHero() {
  return render(
    <WorkStatusProvider>
      <HeroSection />
    </WorkStatusProvider>
  );
}

/** Cantidad de líneas ya tipeadas en el cuerpo de la terminal. */
function typedLines(container: HTMLElement): number {
  return container.querySelectorAll('[class*="termLine"], [class*="blankLine"]').length;
}

describe('HeroSection · work_status', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('un status distinto del default no reinicia el typewriter', async () => {
    vi.mocked(getWorkStatus).mockResolvedValue({ status: 'occupied' });
    const { container } = renderHero();

    // Dejar correr la animación un tramo
    await act(async () => { await vi.advanceTimersByTimeAsync(1200); });
    const antes = typedLines(container);
    expect(antes).toBeGreaterThan(1);

    // El fetch resuelve con un estado distinto y se re-renderiza
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });

    // El contador nunca vuelve atrás: si el effect se hubiera re-ejecutado,
    // `visibleCount` habría vuelto a 0 y quedaría sólo la línea del cursor.
    expect(typedLines(container)).toBeGreaterThanOrEqual(antes);
  });

  it('la línea de status muestra el texto del estado recibido', async () => {
    vi.mocked(getWorkStatus).mockResolvedValue({ status: 'occupied' });
    renderHero();

    // Correr la animación hasta el final
    await act(async () => { await vi.advanceTimersByTimeAsync(6000); });

    expect(screen.getByText('> occupied · no disponible por ahora')).toBeInTheDocument();
  });

  it('con el status default el texto es el de open to work', async () => {
    vi.mocked(getWorkStatus).mockResolvedValue({ status: 'open' });
    renderHero();

    await act(async () => { await vi.advanceTimersByTimeAsync(6000); });

    expect(screen.getByText('> open to work · freelance · full-time')).toBeInTheDocument();
  });
});
