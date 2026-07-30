/**
 * Tests de ProjectsPage: render de filas (property), búsqueda, validación del
 * formulario y eliminación con confirmación.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import type { Project } from '../../../types';
import { AdminContext, type AdminContextValue } from '../adminContext';
import { ToastProvider } from '../../../components/Toast/Toast';

vi.mock('../../../api/projects', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  uploadImage: vi.fn(),
}));

import ProjectsPage from '../ProjectsPage';
import { uploadImage } from '../../../api/projects';

type ProjectsApi = AdminContextValue['projectsApi'];

function makeProject(i: number): Project {
  return {
    id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
    name: `Proyecto ${i}`,
    description: `Descripción del proyecto ${i}`,
    technologies: ['React', 'TypeScript'],
    url: `https://example.com/p${i}`,
    repoUrl: '',
    imageUrl: '',
    imageAlt: '',
    createdAt: new Date(Date.now() - i * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - i * 3_600_000).toISOString(),
  };
}

function makeProjectsApi(projects: Project[], overrides: Partial<ProjectsApi> = {}): ProjectsApi {
  return {
    projects,
    loading: false,
    error: null,
    refetch: vi.fn(),
    addProject: vi.fn(async () => makeProject(99)),
    editProject: vi.fn(async (id: string) => projects.find(p => p.id === id)!),
    removeProject: vi.fn(async () => {}),
    reorder: vi.fn(async () => {}),
    ...overrides,
  } as unknown as ProjectsApi;
}

function renderPage(projectsApi: ProjectsApi) {
  const ctx: AdminContextValue = {
    searchRef: { current: null },
    requestOpenCreate: vi.fn(),
    setOpenCreateHandler: vi.fn(),
    projectsApi,
    messagesApi: {
      messages: [],
      loading: false,
      error: null,
      readMessage: vi.fn(),
      removeMessage: vi.fn(),
      unreadCount: 0,
    } as unknown as AdminContextValue['messagesApi'],
  };
  return render(
    <ToastProvider>
      <AdminContext.Provider value={ctx}>
        <ProjectsPage />
      </AdminContext.Provider>
    </ToastProvider>,
  );
}

describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('property: renderiza una fila por proyecto y el total coincide', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10 }), (n) => {
        const projects = Array.from({ length: n }, (_, i) => makeProject(i + 1));
        const { container, unmount } = renderPage(makeProjectsApi(projects));

        // La primera fila es el encabezado de la tabla
        const rows = container.querySelectorAll('[class*="tableRow"]');
        expect(rows.length).toBe(n + 1);
        expect(screen.getByText(`─── FIN DEL LISTADO · ${n} REGISTRO(S) ───`)).toBeInTheDocument();
        unmount();
      }),
      { numRuns: 15 },
    );
  });

  it('la búsqueda filtra por nombre o descripción', () => {
    renderPage(makeProjectsApi([makeProject(1), makeProject(2)]));

    fireEvent.change(screen.getByPlaceholderText('buscar proyecto...'), {
      target: { value: 'Proyecto 2' },
    });

    expect(screen.queryByText('Proyecto 1')).not.toBeInTheDocument();
    expect(screen.getByText('Proyecto 2')).toBeInTheDocument();
  });

  it('submit del formulario vacío muestra errores y no llama a addProject', () => {
    const api = makeProjectsApi([]);
    renderPage(api);

    fireEvent.click(screen.getByRole('button', { name: '+ Nuevo proyecto [n]' }));
    fireEvent.click(screen.getByRole('button', { name: '↵ Crear proyecto' }));

    expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    expect(screen.getByText('La descripción es requerida')).toBeInTheDocument();
    expect(screen.getByText('Al menos una tecnología es requerida')).toBeInTheDocument();
    expect(screen.getByText('La URL debe ser válida')).toBeInTheDocument();
    expect(api.addProject).not.toHaveBeenCalled();
  });

  it('formulario válido crea el proyecto y cierra el form', async () => {
    const api = makeProjectsApi([]);
    renderPage(api);

    fireEvent.click(screen.getByRole('button', { name: '+ Nuevo proyecto [n]' }));
    fireEvent.change(screen.getByLabelText('NOMBRE *'), { target: { value: 'Mi App' } });
    fireEvent.change(screen.getByLabelText('DESCRIPCIÓN *'), { target: { value: 'Una app de prueba' } });
    fireEvent.change(screen.getByLabelText(/TECNOLOGÍAS \*/), { target: { value: 'React, Node' } });
    fireEvent.change(screen.getByLabelText('URL DEL PROYECTO *'), { target: { value: 'https://miapp.com' } });
    fireEvent.click(screen.getByRole('button', { name: '↵ Crear proyecto' }));

    await waitFor(() => expect(api.addProject).toHaveBeenCalledOnce());
    expect(api.addProject).toHaveBeenCalledWith({
      name: 'Mi App',
      description: 'Una app de prueba',
      technologies: ['React', 'Node'],
      url: 'https://miapp.com',
      repoUrl: '',
      imageUrl: '',
      imageAlt: '',
    });
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '↵ Crear proyecto' })).not.toBeInTheDocument(),
    );
  });

  it('editar precarga el formulario con los datos del proyecto', () => {
    const project = makeProject(1);
    renderPage(makeProjectsApi([project]));

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    expect(screen.getByLabelText('NOMBRE *')).toHaveValue(project.name);
    expect(screen.getByLabelText('DESCRIPCIÓN *')).toHaveValue(project.description);
    expect(screen.getByLabelText(/TECNOLOGÍAS \*/)).toHaveValue('React, TypeScript');
    expect(screen.getByText(`┌─ editando: ${project.name}`)).toBeInTheDocument();
  });

  it('eliminar pide confirmación y recién ahí llama a removeProject', async () => {
    const project = makeProject(1);
    const api = makeProjectsApi([project]);
    renderPage(api);

    // El botón "Eliminar" de la fila abre el diálogo
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(api.removeProject).not.toHaveBeenCalled();

    // El diálogo agrega un segundo botón "Eliminar" (el de confirmación)
    const confirmBtn = screen.getAllByRole('button', { name: 'Eliminar' }).at(-1)!;
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(api.removeProject).toHaveBeenCalledExactlyOnceWith(project.id));
  });

  it('sin proyectos muestra el estado vacío', () => {
    renderPage(makeProjectsApi([]));
    expect(screen.getByText('No hay proyectos. Agregá el primero.')).toBeInTheDocument();
  });

  it('el formulario muestra una vista previa de la fila pública', () => {
    const { container } = renderPage(makeProjectsApi([]));

    fireEvent.click(screen.getByRole('button', { name: '+ Nuevo proyecto [n]' }));
    fireEvent.change(screen.getByLabelText('NOMBRE *'), { target: { value: 'Mi App' } });
    fireEvent.change(screen.getByLabelText('DESCRIPCIÓN *'), { target: { value: 'Una demo' } });
    fireEvent.change(screen.getByLabelText(/TECNOLOGÍAS \*/), { target: { value: 'React' } });

    const preview = container.querySelector('[class*="previewRow"]')!;
    expect(preview).not.toBeNull();
    expect(preview.textContent).toContain('Mi App');
    expect(preview.textContent).toContain('.proj');
    expect(preview.textContent).toContain('Una demo');
    expect(preview.textContent).toContain('React');
  });

  describe('cambios sin guardar', () => {
    it('cancelar con cambios pide confirmación antes de descartar', () => {
      renderPage(makeProjectsApi([]));

      fireEvent.click(screen.getByRole('button', { name: '+ Nuevo proyecto [n]' }));
      fireEvent.change(screen.getByLabelText('NOMBRE *'), { target: { value: 'Borrador' } });
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

      // El form sigue abierto y aparece el diálogo
      expect(screen.getByLabelText('NOMBRE *')).toBeInTheDocument();
      expect(screen.getByText(/Descartar cambios/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));
      expect(screen.queryByLabelText('NOMBRE *')).not.toBeInTheDocument();
    });

    it('cancelar sin cambios cierra directo, sin diálogo', () => {
      renderPage(makeProjectsApi([]));

      fireEvent.click(screen.getByRole('button', { name: '+ Nuevo proyecto [n]' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(screen.queryByLabelText('NOMBRE *')).not.toBeInTheDocument();
      expect(screen.queryByText('Descartar cambios')).not.toBeInTheDocument();
    });
  });

  it('mientras carga muestra filas skeleton en vez de texto plano', () => {
    const { container } = renderPage(makeProjectsApi([], { loading: true } as never));
    expect(container.querySelectorAll('[class*="skelRow"]').length).toBeGreaterThan(0);
    expect(screen.queryByText('Cargando proyectos...')).not.toBeInTheDocument();
  });

  describe('subida de imagen', () => {
    it('subir un archivo completa el campo URL IMAGEN con la url devuelta', async () => {
      vi.mocked(uploadImage).mockResolvedValueOnce({ url: '/api/uploads/abc123.png' });
      renderPage(makeProjectsApi([]));

      fireEvent.click(screen.getByRole('button', { name: '+ Nuevo proyecto [n]' }));
      const file = new File(['png-bytes'], 'foto.png', { type: 'image/png' });
      fireEvent.change(screen.getByLabelText(/SUBIR IMAGEN/), { target: { files: [file] } });

      await waitFor(() =>
        expect(screen.getByLabelText('URL IMAGEN')).toHaveValue('/api/uploads/abc123.png'),
      );
      expect(uploadImage).toHaveBeenCalledExactlyOnceWith(file);
    });

    it('si la subida falla se muestra un toast de error y el campo no cambia', async () => {
      vi.mocked(uploadImage).mockRejectedValueOnce(new Error('upload failed'));
      renderPage(makeProjectsApi([]));

      fireEvent.click(screen.getByRole('button', { name: '+ Nuevo proyecto [n]' }));
      const file = new File(['png-bytes'], 'foto.png', { type: 'image/png' });
      fireEvent.change(screen.getByLabelText(/SUBIR IMAGEN/), { target: { files: [file] } });

      await waitFor(() => expect(screen.getByText('No se pudo subir la imagen')).toBeInTheDocument());
      expect(screen.getByLabelText('URL IMAGEN')).toHaveValue('');
    });
  });

  describe('reordenamiento manual (drag and drop)', () => {
    // El asa de arrastre reemplaza al `draggable` de HTML5: ahora el gesto vive
    // en Pointer Events y el asa es además el punto de entrada por teclado.
    function getHandles(): HTMLElement[] {
      return screen.queryAllByRole('button', { name: /^Reordenar / });
    }

    it('en modo Orden aparece un asa por fila; en otros modos no', () => {
      const projects = [makeProject(1), makeProject(2)];
      renderPage(makeProjectsApi(projects));

      expect(getHandles()).toHaveLength(0);

      fireEvent.click(screen.getByRole('button', { name: 'Orden' }));

      expect(getHandles()).toHaveLength(2);
    });

    it('bajar una fila con el teclado llama a reorder con el nuevo orden de ids', async () => {
      const projects = [makeProject(1), makeProject(2), makeProject(3)];
      const api = makeProjectsApi(projects);
      renderPage(api);

      fireEvent.click(screen.getByRole('button', { name: 'Orden' }));

      // ArrowDown sobre el asa de la primera fila: la baja un lugar
      fireEvent.keyDown(getHandles()[0], { key: 'ArrowDown' });

      const reorderMock = (api as unknown as { reorder: ReturnType<typeof vi.fn> }).reorder;
      await waitFor(() => expect(reorderMock).toHaveBeenCalledOnce());
      expect(reorderMock).toHaveBeenCalledWith([projects[1].id, projects[0].id, projects[2].id]);
    });

    it('no se puede mover la primera fila más arriba ni la última más abajo', () => {
      const projects = [makeProject(1), makeProject(2)];
      const api = makeProjectsApi(projects);
      renderPage(api);

      fireEvent.click(screen.getByRole('button', { name: 'Orden' }));
      const handles = getHandles();

      fireEvent.keyDown(handles[0], { key: 'ArrowUp' });
      fireEvent.keyDown(handles[1], { key: 'ArrowDown' });

      const reorderMock = (api as unknown as { reorder: ReturnType<typeof vi.fn> }).reorder;
      expect(reorderMock).not.toHaveBeenCalled();
    });

    it('con búsqueda activa el arrastre queda deshabilitado', () => {
      const projects = [makeProject(1), makeProject(2)];
      renderPage(makeProjectsApi(projects));

      fireEvent.click(screen.getByRole('button', { name: 'Orden' }));
      fireEvent.change(screen.getByPlaceholderText('buscar proyecto...'), {
        target: { value: 'Proyecto' },
      });

      expect(getHandles()).toHaveLength(0);
    });
  });
});
