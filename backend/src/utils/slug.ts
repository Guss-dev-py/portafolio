/**
 * Slug seguro para nombres de archivo.
 *
 * El nombre del proyecto lo escribe el admin, así que es entrada de usuario que
 * termina en una ruta del sistema de archivos. La estrategia es **lista blanca**:
 * sólo sobreviven `a-z` y `0-9`, y todo lo demás se colapsa en guiones. No hay
 * una lista negra de `..`, `/`, `\` o `\0` que mantener al día — esos caracteres
 * simplemente no pueden atravesar la regla.
 */

/** Deja margen holgado contra el límite de 255 bytes del sistema de archivos. */
const MAX_SLUG_LENGTH = 60;

/** Para nombres que no dejan ningún carácter utilizable (sólo emoji, sólo CJK). */
const FALLBACK = 'imagen';

export function toFileSlug(raw: unknown): string {
  if (typeof raw !== 'string') return FALLBACK;

  const slug = raw
    // NFD separa la letra de su diacrítico y el rango los borra: "Diseño" no
    // debe perder la ñ entera ni quedar percent-encoded en la URL.
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    // El corte por longitud puede dejar un guión colgando al final.
    .replace(/-+$/g, '');

  return slug || FALLBACK;
}
