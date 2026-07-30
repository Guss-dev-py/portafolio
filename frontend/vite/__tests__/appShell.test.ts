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
  it('trae el nombre, el rol y la bio del perfil', () => {
    const text = visibleText(renderAppShell());

    expect(text).toContain(`${profile.name} ${profile.lastName}`);
    expect(text).toContain(profile.role);
    expect(text).toContain(profile.intro);
    expect(text).toContain(profile.goals);
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

  it('deja bastante más texto que el <body> vacío que había antes', () => {
    // El HTML servido tenía 0 caracteres de texto en el body. El número exacto
    // no importa; que el orden de magnitud sea otro, sí.
    expect(visibleText(renderAppShell()).length).toBeGreaterThan(800);
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
