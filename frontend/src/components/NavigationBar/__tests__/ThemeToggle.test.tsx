/**
 * Toggle de tema claro/oscuro en el navbar: aplica data-theme en <html>,
 * persiste en localStorage y restaura la preferencia al montar.
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

import { NavigationBar } from '../NavigationBar';

describe('ThemeToggle (NavigationBar)', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('en modo claro ofrece activar el modo oscuro', () => {
    render(<NavigationBar />);
    expect(screen.getByRole('button', { name: 'Activar modo oscuro' })).toBeInTheDocument();
  });

  it('al hacer clic aplica data-theme="dark" en <html> y persiste la preferencia', () => {
    render(<NavigationBar />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar modo oscuro' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Activar modo claro' })).toBeInTheDocument();
  });

  it('un segundo clic vuelve al modo claro', () => {
    render(<NavigationBar />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar modo oscuro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Activar modo claro' }));

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('restaura la preferencia guardada al montar', () => {
    localStorage.setItem('theme', 'dark');

    render(<NavigationBar />);

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: 'Activar modo claro' })).toBeInTheDocument();
  });
});
