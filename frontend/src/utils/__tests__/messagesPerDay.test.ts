/**
 * Property tests del helper messagesPerDay: agrupa mensajes por día calendario
 * para el sparkline del panel de mensajes.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { messagesPerDay } from '../messagesPerDay';

const DAY_MS = 86_400_000;

function isoDaysAgo(days: number, offsetMs = 0): string {
  return new Date(Date.now() - days * DAY_MS + offsetMs).toISOString();
}

describe('messagesPerDay', () => {
  it('property: devuelve exactamente `days` buckets, todos no negativos', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 30 }), { maxLength: 40 }),
        fc.integer({ min: 1, max: 30 }),
        (agesInDays, days) => {
          const dates = agesInDays.map(a => isoDaysAgo(a));
          const buckets = messagesPerDay(dates, days);
          expect(buckets).toHaveLength(days);
          buckets.forEach(b => expect(b).toBeGreaterThanOrEqual(0));
        },
      ),
    );
  });

  it('property: la suma de los buckets es el total de mensajes dentro de la ventana', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 30 }), { maxLength: 40 }),
        fc.integer({ min: 1, max: 30 }),
        (agesInDays, days) => {
          const dates = agesInDays.map(a => isoDaysAgo(a));
          const buckets = messagesPerDay(dates, days);
          const inWindow = agesInDays.filter(a => a < days).length;
          expect(buckets.reduce((s, b) => s + b, 0)).toBe(inWindow);
        },
      ),
    );
  });

  it('un mensaje de hoy cae en el último bucket', () => {
    const buckets = messagesPerDay([new Date().toISOString()], 7);
    expect(buckets).toEqual([0, 0, 0, 0, 0, 0, 1]);
  });

  it('un mensaje de hace 2 días cae en el bucket correspondiente', () => {
    // Mediodía de hace 2 días para evitar bordes de medianoche
    const d = new Date();
    d.setDate(d.getDate() - 2);
    d.setHours(12, 0, 0, 0);
    const buckets = messagesPerDay([d.toISOString()], 7);
    expect(buckets).toEqual([0, 0, 0, 0, 1, 0, 0]);
  });

  it('lista vacía → todos los buckets en cero', () => {
    expect(messagesPerDay([], 5)).toEqual([0, 0, 0, 0, 0]);
  });

  it('mensajes fuera de la ventana se descartan', () => {
    const d = new Date();
    d.setDate(d.getDate() - 10);
    expect(messagesPerDay([d.toISOString()], 7)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});
