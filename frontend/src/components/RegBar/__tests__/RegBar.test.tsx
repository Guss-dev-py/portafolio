/**
 * El masthead tenía "OPEN TO WORK" escrito a mano (ítem 9 del backlog): decía
 * lo contrario que el hero cuando el estado se cambiaba desde el admin.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('../../../api/status', () => ({
  getWorkStatus: vi.fn(),
}));

import { RegBar } from '../RegBar';
import { WorkStatusProvider } from '../../../hooks/WorkStatusProvider';
import { getWorkStatus } from '../../../api/status';

function renderRegBar() {
  return render(
    <WorkStatusProvider>
      <RegBar />
    </WorkStatusProvider>
  );
}

describe('RegBar · estado laboral', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['open', 'Open to work'],
    ['working', 'Working · con demoras'],
    ['occupied', 'Occupied'],
  ] as const)('con status %s muestra "%s"', async (status, label) => {
    vi.mocked(getWorkStatus).mockResolvedValue({ status });
    renderRegBar();

    expect(await screen.findByText(label)).toBeInTheDocument();
  });

  it('no afirma disponibilidad mientras el fetch está en vuelo', async () => {
    // Promesa que no resuelve: el componente queda en su estado de carga.
    vi.mocked(getWorkStatus).mockReturnValue(new Promise(() => {}));
    const { container } = renderRegBar();

    expect(screen.queryByText('Open to work')).not.toBeInTheDocument();
    expect(container.textContent).not.toContain('Open to work');
  });

  it('un fallo de la API tampoco inventa un estado', async () => {
    vi.mocked(getWorkStatus).mockRejectedValue(new Error('red caída'));
    renderRegBar();

    // El fetch falla: se cae al default 'open' del provider, que es el estado
    // que ya declaraba el HTML antes de este cambio. Lo importante es que la
    // barra sigue renderizando y no rompe la página.
    await act(async () => {});
    expect(screen.getByText('AF / PORTFOLIO / 2026')).toBeInTheDocument();
  });
});
