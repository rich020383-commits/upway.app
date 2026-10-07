'use client';

import { useEffect, useRef, useState } from 'react';

const GLIFOS = 'ABCDEF0123456789#*+/·';

/**
 * Titular con efecto "decode" (las letras se resuelven como un terminal).
 *
 * Se aplica UNA vez, al entrar en pantalla, y siempre termina en el texto real:
 * el estado inicial es el texto final, así que si el efecto no corre (JS
 * ausente, movimiento reducido) el titular nunca se ve raro. El animado va con
 * `aria-hidden` y el texto real se sirve aparte con `sr-only`, para que un
 * lector de pantalla nunca lea glifos intermedios.
 */
export default function ScrambleText({
  text,
  className = '',
  duration = 700,
}: {
  text: string;
  className?: string;
  duration?: number;
}) {
  const [visible, setVisible] = useState(text);
  const ref = useRef<HTMLSpanElement | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || doneRef.current) return;
    // Con movimiento reducido se muestra el texto tal cual, sin animación.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const inicio = performance.now();

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        doneRef.current = true;

        const paso = (ahora: number) => {
          const p = Math.min(1, (ahora - inicio) / duration);
          // De izquierda a derecha: los glifos ya resueltos se quedan fijos.
          const fijos = Math.floor(p * text.length);
          let salida = text.slice(0, fijos);
          for (let i = fijos; i < text.length; i++) {
            salida += text[i] === ' ' ? ' ' : GLIFOS[(Math.random() * GLIFOS.length) | 0];
          }
          setVisible(salida);
          if (p < 1) raf = requestAnimationFrame(paso);
          else setVisible(text);
        };
        raf = requestAnimationFrame(paso);
      },
      { threshold: 0.35 }
    );
    observer.observe(nodo);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [text, duration]);

  return (
    <>
      {/* Texto real para buscadores y lectores de pantalla: existe desde el SSR. */}
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden="true" className={className}>
        {visible}
      </span>
    </>
  );
}
