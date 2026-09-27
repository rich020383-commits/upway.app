import SaludLanding from '@/components/landing/salud-landing';

/**
 * Landing pública de Upway Health.
 *
 * Hasta ahora esta página vivía dentro de la raíz (`/`), que mezclaba el hero
 * de Sophie —común a las tres verticales— con todo el detalle clínico de salud.
 * Eso dejaba a Center e Inmobiliaria reducida a un bloque al final de la página
 * y, sobre todo, hacía que la raíz respondiera "¿tu operación es salud?" en el
 * primer pantallazo, descartando dos de los tres mercados.
 *
 * Ahora la raíz es la puerta de entrada común (Sophie + las tres verticales) y
 * cada vertical tiene su propio detalle. Se mueve a `/salud` y no a `/health`
 * porque esa ruta ya es el DASHBOARD autenticado: `app/health/page.tsx`
 * consume `/api/business/dashboard` y `proxy.ts` cierra todo `/health/*` sin
 * sesión. Además, `salud` sigue la convención que ya usan `/center` y
 * `/inmobiliarias`, y hoy no había tráfico público a `/health` que romper: las
 * tarjetas de salud apuntaban a `/login?segment=health`.
 */
export const metadata = {
  title: 'Upway Health — Agente de voz con IA para clínicas, IPS y EPS',
  description:
    'Sophie atiende, agenda, confirma y entrega el dato clínico estructurado y auditable. Catálogos oficiales de Colombia, doble confirmación y trazabilidad bajo la Ley 1581.',
};

export default function SaludPage() {
  return <SaludLanding />;
}