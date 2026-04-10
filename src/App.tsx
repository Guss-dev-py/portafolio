import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useActiveSection } from './hooks/useActiveSection';
import { NavigationBar } from './components/NavigationBar/NavigationBar';
import { HeroSection } from './components/sections/HeroSection/HeroSection';
import { AboutSection } from './components/sections/AboutSection/AboutSection';
import { ProjectsSection } from './components/sections/ProjectsSection/ProjectsSection';
import { ContactSection } from './components/sections/ContactSection/ContactSection';
import { profile } from './data/profile';
import { skillGroups, heroSkills } from './data/skills';
import { contactLinks } from './data/contact';
import { LoginPage } from './pages/admin/LoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AuthGuard } from './pages/admin/AuthGuard';
import ProjectsPage from './pages/admin/ProjectsPage';
import MessagesPage from './pages/admin/MessagesPage';
import type { SectionId } from './types';
import './App.css';

const SECTION_IDS: SectionId[] = ['inicio', 'sobre-mi', 'proyectos', 'contacto'];

function PortfolioApp() {
  const { theme, toggle } = useTheme();
  const activeSection = useActiveSection(SECTION_IDS);

  const scrollToProjects = () => {
    document.getElementById('proyectos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <NavigationBar
        activeSection={activeSection}
        theme={theme}
        onToggleTheme={toggle}
      />
      <main>
        <HeroSection
          name={profile.name}
          lastName={profile.lastName}
          role={profile.role}
          intro={profile.intro}
          skills={heroSkills}
          onCtaClick={scrollToProjects}
        />
        <AboutSection
          biography={profile.biography}
          goals={profile.goals}
          aspirationSector={profile.aspirationSector}
          skillGroups={skillGroups}
        />
        <ProjectsSection />
        <ContactSection links={contactLinks} />
      </main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<LoginPage />} />
        <Route element={<AuthGuard />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="messages" element={<MessagesPage />} />
          </Route>
        </Route>
        <Route path="/*" element={<PortfolioApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
