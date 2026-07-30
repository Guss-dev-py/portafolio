import type { Plugin } from 'vite';
import { renderAppShell } from './appShell';

/** Marca exacta que trae `index.html`. Si cambia allá, el build tiene que fallar. */
const ROOT_DIV = '<div id="root"></div>';

/**
 * Inyecta el contenido de respaldo dentro de `#root` en el HTML final.
 *
 * Sólo en build: en `vite dev` el fallback estorbaría al ver el HTML servido y
 * no aporta nada, porque ningún crawler mira el dev server.
 */
export function appShellPlugin(): Plugin {
  return {
    name: 'app-shell-fallback',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!html.includes(ROOT_DIV)) {
          // Fallar el build es deliberado: si esto pasara en silencio, el sitio
          // volvería a servirse sin texto y nadie se enteraría hasta la próxima
          // auditoría de SEO.
          throw new Error(
            `[app-shell-fallback] No encontré ${ROOT_DIV} en index.html. ` +
              'Si cambió el contenedor de montaje, actualizá ROOT_DIV en vite/appShellPlugin.ts.'
          );
        }
        return html.replace(ROOT_DIV, `<div id="root">${renderAppShell()}</div>`);
      },
    },
  };
}
