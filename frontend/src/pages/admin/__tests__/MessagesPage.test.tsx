/**
 * Tests de MessagesPage: stats consistentes (property), selección con marcado
 * de leído, filtros y eliminación con confirmación.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import type { Message } from '../../../types';
import { AdminContext, type AdminContextValue } from '../adminContext';
import { ToastProvider } from '../../../components/Toast/Toast';

import MessagesPage from '../MessagesPage';

type MessagesApi = AdminContextValue['messagesApi'];

function makeMessage(i: number, status: Message['status']): Message {
  return {
    id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
    name: `Remitente ${i}`,
    email: `persona${i}@example.com`,
    message: `Mensaje de prueba número ${i} con contenido suficiente.`,
    status,
    createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
  };
}

function makeMessagesApi(messages: Message[], overrides: Partial<MessagesApi> = {}): MessagesApi {
  return {
    messages,
    loading: false,
    error: null,
    readMessage: vi.fn(async (id: string) => {
      const msg = messages.find(m => m.id === id)!;
      return { ...msg, status: 'read' as const };
    }),
    removeMessage: vi.fn(async () => {}),
    unreadCount: messages.filter(m => m.status === 'unread').length,
    ...overrides,
  };
}

function renderPage(messagesApi: MessagesApi) {
  const ctx: AdminContextValue = {
    searchRef: { current: null },
    requestOpenCreate: vi.fn(),
    setOpenCreateHandler: vi.fn(),
    projectsApi: {
      projects: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
      addProject: vi.fn(),
      editProject: vi.fn(),
      removeProject: vi.fn(),
    } as unknown as AdminContextValue['projectsApi'],
    messagesApi,
  };
  return render(
    <ToastProvider>
      <AdminContext.Provider value={ctx}>
        <MessagesPage />
      </AdminContext.Provider>
    </ToastProvider>,
  );
}

describe('MessagesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('property: la stats strip siempre cumple total = no leídos + leídos', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { maxLength: 12 }),
        (unreadFlags) => {
          const messages = unreadFlags.map((unread, i) =>
            makeMessage(i + 1, unread ? 'unread' : 'read'),
          );
          const { container, unmount } = render(
            <ToastProvider>
              <AdminContext.Provider
                value={{
                  searchRef: { current: null },
                  requestOpenCreate: vi.fn(),
                  setOpenCreateHandler: vi.fn(),
                  projectsApi: {} as AdminContextValue['projectsApi'],
                  messagesApi: makeMessagesApi(messages),
                }}
              >
                <MessagesPage />
              </AdminContext.Provider>
            </ToastProvider>,
          );

          const values = Array.from(container.querySelectorAll('[class*="statValue"]'))
            .slice(0, 3)
            .map(el => Number(el.textContent));
          const [total, unread, read] = values;
          expect(total).toBe(messages.length);
          expect(unread).toBe(unreadFlags.filter(Boolean).length);
          expect(unread + read).toBe(total);
          unmount();
        },
      ),
      { numRuns: 20 },
    );
  });

  it('seleccionar un mensaje no leído lo marca como leído y muestra el detalle', async () => {
    const messages = [makeMessage(1, 'unread'), makeMessage(2, 'read')];
    const api = makeMessagesApi(messages);
    renderPage(api);

    fireEvent.click(screen.getByText('Remitente 1'));

    await waitFor(() => expect(api.readMessage).toHaveBeenCalledExactlyOnceWith(messages[0].id));
    expect(screen.getByText(`MSG · ${messages[0].id.slice(0, 8)}`)).toBeInTheDocument();
    expect(screen.getByText(messages[0].message)).toBeInTheDocument();
  });

  it('seleccionar un mensaje ya leído no llama a readMessage', () => {
    const messages = [makeMessage(1, 'read')];
    const api = makeMessagesApi(messages);
    renderPage(api);

    fireEvent.click(screen.getByText('Remitente 1'));

    expect(api.readMessage).not.toHaveBeenCalled();
  });

  it('el filtro "No leídos" oculta los mensajes leídos', () => {
    const messages = [makeMessage(1, 'unread'), makeMessage(2, 'read')];
    renderPage(makeMessagesApi(messages));

    fireEvent.click(screen.getByRole('button', { name: 'No leídos' }));

    expect(screen.getByText('Remitente 1')).toBeInTheDocument();
    expect(screen.queryByText('Remitente 2')).not.toBeInTheDocument();
  });

  it('la búsqueda filtra por nombre, email o contenido', () => {
    const messages = [makeMessage(1, 'read'), makeMessage(2, 'read')];
    renderPage(makeMessagesApi(messages));

    fireEvent.change(screen.getByPlaceholderText('buscar mensaje...'), {
      target: { value: 'persona2@' },
    });

    expect(screen.queryByText('Remitente 1')).not.toBeInTheDocument();
    expect(screen.getByText('Remitente 2')).toBeInTheDocument();
  });

  it('eliminar pide confirmación y recién ahí llama a removeMessage', async () => {
    const messages = [makeMessage(1, 'read')];
    const api = makeMessagesApi(messages);
    renderPage(api);

    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(api.removeMessage).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(api.removeMessage).toHaveBeenCalledExactlyOnceWith(messages[0].id));
  });

  it('sin mensajes muestra el estado vacío', () => {
    renderPage(makeMessagesApi([]));
    expect(screen.getByText('No hay mensajes.')).toBeInTheDocument();
  });

  it('bulk delete: seleccionar varios mensajes y confirmar llama a removeMessage por cada uno', async () => {
    const messages = [makeMessage(1, 'read'), makeMessage(2, 'read'), makeMessage(3, 'unread')];
    const api = makeMessagesApi(messages);
    renderPage(api);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar mensaje de Remitente 1' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar mensaje de Remitente 2' }));

    // Marcar el checkbox no abre el detalle ni marca como leído
    expect(api.readMessage).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar (2)' }));
    expect(api.removeMessage).not.toHaveBeenCalled();

    // Confirmar en el diálogo
    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' }).at(-1)!);

    await waitFor(() => expect(api.removeMessage).toHaveBeenCalledTimes(2));
    expect(api.removeMessage).toHaveBeenCalledWith(messages[0].id);
    expect(api.removeMessage).toHaveBeenCalledWith(messages[1].id);
  });

  it('bulk delete: el checkbox del encabezado selecciona y deselecciona todos los visibles', () => {
    const messages = [makeMessage(1, 'read'), makeMessage(2, 'unread')];
    renderPage(makeMessagesApi(messages));

    const selectAll = screen.getByRole('checkbox', { name: 'Seleccionar todos' });
    fireEvent.click(selectAll);
    expect(screen.getByRole('button', { name: 'Eliminar (2)' })).toBeInTheDocument();

    fireEvent.click(selectAll);
    expect(screen.queryByRole('button', { name: /Eliminar \(\d+\)/ })).not.toBeInTheDocument();
  });

  it('la stats strip incluye un sparkline con una barra por cada uno de los últimos 14 días', () => {
    const messages = [makeMessage(1, 'unread'), makeMessage(2, 'read')];
    const { container } = renderPage(makeMessagesApi(messages));

    expect(screen.getByText('Últimos 14 días')).toBeInTheDocument();
    const bars = container.querySelectorAll('[class*="sparkBar"]');
    expect(bars.length).toBe(14);
  });
});
