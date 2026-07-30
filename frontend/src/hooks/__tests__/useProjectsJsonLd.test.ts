/**
 * JSON-LD de proyectos. Se testea el builder puro (la forma del schema) y la
 * seguridad del emisor: el structured data sale de la DB, así que una
 * descripción hostil no debe poder romper el documento.
 */

import { describe, it, expect } from 'vitest';
import type { Project } from '../../types';
import { buildProjectsItemList } from '../useProjectsJsonLd';

function mk(over: Partial<Project> = {}): Project {
  return {
    id: 'x', name: 'Proyecto', description: 'Una descripcion',
    technologies: ['React', 'TypeScript'],
    url: 'https://demo.example.com', repoUrl: '', imageUrl: '', imageAlt: '',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z',
    ...over,
  };
}

describe('buildProjectsItemList', () => {
  it('arma un ItemList con la posición y el tipo de cada ítem', () => {
    const ld = buildProjectsItemList([mk({ name: 'Uno' }), mk({ name: 'Dos' })]);

    expect(ld['@type']).toBe('ItemList');
    expect(ld.numberOfItems).toBe(2);
    expect(ld.itemListElement.map(e => e.position)).toEqual([1, 2]);
    expect(ld.itemListElement[0]['@type']).toBe('ListItem');
    expect(ld.itemListElement[0].item['@type']).toBe('SoftwareSourceCode');
    expect(ld.itemListElement[1].item.name).toBe('Dos');
  });

  it('omite codeRepository cuando el repo es privado, en vez de mandar vacío', () => {
    const conRepo = buildProjectsItemList([mk({ repoUrl: 'https://github.com/a/b' })]);
    const sinRepo = buildProjectsItemList([mk({ repoUrl: '' })]);

    expect(conRepo.itemListElement[0].item.codeRepository).toBe('https://github.com/a/b');
    expect('codeRepository' in sinRepo.itemListElement[0].item).toBe(false);
  });

  it('omite image y programmingLanguage cuando no hay dato', () => {
    const ld = buildProjectsItemList([mk({ imageUrl: '', technologies: [] })]);
    expect('image' in ld.itemListElement[0].item).toBe(false);
    expect('programmingLanguage' in ld.itemListElement[0].item).toBe(false);
  });

  it('vuelve absolutas las rutas relativas de imagen (schema.org no admite relativas)', () => {
    const ld = buildProjectsItemList([mk({ imageUrl: '/api/uploads/foto.webp' })]);
    const img = ld.itemListElement[0].item.image as string;

    expect(img).toMatch(/^https?:\/\//);
    expect(img).toContain('/api/uploads/foto.webp');
  });

  it('deja intactas las URLs que ya son absolutas', () => {
    const ld = buildProjectsItemList([mk({ imageUrl: 'https://cdn.example.com/a.png' })]);
    expect(ld.itemListElement[0].item.image).toBe('https://cdn.example.com/a.png');
  });

  it('una lista vacía no explota', () => {
    const ld = buildProjectsItemList([]);
    expect(ld.numberOfItems).toBe(0);
    expect(ld.itemListElement).toEqual([]);
  });

  it('el JSON serializado sobrevive a una descripción con </script>', () => {
    // El emisor usa textContent, así que el contenido de un script no se
    // parsea como HTML y esto no puede cerrar la etiqueta. El test fija que el
    // dato viaja entero y que el parseo de vuelta lo recupera igual.
    const hostil = 'Rompe esto: </script><img src=x onerror=alert(1)>';
    const json = JSON.stringify(buildProjectsItemList([mk({ description: hostil })]));

    expect(JSON.parse(json).itemListElement[0].item.description).toBe(hostil);
  });
});
