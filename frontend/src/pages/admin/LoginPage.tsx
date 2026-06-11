import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import styles from './LoginPage.module.css';

interface LoginResponse {
  token: string;
  expiresIn: number;
}

export function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Completá usuario y contraseña.');
      return;
    }
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
      setError('Credenciales inválidas. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUsername('');
    setPassword('');
    setError(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.cardHead}>
          <span className={styles.cardLabel}>freire@portafolio:~/admin</span>
          <div className={styles.dots}>
            <i className={styles.dot} />
            <i className={styles.dot} />
            <i className={`${styles.dot} ${styles.dotGreen}`} />
          </div>
        </div>

        {/* Shell intro */}
        <div className={styles.shellIntro}>
          <div className={styles.shellLine}>
            <span className={styles.prompt}>$</span>
            <span> ssh admin@portafolio.app</span>
          </div>
          <div className={styles.shellLine}>
            <span className={styles.muted}>Acceso restringido. Solo usuarios autorizados.</span>
          </div>
          <div className={styles.shellLine}>
            <span className={styles.prompt}>$</span>
            <span> login</span>
            <span className={styles.cursor} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={styles.errorAlert} role="alert">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="login-username">USUARIO</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputGlyph}>$</span>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password">CONTRASEÑA</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputGlyph}>#</span>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Conectando...' : '↵ Iniciar sesión'}
            </button>
            <button type="button" className={styles.clearBtn} onClick={handleClear}>
              Limpiar
            </button>
          </div>

          <p className={styles.hint}>
            › sesión expira a las 8h · acceso solo para admin
          </p>
        </form>

        {/* Footer */}
        <div className={styles.cardFoot}>
          <Link to="/" className={styles.backLink}>
            ← volver al portafolio público
          </Link>
          <span className={styles.footMeta}>JWT · 8H · BCRYPT</span>
        </div>
      </div>
    </div>
  );
}
