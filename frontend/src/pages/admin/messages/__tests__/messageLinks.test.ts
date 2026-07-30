/**
 * `gmailReplyUrl` y `formatDate` quedaron puros y aislados en la Fase 3, con el
 * test habilitado y sin escribir. Esto lo cierra.
 *
 * Nota sobre el tiempo: `formatDate` usa `toLocaleString('es-AR')`, que depende
 * de la zona horaria de la máquina. Los tests asertan **forma** y no una hora
 * absoluta; para la parte de fecha se usan instantes al mediodía UTC, que caen
 * en el mismo día calendario en cualquier zona dentro de ±12h.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { gmailReplyUrl, formatDate } from '../messageLinks';

const msg = (over: Partial<{ name: string; email: string; message: string }> = {}) => ({
  name: 'Augusto',
  email: 'augusto@example.com',
  message: 'Hola, quiero un sitio.',
  ...over,
});

describe('gmailReplyUrl', () => {
  it('apunta al compose de Gmail con el destinatario cargado', () => {
    const url = new URL(gmailReplyUrl(msg()));

    expect(url.origin + url.pathname).toBe('https://mail.google.com/mail/');
    expect(url.searchParams.get('view')).toBe('cm');
    expect(url.searchParams.get('to')).toBe('augusto@example.com');
  });

  it('arma el asunto con el nombre del remitente', () => {
    const url = new URL(gmailReplyUrl(msg({ name: 'Lucía' })));

    expect(url.searchParams.get('su')).toBe('Re: mensaje desde el portafolio — Lucía');
  });

  it('cita el mensaje original en el cuerpo', () => {
    const url = new URL(gmailReplyUrl(msg({ message: 'Necesito un e-commerce.' })));
    const body = url.searchParams.get('body')!;

    expect(body).toContain('Hola Augusto,');
    expect(body).toContain('Mensaje original:');
    expect(body).toContain('Necesito un e-commerce.');
  });

  // Lo que de verdad puede romperse: un `&` o un `#` sin escapar parte la URL y
  // el resto del mensaje se pierde en silencio.
  it('no se rompe con caracteres que tienen significado en una URL', () => {
    const url = new URL(gmailReplyUrl(msg({
      name: 'A & B #1',
      message: 'Presupuesto por ?query=1 & algo #urgente',
    })));

    expect(url.searchParams.get('su')).toContain('A & B #1');
    expect(url.searchParams.get('body')).toContain('?query=1 & algo #urgente');
  });

  it('para CUALQUIER contenido el resultado sigue siendo una URL válida de Gmail', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.string(), (name, email, message) => {
        const url = new URL(gmailReplyUrl({ name, email, message }));
        expect(url.hostname).toBe('mail.google.com');
        // Y el contenido sobrevive al viaje de ida y vuelta por el encoding.
        expect(url.searchParams.get('to')).toBe(email);
        expect(url.searchParams.get('body')).toContain(message);
      }),
      { numRuns: 300 }
    );
  });
});

describe('formatDate', () => {
  it('devuelve día, mes, año y hora en formato es-AR', () => {
    const salida = formatDate('2026-07-30T12:00:00Z');

    expect(salida).toMatch(/^30\/07\/2026, \d{2}:\d{2}/);
  });

  it('usa dos dígitos también en fechas de un solo dígito', () => {
    expect(formatDate('2026-01-05T12:00:00Z')).toMatch(/^05\/01\/2026,/);
  });

  // Regresión: devolvía el literal "Invalid Date" —en inglés, en un panel que
  // está todo en español— para cualquier fecha que no parsee.
  it('no muestra "Invalid Date" cuando la fecha no parsea', () => {
    for (const basura of ['', 'no-es-una-fecha', 'null', '2026-13-45']) {
      const salida = formatDate(basura);
      expect(salida).not.toBe('Invalid Date');
      expect(salida).not.toMatch(/invalid/i);
    }
  });

  it('para CUALQUIER string devuelve algo mostrable, nunca vacío ni un throw', () => {
    fc.assert(
      fc.property(fc.string(), (entrada) => {
        const salida = formatDate(entrada);
        expect(typeof salida).toBe('string');
        expect(salida.length).toBeGreaterThan(0);
        expect(salida).not.toMatch(/invalid/i);
      }),
      { numRuns: 300 }
    );
  });
});
