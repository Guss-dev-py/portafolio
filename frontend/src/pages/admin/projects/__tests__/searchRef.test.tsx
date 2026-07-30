/**
 * El atajo `/` del admin enfoca el buscador vía `searchRef`, que vive en
 * `AdminLayout` y lo consume con optional chaining (`searchRef.current?.focus()`).
 * Si el ref quedara sin apuntar a nada, el atajo **fallaría en silencio**: sin
 * error, sin test rojo, sin nada.
 *
 * Este test existe porque la descomposición de la Fase 3 cambió quién attachea
 * ese ref: antes el input y el effect de sincronización vivían en el mismo
 * componente; ahora el effect está en `ProjectsProvider` y el input lo renderiza
 * `ProjectFilters`, un hijo. El handoff depende de que React attachee los refs
 * de los hijos antes de correr los effects del padre.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AdminContext, type AdminContextValue } from '../../adminContext';
import { ToastProvider } from '../../../../components/Toast/Toast';
import ProjectsPage from '../../ProjectsPage';

function renderWithSearchRef(searchRef: AdminContextValue['searchRef']) {
  const ctx = {
    searchRef,
    requestOpenCreate: vi.fn(),
    setOpenCreateHandler: vi.fn(),
    projectsApi: {
      projects: [], loading: false, error: null, refetch: vi.fn(),
      addProject: vi.fn(), editProject: vi.fn(), removeProject: vi.fn(), reorder: vi.fn(),
    },
    messagesApi: { messages: [], loading: false, error: null, unreadCount: 0 },
  } as unknown as AdminContextValue;

  return render(
    <ToastProvider>
      <AdminContext value={ctx}>
        <ProjectsPage />
      </AdminContext>
    </ToastProvider>,
  );
}

describe('searchRef del admin', () => {
  it('el provider deja searchRef apuntando al input que renderiza el hijo', () => {
    const searchRef: AdminContextValue['searchRef'] = { current: null };
    renderWithSearchRef(searchRef);

    expect(searchRef.current).not.toBeNull();
    expect(searchRef.current?.placeholder).toBe('buscar proyecto...');
  });

  it('el input al que apunta es enfocable, que es para lo que existe el ref', () => {
    const searchRef: AdminContextValue['searchRef'] = { current: null };
    renderWithSearchRef(searchRef);

    searchRef.current?.focus();
    expect(document.activeElement).toBe(searchRef.current);
  });
});
