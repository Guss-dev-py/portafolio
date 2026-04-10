import { useState } from 'react';
import { useMessages } from '../../hooks/useMessages';
import type { Message } from '../../types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessagesPage() {
  const { messages, loading, error, readMessage, removeMessage } = useMessages();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const handleSelect = async (msg: Message) => {
    setSelectedMessage(msg);
    if (msg.status === 'unread') {
      try {
        const updated = await readMessage(msg.id);
        setSelectedMessage(updated);
      } catch {
        // non-critical: keep message selected even if marking fails
      }
    }
  };

  const handleDelete = async (msg: Message) => {
    if (!window.confirm(`¿Eliminar el mensaje de "${msg.name}"?`)) return;
    try {
      await removeMessage(msg.id);
      if (selectedMessage?.id === msg.id) setSelectedMessage(null);
    } catch {
      alert('Error al eliminar el mensaje');
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem' }}>Mensajes</h1>

      {loading && <p>Cargando mensajes...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && messages.length === 0 && (
        <p style={{ color: '#666' }}>No hay mensajes.</p>
      )}

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {messages.length > 0 && (
          <div style={{ flex: '1', minWidth: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Remitente</th>
                  <th style={{ padding: '0.5rem' }}>Email</th>
                  <th style={{ padding: '0.5rem' }}>Fecha</th>
                  <th style={{ padding: '0.5rem' }}>Estado</th>
                  <th style={{ padding: '0.5rem' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => {
                  const isUnread = msg.status === 'unread';
                  const isSelected = selectedMessage?.id === msg.id;
                  return (
                    <tr
                      key={msg.id}
                      onClick={() => handleSelect(msg)}
                      style={{
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer',
                        background: isSelected ? '#eef4ff' : 'transparent',
                        fontWeight: isUnread ? 700 : 400,
                      }}
                    >
                      <td style={{ padding: '0.5rem' }}>{msg.name}</td>
                      <td style={{ padding: '0.5rem', color: '#555' }}>{msg.email}</td>
                      <td style={{ padding: '0.5rem', color: '#555', whiteSpace: 'nowrap' }}>
                        {formatDate(msg.createdAt)}
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        {isUnread ? (
                          <span style={{ color: '#2563eb', fontWeight: 700 }}>● No leído</span>
                        ) : (
                          <span style={{ color: '#888' }}>Leído</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleDelete(msg)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            cursor: 'pointer',
                            color: 'white',
                            background: '#c0392b',
                            border: 'none',
                            borderRadius: '4px',
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedMessage && (
          <div
            style={{
              width: '340px',
              flexShrink: 0,
              background: '#f9f9f9',
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>Detalle del mensaje</h2>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}
                aria-label="Cerrar detalle"
              >
                ✕
              </button>
            </div>
            <p style={{ margin: '0 0 0.25rem' }}>
              <strong>De:</strong> {selectedMessage.name}
            </p>
            <p style={{ margin: '0 0 0.25rem', wordBreak: 'break-all' }}>
              <strong>Email:</strong> {selectedMessage.email}
            </p>
            <p style={{ margin: '0 0 0.75rem', color: '#666', fontSize: '0.85rem' }}>
              {formatDate(selectedMessage.createdAt)}
            </p>
            <hr style={{ margin: '0 0 0.75rem', border: 'none', borderTop: '1px solid #ddd' }} />
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{selectedMessage.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
