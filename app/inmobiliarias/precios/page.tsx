import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
import Footer from '@/components/Footer';
import { STANDARD_INMOB_PLANS, CUSTOM_INMOB_PLANS, INMOBILIARIA_PLANS, withIVA, DEFAULT_OVERAGE_COP } from '@/lib/inmobiliaria/plans';

export const metadata: Metadata = {
  title: 'Planes para inmobiliarias — Sophie atiende y agenda 24/7 | Upway',
  description:
    'Planes de voz IA para inmobiliarias: minutos incluidos, números simultáneos, calificación de leads y datos auditables. Precios transparentes en COP.',
  alternates: { canonical: '/inmobiliarias/precios' },
};

const cop = (n: number) => `$${n.toLocaleString('es-CO')}`;

type Plan = (typeof STANDARD_INMOB_PLANS)[number];

function PlanCard({ plan, featured = false }: { plan: Plan; featured?: boolean }) {
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
      <p className={`mt-1 text-[12px] leading-[1.6] ${featured ? 'text-white/80' : 'text-[#55718f]'}`}>{plan.tagline}</p>
      <div className="mt-[18px] flex items-baseline gap-2">
        <span className="font-display text-[30px] font-extrabold tracking-[-1px]">{cop(plan.monthlyCOP)}</span>
        <span className={`text-[12px] font-semibold ${featured ? 'text-white/70' : 'text-[#7b93ab]'}`}>/mes + IVA</span>
      </div>
      <p className={`mt-1 text-[11px] ${featured ? 'text-white/60' : 'text-[#7b93ab]'}`}>
        Total con IVA 19%: {cop(withIVA(plan.monthlyCOP))}
      </p>
      {plan.setupCOP > 0 && (
        <p className={`mt-1 text-[11px] font-semibold ${featured ? 'text-[#50e1d5]' : 'text-[#0d8a88]'}`}>
          Implementación única: {cop(plan.setupCOP)}
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
        <li className="flex gap-2">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0ba9a9]" />
          Minuto adicional: {cop(plan.overageCOP)}
        </li>
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0ba9a9]" />
            {f}
          </li>
        ))}
      </ul>
      <p className={`mt-[14px] text-[11px] italic ${featured ? 'text-white/70' : 'text-[#7b93ab]'}`}>{plan.bestFor}</p>
      <Link
        href="/login?segment=inmobiliaria"
        className={`mt-[20px] inline-flex items-center justify-center gap-2 rounded-full px-[20px] py-[13px] text-[13px] font-bold transition ${
          featured ? 'bg-white text-[#0c3775] hover:-translate-y-0.5' : 'bg-[#0c3775] text-white hover:bg-[#092a5c]'
        }`}
      >
        Activar este plan <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

const faqs = [
  {
    q: '¿Qué pasa si me quedo sin minutos?',
    a: `El minuto adicional se cobra a ${cop(DEFAULT_OVERAGE_COP)} COP, sin interrupciones: Sophie sigue atendiendo y el consumo se refleja en tu panel con trazabilidad.`,
  },
  {
    q: '¿Necesito cambiar de proveedor telefónico?',
    a: 'No. Upway entrega un número propio de voz IA (o portamos el tuyo si lo prefieres). La implementación es white-glove: nosotros conectamos y dejamos operando.',
  },
  {
    q: '¿Sophie reemplaza a mis asesores?',
    a: 'No. Sophie atiende, califica con tus criterios y agenda las visitas; la negociación y el cierre siguen en tu equipo comercial. Cuando la llamada lo pide, transfiere con todo el contexto.',
  },
  {
    q: '¿Hay permanencia?',
    a: 'Sin contratos largos. Planes mensuales, con implementación única solo al activar. Puedes subir o bajar de plan según tu volumen de llamadas.',
  },
];

export default function InmobiliariasPreciosPage() {
  const customPlans = CUSTOM_INMOB_PLANS;
  return (
    <main className="min-h-screen bg-white text-[#0d3168] selection:bg-[#11b7b1] selection:text-white">
      <header className="sticky top-0 z-50 border-b border-[#edf3f8] bg-white/90 backdrop-blur-md">
        <div className="upway-topbar mx-auto flex w-full max-w-[1180px] items-center justify-between px-5 md:px-[5%]">
          <Link href="/inmobiliarias" className="flex items-center gap-3" aria-label="Volver a la landing de inmobiliarias">
            <span className="inline-flex items-center overflow-hidden rounded-2xl bg-black px-4 py-2 shadow-lg">
              <Image
                src="/upway.png"
                alt="Upway"
                width={1000}
                height={667}
                quality={90}
                sizes="160px"
                className="h-7 w-auto object-contain md:h-8"
              />
            </span>
            <span className="hidden text-[13px] font-bold tracking-[-0.4px] text-[#0ba9a9] sm:inline">
              Inmobiliarias · Precios
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/inmobiliarias"
              className="hidden rounded-full border border-[#dce9f4] bg-white px-4 py-2 text-[12px] font-bold text-[#0d3168] transition hover:border-[#9fc6ee] sm:inline-flex"
            >
              Ver la solución
            </Link>
            <Link
              href="/login?segment=inmobiliaria"
              className="inline-flex items-center gap-2 rounded-full bg-[#0c3775] px-[18px] py-[10px] text-[12px] font-bold text-white shadow-md transition hover:bg-[#092a5c] md:px-[23px] md:text-[13px]"
            >
              Activar mi operación
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-5 md:px-[5%]">
        {/* HERO */}
        <section className="pb-[10px] pt-[40px] md:pt-[60px]">
          <div className="mx-auto max-w-[760px] text-center">
            <div className="mb-[17px] inline-flex items-center gap-2 rounded-full border border-[#bfe9e6] bg-[#effbfa] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0d8a88]">
              Sophie · Inmobiliarias · Precios
            </div>
            <h1 className="font-display text-[32px] font-extrabold leading-[1.1] tracking-[-1.8px] md:text-[46px] md:tracking-[-2.4px]">
              Un plan por el tamaño de <em className="not-italic text-[#11b4b0]">tu operación.</em>
            </h1>
            <p className="mx-auto mt-[18px] max-w-[640px] text-[15px] leading-[1.65] text-[#49698f]">
              Sophie contesta tus llamadas 24/7, califica con tus criterios y agenda las visitas sobre tu operación real.
              Precios en pesos, minutos incluidos y sin licencias de terceros.
            </p>
            <div className="mt-[22px] flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-[#55718f]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e0edf6] bg-white px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0ba9a9]" /> Sin licencias de terceros
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e0edf6] bg-white px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0ba9a9]" /> Datos de leads conformes y auditables
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e0edf6] bg-white px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0ba9a9]" /> Implementación white-glove
              </span>
            </div>
          </div>
        </section>
        {/* GRID DE PLANES */}
        <section className="py-[30px] md:py-[45px]">
          <div className="grid gap-[18px] md:grid-cols-2 xl:grid-cols-4">
            {INMOBILIARIA_PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} featured={plan.id === 'profesional-1500'} />
            ))}
          </div>
          <p className="mx-auto mt-[18px] max-w-[720px] text-center text-[11px] leading-[1.6] text-[#7b93ab]">
            Los planes estiman tu volumen de llamadas entrantes. Si tu operación no encaja en ninguno, lo cotizamos a medida — sin
            costos ocultos y sin licencias de terceros.
          </p>
        </section>

        {customPlans.length > 0 && (
          <section className="py-[30px] md:py-[45px]">
            <div className="mb-[17px] text-[13px] font-bold text-[#0ba9a9]">Operaciones de gran volumen</div>
            <h2 className="font-display text-[26px] font-extrabold leading-[1.12] tracking-[-1.5px] md:text-[32px]">
              Redes y desarrollos con varios proyectos
            </h2>
            <div className="mt-[24px] grid gap-[15px] md:grid-cols-2">
              {customPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="py-[30px] md:py-[45px]">
          <div className="mb-[17px] text-[13px] font-bold text-[#0ba9a9]">Preguntas frecuentes</div>
          <h2 className="font-display text-[26px] font-extrabold leading-[1.12] tracking-[-1.5px] md:text-[32px]">
            Lo que preguntan antes de activar
          </h2>
          <div className="mt-[24px] grid gap-[12px] md:grid-cols-2">
            {faqs.map(({ q, a }) => (
              <div key={q} className="rounded-[17px] border border-[#e0edf6] bg-white p-[20px] shadow-[0_8px_25px_#153f6810]">
                <h3 className="text-[13px] font-bold text-[#0d3168]">{q}</h3>
                <p className="mt-[8px] text-[12px] leading-[1.65] text-[#55718f]">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-[30px] md:py-[45px]">
          <div className="rounded-[28px] bg-[linear-gradient(115deg,#103d79,#0b858d)] p-[30px] text-white md:p-[46px]">
            <small className="mb-[10px] block text-[13px] font-semibold text-[#50e1d5]">Sophie en tu inmobiliaria</small>
            <h2 className="font-display max-w-[680px] text-[26px] font-extrabold leading-[1.2] md:text-[32px]">
              ¿Lista tu inmobiliaria para <em className="not-italic text-[#50e1d5]">no perder una llamada más?</em>
            </h2>
            <p className="mt-[14px] max-w-[620px] text-[13px] leading-[1.7] text-white/85">
              Activa el plan que corresponda a tu volumen o escríbenos y armamos la operación contigo: qué responde Sophie, qué
              agenda y qué queda registrado.
            </p>
            <div className="mt-[24px] flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login?segment=inmobiliaria"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-[23px] py-[14px] text-[13px] font-bold text-[#0c3775] transition hover:-translate-y-0.5"
              >
                Activar mi operación
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/inmobiliarias"
                className="inline-flex items-center justify-center rounded-full border border-white/50 px-[23px] py-[14px] text-[13px] font-bold text-white transition hover:bg-white/10"
              >
                Ver la solución
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}


