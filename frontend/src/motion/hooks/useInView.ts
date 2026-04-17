import { useRef } from 'react';
import { useInView as useFramerInView } from 'framer-motion';

interface UseInViewOptions {
  once?: boolean;
  amount?: number;
  margin?: `${number}px ${number}px ${number}px ${number}px` | `${number}px ${number}px ${number}px` | `${number}px ${number}px` | `${number}px`;
}

export function useInView(options: UseInViewOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useFramerInView(ref, {
    once: options.once ?? true,
    amount: options.amount ?? 0.15,
    margin: (options.margin ?? '0px 0px -60px 0px') as `${number}px ${number}px ${number}px ${number}px`,
  });
  return { ref, isInView };
}
