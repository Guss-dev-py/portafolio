/**
 * Feature: portfolio-admin-panel
 * Property 1: Validación rechaza proyectos con campos inválidos
 *
 * Validates: Requirements 1.5, 1.10
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { projectSchema } from '../project.schema';

// A valid base project to build invalid variants from
const validProject = {
  name: 'My Project',
  description: 'A valid description',
  technologies: ['TypeScript'],
  url: 'https://example.com',
  imageUrl: 'https://example.com/image.png',
  imageAlt: 'Project image',
};

// Arbitrary: string longer than 100 chars
const longString = (minLen: number) =>
  fc.string({ minLength: minLen + 1, maxLength: minLen + 200 });

// Arbitrary: invalid URL (plain string without protocol)
const invalidUrl = fc.oneof(
  fc.constant('not-a-url'),
  fc.constant('ftp://'),
  fc.constant(''),
  fc.constant('just text'),
  fc.string({ minLength: 1, maxLength: 50 }).filter(
    (s) => !s.startsWith('http://') && !s.startsWith('https://')
  )
);

describe('Property 1 — Validación rechaza proyectos con campos inválidos', () => {
  it('rechaza proyectos con nombre vacío', () => {
    fc.assert(
      fc.property(fc.record({ ...buildArbs(), name: fc.constant('') }), (input) => {
        return projectSchema.safeParse(input).success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('rechaza proyectos con nombre que excede 100 caracteres', () => {
    fc.assert(
      fc.property(fc.record({ ...buildArbs(), name: longString(100) }), (input) => {
        return projectSchema.safeParse(input).success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('rechaza proyectos con descripción vacía', () => {
    fc.assert(
      fc.property(fc.record({ ...buildArbs(), description: fc.constant('') }), (input) => {
        return projectSchema.safeParse(input).success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('rechaza proyectos con descripción que excede 500 caracteres', () => {
    fc.assert(
      fc.property(fc.record({ ...buildArbs(), description: longString(500) }), (input) => {
        return projectSchema.safeParse(input).success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('rechaza proyectos con technologies vacío', () => {
    fc.assert(
      fc.property(fc.record({ ...buildArbs(), technologies: fc.constant([]) }), (input) => {
        return projectSchema.safeParse(input).success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('rechaza proyectos con URL inválida', () => {
    fc.assert(
      fc.property(fc.record({ ...buildArbs(), url: invalidUrl }), (input) => {
        return projectSchema.safeParse(input).success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('rechaza cualquier combinación con al menos un campo inválido', () => {
    // Pick one invalid field at random per run
    const invalidVariants = fc.oneof(
      fc.record({ ...buildArbs(), name: fc.constant('') }),
      fc.record({ ...buildArbs(), name: longString(100) }),
      fc.record({ ...buildArbs(), description: fc.constant('') }),
      fc.record({ ...buildArbs(), description: longString(500) }),
      fc.record({ ...buildArbs(), technologies: fc.constant([]) }),
      fc.record({ ...buildArbs(), url: invalidUrl })
    );

    fc.assert(
      fc.property(invalidVariants, (input) => {
        return projectSchema.safeParse(input).success === false;
      }),
      { numRuns: 100 }
    );
  });
});

/** Arbitraries for valid fields (used as base when overriding one invalid field) */
function buildArbs() {
  return {
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 500 }),
    technologies: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
    url: fc.webUrl(),
    imageUrl: fc.string(),
    imageAlt: fc.string(),
  };
}
