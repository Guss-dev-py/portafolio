import { useProjectsPage } from './projectsContext';
import type { SortMode } from './useProjectFilters';
import styles from '../admin.module.css';

const SORTS: { mode: SortMode; label: string; title?: string }[] = [
  { mode: 'updated', label: 'Modificado' },
  { mode: 'created', label: 'Creado' },
  { mode: 'name', label: 'A→Z' },
  {
    mode: 'manual',
    label: 'Orden',
    title: 'Orden manual: arrastrá las filas para reordenar el portfolio público',
  },
];

export function ProjectFilters() {
  const { filters } = useProjectsPage();
  const { search, setSearch, sortBy, setSortBy, filterTech, setFilterTech, allTechs, inputRef } = filters;

  return (
    <div className={styles.toolbar}>
      <div className={styles.searchWrap}>
        <span className={styles.searchGlyph}>/</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="buscar proyecto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.filterGroup}>
        {SORTS.map(({ mode, label, title }) => (
          <button
            key={mode}
            className={`${styles.filterBtn} ${sortBy === mode ? styles.filterActive : ''}`}
            onClick={() => setSortBy(mode)}
            title={title}
          >{label}</button>
        ))}
      </div>
      {/* Sin nombre accesible, un lector de pantalla lo anunciaba como
          "cuadro combinado" a secas. El texto de la opción por defecto no
          cuenta como label (WCAG 4.1.2). */}
      <select
        className={styles.techFilter}
        aria-label="Filtrar proyectos por tecnología"
        value={filterTech}
        onChange={e => setFilterTech(e.target.value)}
      >
        <option value="">Todas las techs</option>
        {allTechs.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  );
}
