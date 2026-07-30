/**
 * Reintenta la descarga de un chunk de `React.lazy`.
 *
 * Un corte de red momentáneo mientras baja un chunk del admin hacía que el
 * import rechazara y la app entera cayera en el `ErrorBoundary` global, que
 * ofrece recargar todo. Un fallo de red es transitorio por definición: se
 * reintenta con espera creciente y el usuario no se entera.
 *
 * Lo que **no** se reintenta es un módulo que baja bien y falla al evaluarse
 * (`SyntaxError`, `ReferenceError`): pedirlo de nuevo da el mismo resultado y
 * sólo agrega demora antes de mostrar el error.
 *
 * Si se agotan los intentos, el error se propaga y el `ErrorBoundary` sigue
 * siendo la última red. Para el otro caso típico —un chunk viejo que quedó 404
 * después de un deploy— recargar es exactamente el remedio correcto, así que
 * ese camino ya está bien cubierto.
 */

const sleep = (ms: number) => new Promise<void>((r) => { setTimeout(r, ms); });

/**
 * Errores de evaluación del módulo: reintentar no los arregla.
 *
 * ⚠️ `TypeError` **no** va en esta lista, aunque a primera vista parezca de
 * evaluación: un import dinámico que no baja lanza justamente un `TypeError`
 * ("Failed to fetch dynamically imported module" en Chrome, "error loading
 * dynamically imported module" en Firefox). Incluirlo desactivaba el reintento
 * exactamente en el caso para el que existe esta función.
 */
function esPermanente(err: unknown): boolean {
  return err instanceof SyntaxError || err instanceof ReferenceError;
}

export async function retryImport<T>(
  load: () => Promise<T>,
  retries = 2,
  delay = 400,
): Promise<T> {
  try {
    return await load();
  } catch (err) {
    if (retries <= 0 || esPermanente(err)) throw err;
    await sleep(delay);
    return retryImport(load, retries - 1, delay * 2);
  }
}
