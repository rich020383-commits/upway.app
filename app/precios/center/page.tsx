import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { CENTER_PLANS } from '@/lib/center/plans';

export const metadata: Metadata = {
  title: 'Precios Center — Planes de voz IA para call center y soporte | Upway',
  description:
    'Planes de Upway Center: minutos de voz con agente IA 24/7, números dedicados, implementación única y minuto adicional único. Precios en COP con IVA incluido.',
  alternates: { canonical: '/precios/center' },
};

const cop = (n: number) => `$${n.toLocaleString('es-CO')}`;
const conIVA = (n: number) => cop(Math.round(n * 1.19));

type Plan = (typeof CENTER_PLANS)[number];

function PlanCard({ plan, featured = false, overageCOP }: { plan: Plan; featured?: boolean; overageCOP: number }) {
  const isCustom = plan.monthlyCOP === 0;
  return (
    <div
      id={plan.id}
      className={`relative flex flex-col rounded-[24px] border p-[26px] transition hover:-translate-y-1 ${
        featured
          ? 'border-transparent bg-[linear-gradient(135deg,#0c3775,#0b858d)] text-white shadow-[0_20px_50px_rgba(12,55,117,0.35)]'
          : 'border-[#e0edf6] bg-white text-[#0d3168] shadow-[0_8px_25px_#153f6810]'
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0ba9a9] px-4 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-lg">
          Más popular
        </div>
      )}
      <h3 className="font-display text-[20px] font-extrabold tracking-[-0.5px]">{plan.name}</h3>
      <p className={`mt-1 text-[12px] leading-[1.6] ${featured ? 'text-white/80' : 'text-[#55718f]'}`}>{plan.bestFor}</p>
      <div className="mt-[18px] flex items-baseline gap-2">
        {isCustom ? (
          <span className="font-display text-[26px] font-extrabold tracking-[-1px]">A cotizar</span>
        ) : (
          <>
            <span className="font-display text-[30px] font-extrabold tracking-[-1px]">{conIVA(plan.monthlyCOP)}</span>
            <span className={`text-[12px] font-semibold ${featured ? 'text-white/70' : 'text-[#7b93ab]'}`}>/mes</span>
          </>
        )}
      </div>
      {!isCustom && (
        <p className={`mt-1 text-[11px] ${featured ? 'text-white/60' : 'text-[#7b93ab]'}`}>
          IVA 19% incluido · base sin IVA {cop(plan.monthlyCOP)}
        </p>
      )}
      {plan.setupCOP > 0 && (
        <p className={`mt-1 text-[11px] font-semibold ${featured ? 'text-[#50e1d5]' : 'text-[#0d8a88]'}`}>
          Implementación única: {conIVA(plan.setupCOP)}
        </p>
      )}
      <ul className={`mt-[18px] flex-1 space-y-2 border-t pt-[16px] text-[12px] leading-[1.55] ${featured ? 'border-white/20' : 'border-[#e8f0f8]'}`}>
        <li className="flex gap-2">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0ba9a9]" />
          {plan.includedMinutes.toLocaleString('es-CO')} minutos de voz incluidos
        </li>
        <li className="flex gap-2">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0ba9a9]" />
          {plan.includedNumbers} número{plan.includedNumbers > 1 ? 's' : ''} telefónico{plan.includedNumbers > 1 ? 's' : ''}
        </li>
        <li className="flex gap-2">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0ba9a9]" />
          Hasta {plan.concurrentCalls} llamadas simultáneas
        </li>
        {overageCOP > 0 && (
          <li className="flex gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0ba9a9]" />
            Minuto adicional: {conIVA(overageCOP)} (IVA incluido)
          </li>
        )}
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0ba9a9]" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/login?segment=center"
        className={`mt-[20px] inline-flex items-center justify-center gap-2 rounded-full px-[20px] py-[13px] text-[13px] font-bold transition ${
          featured ? 'bg-white text-[#0c3775] hover:-translate-y-0.5' : 'bg-[#0c3775] text-white hover:bg-[#092a5c]'
        }`}
      >
        {isCustom ? 'Cotizar con ventas' : 'Activar este plan'} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function PreciosCenterPage() {
  const planes = CENTER_PLANS.filter((p) => p.monthlyCOP > 0);
  const overageCOP = planes[0]?.overageCOP ?? 0;
  return (
    <main className="min-h-screen bg-white text-[#0d3168]">
      <header className="sticky top-0 z-50 border-b border-[#edf3f8] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-5 md:px-[5%]">
          <Link href="/" className="flex items-center gap-3" aria-label="Volver al inicio">
            <span className="text-xl font-black tracking-tight text-[#0d3168]">Upway</span>
            <span className="hidden text-[13px] font-bold tracking-[-0.4px] text-[#0ba9a9] sm:inline">Center · Precios</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/precios"
              className="hidden rounded-full border border-[#dce9f4] bg-white px-4 py-2 text-[12px] font-bold text-[#0d3168] transition hover:border-[#9fc6ee] sm:inline-flex"
            >
              Todas las verticales
            </Link>
            <Link
              href="/login?segment=center"
              className="inline-flex items-center gap-2 rounded-full bg-[#0c3775] px-[18px] py-[10px] text-[12px] font-bold text-white shadow-md transition hover:bg-[#092a5c] md:px-[23px] md:text-[13px]"
            >
              Activar mi operación
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-5 md:px-[5%]">
        <section className="bg-[radial-gradient(circle_at_80%_20%,_#e8fbfa,_transparent_45%)] pb-[20px] pt-[45px] md:pt-[70px]">
          <div className="mb-[17px] inline-flex items-center gap-2 rounded-full border border-[#bfe9e6] bg-[#effbfa] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0d8a88]">
            Upway Center · Precios en COP con IVA incluido
          </div>
          <h1 className="font-display max-w-[820px] text-[35px] font-extrabold leading-[1.06] tracking-[-2px] md:text-[52px] md:tracking-[-2.6px]">
            Planes de Upway Center.{' '}
            <em className="not-italic text-[#11b4b0]">Servicio técnico y atención al cliente 24/7.</em>
          </h1>
          <p className="mt-[18px] max-w-[720px] text-[15px] leading-[1.65] text-[#49698f]">
            Cada plan incluye minutos de voz con el agente de IA, números telefónicos dedicados, grabación, log de eventos y
            evidencia exportable. Implementación única solo al activar; sin permanencia y sin licencias de terceros cobradas
            aparte.
          </p>
        </section>

        <section className="py-[30px] md:py-[45px]">
          <div className="grid gap-[18px] md:grid-cols-2">
            {planes.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} featured={i === 1} overageCOP={plan.overageCOP || overageCOP} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
