/**
 * Tests de LoginPage: validación previa al fetch, login exitoso y credenciales inválidas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';

// jsdom no provee localStorage — lo mockeamos manualmente
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));

vi.mock('../../../api/client', () => ({
  apiClient: vi.fn(),
}));

import { LoginPage } from '../LoginPage';
import { apiClient } from '../../../api/client';

const mockedApiClient = vi.mocked(apiClient);

function fillAndSubmit(username: string, password: string) {
  fireEvent.change(screen.getByLabelText('USUARIO'), { target: { value: username } });
  fireEvent.change(screen.getByLabelText('CONTRASEÑA'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('property: campos vacíos o solo espacios → error de validación sin llamar a la API', () => {
    const blankArb = fc.stringMatching(/^[ \t]{0,5}$/);
    const filledArb = fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/);

    fc.assert(
      fc.property(
        fc.oneof(
          fc.tuple(blankArb, filledArb),   // usuario vacío
          fc.tuple(filledArb, blankArb),   // contraseña vacía
          fc.tuple(blankArb, blankArb),    // ambos vacíos
        ),
        ([username, password]) => {
          const { unmount } = render(<LoginPage />);
          fillAndSubmit(username, password);

          expect(screen.getByRole('alert')).toHaveTextContent('Completá usuario y contraseña.');
          expect(mockedApiClient).not.toHaveBeenCalled();
          unmount();
        },
      ),
      { numRuns: 25 },
    );
  });

  it('login exitoso → guarda el token y navega a /admin', async () => {
    mockedApiClient.mockResolvedValueOnce({ token: 'jwt-token-123', expiresIn: 28800 });

    render(<LoginPage />);
    fillAndSubmit('admin', 'secret');

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'));
    expect(localStorage.getItem('token')).toBe('jwt-token-123');
    expect(mockedApiClient).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'secret' }),
    });
  });

  it('credenciales inválidas → muestra el error y no navega', async () => {
    mockedApiClient.mockRejectedValueOnce(new Error('Unauthorized'));

    render(<LoginPage />);
    fillAndSubmit('admin', 'wrong');

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Credenciales inválidas. Intentá de nuevo.'),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('el botón Limpiar resetea los campos y el error', () => {
    render(<LoginPage />);
    fillAndSubmit('', '');
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('USUARIO')).toHaveValue('');
    expect(screen.getByLabelText('CONTRASEÑA')).toHaveValue('');
  });
});
