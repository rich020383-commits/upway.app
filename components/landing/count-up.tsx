'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Contador que sube al entrar en pantalla (IntersectionObserver + RAF).
 *
 * Solo números: el sufijo (`+`, `h`…) queda fuera y se pinta estático. Con
 * `prefers-reduced-motion` se muestra el valor final sin animar. El nodo
 * renderiza el valor final desde el servidor, así que el HTML sin JS ya
 * contiene la cifra correcta.
 */
export default function CountUp({
  to,
  duration = 900,
  className = '',
}: {
  to: number;
  duration?: number;
  className?: string;
}) {
  const [value, setValue] = useState(to);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || started.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || started.current) return;
        observer.disconnect();
        started.current = true;

        const inicio = performance.now();
        const paso = (ahora: number) => {
          const p = Math.min(1, (ahora - inicio) / duration);
          // ease-out: rápido al principio, aterriza suave (no lineal feo).
          const eased = 1 - (1 - p) * (1 - p);
          setValue(Math.round(eased * to));
          if (p < 1) raf = requestAnimationFrame(paso);
          else setValue(to);
        };
        raf = requestAnimationFrame(paso);
      },
      { threshold: 0.5 }
    );
    observer.observe(nodo);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString('es-CO')}
    </span>
  );
}
