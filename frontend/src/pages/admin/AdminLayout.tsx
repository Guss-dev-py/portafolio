import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useMessages } from '../../hooks/useMessages';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  const navigate = useNavigate();
  const { unreadCount } = useMessages();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden="true">⚙️</span>
          <span className={styles.brandName}>Admin</span>
        </div>

        <nav className={styles.nav} aria-label="Navegación del panel">
          <NavLink
            to="/admin/projects"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon} aria-hidden="true">📁</span>
            Proyectos
          </NavLink>

          <NavLink
            to="/admin/messages"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon} aria-hidden="true">✉️</span>
            Mensajes
            {unreadCount > 0 && (
              <span className={styles.badge} aria-label={`${unreadCount} no leídos`}>
                {unreadCount}
              </span>
            )}
          </NavLink>
        </nav>

        <button
          type="button"
          className={styles.logoutBtn}
          onClick={handleLogout}
        >
          <span aria-hidden="true">↩</span>
          Cerrar sesión
        </button>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
