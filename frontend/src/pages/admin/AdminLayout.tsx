import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { scrimFade } from '../../motion/variants';
import { useMessages } from '../../hooks/useMessages';
import { useProjects } from '../../hooks/useProjects';
import { apiClient } from '../../api/client';
import { AdminContext } from './adminContext';
import { AdminThemeToggle } from './AdminThemeToggle';
import { CommandPalette } from './CommandPalette';
import { useUnreadTitle } from '../../hooks/useUnreadTitle';
import styles from './AdminLayout.module.css';

interface HealthState {
  api: boolean;
  db: boolean;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `${styles.navLink} ${isActive ? styles.active : ''}`;

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesApi = useMessages();
  const projectsApi = useProjects();
  const { messages, unreadCount } = messagesApi;
  const { projects } = projectsApi;

  useUnreadTitle(unreadCount);

  const [now, setNow] = useState(new Date());
  const [health, setHealth] = useState<HealthState | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // useState con inicializador lazy en vez de useRef(Date.now()):
  // llamar funciones impuras o leer refs durante el render viola las reglas de React.
  const [startTime] = useState(() => Date.now());
  const searchRef = useRef<HTMLInputElement | null>(null);
  const openCreateRef = useRef<(() => void) | null>(null);

  const setOpenCreateHandler = useCallback((fn: (() => void) | null) => {
    openCreateRef.current = fn;
  }, []);

  const requestOpenCreate = useCallback(() => {
    if (openCreateRef.current) openCreateRef.current();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      apiClient<{ status: string; db: string }>('/api/health')
        .then((h) => { if (!cancelled && h) setHealth({ api: h.status === 'ok', db: h.db === 'ok' }); })
        .catch(() => { if (!cancelled) setHealth({ api: false, db: false }); });
    };
    check();
    const id = setInterval(check, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    let leaderMode = false;
    let leaderTimer: ReturnType<typeof setTimeout> | null = null;

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }

      if (e.key === 'Escape') {
        leaderMode = false;
        return;
      }

      if (leaderMode) {
        if (e.key === 'p') { navigate('/admin/projects'); leaderMode = false; }
        if (e.key === 'm') { navigate('/admin/messages'); leaderMode = false; }
        if (e.key === 's') { navigate('/admin/settings'); leaderMode = false; }
        if (e.key === 'l') { navigate('/admin/logs'); leaderMode = false; }
        if (leaderTimer) clearTimeout(leaderTimer);
        return;
      }

      if (isInput) return;

      if (e.key === '/') {
        e.preventDefault();
        navigate('/admin/projects');
        setTimeout(() => searchRef.current?.focus(), 80);
        return;
      }

      if (e.key === 'n') {
        requestOpenCreate();
        return;
      }

      if (e.key === 'g') {
        leaderMode = true;
        leaderTimer = setTimeout(() => { leaderMode = false; }, 1200);
        return;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate, requestOpenCreate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const routeLabel = location.pathname.replace('/admin', '') || '/';

  return (
    <AdminContext.Provider value={{ searchRef, requestOpenCreate, setOpenCreateHandler, projectsApi, messagesApi }}>
      <div className={styles.layout}>
        <div className={styles.menubar}>
          <button
            type="button"
            className={styles.menuToggle}
            aria-label={sidebarOpen ? 'Cerrar navegación' : 'Abrir navegación'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(v => !v)}
          >
            ≡
          </button>
          <span className={styles.menuBrand}>▌ FREIRE/ADMIN</span>
          <span className={styles.menuSpacer} />
          <AdminThemeToggle />
          <span className={styles.menuInfo}>
            augusto@portafolio · {formatDate(now)} · {formatTime(now)}
          </span>
        </div>

        <div className={styles.workspace}>
          {/* El aside ya transiciona por CSS; lo que faltaba era que el scrim
              se desvaneciera en vez de desaparecer de golpe. */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                className={styles.sideBackdrop}
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
                variants={scrimFade}
                initial="hidden"
                animate="visible"
                exit="exit"
              />
            )}
          </AnimatePresence>
          <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
            <div className={styles.sideHead}>
              <p className={styles.sideEyebrow}>SESIÓN ACTIVA</p>
              <p className={styles.sideName}>◆ augusto</p>
              <p className={styles.sideHost}>portafolio · admin</p>
            </div>

            <p className={styles.sideSection}>── Navegación ──</p>
            {/* Cerrar el drawer (mobile) al tocar cualquier link: event-driven, sin effect */}
            <nav className={styles.nav} aria-label="Navegación del panel" onClick={() => setSidebarOpen(false)}>
              <NavLink to="/admin/projects" className={navClass}>
                <span className={styles.glyph}>[P]</span> Proyectos
              </NavLink>
              <NavLink to="/admin/messages" className={navClass}>
                <span className={styles.glyph}>[M]</span> Mensajes
                {unreadCount > 0 && (
                  <span className={styles.badge} aria-label={`${unreadCount} no leídos`}>
                    {unreadCount}
                  </span>
                )}
              </NavLink>
              <NavLink to="/admin/logs" className={navClass}>
                <span className={styles.glyph}>[L]</span> Logs
              </NavLink>
              <NavLink to="/admin/settings" className={navClass}>
                <span className={styles.glyph}>[S]</span> Ajustes
              </NavLink>
            </nav>

            <p className={styles.sideSection}>── Atajos ──</p>
            <div className={styles.kbdList}>
              <div className={styles.kbdRow}>
                <kbd className={styles.kbd}>/</kbd>
                <span>buscar</span>
              </div>
              <div className={styles.kbdRow}>
                <kbd className={styles.kbd}>n</kbd>
                <span>nuevo proyecto</span>
              </div>
              <div className={styles.kbdRow}>
                <kbd className={styles.kbd}>g</kbd>
                <kbd className={styles.kbd}>p</kbd>
                <span>ir a proyectos</span>
              </div>
              <div className={styles.kbdRow}>
                <kbd className={styles.kbd}>g</kbd>
                <kbd className={styles.kbd}>m</kbd>
                <span>ir a mensajes</span>
              </div>
              <div className={styles.kbdRow}>
                <kbd className={styles.kbd}>g</kbd>
                <kbd className={styles.kbd}>s</kbd>
                <span>ir a ajustes</span>
              </div>
              <div className={styles.kbdRow}>
                <kbd className={styles.kbd}>ctrl</kbd>
                <kbd className={styles.kbd}>k</kbd>
                <span>paleta de comandos</span>
              </div>
              <div className={styles.kbdRow}>
                <kbd className={styles.kbd}>esc</kbd>
                <span>cerrar diálogo</span>
              </div>
            </div>

            <div className={styles.sideFoot}>
              <p className={styles.sideVersion}>
                API · {health === null ? '...' : health.api ? 'ok' : 'sin respuesta'}
              </p>
              <p className={styles.sideVersion}>
                DB · {health === null ? '...' : health.db ? 'ok' : 'error'}
              </p>
              <button
                type="button"
                className={styles.logoutBtn}
                onClick={handleLogout}
              >
                ↩ Cerrar sesión
              </button>
            </div>
          </aside>

          <main className={styles.main}>
            <Outlet />
          </main>

          {/* Sin AnimatePresence: la paleta no anima (ver CommandPalette.tsx) */}
          {paletteOpen && <CommandPalette open onClose={() => setPaletteOpen(false)} />}
        </div>

        <div className={styles.statusbar}>
          <span className={health === null || health.api ? styles.statusConn : styles.statusErr}>
            {health === null ? '○ CONECTANDO' : health.api ? '● CONECTADO' : '○ SIN CONEXIÓN'}
          </span>
          <span className={styles.statusSep}>·</span>
          <span>RUTA: /admin{routeLabel}</span>
          <span className={styles.statusSep}>·</span>
          <span>PROY: {projects.length}</span>
          <span className={styles.statusSep}>·</span>
          <span>MSG: {messages.length} ({unreadCount} no leídos)</span>
          <span className={styles.statusSep}>·</span>
          <span>UPTIME: {formatUptime(now.getTime() - startTime)}</span>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
