const DAY_MS = 86_400_000;

/** Inicio del día calendario local de una fecha. */
function startOfDay(d: Date): number {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

/**
 * Agrupa fechas ISO por día calendario en una ventana de `days` días.
 * Devuelve un array de `days` conteos, del día más viejo al más nuevo
 * (el último bucket es hoy). Fechas fuera de la ventana se descartan.
 */
export function messagesPerDay(isoDates: string[], days: number): number[] {
  const buckets = new Array<number>(days).fill(0);
  const today = startOfDay(new Date());
  for (const iso of isoDates) {
    const age = Math.floor((today - startOfDay(new Date(iso))) / DAY_MS);
    if (age >= 0 && age < days) buckets[days - 1 - age] += 1;
  }
  return buckets;
}
