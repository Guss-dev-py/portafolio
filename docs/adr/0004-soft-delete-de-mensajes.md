# ADR 0004 — Papelera (soft-delete) para mensajes, borrado duro para proyectos

- **Estado:** aceptada
- **Fecha de la decisión:** 2026-06-12, migración `005` (documentada retroactivamente el 2026-07-29)

## Contexto

Los mensajes del formulario de contacto son **irrecuperables si se borran**: los manda un tercero, no hay copia en ningún lado y pueden ser una oportunidad laboral. Un clic accidental en "Eliminar" destruye información valiosa para siempre.

Los proyectos, en cambio, los crea el propio dueño y siempre puede volver a cargarlos.

## Decisión

**Trato distinto según el riesgo de pérdida:**

- **Mensajes — papelera en dos pasos.** `DELETE /api/messages/:id` setea `deleted_at`. Un **segundo** `DELETE` sobre un mensaje ya en papelera lo purga de verdad. `POST /api/messages/:id/restore` lo devuelve. `GET /api/messages` los excluye salvo `?include_deleted=true`.
- **Proyectos — borrado duro.** `DELETE /api/projects/:id` borra la fila.

Un índice parcial (`idx_messages_active_created`) mantiene rápida la consulta de la lista activa.

## Fundamento

1. **La asimetría es intencional y refleja el costo real del error.** Un mensaje perdido no se recupera; un proyecto se vuelve a cargar en dos minutos.
2. **Reusar el verbo `DELETE` para papelera y para purga** evita agregar endpoints y hace que la segunda eliminación se sienta natural ("borrar algo que ya está en la papelera lo borra en serio").
3. **El índice parcial** evita que las filas en papelera degraden la consulta más frecuente.

## Consecuencias

**Positivas:** el borrado accidental de un mensaje es reversible; el audit log registra las tres operaciones (papelera, purga, restauración).

**Negativas:** toda consulta de mensajes debe acordarse de filtrar `deleted_at IS NULL`; olvidarlo filtra mensajes borrados a la vista. Los conteos (no leídos, estadísticas) tienen que excluir la papelera explícitamente. El endpoint tiene comportamiento dependiente del estado — el mismo `DELETE` hace dos cosas distintas según en qué estado esté el mensaje, lo que **hay que probar en ambos caminos** (está cubierto: 5 tests de backend).
