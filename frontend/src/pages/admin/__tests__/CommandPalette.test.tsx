/**
 * Command palette del admin (Ctrl/Cmd+K): busca acciones y proyectos,
 * navegable por teclado, Esc cierra.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Project } from '../../../types';
import { AdminContext, type AdminContextValue } from '../adminContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import { CommandPalette } from '../CommandPalette';

function makeProject(i: number): Project {
  return {
    id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
    name: `Proyecto ${i}`,
    description: 'desc',
    technologies: ['React'],
    url: 'https://example.com',
    repoUrl: '',
    imageUrl: '',
    imageAlt: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function renderPalette(projects: Project[] = [], onClose = vi.fn(), requestOpenCreate = vi.fn()) {
  const ctx = {
    searchRef: { current: null },
    requestOpenCreate,
    setOpenCreateHandler: vi.fn(),
    projectsApi: { projects } as AdminContextValue['projectsApi'],
    messagesApi: { messages: [], unreadCount: 0 } as unknown as AdminContextValue['messagesApi'],
  } as AdminContextValue;

  render(
    <AdminContext.Provider value={ctx}>
      <CommandPalette open onClose={onClose} />
    </AdminContext.Provider>,
  );
  return { onClose, requestOpenCreate };
}

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra las acciones base y enfoca el input', () => {
    renderPalette();

    expect(screen.getByPlaceholderText(/comando o proyecto/i)).toHaveFocus();
    expect(screen.getByText('Ir a Proyectos')).toBeInTheDocument();
    expect(screen.getByText('Ir a Mensajes')).toBeInTheDocument();
    expect(screen.getByText('Ir a Ajustes')).toBeInTheDocument();
    expect(screen.getByText('Nuevo proyecto')).toBeInTheDocument();
  });

  it('filtra por texto: "mensa" deja solo Ir a Mensajes', () => {
    renderPalette();

    fireEvent.change(screen.getByPlaceholderText(/comando o proyecto/i), { target: { value: 'mensa' } });

    expect(screen.getByText('Ir a Mensajes')).toBeInTheDocument();
    expect(screen.queryByText('Ir a Proyectos')).not.toBeInTheDocument();
  });

  it('Enter ejecuta el ítem seleccionado (navegar) y cierra', () => {
    const { onClose } = renderPalette();
    const input = screen.getByPlaceholderText(/comando o proyecto/i);

    fireEvent.change(input, { target: { value: 'mensajes' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith('/admin/messages');
    expect(onClose).toHaveBeenCalled();
  });

  it('las flechas mueven la selección', () => {
    renderPalette();
    const input = screen.getByPlaceholderText(/comando o proyecto/i);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Segundo ítem de la lista base: Ir a Mensajes
    expect(mockNavigate).toHaveBeenCalledWith('/admin/messages');
  });

  it('incluye los proyectos y "Nuevo proyecto" dispara el form', () => {
    const { requestOpenCreate } = renderPalette([makeProject(1)]);
    const input = screen.getByPlaceholderText(/comando o proyecto/i);

    expect(screen.getByText('Proyecto 1')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'nuevo' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(requestOpenCreate).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/admin/projects');
  });

  it('Escape cierra la paleta', () => {
    const { onClose } = renderPalette();

    fireEvent.keyDown(screen.getByPlaceholderText(/comando o proyecto/i), { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });
});
