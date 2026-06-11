export function safeIso(date: unknown): string {
  const d = date as Date;
  return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : new Date(0).toISOString();
}
