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

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
