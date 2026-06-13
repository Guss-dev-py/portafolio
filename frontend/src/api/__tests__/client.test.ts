/**
 * apiClient: persiste el token renovado que el backend emite en
 * X-Refreshed-Token (sesión deslizante).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { apiClient } from '../client';

function mockFetch(headers: Record<string, string> = {}, body: unknown = { ok: true }) {
  const response = new Response(JSON.stringify(body), { status: 200, headers });
  const spy = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', spy);
  return spy;
}

describe('apiClient — sesión deslizante', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.stubGlobal('localStorage', localStorageMock);
  });

  it('persiste el token de X-Refreshed-Token', async () => {
    localStorage.setItem('token', 'viejo');
    mockFetch({ 'X-Refreshed-Token': 'nuevo-token' });

    await apiClient('/api/projects');

    expect(localStorage.getItem('token')).toBe('nuevo-token');
  });

  it('sin header no toca el token', async () => {
    localStorage.setItem('token', 'viejo');
    mockFetch();

    await apiClient('/api/projects');

    expect(localStorage.getItem('token')).toBe('viejo');
  });
});
