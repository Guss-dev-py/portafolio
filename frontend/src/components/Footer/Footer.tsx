import { scrollToSection as scrollTo } from '../../utils/scroll';
import { useToast } from '../Toast/toastContext';
import { version } from '../../../package.json';
import styles from './Footer.module.css';

export function Footer() {
  const { toast } = useToast();
  const yr = new Date().getFullYear();

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('augustofreire02@gmail.com');
      toast({ title: 'Email copiado', msg: 'augustofreire02@gmail.com' });
    } catch {
      // El clipboard falla en contextos no seguros (http) o sin permiso.
      toast({ title: 'No se pudo copiar', msg: 'augustofreire02@gmail.com', variant: 'danger' });
    }
  };

  return (
    <footer className={`${styles.footer} footer`}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <div className={styles.brandName}>AUGUSTO</div>
          <div className={styles.brandSub}><em>Freire.</em></div>
          <p className={styles.tagline}>
            FullStack developer · Buenos Aires, AR.<br />
            Disponible para freelance y full-time.<br />
            Construyo productos digitales limpios y escalables.
          </p>
        </div>

        <div className={styles.col}>
          <p className={styles.colTitle}><span className={styles.sym}>//</span> Índice</p>
          <nav className={styles.navList}>
            <button type="button" onClick={() => scrollTo('inicio')}>
              <span className={styles.linkNum}>00</span> · Inicio
            </button>
            <button type="button" onClick={() => scrollTo('sobre')}>
              <span className={styles.linkNum}>01</span> · Sobre mí
            </button>
            <button type="button" onClick={() => scrollTo('proyectos')}>
              <span className={styles.linkNum}>02</span> · Proyectos
            </button>
            <button type="button" onClick={() => scrollTo('contacto')}>
              <span className={styles.linkNum}>03</span> · Contacto
            </button>
          </nav>
        </div>

        <div className={styles.col}>
          <p className={styles.colTitle}><span className={styles.sym}>//</span> Redes</p>
          <nav className={styles.navList}>
            <button type="button" onClick={copyEmail} className={styles.copyBtn}>augustofreire02@gmail.com</button>
            <a href="https://github.com/Guss-dev-py" target="_blank" rel="noopener noreferrer">github.com/Guss-dev-py</a>
            <a href="https://www.linkedin.com/in/augusto-freire-web" target="_blank" rel="noopener noreferrer">linkedin · augusto-freire-web</a>
          </nav>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {yr} Augusto Freire · Todos los derechos reservados</span>
        <span>v{version} · construido con React · Vite · Postgres</span>
      </div>
    </footer>
  );
}
