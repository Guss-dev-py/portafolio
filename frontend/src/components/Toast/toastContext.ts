// Contexto y hook en archivo propio: si conviven con el componente,
// react-refresh no puede hacer fast-refresh del módulo.
import { createContext, use } from 'react';

export interface ToastInput {
  title: string;
  msg: string;
  variant?: 'ok' | 'danger';
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

export const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return use(ToastContext);
}
