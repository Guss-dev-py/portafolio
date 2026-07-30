/**
 * Un chunk del admin que no baja por un corte de red momentáneo caía derecho en
 * el ErrorBoundary global, que ofrece recargar la app entera. Reintentar la
 * descarga resuelve el caso transitorio sin que el usuario se entere.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retryImport } from '../retryImport';

describe('retryImport', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('devuelve el módulo sin reintentar cuando la primera carga anda', async () => {
    const mod = { default: 'Componente' };
    const load = vi.fn().mockResolvedValue(mod);

    await expect(retryImport(load)).resolves.toBe(mod);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('reintenta y se recupera de un fallo transitorio', async () => {
    const mod = { default: 'Componente' };
    const load = vi.fn()
      .mockRejectedValueOnce(new Error('Failed to fetch dynamically imported module'))
      .mockResolvedValue(mod);

    const p = retryImport(load);
    await vi.runAllTimersAsync();

    await expect(p).resolves.toBe(mod);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('espera entre intentos, y cada espera es más larga que la anterior', async () => {
    const load = vi.fn().mockRejectedValue(new Error('caído'));
    const esperas: number[] = [];
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
      .mockImplementation(((fn: () => void, ms?: number) => {
        esperas.push(ms ?? 0);
        fn();
        return 0 as unknown as ReturnType<typeof setTimeout>;
      }) as typeof setTimeout);

    await expect(retryImport(load, 2, 400)).rejects.toThrow('caído');

    expect(esperas).toHaveLength(2);
    expect(esperas[1]).toBeGreaterThan(esperas[0]);
    setTimeoutSpy.mockRestore();
  });

  it('se rinde tras agotar los intentos y propaga el error original', async () => {
    // Que propague importa: el ErrorBoundary global sigue siendo la última red,
    // y para un chunk viejo tras un deploy recargar es justamente el remedio.
    const boom = new Error('Failed to fetch dynamically imported module');
    const load = vi.fn().mockRejectedValue(boom);

    const p = retryImport(load, 2, 10);
    const assertion = expect(p).rejects.toBe(boom);
    await vi.runAllTimersAsync();
    await assertion;

    expect(load).toHaveBeenCalledTimes(3); // el original + 2 reintentos
  });

  // Regresión: el error real de un chunk que no baja es un TypeError, no un
  // Error pelado. Clasificarlo como "permanente" desactivaba el reintento justo
  // en el único caso para el que existe esta función.
  it('SÍ reintenta el TypeError que lanza un import dinámico caído', async () => {
    const mod = { default: 'Componente' };
    const load = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch dynamically imported module'))
      .mockResolvedValue(mod);

    const p = retryImport(load, 2, 10);
    await vi.runAllTimersAsync();

    await expect(p).resolves.toBe(mod);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('no reintenta cuando el módulo existe pero explota al evaluarse', async () => {
    // Un error de sintaxis o un import roto no se arregla pidiéndolo de nuevo:
    // reintentar sólo agrega demora antes de mostrar el error.
    const load = vi.fn().mockRejectedValue(new SyntaxError('token inesperado'));

    const p = retryImport(load, 2, 10);
    const assertion = expect(p).rejects.toThrow(SyntaxError);
    await vi.runAllTimersAsync();
    await assertion;

    expect(load).toHaveBeenCalledTimes(1);
  });
});
