import Link from 'next/link';
import { ALL_HEALTH_PLANS, formatCOP, planCommercialSummary } from '@/lib/health/plans-enterprise';
import { withIVA, FACILITY_TYPE_OPTIONS } from '@/lib/health/plans';

export const metadata = {
  title: 'Planes Upway Health - Clinicas, IPS y EPS | Upway',
  description: 'Planes de voz AI para salud. Desde consultorios hasta EPS. Compara minutos, numeros simultaneos y precios transparentes.',
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
        <div className="flex items-center gap-2"><span>{plan.includedNumbers} numero{plan.includedNumbers > 1 ? 'es' : ''}</span></div>
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
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">Desde un consultorio hasta una red de EPS. Voz AI con WhatsApp, agenda, triaje y escalamiento.</p>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {standardPlans.map((plan) => (<PlanCard key={plan.id} plan={plan} featured={plan.id === 'clinica-pro-1800'} />))}
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
          <p className="mt-3 text-slate-300">Empieza hoy. Sin contratos largos.</p>
          <Link href="/login?segment=health" className="mt-8 inline-block rounded-full bg-white px-8 py-4 text-sm font-bold text-[#0f172a] transition-all hover:-translate-y-0.5 hover:shadow-xl">Comenzar ahora</Link>
        </div>
      </section>
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400">Upway Business Group S.A.S - Bogota, Colombia</footer>
    </div>
  );
}
