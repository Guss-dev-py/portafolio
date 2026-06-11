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
import { LoginPage } from "./pages/admin/LoginPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AuthGuard } from "./pages/admin/AuthGuard";
import ProjectsPage from "./pages/admin/ProjectsPage";
import MessagesPage from "./pages/admin/MessagesPage";
import SettingsPage from "./pages/admin/SettingsPage";

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

function PortfolioApp() {
  return (
    <>
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
      </div>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route element={<AuthGuard />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="projects" replace />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="settings" element={<SettingsPage />} />
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
