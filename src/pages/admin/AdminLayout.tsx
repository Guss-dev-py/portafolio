import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useMessages } from '../../hooks/useMessages';

export function AdminLayout() {
  const navigate = useNavigate();
  const { unreadCount } = useMessages();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: '200px', padding: '1rem', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2>Admin</h2>
        <NavLink to="/admin/projects">Proyectos</NavLink>
        <NavLink to="/admin/messages">
          Mensajes {unreadCount > 0 && <span>({unreadCount})</span>}
        </NavLink>
        <button onClick={handleLogout} style={{ marginTop: 'auto' }}>
          Cerrar sesión
        </button>
      </nav>
      <main style={{ flex: 1, padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
