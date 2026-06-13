/**
 * useUnreadTitle: refleja los mensajes no leídos en el título de la pestaña
 * para verlos sin tener el panel activo. Restaura el título al desmontar.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUnreadTitle } from '../useUnreadTitle';

describe('useUnreadTitle', () => {
  beforeEach(() => {
    document.title = 'Título original';
  });

  it('sin no leídos usa el título base', () => {
    renderHook(() => useUnreadTitle(0));
    expect(document.title).toBe('FREIRE/ADMIN');
  });

  it('con no leídos antepone el contador', () => {
    renderHook(() => useUnreadTitle(3));
    expect(document.title).toBe('(3) FREIRE/ADMIN');
  });

  it('se actualiza cuando cambia el contador', () => {
    const { rerender } = renderHook(({ n }) => useUnreadTitle(n), { initialProps: { n: 1 } });
    expect(document.title).toBe('(1) FREIRE/ADMIN');

    rerender({ n: 0 });
    expect(document.title).toBe('FREIRE/ADMIN');
  });

  it('al desmontar restaura el título original', () => {
    const { unmount } = renderHook(() => useUnreadTitle(5));
    expect(document.title).toBe('(5) FREIRE/ADMIN');

    unmount();
    expect(document.title).toBe('Título original');
  });
});
