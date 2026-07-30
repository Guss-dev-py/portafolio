import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { NavigationBar } from "./components/NavigationBar/NavigationBar";
import { RegBar } from "./components/RegBar/RegBar";
import { HeroSection } from "./components/sections/HeroSection/HeroSection";
import { AboutSection } from "./components/sections/AboutSection/AboutSection";
import { ProjectsSection } from "./components/sections/ProjectsSection/ProjectsSection";
import { ContactSection } from "./components/sections/ContactSection/ContactSection";
import { Footer } from "./components/Footer/Footer";
import { ToastProvider } from "./components/Toast/Toast";
import { WorkStatusProvider } from "./hooks/WorkStatusProvider";
import { BackToTop } from "./components/BackToTop/BackToTop";
import { AuthGuard } from "./pages/admin/AuthGuard";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '48px', fontFamily: 'monospace', textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Algo salió mal.</p>
          <button onClick={() => window.location.reload()} style={{ cursor: 'pointer' }}>
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ParticlesBackground = lazy(() =>
  import("./components/ParticlesBackground/ParticlesBackground").then((m) => ({
    default: m.ParticlesBackground,
  })),
);

/**
 * El panel de administración va en chunks aparte. Es una herramienta de una
 * sola persona y viajaba entero en la carga inicial del sitio público: cada
 * visitante descargaba las tablas, los formularios y la paleta de comandos que
 * nunca va a ver. `AuthGuard` queda eager a propósito — son 20 líneas que sólo
 * leen el token y deciden el redirect, y meterlo en un chunk agregaría un
 * roundtrip antes de poder rechazar a un visitante sin sesión.
 */
const LoginPage = lazy(() =>
  import("./pages/admin/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const AdminLayout = lazy(() =>
  import("./pages/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const ProjectsPage = lazy(() => import("./pages/admin/ProjectsPage"));
const MessagesPage = lazy(() => import("./pages/admin/MessagesPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const LogsPage = lazy(() => import("./pages/admin/LogsPage"));

/**
 * Fallback de los chunks del admin. Sin CSS modules del admin a propósito: ese
 * CSS viaja en el mismo chunk que estamos esperando, así que usarlo dejaría el
 * fallback sin estilos justo cuando se lo necesita.
 *
 * El color y la tipografía salen de las custom properties de `index.css`, que
 * sí está en el chunk inicial: la invariante 12 de `CONTEXT.md` no admite
 * literales para eso. El padding queda literal porque el proyecto no tiene
 * escala de espaciado en tokens y no vale inventarle una acá.
 */
function ChunkFallback() {
  return (
    <div
      style={{
        padding: '48px',
        fontFamily: 'var(--mono)',
        fontSize: 'var(--fs-13)',
        color: 'var(--ink-dim)',
      }}
    >
      cargando…
    </div>
  );
}

/** Envuelve un elemento de ruta perezoso con su límite de Suspense. */
function lazyRoute(element: ReactNode) {
  return <Suspense fallback={<ChunkFallback />}>{element}</Suspense>;
}

function PortfolioApp() {
  return (
    // El masthead y el hero muestran el mismo estado laboral: un solo fetch
    // para los dos, desde acá.
    <WorkStatusProvider>
      <Suspense fallback={null}>
        <ParticlesBackground />
      </Suspense>

      <div className="page">
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        <RegBar />
        <NavigationBar />
        <main id="contenido">
          <HeroSection />
          <AboutSection />
          <ProjectsSection />
          <ContactSection />
        </main>
        <Footer />
        <BackToTop />
      </div>
    </WorkStatusProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={lazyRoute(<LoginPage />)} />
          <Route element={<AuthGuard />}>
            {/* Dos límites anidados: el de arriba espera el layout, el de cada
                página espera su propio chunk. Así el shell del admin aparece
                una sola vez y navegar entre secciones no lo desmonta. */}
            <Route path="/admin" element={lazyRoute(<AdminLayout />)}>
              <Route index element={<Navigate to="projects" replace />} />
              <Route path="projects" element={lazyRoute(<ProjectsPage />)} />
              <Route path="messages" element={lazyRoute(<MessagesPage />)} />
              <Route path="settings" element={lazyRoute(<SettingsPage />)} />
              <Route path="logs" element={lazyRoute(<LogsPage />)} />
            </Route>
          </Route>
          <Route path="/*" element={<PortfolioApp />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
