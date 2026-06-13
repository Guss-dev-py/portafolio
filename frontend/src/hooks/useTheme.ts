import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch { /* localStorage no disponible (SSR / privacidad) */ }
  return 'light';
}

/**
 * Tema claro/oscuro persistido. Aplica `data-theme` en <html>, que activa
 * los overrides de custom properties definidos en index.css.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch { /* noop */ }
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return { theme, toggleTheme };
}
