import type { WorkStatus } from '../api/status';

/**
 * Copy del estado laboral, en un solo lugar.
 *
 * Vivía dentro de `HeroSection`, y el masthead (`RegBar`) tenía "OPEN TO WORK"
 * escrito a mano: dos superficies afirmando cosas distintas sobre lo mismo.
 * Con los mapas acá, un cambio de estado desde el admin mueve a las dos.
 */

/** Línea del `status` dentro de la terminal del hero. Registro de consola. */
export const STATUS_LINE: Record<WorkStatus, string> = {
  open:     '> open to work · freelance · full-time',
  working:  '> working · respondiendo con demoras · GMT-3',
  occupied: '> occupied · no disponible por ahora',
};

/**
 * Etiqueta corta para el chip del hero y el masthead. El masthead la muestra en
 * mayúsculas por CSS (`text-transform`), así que se escribe una sola vez.
 */
export const STATUS_LABEL: Record<WorkStatus, string> = {
  open:     'Open to work',
  working:  'Working · con demoras',
  occupied: 'Occupied',
};
