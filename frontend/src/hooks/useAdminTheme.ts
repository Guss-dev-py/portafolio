import { useEffect, useState } from 'react';

export type AdminTheme = 'paper' | 'hacker';

function initialAdminTheme(): AdminTheme {
  try {
    const stored = localStorage.getItem('admin-theme');
    if (stored === 'hacker' || stored === 'paper') return stored;
  } catch { /* localStorage no disponible */ }
  return 'paper';
}

/**
 * Tema del panel admin, independiente del tema del sitio público (data-theme).
 * Aplica `data-admin-theme="hacker"` en <html> mientras el panel está montado;
 * al desmontar se limpia para que el sitio público nunca lo herede.
 */
export function useAdminTheme() {
  const [theme, setTheme] = useState<AdminTheme>(initialAdminTheme);

  useEffect(() => {
    if (theme === 'hacker') {
      document.documentElement.dataset.adminTheme = 'hacker';
    } else {
      delete document.documentElement.dataset.adminTheme;
    }
    try {
      localStorage.setItem('admin-theme', theme);
    } catch { /* noop */ }
  }, [theme]);

  useEffect(() => {
    return () => {
      delete document.documentElement.dataset.adminTheme;
    };
  }, []);

  const toggleTheme = () => setTheme(t => (t === 'paper' ? 'hacker' : 'paper'));

  return { theme, toggleTheme };
}
