import { useCallback, useRef } from 'react';

/**
 * Serializa de forma estable: ordena las claves de cada objeto antes de
 * stringificar, así dos objetos con los mismos datos en distinto orden dan la
 * misma cadena. Sin esto el hook obligaría a cada consumidor a construir el
 * estado inicial y el editado con las claves en idéntico orden, que es un
 * requisito invisible y fácil de romper.
 *
 * ⚠️ **Límite del contrato: sólo sirve para datos JSON planos.**
 * - `Set` y `Map` se serializan como `{}`, así que **dos colecciones distintas
 *   comparan como iguales** y el form reportaría "sin cambios" para siempre.
 *   Si el estado del form tiene un `Set`, convertilo a array antes de pasarlo.
 * - `undefined` se omite, así que `{ a: undefined }` y `{}` son equivalentes.
 * - Las fechas sí andan: `toJSON()` corre antes del replacer, así que un `Date`
 *   llega acá ya convertido a string ISO.
 * - El orden de los elementos de un array **sí** cuenta como cambio, a
 *   propósito: reordenar es una edición.
 */
function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val === null || typeof val !== 'object' || Array.isArray(val)) return val;
    const sorted: Record<string, unknown> = {};
    for (const k of Object.keys(val as Record<string, unknown>).sort()) {
      sorted[k] = (val as Record<string, unknown>)[k];
    }
    return sorted;
  });
}

/**
 * Detecta si un formulario tiene cambios sin guardar contra el estado que
 * tenía al abrirlo.
 *
 * El snapshot vive en un ref y no en estado: la respuesta se necesita en el
 * momento de cancelar, no en cada render. Guardarlo en estado obligaría a
 * recalcular y re-renderizar en cada tecla para responder una pregunta que
 * nadie está mirando todavía.
 *
 *   const dirty = useDirtyForm<FormData>();
 *   dirty.snapshot(initial);           // al abrir
 *   if (dirty.isDirty(data)) { ... }   // al cancelar
 */
export function useDirtyForm<T>() {
  const snapshotRef = useRef<string>('');

  /** Fija el punto de comparación. Llamar al abrir o al guardar. */
  const snapshot = useCallback((value: T) => {
    snapshotRef.current = stableStringify(value);
  }, []);

  const isDirty = useCallback(
    (value: T) => stableStringify(value) !== snapshotRef.current,
    [],
  );

  return { snapshot, isDirty };
}
