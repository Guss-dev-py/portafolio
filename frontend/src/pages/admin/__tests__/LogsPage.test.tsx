/**
 * LogsPage: lista la actividad del admin (audit log) con etiquetas legibles.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('../../../api/logs', () => ({
  getLogs: vi.fn(),
}));

import LogsPage from '../LogsPage';
import { getLogs } from '../../../api/logs';

const mockedGetLogs = vi.mocked(getLogs);

const entries = [
  {
    id: '1',
    action: 'project_created',
    entity: 'project',
    entityId: 'abc',
    detail: 'Mi App',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    action: 'login_ok',
    entity: 'auth',
    entityId: 'env-admin',
    detail: 'augusto',
    createdAt: new Date().toISOString(),
  },
];

describe('LogsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lista la actividad con etiquetas legibles', async () => {
    mockedGetLogs.mockResolvedValueOnce(entries);

    render(<LogsPage />);

    await waitFor(() => expect(screen.getByText(/Proyecto creado/)).toBeInTheDocument());
    expect(screen.getByText(/Login exitoso/)).toBeInTheDocument();
    expect(screen.getByText('Mi App')).toBeInTheDocument();
  });

  it('sin actividad muestra el estado vacío', async () => {
    mockedGetLogs.mockResolvedValueOnce([]);

    render(<LogsPage />);

    await waitFor(() => expect(screen.getByText(/Sin actividad registrada/)).toBeInTheDocument());
  });

  it('si la API falla muestra el error', async () => {
    mockedGetLogs.mockRejectedValueOnce(new Error('falló'));

    render(<LogsPage />);

    await waitFor(() => expect(screen.getByText(/Error/)).toBeInTheDocument());
  });
});
