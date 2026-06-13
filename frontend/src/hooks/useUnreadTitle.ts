import { useEffect, useRef } from 'react';

const BASE_TITLE = 'FREIRE/ADMIN';

/**
 * Refleja los mensajes no leídos en el título de la pestaña: `(3) FREIRE/ADMIN`.
 * Al desmontar (salir del panel) restaura el título previo.
 */
export function useUnreadTitle(unreadCount: number) {
  const originalTitle = useRef(document.title);

  useEffect(() => {
    document.title = unreadCount > 0 ? `(${unreadCount}) ${BASE_TITLE}` : BASE_TITLE;
  }, [unreadCount]);

  useEffect(() => {
    const original = originalTitle.current;
    return () => {
      document.title = original;
    };
  }, []);
}
