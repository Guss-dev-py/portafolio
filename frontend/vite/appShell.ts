import { profile } from '../src/data/profile';
import { skillGroups } from '../src/data/skills';
import { contactLinks } from '../src/data/contact';

/**
 * Contenido de respaldo para clientes que no ejecutan JavaScript.
 *
 * El sitio es una SPA de Vite: el HTML servido tiene un `<div id="root">`
 * vacío y todo el texto aparece recién después de que corre el bundle. Google
 * renderiza JS y ve la página entera, pero los crawlers de ChatGPT, Perplexity
 * y Claude no: leen el HTML crudo y encuentran cero caracteres de texto.
 *
 * `main.tsx` monta con `createRoot()`, no con `hydrateRoot()`. React **vacía el
 * contenedor** en el primer render, así que lo que se inyecte acá adentro lo
 * lee un crawler sin JS y ningún visitante real llega a verlo. No es cloaking:
 * es el mismo contenido que la app renderiza, en texto plano.
 *
 * Se genera desde `src/data/` en tiempo de build para que no haya un segundo
 * lugar donde mantener la copy a mano.
 *
 * ⚠️ Límite conocido: el listado de proyectos sale de la base y no puede vivir
 * acá sin quedar viejo. Para esos crawlers, el canal es `public/llms.txt`.
 * Ver `docs/adr/0010-app-shell-para-crawlers-sin-javascript.md`.
 */

/** Escapa lo que va a interpolarse en el HTML. La data es nuestra, pero el
 *  generador no debería depender de eso para ser correcto. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderAppShell(): string {
  const fullName = `${profile.name} ${profile.lastName}`;

  const bio = profile.biography
    .split('\n\n')
    .map((p) => `<p>${escapeHtml(p.trim())}</p>`)
    .join('');

  const stack = skillGroups
    .map(
      (group) =>
        `<li>${escapeHtml(group.category)}: ${group.skills
          .map((s) => escapeHtml(s.name))
          .join(', ')}</li>`
    )
    .join('');

  const contacto = contactLinks
    .map((l) => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a></li>`)
    .join('');

  // `data-app-shell` es el gancho de estilo (ver `index.css`). Se le da forma
  // en vez de esconderlo: entre el primer pintado y el montaje de React esto
  // se ve, y tiene que leerse como la página cargando, no como un glitch.
  return [
    '<div data-app-shell>',
    `<h1>${escapeHtml(fullName)}</h1>`,
    `<p>${escapeHtml(profile.role)}</p>`,
    `<p>${escapeHtml(profile.intro)}</p>`,
    '<h2>Sobre mí</h2>',
    bio,
    '<h2>Objetivos</h2>',
    `<p>${escapeHtml(profile.goals)}</p>`,
    `<p>Sectores de interés: ${escapeHtml(profile.aspirationSector)}</p>`,
    '<h2>Stack</h2>',
    `<ul>${stack}</ul>`,
    '<h2>Proyectos</h2>',
    // El listado vive en la base y se renderiza con JS. Sin este puntero, un
    // crawler sin JS no tiene forma de saber que existe.
    '<p>El índice de proyectos se carga desde la API. La versión en texto plano está en <a href="/llms.txt">/llms.txt</a>.</p>',
    '<h2>Contacto</h2>',
    `<ul>${contacto}</ul>`,
    '</div>',
  ].join('');
}
