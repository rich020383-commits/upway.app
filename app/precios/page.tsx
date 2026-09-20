import Link from 'next/link';
import { ALL_HEALTH_PLANS, formatCOP, planCommercialSummary } from '@/lib/health/plans-enterprise';
import {
  withIVA,
  FACILITY_TYPE_OPTIONS,
  IDENTITY_MODULE_COP,
  IDENTITY_MODULE_LABEL,
  IDENTITY_MODULE_DESCRIPTION,
} from '@/lib/health/plans';

export const metadata = {
  title: 'Planes Upway Health - Clinicas, IPS y EPS | Upway',
  description: 'Planes de voz AI para salud. Desde consultorios hasta EPS. Minutos, numeros simultaneos y el modulo de identidad conforme por sede, con precios transparentes.',
};

function FacilityBadge({ type }: { type: string }) {
  const facility = FACILITY_TYPE_OPTIONS.find((f) => f.id === type);
  if (!facility) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-[#edf5ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1b5ed6]">
      {facility.label}
    </span>
  );
}

function PlanCard({ plan, featured = false }: { plan: typeof ALL_HEALTH_PLANS[number]; featured?: boolean }) {
  const summary = planCommercialSummary(plan);
  const isCustom = plan.monthlyCOP === 0;
  return (
    <div id={plan.id} className={`relative flex flex-col rounded-[24px] border p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${featured ? 'border-[#1b5ed6] bg-gradient-to-br from-[#0f172a] to-[#1b3a5f] text-white shadow-2xl' : 'border-slate-200 bg-white shadow-md'}`}>
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1b5ed6] px-4 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-lg">Mas popular</div>
      )}
      <div className="mb-4">
        <h3 className={`text-xl font-black tracking-tight ${featured ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
        <p className={`mt-1 text-sm ${featured ? 'text-slate-300' : 'text-slate-500'}`}>{plan.tagline}</p>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {plan.target.map((t) => (<FacilityBadge key={t} type={t} />))}
      </div>
      <div className="mb-5">
        {isCustom ? (
          <span className={`text-3xl font-black ${featured ? 'text-white' : 'text-slate-900'}`}>A cotizar</span>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black ${featured ? 'text-white' : 'text-slate-900'}`}>{summary.monthlyLabel}</span>
              <span className="text-sm text-slate-500">/mes</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">+ IVA 19% ({formatCOP(withIVA(plan.monthlyCOP))} total)</p>
          </>
        )}
      </div>
      <div className={`mb-5 space-y-2 text-sm ${featured ? 'text-slate-200' : 'text-slate-600'}`}>
        <div className="flex items-center gap-2"><span>{plan.includedNumbers} número{plan.includedNumbers > 1 ? 's' : ''}</span></div>
        <div className="flex items-center gap-2"><span>{plan.includedMinutes.toLocaleString('es-CO')} min/mes</span></div>
        <div className="flex items-center gap-2"><span>Hasta {plan.concurrentCalls} simultaneas</span></div>
        {plan.overageCOP > 0 && <div className="flex items-center gap-2"><span>Overage: ${plan.overageCOP.toLocaleString('es-CO')} COP/min</span></div>}
        <div className="flex items-center gap-2"><span>Grabacion: {plan.recordingRetention}</span></div>
      </div>
      <ul className="mb-6 flex-1 space-y-2">
        {plan.features.map((f, i) => (
          <li key={i} className={`flex items-start gap-2 text-sm ${featured ? 'text-slate-200' : 'text-slate-600'}`}>
            <span className="mt-0.5 text-emerald-500">OK</span><span>{f}</span>
          </li>
        ))}
      </ul>
      {!isCustom && (
        <div className={`mb-6 rounded-xl border p-3 text-xs ${featured ? 'border-white/20 bg-white/10' : 'border-emerald-200 bg-emerald-50/60'}`}>
          <p className={`font-bold ${featured ? 'text-white' : 'text-emerald-900'}`}>Adicional por sede: {IDENTITY_MODULE_LABEL}</p>
          <p className={`mt-1 ${featured ? 'text-slate-300' : 'text-slate-600'}`}>{IDENTITY_MODULE_DESCRIPTION}</p>
          <p className={`mt-2 font-bold ${featured ? 'text-emerald-300' : 'text-emerald-700'}`}>+ {formatCOP(IDENTITY_MODULE_COP)}/sede/mes + IVA</p>
        </div>
      )}
      <div className="mt-auto space-y-3">
        <Link href="/login?segment=health" className={`block rounded-full py-3 text-center text-sm font-bold transition-all ${featured ? 'bg-white text-[#0f172a] hover:bg-slate-100' : 'bg-[#1b5ed6] text-white hover:bg-[#1548a8]'}`}>
          {isCustom ? 'Contactar ventas' : 'Empezar ahora'}
        </Link>
        {plan.setupCOP > 0 && <p className="text-center text-xs text-slate-400">Setup: {formatCOP(plan.setupCOP)} + IVA</p>}
      </div>
      {plan.requiresTelnyxApproval && (
        <div className={`mt-4 rounded-xl p-3 text-xs ${featured ? 'bg-white/10 text-slate-200' : 'bg-amber-50 text-amber-700'}`}>
          Requiere ampliacion de capacidad (lo tramita Upway)
        </div>
      )}
    </div>
  );
}


export default function PreciosPage() {
  const standardPlans = ALL_HEALTH_PLANS.filter((p) => p.monthlyCOP > 0);
  const customPlans = ALL_HEALTH_PLANS.filter((p) => p.monthlyCOP === 0);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Upway Health
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-black tracking-[-0.04em] text-slate-900 md:text-5xl">Planes para cada tipo de atencion en salud</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">Recepcionista de voz AI 24/7 que atiende cada llamada y agenda por ti. Precios transparentes: minutos, numeros y un modulo de identidad conforme que se paga por sede.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Ley 1581 de 2012</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Catalogos oficiales IHCE</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Trazabilidad y evidencia</span>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {standardPlans.map((plan) => (<PlanCard key={plan.id} plan={plan} featured={plan.id === 'clinica-pro-1800'} />))}
        </div>
        <div className="mt-8 rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-6 md:flex md:items-center md:gap-6">
          <div className="flex-1">
            <h2 className="text-lg font-black text-emerald-900">Adicional por sede: {IDENTITY_MODULE_LABEL}</h2>
            <p className="mt-1 text-sm text-slate-600">{IDENTITY_MODULE_DESCRIPTION}</p>
            <p className="mt-2 text-xs text-slate-500">Disponible sobre cualquier plan. Se activa con contrato de encargo de datos (DPA) firmado: asi de serios somos con la Ley 1581.</p>
          </div>
          <div className="mt-4 text-center md:mt-0">
            <p className="text-2xl font-black text-emerald-700">{formatCOP(IDENTITY_MODULE_COP)}</p>
            <p className="text-xs text-slate-500">por sede/mes + IVA</p>
          </div>
        </div>
        {customPlans.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-center text-2xl font-black text-slate-900">Planes empresariales</h2>
            <p className="mx-auto mb-8 max-w-xl text-center text-sm text-slate-500">Para volumenes que superan los planes estandar. Cotizamos a medida.</p>
            <div className="grid gap-6 md:grid-cols-2">
              {customPlans.map((plan) => (<PlanCard key={plan.id} plan={plan} />))}
            </div>
          </div>
        )}
      </section>
      <section className="bg-gradient-to-br from-[#0f172a] to-[#132642] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-black text-white">Listo para dejar de perder llamadas?</h2>
          <p className="mt-3 text-slate-300">Empieza con un piloto medido. Sin contratos largos; con DPA cuando se activa identidad conforme.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login?segment=health" className="w-full rounded-full bg-white px-8 py-4 text-sm font-bold text-[#0f172a] transition-all hover:-translate-y-0.5 hover:shadow-xl sm:w-auto">Comenzar ahora</Link>
            <a href="mailto:contacto@upway.business?subject=Quiero%20cotizar%20Upway%20Health" className="w-full rounded-full border border-white/30 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 sm:w-auto">Hablar con ventas</a>
          </div>
        </div>
      </section>
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400">Upway Business Group S.A.S - Bogota, Colombia</footer>
    </div>
  );
}
