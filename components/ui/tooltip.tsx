"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
interface TooltipProps {
  /** Texto explicativo que aparece al pasar el puntero o el foco. */
  content: string;
  children: ReactNode;
  /** Posición del tooltip respecto al elemento. */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Alineación horizontal/vertical del tooltip (solo para top/bottom). */
  align?: 'start' | 'center' | 'end';
  /** Clases adicionales para el contenedor (trigger). */
  className?: string;
  /** Clases adicionales para la tarjeta del tooltip. */
  tooltipClassName?: string;
  /** Retraso (ms) antes de mostrar/ocultar. Evita parpadeos. */
  delayMs?: number;
  /** Muestra una flecha apuntando al trigger. */
  arrow?: boolean;
}
const POSITION: Record<
  NonNullable<TooltipProps['side']>,
  Record<NonNullable<TooltipProps['align']>, string>
> = {
  top: {
    start: 'bottom-full left-0 mb-2',
    center: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
    end: 'bottom-full right-0 mb-2',
  },
  bottom: {
    start: 'top-full left-0 mt-2',
    center: 'top-full left-1/2 mt-2 -translate-x-1/2',
    end: 'top-full right-0 mt-2',
  },
  left: {
    start: 'right-full top-0 mr-2',
    center: 'right-full top-1/2 mr-2 -translate-y-1/2',
    end: 'right-full bottom-0 mr-2',
  },
  right: {
    start: 'left-full top-0 ml-2',
    center: 'left-full top-1/2 ml-2 -translate-y-1/2',
    end: 'left-full bottom-0 ml-2',
  },
};
/**
 * Tooltip accesible, robusto y con estilo propio.
 *
 * Qué lo hace "robusto" y fácil de usar en productos reales:
 * - Accesible: conecta el trigger con el tooltip vía `aria-describedby`,
 *   funciona con teclado (focus) y es legible por lectores de pantalla.
 * - Antiparpadeo: retraso corto antes de mostrar/ocultar, para no molestar
 *   al pasar el puntero rápido por varios elementos.
 * - Control total: se cierra con Escape o al hacer click fuera.
 * - Configurable: posición + alineación + flecha + clases propias.
 * - A diferencia del `title` nativo, se muestra al instante y admite textos largos.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  className = '',
  tooltipClassName = '',
  delayMs = 0,
  arrow = true,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const clearTimers = () => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };
  const open = () => {
    clearTimers();
    showTimer.current = setTimeout(() => setVisible(true), delayMs);
  };
  const close = () => {
    clearTimers();
    hideTimer.current = setTimeout(() => setVisible(false), delayMs);
  };
  // Cerrar con Escape, y con click/toque fuera del propio tooltip.
  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisible(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      clearTimers();
    };
  }, [visible]);
  const positionClass = POSITION[side][align];
  return (
    <span
      ref={rootRef}
      className={`relative inline-flex ${className}`}
      aria-describedby={visible ? tooltipId : undefined}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
    >
      {children}
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 ${positionClass} w-max max-w-[260px] rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium leading-5 text-slate-700 shadow-[0_18px_40px_rgba(15,23,42,0.22)] ${tooltipClassName}`}
        >
          {content}
          {arrow && (
            <span
              aria-hidden="true"
              className={
                side === 'top'
                  ? 'absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-white'
                  : side === 'bottom'
                    ? 'absolute left-1/2 bottom-full -translate-x-1/2 border-8 border-transparent border-b-white'
                    : side === 'left'
                      ? 'absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-white'
                      : 'absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-white'
              }
            />
          )}
        </span>
      )}
    </span>
  );
}