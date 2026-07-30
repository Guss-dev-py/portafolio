import { useCallback, useRef, useState } from 'react';
import { VelocityTracker } from '../gesture';
import { gesture, gestureSpring } from '../tokens';
import { useReducedMotion } from './useReducedMotion';

/**
 * Reordenamiento por arrastre con Pointer Events.
 *
 * Reemplaza al drag & drop de HTML5, que no daba ningún feedback continuo: el
 * navegador dibujaba su propia imagen fantasma, la fila no seguía al dedo y no
 * había forma de saber dónde iba a caer hasta soltar.
 *
 * Lo que aporta:
 *  · Tracking 1:1 respetando el offset del agarre — la fila no salta a centrarse.
 *  · `setPointerCapture`, así el gesto sobrevive si el puntero se va del elemento.
 *  · Historial de velocidad disponible para el feel del asentado (la proyección
 *    de momentum se descartó a propósito: ver el comentario en `onPointerUp`).
 *  · Interrumpible: se puede agarrar de nuevo mientras se está asentando.
 *  · Teclado: el handle es focusable y se mueve con las flechas. El HTML5 nativo
 *    tampoco era accesible, así que esto es ganancia neta.
 *
 * Escribe los `transform` directo en el DOM durante el gesto en lugar de pasar
 * por estado de React: un re-render por `pointermove` no llega a 60fps.
 */

interface Options {
  /** Cantidad de filas reordenables. */
  count: number;
  /** Si está en false, el hook no engancha nada. */
  enabled: boolean;
  /** Se llama sólo si el índice cambió de verdad. */
  onCommit: (from: number, to: number) => void;
}

interface DragState {
  from: number;
  to: number;
  pointerStart: number;
  rowHeight: number;
  moved: boolean;
  pointerId: number;
}

export function useReorderDrag({ count, enabled, onCommit }: Options) {
  const rowsRef = useRef<(HTMLElement | null)[]>([]);
  const stateRef = useRef<DragState | null>(null);
  const trackerRef = useRef(new VelocityTracker());
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const reduced = useReducedMotion();

  const registerRow = useCallback((index: number, el: HTMLElement | null) => {
    rowsRef.current[index] = el;
  }, []);

  /** Deja todas las filas sin transform ni transición. */
  const clearTransforms = useCallback((withTransition: boolean) => {
    rowsRef.current.forEach(el => {
      if (!el) return;
      el.style.transition = withTransition && !reduced ? 'transform 200ms cubic-bezier(0,0,0.2,1)' : '';
      el.style.transform = '';
      el.style.zIndex = '';
      if (!withTransition) el.style.willChange = '';
    });
  }, [reduced]);

  /** Desplaza las filas que no se arrastran para abrir el hueco del destino. */
  const layoutGap = useCallback((from: number, to: number, rowHeight: number) => {
    rowsRef.current.forEach((el, i) => {
      if (!el || i === from) return;
      let shift = 0;
      if (from < to && i > from && i <= to) shift = -rowHeight;
      else if (from > to && i >= to && i < from) shift = rowHeight;
      el.style.transition = reduced ? '' : 'transform 180ms cubic-bezier(0,0,0.2,1)';
      el.style.transform = shift ? `translateY(${shift}px)` : '';
    });
  }, [reduced]);

  const finish = useCallback((commit: boolean) => {
    const st = stateRef.current;
    stateRef.current = null;
    setDraggingIndex(null);
    trackerRef.current.reset();
    if (!st) return;

    const dragged = rowsRef.current[st.from];
    if (dragged) {
      // Asentar desde la posición actual, no desde el valor lógico: si se corta
      // el gesto a mitad de una animación, arrancar del target haría un salto.
      dragged.style.transition = reduced
        ? ''
        : `transform ${gestureSpring.snap.duration}s cubic-bezier(0,0,0.2,1)`;
      dragged.style.transform = '';
      dragged.style.zIndex = '';
    }
    clearTransforms(true);

    if (commit && st.moved && st.to !== st.from) onCommit(st.from, st.to);
  }, [clearTransforms, onCommit, reduced]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    const st = stateRef.current;
    if (!st || e.pointerId !== st.pointerId) return;

    const dy = e.clientY - st.pointerStart;
    if (!st.moved && Math.abs(dy) < gesture.threshold) return; // histéresis
    st.moved = true;

    const dragged = rowsRef.current[st.from];
    if (dragged) dragged.style.transform = `translateY(${dy}px)`;

    trackerRef.current.add(e.clientY);

    // Destino: cuántas filas de altura se recorrió, acotado al rango válido
    const steps = Math.round(dy / st.rowHeight);
    const to = Math.max(0, Math.min(count - 1, st.from + steps));
    if (to !== st.to) {
      st.to = to;
      layoutGap(st.from, to, st.rowHeight);
    }
  }, [count, layoutGap]);

  const onPointerUp = useCallback((e: PointerEvent) => {
    const st = stateRef.current;
    if (!st || e.pointerId !== st.pointerId) return;
    // El destino es el que el usuario está viendo: el hueco ya está abierto ahí.
    //
    // Acá NO se proyecta momentum, y es deliberado. La proyección de Apple
    // (`project()` en gesture.ts) sirve para sheets y scroll, donde no hay
    // indicación previa de dónde va a caer. En un reordenamiento sí la hay —
    // el hueco abierto — y proyectar contradice lo que el usuario ve: medido,
    // un arrastre de una fila a ~200 px/s sumaba ~104 px y saltaba tres
    // posiciones. Que el resultado coincida con el feedback importa más que
    // la inercia.
    finish(true);
  }, [finish]);

  const onPointerDown = useCallback((index: number) => (e: React.PointerEvent) => {
    if (!enabled || e.button !== 0) return;
    const el = rowsRef.current[index];
    if (!el) return;

    const rect = el.getBoundingClientRect();
    stateRef.current = {
      from: index,
      to: index,
      // Se trackea el delta del puntero, no una posición absoluta: así la fila
      // sigue al dedo desde donde se la agarró, sin saltar a centrarse.
      pointerStart: e.clientY,
      rowHeight: rect.height,
      moved: false,
      pointerId: e.pointerId,
    };
    trackerRef.current.reset();
    trackerRef.current.add(e.clientY);
    setDraggingIndex(index);

    el.style.transition = '';
    el.style.willChange = 'transform';
    el.style.zIndex = '2';

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const target = e.target as HTMLElement;
    const up = (ev: PointerEvent) => {
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', cancel);
      onPointerUp(ev);
    };
    const cancel = () => {
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', cancel);
      finish(false);
    };
    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', cancel);
  }, [enabled, finish, onPointerMove, onPointerUp]);

  /** Mover con el teclado: el drag nativo no tenía equivalente. */
  const onKeyDown = useCallback((index: number) => (e: React.KeyboardEvent) => {
    if (!enabled) return;
    const delta = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
    if (!delta) return;
    e.preventDefault();
    const to = index + delta;
    if (to < 0 || to >= count) return;
    onCommit(index, to);
  }, [count, enabled, onCommit]);

  return { registerRow, onPointerDown, onKeyDown, draggingIndex };
}
