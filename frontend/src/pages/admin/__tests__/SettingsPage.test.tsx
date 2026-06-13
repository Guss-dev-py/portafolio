/**
 * Tests de SettingsPage: render de opciones de work_status, opción activa y cambio de estado.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { WorkStatus } from '../../../api/status';

vi.mock('../../../hooks/useWorkStatus', () => ({
  useWorkStatus: vi.fn(),
}));

import SettingsPage from '../SettingsPage';
import { useWorkStatus } from '../../../hooks/useWorkStatus';

const mockedUseWorkStatus = vi.mocked(useWorkStatus);

function mockHook(overrides: Partial<ReturnType<typeof useWorkStatus>> = {}) {
  const base = {
    status: 'open' as WorkStatus,
    loading: false,
    saving: false,
    error: null,
    updateStatus: vi.fn(),
  };
  mockedUseWorkStatus.mockReturnValue({ ...base, ...overrides });
  return { ...base, ...overrides };
}

const ALL_STATUSES: WorkStatus[] = ['open', 'working', 'occupied'];

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el loading mientras carga el estado', () => {
    mockHook({ loading: true });
    render(<SettingsPage />);
    expect(screen.getByText('Cargando estado actual...')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it.each(ALL_STATUSES)('marca como activa solo la opción "%s"', (status) => {
    mockHook({ status });
    render(<SettingsPage />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    const pressed = buttons.filter(b => b.getAttribute('aria-pressed') === 'true');
    expect(pressed).toHaveLength(1);
    expect(screen.getAllByText('● ACTIVO')).toHaveLength(1);
  });

  it('clic en una opción inactiva llama a updateStatus con ese valor', () => {
    const { updateStatus } = mockHook({ status: 'open' });
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: /working/i }));

    expect(updateStatus).toHaveBeenCalledExactlyOnceWith('working');
  });

  it('clic en la opción ya activa no llama a updateStatus', () => {
    const { updateStatus } = mockHook({ status: 'open' });
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: /open to work/i }));

    expect(updateStatus).not.toHaveBeenCalled();
  });

  it('mientras guarda, las opciones quedan deshabilitadas y se ve "Guardando..."', () => {
    mockHook({ saving: true });
    render(<SettingsPage />);

    expect(screen.getByText('Guardando...')).toBeInTheDocument();
    screen.getAllByRole('button').forEach(b => expect(b).toBeDisabled());
  });

  it('muestra el error como alert cuando falla la actualización', () => {
    mockHook({ error: 'No se pudo guardar' });
    render(<SettingsPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Error: No se pudo guardar');
  });
});
