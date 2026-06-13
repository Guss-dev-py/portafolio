/**
 * Toggle del tema "hacker" del panel admin: aplica data-admin-theme en <html>,
 * persiste en localStorage y se limpia al desmontar (volver al sitio público).
 * Es independiente del tema claro/oscuro del sitio público (data-theme).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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

import { AdminThemeToggle } from '../AdminThemeToggle';

describe('AdminThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.adminTheme;
  });

  it('en modo papel ofrece activar el modo hacker', () => {
    render(<AdminThemeToggle />);
    expect(screen.getByRole('button', { name: 'Activar modo hacker' })).toBeInTheDocument();
    expect(document.documentElement.dataset.adminTheme).toBeUndefined();
  });

  it('al hacer clic aplica data-admin-theme="hacker" y persiste la preferencia', () => {
    render(<AdminThemeToggle />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar modo hacker' }));

    expect(document.documentElement.dataset.adminTheme).toBe('hacker');
    expect(localStorage.getItem('admin-theme')).toBe('hacker');
    expect(screen.getByRole('button', { name: 'Volver al modo papel' })).toBeInTheDocument();
  });

  it('un segundo clic vuelve al modo papel y quita el atributo', () => {
    render(<AdminThemeToggle />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar modo hacker' }));
    fireEvent.click(screen.getByRole('button', { name: 'Volver al modo papel' }));

    expect(document.documentElement.dataset.adminTheme).toBeUndefined();
    expect(localStorage.getItem('admin-theme')).toBe('paper');
  });

  it('restaura la preferencia guardada al montar', () => {
    localStorage.setItem('admin-theme', 'hacker');

    render(<AdminThemeToggle />);

    expect(document.documentElement.dataset.adminTheme).toBe('hacker');
    expect(screen.getByRole('button', { name: 'Volver al modo papel' })).toBeInTheDocument();
  });

  it('al desmontar quita el atributo de <html> (el público no hereda el tema del admin)', () => {
    localStorage.setItem('admin-theme', 'hacker');
    const { unmount } = render(<AdminThemeToggle />);
    expect(document.documentElement.dataset.adminTheme).toBe('hacker');

    unmount();

    expect(document.documentElement.dataset.adminTheme).toBeUndefined();
    // La preferencia persiste para la próxima visita al admin
    expect(localStorage.getItem('admin-theme')).toBe('hacker');
  });

  it('no toca el tema del sitio público (data-theme)', () => {
    document.documentElement.dataset.theme = 'dark';
    render(<AdminThemeToggle />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar modo hacker' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    delete document.documentElement.dataset.theme;
  });
});
