/**
 * Feature: portfolio-admin-panel
 * Property 2: Validación rechaza mensajes de contacto con campos inválidos
 *
 * Validates: Requirements 2.2, 2.3
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { contactSchema } from '../message.schema';

// Arbitrary: string longer than N chars
const longString = (minLen: number) =>
  fc.string({ minLength: minLen + 1, maxLength: minLen + 200 });

// Arbitrary: invalid email (not a valid email format)
const invalidEmail = fc.oneof(
  fc.constant(''),
  fc.constant('not-an-email'),
  fc.constant('@nodomain'),
  fc.constant('missing@'),
  fc.constant('spaces in@email.com'),
  fc.string({ minLength: 1, maxLength: 50 }).filter(
    (s) => !s.includes('@') || s.startsWith('@') || s.endsWith('@')
  )
);

describe('Property 2 — Validación rechaza mensajes de contacto con campos inválidos', () => {
  it('rechaza mensajes con nombre vacío', () => {
    fc.assert(
      fc.property(fc.record({ ...buildArbs(), name: fc.constant('') }), (input) => {
        return contactSchema.safeParse(input).success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('rechaza mensajes con nombre que excede 100 caracteres', () => {
    fc.assert(
      fc.property(fc.record({ ...buildArbs(), name: longString(100) }), (input) => {
        return contactSchema.safeParse(input).success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('rechaza mensajes con email inválido', () => {
    fc.assert(
      fc.property(fc.record({ ...buildArbs(), email: invalidEmail }), (input) => {
        return contactSchema.safeParse(input).success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('rechaza mensajes con mensaje vacío', () => {
    fc.assert(
      fc.property(fc.record({ ...buildArbs(), message: fc.constant('') }), (input) => {
        return contactSchema.safeParse(input).success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('rechaza mensajes con mensaje que excede 2000 caracteres', () => {
    fc.assert(
      fc.property(fc.record({ ...buildArbs(), message: longString(2000) }), (input) => {
        return contactSchema.safeParse(input).success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('rechaza cualquier combinación con al menos un campo inválido', () => {
    const invalidVariants = fc.oneof(
      fc.record({ ...buildArbs(), name: fc.constant('') }),
      fc.record({ ...buildArbs(), name: longString(100) }),
      fc.record({ ...buildArbs(), email: invalidEmail }),
      fc.record({ ...buildArbs(), message: fc.constant('') }),
      fc.record({ ...buildArbs(), message: longString(2000) })
    );

    fc.assert(
      fc.property(invalidVariants, (input) => {
        return contactSchema.safeParse(input).success === false;
      }),
      { numRuns: 100 }
    );
  });
});

/** Arbitraries for valid fields (used as base when overriding one invalid field) */
function buildArbs() {
  return {
    name: fc.string({ minLength: 1, maxLength: 100 }),
    email: fc.emailAddress(),
    message: fc.string({ minLength: 1, maxLength: 2000 }),
  };
}
