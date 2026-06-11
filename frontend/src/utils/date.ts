/** Coarse granularity: days. For project timestamps. */
export function relDateDays(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days}d`;
  if (days < 30) return `Hace ${Math.floor(days / 7)}sem`;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/** Fine granularity: hours. For message inbox timestamps. */
export function relDateHours(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const hours = Math.floor((now.getTime() - d.getTime()) / 3600000);
  if (hours < 1) return 'Hace un momento';
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  return `Hace ${days}d`;
}
