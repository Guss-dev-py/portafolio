/**
 * useDirtyForm: compara el estado de un formulario contra el snapshot tomado
 * al abrirlo. El snapshot vive en un ref, así que ninguna de las dos funciones
 * provoca re-render.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import * as fc from 'fast-check';
import { useDirtyForm } from '../useDirtyForm';

type Form = { name: string; tags: string[]; nested?: { a: number; b: number } };

const initial: Form = { name: 'uno', tags: ['react'] };

describe('useDirtyForm', () => {
  it('sin snapshot previo, cualquier valor cuenta como sucio', () => {
    const { result } = renderHook(() => useDirtyForm<Form>());
    expect(result.current.isDirty(initial)).toBe(true);
  });

  it('el mismo valor que el snapshot no está sucio', () => {
    const { result } = renderHook(() => useDirtyForm<Form>());
    result.current.snapshot(initial);
    expect(result.current.isDirty(initial)).toBe(false);
    // Un objeto distinto con los mismos datos tampoco: compara valor, no identidad
    expect(result.current.isDirty({ name: 'uno', tags: ['react'] })).toBe(false);
  });

  it('cambiar un campo lo marca sucio, y volver atrás lo limpia', () => {
    const { result } = renderHook(() => useDirtyForm<Form>());
    result.current.snapshot(initial);

    expect(result.current.isDirty({ ...initial, name: 'dos' })).toBe(true);
    expect(result.current.isDirty({ ...initial, name: 'uno' })).toBe(false);
  });

  it('un cambio dentro de un array anidado se detecta', () => {
    const { result } = renderHook(() => useDirtyForm<Form>());
    result.current.snapshot(initial);
    expect(result.current.isDirty({ ...initial, tags: ['react', 'ts'] })).toBe(true);
    expect(result.current.isDirty({ ...initial, tags: [] })).toBe(true);
  });

  it('el orden de los elementos de un array SÍ importa', () => {
    const { result } = renderHook(() => useDirtyForm<Form>());
    result.current.snapshot({ name: 'uno', tags: ['a', 'b'] });
    expect(result.current.isDirty({ name: 'uno', tags: ['b', 'a'] })).toBe(true);
  });

  it('un snapshot nuevo mueve el punto de comparación', () => {
    const { result } = renderHook(() => useDirtyForm<Form>());
    result.current.snapshot(initial);

    const editado = { ...initial, name: 'dos' };
    expect(result.current.isDirty(editado)).toBe(true);

    result.current.snapshot(editado);
    expect(result.current.isDirty(editado)).toBe(false);
    expect(result.current.isDirty(initial)).toBe(true);
  });

  it('las fechas se comparan bien (toJSON corre antes del serializador)', () => {
    const { result } = renderHook(() => useDirtyForm<{ at: Date }>());
    result.current.snapshot({ at: new Date('2026-07-30T12:00:00Z') });

    expect(result.current.isDirty({ at: new Date('2026-07-30T12:00:00Z') })).toBe(false);
    expect(result.current.isDirty({ at: new Date('2026-07-30T12:00:01Z') })).toBe(true);
  });

  it('LÍMITE DOCUMENTADO: dos Set distintos comparan como iguales', () => {
    // No es un bug a arreglar, es el contrato: el hook sirve para datos JSON
    // planos. Está acá para que quede ejecutable y nadie lo "arregle" borrando
    // la advertencia del docblock sin darse cuenta de la consecuencia.
    const { result } = renderHook(() => useDirtyForm<{ ids: Set<string> }>());
    result.current.snapshot({ ids: new Set(['a']) });

    expect(result.current.isDirty({ ids: new Set(['b', 'c']) })).toBe(false);
  });

  it('property: el orden de las claves nunca cambia el resultado', () => {
    fc.assert(
      fc.property(
        fc.string(), fc.integer(), fc.integer(),
        (name, a, b) => {
          const { result, unmount } = renderHook(() => useDirtyForm<Form>());

          // Mismos datos, claves declaradas en orden inverso en cada nivel
          result.current.snapshot({ name, tags: [], nested: { a, b } });
          const reordenado = { nested: { b, a }, tags: [], name } as Form;

          expect(result.current.isDirty(reordenado)).toBe(false);
          unmount();
        },
      ),
      { numRuns: 25 },
    );
  });
});
