import { useState, FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import styles from './LoginPage.module.css';

interface LoginResponse {
  token: string;
  expiresIn: number;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionMessage = (location.state as { message?: string } | null)?.message;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiClient<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem('token', data.token);
      navigate('/admin');
    } catch {
      setError('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.icon} aria-hidden="true">🔐</span>
          <h1 className={styles.title}>Panel Admin</h1>
          <p className={styles.subtitle}>Acceso restringido</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {sessionMessage && (
            <p className={`${styles.alert} ${styles.alertWarning}`} role="status">
              {sessionMessage}
            </p>
          )}
          {error && (
            <p className={`${styles.alert} ${styles.alertError}`} role="alert">
              {error}
            </p>
          )}

          <div className={styles.field}>
            <label htmlFor="login-username">Usuario</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <Link to="/" className={styles.backLink}>
          ← Volver al portafolio
        </Link>
      </div>
    </div>
  );
}
