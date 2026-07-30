/**
 * El fallback existe para un solo lector: un crawler que no ejecuta JS. Lo que
 * importa es que traiga texto real y que salga del mismo `src/data/` que el
 * resto del sitio, no de una copia escrita a mano.
 */

import { describe, it, expect } from 'vitest';
import { renderAppShell } from '../appShell';
import { appShellPlugin } from '../appShellPlugin';
import { profile } from '../../src/data/profile';
import { skillGroups } from '../../src/data/skills';
import { contactLinks } from '../../src/data/contact';

/** Lo que ve un crawler: el HTML sin etiquetas. */
function visibleText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

describe('renderAppShell', () => {
  it('trae la identidad: nombre, rol e intro', () => {
    const text = visibleText(renderAppShell());

    expect(text).toContain(`${profile.name} ${profile.lastName}`);
    expect(text).toContain(profile.role);
    expect(text).toContain(profile.intro);
  });

  // Medido en la Fase 6.2: la versión larga costaba ~540 ms de LCP porque el
  // navegador la pinta y después React la borra y repinta. La bio completa vive
  // en /llms.txt, que los mismos crawlers leen sin costo de pintado.
  it('NO trae la bio larga ni los objetivos: es deliberadamente mínimo', () => {
    const text = visibleText(renderAppShell());

    // Literales y no campos de `profile`: esos tres campos se borraron en la
    // auditoría de 6.6 justamente por no tener consumidor. El test protege el
    // tamaño del shell, así que tiene que sobrevivir a que la copy se mueva.
    expect(text).not.toMatch(/objetivo profesional/i);
    expect(text).not.toMatch(/Sectores de inter/i);
    expect(text).not.toMatch(/primeros ejercicios en Python/i);
  });

  it('apunta a /llms.txt para lo que no está acá', () => {
    expect(visibleText(renderAppShell())).toMatch(/Biograf.a completa e .ndice de proyectos/);
  });

  it('lista todas las tecnologías de skillGroups', () => {
    const text = visibleText(renderAppShell());

    for (const group of skillGroups) {
      expect(text).toContain(group.category);
      for (const skill of group.skills) {
        expect(text).toContain(skill.name);
      }
    }
  });

  it('incluye los enlaces de contacto como <a> navegables', () => {
    const html = renderAppShell();

    for (const link of contactLinks) {
      expect(html).toContain(`href="${link.href}"`);
    }
  });

  it('apunta a /llms.txt para el listado de proyectos, que es dato vivo', () => {
    expect(renderAppShell()).toContain('href="/llms.txt"');
  });

  it('escapa el HTML de los datos', () => {
    // La data es nuestra, pero el generador no debe depender de eso.
    expect(renderAppShell()).not.toMatch(/<script/i);
  });

  it('deja texto real donde antes había cero, sin volver a inflarse', () => {
    // El <body> servido tenía 0 caracteres. El piso protege el propósito; el
    // techo protege el LCP: si alguien vuelve a meter la bio larga acá, este
    // test lo frena antes de que se note en Lighthouse.
    const largo = visibleText(renderAppShell()).length;
    expect(largo).toBeGreaterThan(250);
    expect(largo).toBeLessThan(700);
  });
});

describe('appShellPlugin', () => {
  /** `transformIndexHtml` es un objeto con `handler` en la forma que usamos. */
  function transform(html: string): string {
    const plugin = appShellPlugin();
    const hook = plugin.transformIndexHtml;
    if (typeof hook !== 'object' || !hook.handler) throw new Error('hook inesperado');
    return hook.handler.call(
      // El handler no usa `this` ni los argumentos de contexto de Vite.
      null as never,
      html,
      null as never
    ) as string;
  }

  it('inyecta el fallback adentro de #root', () => {
    const out = transform('<body><div id="root"></div></body>');

    expect(out).toContain('<div id="root"><div data-app-shell>');
    expect(out).toContain(profile.role);
    // Fuera de #root no se toca nada: React sólo vacía su propio contenedor.
    expect(out.startsWith('<body>')).toBe(true);
  });

  it('rompe el build si #root dejó de existir con esa forma', () => {
    // Sin esto, un rename del contenedor volvería a servir el sitio sin texto
    // y nadie se enteraría hasta la próxima auditoría.
    expect(() => transform('<body><div id="app"></div></body>')).toThrow(/No encontré/);
  });
});
