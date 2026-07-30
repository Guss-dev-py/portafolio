import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Project } from '../../../types';

export type SortMode = 'updated' | 'created' | 'name' | 'manual';

/**
 * Búsqueda, orden y filtro por tecnología. Devuelve además `canDrag`, porque
 * la habilitación del arrastre es una consecuencia del estado de los filtros y
 * no una decisión independiente: reordenar viendo una lista recortada movería
 * posiciones que el usuario no tiene delante.
 */
export function useProjectFilters(
  projects: Project[],
  searchRef: RefObject<HTMLInputElement | null>,
) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortMode>('updated');
  const [filterTech, setFilterTech] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // sync external ref once on mount (refs don't change identity)
  useEffect(() => {
    searchRef.current = inputRef.current;
  }, [searchRef]);

  const allTechs = useMemo(
    () => Array.from(new Set(projects.flatMap(p => p.technologies))).sort(),
    [projects],
  );

  // Filtrar y ordenar van en memos separados: cambiar el orden no tiene por qué
  // volver a recorrer los filtros, que son la parte cara.
  const matching = useMemo(() => projects
    .filter(p => {
      const q = search.toLowerCase();
      return !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    })
    .filter(p => !filterTech || p.technologies.includes(filterTech)),
  [projects, search, filterTech]);

  const filtered = useMemo(() => {
    // En modo manual se respeta el orden del array (= position en DB)
    if (sortBy === 'manual') return matching;
    // Copia antes de ordenar: `matching` está memoizado y `sort` mutaría el
    // array cacheado, así que el próximo render leería un orden ya alterado.
    return [...matching].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [matching, sortBy]);

  // Arrastrar solo tiene sentido viendo la lista completa en orden manual
  const canDrag = sortBy === 'manual' && !search && !filterTech;

  return {
    search, setSearch,
    sortBy, setSortBy,
    filterTech, setFilterTech,
    allTechs, filtered, canDrag, inputRef,
  };
}
