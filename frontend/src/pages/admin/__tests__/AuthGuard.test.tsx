import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthGuard } from '../AuthGuard';

vi.mock('react-router-dom', () => ({
  Navigate: vi.fn(({ to, state }: { to: string; state?: unknown }) => (
    <div
      data-testid="navigate"
      data-to={to}
      data-state={JSON.stringify(state)}
    />
  )),
  Outlet: vi.fn(() => <div data-testid="outlet">children</div>),
}));

function makeFakeJwt(payload: object): string {
  const encoded = btoa(JSON.stringify(payload));
  return `header.${encoded}.signature`;
}

describe('AuthGuard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to /admin/login with no state when there is no token', () => {
    render(<AuthGuard />);

    const nav = screen.getByTestId('navigate');
    expect(nav).toHaveAttribute('data-to', '/admin/login');
    // No state passed — data-state attribute is absent or "null"
    const stateAttr = nav.getAttribute('data-state');
    expect(stateAttr === null || stateAttr === 'null' || stateAttr === 'undefined').toBe(true);
  });

  it('redirects to /admin/login with expiry message when token is expired', () => {
    const expiredToken = makeFakeJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
    localStorage.setItem('token', expiredToken);

    render(<AuthGuard />);

    const nav = screen.getByTestId('navigate');
    expect(nav).toHaveAttribute('data-to', '/admin/login');
    const state = JSON.parse(nav.getAttribute('data-state') ?? 'null');
    expect(state).toEqual({ message: 'Tu sesión expiró, volvé a iniciar sesión' });
  });

  it('renders children via Outlet when token is valid', () => {
    const validToken = makeFakeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem('token', validToken);

    render(<AuthGuard />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });
});
