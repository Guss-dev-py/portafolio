import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminContext } from './adminContext';
import styles from './CommandPalette.module.css';

interface PaletteItem {
  id: string;
  label: string;
  hint: string;
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Paleta de comandos del panel (Ctrl/Cmd+K): acciones + proyectos. */
export function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { projectsApi, requestOpenCreate } = useAdminContext();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    const actions: PaletteItem[] = [
      { id: 'go-projects', label: 'Ir a Proyectos', hint: 'g p', run: () => navigate('/admin/projects') },
      { id: 'go-messages', label: 'Ir a Mensajes', hint: 'g m', run: () => navigate('/admin/messages') },
      { id: 'go-logs', label: 'Ir a Logs', hint: 'g l', run: () => navigate('/admin/logs') },
      { id: 'go-settings', label: 'Ir a Ajustes', hint: 'g s', run: () => navigate('/admin/settings') },
      {
        id: 'new-project',
        label: 'Nuevo proyecto',
        hint: 'n',
        run: () => {
          navigate('/admin/projects');
          // El handler se registra cuando ProjectsPage monta
          setTimeout(() => requestOpenCreate(), 80);
          requestOpenCreate();
        },
      },
      {
        id: 'logout',
        label: 'Cerrar sesión',
        hint: '',
        run: () => {
          localStorage.removeItem('token');
          navigate('/admin/login');
        },
      },
    ];
    const projectItems: PaletteItem[] = projectsApi.projects.map(p => ({
      id: `proj-${p.id}`,
      label: p.name,
      hint: 'proyecto',
      run: () => navigate('/admin/projects'),
    }));
    return [...actions, ...projectItems];
  }, [navigate, projectsApi.projects, requestOpenCreate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(it => it.label.toLowerCase().includes(q));
  }, [items, query]);

  // Foco al montar (side-effect del DOM; el padre monta la paleta recién al abrir)
  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 0);
    inputRef.current?.focus();
    return () => clearTimeout(id);
  }, []);

  if (!open) return null;

  // El reset de cursor es event-driven (no en un effect) para evitar renders en cascada
  const onQueryChange = (value: string) => {
    setQuery(value);
    setCursor(0);
  };

  const runItem = (item: PaletteItem | undefined) => {
    if (!item) return;
    item.run();
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runItem(filtered[cursor]);
    }
  };

  // Sin animación, a propósito: `Ctrl+K` es una acción de 100+ usos por día y a
  // esa frecuencia cualquier transición se convierte en una espera. Aparece y
  // desaparece instantánea. (Estándar de frecuencia de `review-animations`.)
  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label="Paleta de comandos">
      <div className={styles.palette} onClick={e => e.stopPropagation()}>
        <div className={styles.inputRow}>
          <span className={styles.glyph}>›</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="comando o proyecto..."
            aria-label="Buscar comando o proyecto"
            autoFocus
          />
          <kbd className={styles.kbd}>esc</kbd>
        </div>
        <ul className={styles.list} role="listbox">
          {filtered.length === 0 && <li className={styles.empty}>Sin resultados</li>}
          {filtered.map((item, i) => (
            <li
              key={item.id}
              role="option"
              aria-selected={i === cursor}
              className={`${styles.item} ${i === cursor ? styles.itemActive : ''}`}
              onMouseEnter={() => setCursor(i)}
              onClick={() => runItem(item)}
            >
              <span>{item.label}</span>
              {item.hint && <span className={styles.hint}>{item.hint}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
