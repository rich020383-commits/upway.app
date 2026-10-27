import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { ALL_HEALTH_PLANS, formatCOP } from '@/lib/health/plans-enterprise';
import { withIVA, IDENTITY_MODULE_COP, IDENTITY_MODULE_LABEL, IDENTITY_MODULE_DESCRIPTION } from '@/lib/health/plans';

export const metadata: Metadata = {
  title: 'Precios Health — Planes de voz IA para clínicas, IPS y EPS | Upway',
  description:
    'Planes de voz IA para salud en Colombia: minutos incluidos, números dedicados, minuto adicional único e IVA incluido. Identidad conforme (Res. 866/2021) disponible.',
  alternates: { canonical: '/precios/salud' },
};

type Plan = (typeof ALL_HEALTH_PLANS)[number];
const cop = (n: number) => `$${n.toLocaleString('es-CO')}`;

function PlanCard({ plan, featured = false }: { plan: Plan; featured?: boolean }) {
  const isCustom = plan.monthlyCOP === 0;
  return (
    <div
      id={plan.id}
      className={`relative flex flex-col rounded-[24px] border p-[26px] transition hover:-translate-y-1 ${featured
          ? 'border-transparent bg-[linear-gradient(135deg,#0c3775,#1b5ed6)] text-white shadow-[0_20px_50px_rgba(12,55,117,0.35)]'
          : 'border-[#e0edf6] bg-white text-[#0d3168] shadow-[0_8px_25px_#153f6810]'
        }`}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1b5ed6] px-4 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-lg">
          Más popular
        </div>
      )}
      <h3 className="font-display text-[20px] font-extrabold tracking-[-0.5px]">{plan.name}</h3>
      <p className={`mt-1 text-[12px] leading-[1.6] ${featured ? 'text-white/80' : 'text-[#55718f]'}`}>{plan.tagline}</p>
      <div className="mt-[18px] flex items-baseline gap-2">
        {isCustom ? (
          <span className="font-display text-[26px] font-extrabold tracking-[-1px]">A cotizar</span>
        ) : (
          <>
            <span className="font-display text-[30px] font-extrabold tracking-[-1px]">{cop(withIVA(plan.monthlyCOP))}</span>
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
        <p className={`mt-1 text-[11px] font-semibold ${featured ? 'text-[#9cc6ff]' : 'text-[#1b5ed6]'}`}>
          Implementación única: {cop(withIVA(plan.setupCOP))}
        </p>
      )}
      <ul className={`mt-[18px] flex-1 space-y-2 border-t pt-[16px] text-[12px] leading-[1.55] ${featured ? 'border-white/20' : 'border-[#e8f0f8]'}`}>
        <li className="flex gap-2">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1b5ed6]" />
          {plan.includedMinutes.toLocaleString('es-CO')} minutos de voz incluidos
        </li>
        <li className="flex gap-2">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1b5ed6]" />
          {plan.includedNumbers} número{plan.includedNumbers > 1 ? 's' : ''} telefónico{plan.includedNumbers > 1 ? 's' : ''}
        </li>
        <li className="flex gap-2">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1b5ed6]" />
          Hasta {plan.concurrentCalls} llamadas simultáneas
        </li>
        {plan.overageCOP > 0 && (
          <li className="flex gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1b5ed6]" />
            Minuto adicional: {cop(withIVA(plan.overageCOP))} (IVA incluido)
          </li>
        )}
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1b5ed6]" />
            {f}
          </li>
        ))}
      </ul>
      <p className={`mt-[14px] text-[11px] italic ${featured ? 'text-white/70' : 'text-[#7b93ab]'}`}>{plan.bestFor}</p>
      <Link
        href="/login?segment=health"
        className={`mt-[20px] inline-flex items-center justify-center gap-2 rounded-full px-[20px] py-[13px] text-[13px] font-bold transition ${featured ? 'bg-white text-[#0c3775] hover:-translate-y-0.5' : 'bg-[#0c3775] text-white hover:bg-[#092a5c]'
          }`}
      >
        {isCustom ? 'Cotizar con ventas' : 'Activar este plan'} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function PreciosSaludPage() {
  const planes = ALL_HEALTH_PLANS.filter((p) => true);
  const destacado = planes.find((p) => p.id === 'clinica-pro') ?? planes[0];
  return (
    <main className="min-h-screen bg-white text-[#0d3168]">
      <header className="sticky top-0 z-50 border-b border-[#edf3f8] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-5 md:px-[5%]">
          <Link href="/" className="flex items-center gap-3" aria-label="Volver al inicio">
            <span className="text-xl font-black tracking-tight text-[#0d3168]">Upway</span>
            <span className="hidden text-[13px] font-bold tracking-[-0.4px] text-[#1b5ed6] sm:inline">Health · Precios</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/precios"
              className="hidden rounded-full border border-[#dce9f4] bg-white px-4 py-2 text-[12px] font-bold text-[#0d3168] transition hover:border-[#9fc6ee] sm:inline-flex"
            >
              Todas las verticales
            </Link>
            <Link
              href="/login?segment=health"
              className="inline-flex items-center gap-2 rounded-full bg-[#0c3775] px-[18px] py-[10px] text-[12px] font-bold text-white shadow-md transition hover:bg-[#092a5c] md:px-[23px] md:text-[13px]"
            >
              Activar mi operación
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-5 md:px-[5%]">
        <section className="bg-[radial-gradient(circle_at_80%_20%,_#e8f0ff,_transparent_45%)] pb-[20px] pt-[45px] md:pt-[70px]">
          <div className="mb-[17px] inline-flex items-center gap-2 rounded-full border border-[#bcd4f7] bg-[#eef4ff] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1b5ed6]">
            Upway Health · Precios en COP con IVA incluido
          </div>
          <h1 className="font-display max-w-[820px] text-[35px] font-extrabold leading-[1.06] tracking-[-2px] md:text-[52px] md:tracking-[-2.6px]">
            Planes de voz IA para salud.{' '}
            <em className="not-italic text-[#1b5ed6]">Clínicas, IPS, consultorios y EPS.</em>
          </h1>
          <p className="mt-[18px] max-w-[720px] text-[15px] leading-[1.65] text-[#49698f]">
            Cada plan incluye minutos de voz con el agente, números telefónicos dedicados, grabación y evidencia exportable.
            El módulo de identidad conforme (Res. 866/2021) se activa sobre cualquier plan con DPA firmado.
          </p>
        </section>

        <section className="py-[30px] md:py-[45px]">
          <div className="grid gap-[18px] md:grid-cols-2">
            {planes.map((plan) => (
              <PlanCard key={plan.id} plan={plan} featured={plan.id === destacado?.id && plan.monthlyCOP > 0} />
            ))}
          </div>
        </section>

        <section className="pb-[50px]">
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-[26px] md:flex md:items-center md:gap-6">
            <div className="flex-1">
              <h2 className="text-lg font-black text-emerald-900">{IDENTITY_MODULE_LABEL}</h2>
              <p className="mt-1 text-sm text-emerald-700">{IDENTITY_MODULE_DESCRIPTION}</p>
              <p className="mt-2 text-xs text-slate-500">Disponible sobre cualquier plan Health. Se activa con DPA firmado.</p>
            </div>
            <div className="mt-4 text-center md:mt-0">
              <p className="text-2xl font-black text-emerald-700">{formatCOP(withIVA(IDENTITY_MODULE_COP))}</p>
              <p className="text-xs text-emerald-600">por sede/mes · IVA 19% incluido</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
