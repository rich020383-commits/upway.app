"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  HeartPulse,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { SEGMENT_ROUTE_MAP, VERTICALS } from '../../../lib/verticals';

const capabilityCards = [
  {
    title: 'Ventas y captación',
    description: 'Leads, qualification, follow-up y cierre más inteligente.',
    icon: TrendingUp,
    accent: 'bg-[#edf4ff] text-[#1b5ed6]',
  },
  {
    title: 'Atención 24/7',
    description: 'Agentes multicanal con respuestas rápidas y consistentes.',
    icon: MessageSquareText,
    accent: 'bg-[#f4ebff] text-[#7c4dff]',
  },
  {
    title: 'Agendamiento',
    description: 'Reservas, citas, confirmaciones y coordinación operativa.',
    icon: CalendarCheck2,
    accent: 'bg-[#ebfff5] text-[#0f9f6e]',
  },
  {
    title: 'Compliance y seguridad',
    description: 'Reglas, escalamiento humano y control de riesgo para operaciones sensibles.',
    icon: ShieldCheck,
    accent: 'bg-[#fef4e7] text-[#d97706]',
  },
];

const flowOptions = [
  {
    id: 'health',
    title: VERTICALS.health.label,
    subtitle: 'Operación clínica con triage, políticas, escalamiento y control de privacidad.',
    description: 'Ideal para clínicas, centros médicos, urgencias y workflows con riesgo clínico.',
    route: VERTICALS.health.onboardingRoute,
    accent: 'from-[#0d1b2a] via-[#15355d] to-[#1d5fd9]',
    icon: HeartPulse,
  },
  {
    id: 'inmobiliaria',
    title: VERTICALS.inmobiliaria.label,
    subtitle: 'Captación comercial, agenda de visitas y seguimiento operativo.',
    description: 'Muy útil para inmobiliarias con leads, coordinación de agentes y cierre más organizado.',
    route: VERTICALS.inmobiliaria.onboardingRoute,
    accent: 'from-[#11263c] via-[#1c3e67] to-[#6b8ec9]',
    icon: Building2,
  },
  {
    id: 'retail',
    title: VERTICALS.retail.label,
    subtitle: 'Atención comercial más rápida, más clara y más consistente.',
    description: 'Diseñado para tiendas, cadenas de retail y equipos comerciales con mucha rotación.',
    route: VERTICALS.retail.onboardingRoute,
    accent: 'from-[#142b40] via-[#234c77] to-[#2d9bd5]',
    icon: MessageSquareText,
  },
  {
    id: 'supermercado',
    title: VERTICALS.supermercado.label,
    subtitle: 'Consultas, promociones y soporte con mayor capacidad operativa.',
    description: 'Ideal para supermercados con tráfico alto y mucha demanda repetitiva por canales.',
    route: VERTICALS.supermercado.onboardingRoute,
    accent: 'from-[#0c1f31] via-[#1a3f5e] to-[#48a9ea]',
    icon: TrendingUp,
  },
  {
    id: 'drogueria',
    title: VERTICALS.drogueria.label,
    subtitle: 'Pedidos, disponibilidad y consultas con coordinación más precisa.',
    description: 'Perfecto para droguerías y establecimientos que necesitan rapidez y orden operativo.',
    route: VERTICALS.drogueria.onboardingRoute,
    accent: 'from-[#0f2034] via-[#1f3b5d] to-[#2a8fca]',
    icon: ShieldCheck,
  },
  {
    id: 'business',
    title: VERTICALS.general.label,
    subtitle: 'Configuración operativa para atención comercial, ventas y soporte.',
    description: 'Perfecto para negocios, agencias, servicios y equipos de atención con procesos repetitivos.',
    route: VERTICALS.general.onboardingRoute,
    accent: 'from-[#12263f] via-[#1d3557] to-[#5d7dbb]',
    icon: BriefcaseBusiness,
  },
];

function CACPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const segment = searchParams.get('segment');

  useEffect(() => {
    if (!segment) return;

    const target = SEGMENT_ROUTE_MAP[segment] ?? SEGMENT_ROUTE_MAP.general;
    router.replace(target);
  }, [router, segment]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(95,144,255,0.12),_transparent_30%),linear-gradient(180deg,_#edf4ff_0%,_#f8fbff_100%)] text-slate-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 shadow-sm">
            <Building2 className="h-5 w-5 text-[#1b5ed6]" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Upway</div>
            <div className="text-lg font-black tracking-[-0.05em]">CAC</div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-600 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-[#1b5ed6]" />
          Capability activation center
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 md:px-10">
        <section className="rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#1b5ed6]">
              Centro de activación operativa
            </p>
            <h1 className="mt-5 text-4xl font-black leading-[0.96] tracking-[-0.06em] text-slate-900 md:text-5xl">
              Primero vemos la capacidad real de Upway.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Aquí definimos el alcance de la operación que quieres activar antes de decidir si es una clínica, una empresa o un modelo híbrido.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {capabilityCards.map(({ title, description, icon: Icon, accent }) => (
              <div
                key={title}
                className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 transition-transform duration-200 hover:-translate-y-1"
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold tracking-[-0.04em] text-slate-900">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-slate-500">Selecciona tu contexto</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900">¿Qué tipo de operación quieres activar?</h2>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {flowOptions.map(({ id, title, subtitle, description, route, accent, icon: Icon }) => (
              <button
                key={id}
                onClick={() => router.push(route)}
                className="group relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-1 text-left shadow-[0_24px_60px_rgba(15,23,42,0.06)] transition-transform duration-200 hover:-translate-y-1"
              >
                <div className={`relative flex min-h-[260px] flex-col justify-between rounded-[26px] bg-gradient-to-br ${accent} p-6 text-white`}>
                  <div className="space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
                      <Icon className="h-6 w-6" />
                    </div>

                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/75">Upway flow</p>
                      <h3 className="mt-3 text-2xl font-black tracking-[-0.05em]">{title}</h3>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-base font-semibold text-white/90">{subtitle}</p>
                    <p className="max-w-md text-sm leading-6 text-white/75">{description}</p>

                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                      Activar flujo
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 text-slate-900">Cargando...</div>}>
      <CACPage />
    </Suspense>
  );
}