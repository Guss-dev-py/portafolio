// Helpers puros de presentación de un mensaje. Sin React: testeables solos.

/**
 * Compose en Gmail con el asunto y la cita del original ya escritos. Se usa un
 * link a Gmail y no `mailto:` porque el admin se opera desde el navegador.
 */
export function gmailReplyUrl(msg: { name: string; email: string; message: string }): string {
  const subject = encodeURIComponent(`Re: mensaje desde el portafolio — ${msg.name}`);
  const body = encodeURIComponent(
    `Hola ${msg.name},\n\n\n\n---\nMensaje original:\n${msg.message}`
  );
  return `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(msg.email)}&su=${subject}&body=${body}`;
}

/** Se muestra cuando la fecha no parsea, en vez del "Invalid Date" del motor. */
const FECHA_INVALIDA = '—';

export function formatDate(iso: string): string {
  const d = new Date(iso);
  // `toLocaleString` sobre una fecha inválida devuelve el literal en inglés
  // "Invalid Date", que se colaba tal cual en un panel que está todo en español.
  if (Number.isNaN(d.getTime())) return FECHA_INVALIDA;

  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
