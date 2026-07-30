import { ApiError } from '../../../api/client';

/**
 * Traduce el fallo de un envío del formulario a un mensaje accionable.
 *
 * Antes había un solo texto —"No se pudo enviar. Intentá de nuevo."— para el
 * rate limit, la validación, la caída del servidor y la falta de red. Quien
 * pegaba contra el límite de `contactLimiter` (5 cada 15 min) reintentaba,
 * volvía a fallar y no tenía forma de saber por qué ni qué hacer.
 */
export function describeSubmitError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429) {
      return 'Llegaste al límite de envíos (5 cada 15 minutos). Esperá un rato y volvé a intentar, o escribime directo por email.';
    }
    if (err.status === 400) {
      return `${err.message} Revisá los datos y volvé a intentar.`;
    }
    if (err.status >= 500) {
      return 'El servidor tuvo un problema al procesar el mensaje. Tu texto sigue acá: probá de nuevo en unos minutos, o escribime por email.';
    }
    return `${err.message} Si sigue fallando, escribime por email.`;
  }
  return 'No pude conectar con el servidor. Revisá tu conexión y volvé a intentar — tu mensaje no se perdió.';
}
