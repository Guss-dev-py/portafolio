import { useEffect } from 'react';
import type { Project } from '../types';
import { resolveAssetUrl } from '../api/client';

const SITE = 'https://freire.ucielbustamante.com';
const PERSON_ID = `${SITE}/#persona`;

/** Vuelve absoluta cualquier URL: schema.org no admite rutas relativas. */
function absolute(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  const resolved = resolveAssetUrl(url);
  if (/^https?:\/\//.test(resolved)) return resolved;
  return SITE + (resolved.startsWith('/') ? resolved : `/${resolved}`);
}

/**
 * `ItemList` de proyectos, con cada ítem como `SoftwareSourceCode`.
 *
 * Se construye desde los datos vivos de la API y no desde una constante en
 * `index.html`: si estuviera hardcodeado, renombrar un proyecto desde el admin
 * dejaría el structured data mintiendo, sin que nada avisara.
 *
 * `codeRepository` se omite cuando no hay repo (hoy 2 de 3 son privados). Una
 * cadena vacía sería un dato inválido, no un dato ausente.
 */
export function buildProjectsItemList(projects: Project[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE}/#proyectos`,
    name: 'Proyectos de Augusto Freire',
    numberOfItems: projects.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: projects.map((p, i) => {
      const item: Record<string, unknown> = {
        '@type': 'SoftwareSourceCode',
        name: p.name,
        description: p.description,
        url: absolute(p.url),
        author: { '@id': PERSON_ID },
      };
      if (p.technologies.length) item.programmingLanguage = p.technologies;
      if (p.repoUrl) item.codeRepository = absolute(p.repoUrl);
      if (p.imageUrl) item.image = absolute(p.imageUrl);
      return { '@type': 'ListItem', position: i + 1, item };
    }),
  };
}

/**
 * Publica el ItemList en un `<script type="application/ld+json">` del head.
 *
 * Se escribe con `textContent` y no con `dangerouslySetInnerHTML` ni con un
 * hijo de texto de JSX: el contenido de un script no se parsea como HTML, así
 * que una descripción que contenga `</script>` queda como texto literal y no
 * puede romper el documento. No hace falta escapar nada a mano.
 */
export function useProjectsJsonLd(projects: Project[]) {
  useEffect(() => {
    if (projects.length === 0) return;

    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.dataset.jsonld = 'proyectos';
    el.textContent = JSON.stringify(buildProjectsItemList(projects));
    document.head.appendChild(el);

    return () => el.remove();
  }, [projects]);
}
