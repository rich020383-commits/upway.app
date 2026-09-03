'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  HeartPulse,
  Landmark,
  MessageSquareText,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react';

const sectors = [
  {
    id: 'health',
    name: 'Health',
    description: 'Triage, agenda, FAQ y escalamiento clínico con rigor operativo.',
    route: '/industries/clinicas',
    icon: HeartPulse,
    accent: 'from-[#101d36] via-[#183d75] to-[#2d78ff]',
  },
  {
    id: 'real-estate',
    name: 'Inmobiliaria',
    description: 'Leads calificados y coordinación de citas sin fricción.',
    route: '/industries/inmobiliarias',
    icon: Landmark,
    accent: 'from-[#11263c] via-[#1c3e67] to-[#6b8ec9]',
  },
  {
    id: 'retail',
    name: 'Retail',
    description: 'Atención comercial más inteligente y consistente.',
    route: '/industries/tiendas',
    icon: Store,
    accent: 'from-[#142b40] via-[#234c77] to-[#2d9bd5]',
  },
  {
    id: 'supermarket',
    name: 'Supermercado',
    description: 'Soporte, promociones y ayuda más rápida en cada punto de contacto.',
    route: '/industries/supermercados',
    icon: ShoppingCart,
    accent: 'from-[#0c1f31] via-[#1a3f5e] to-[#48a9ea]',
  },
  {
    id: 'pharmacy',
    name: 'Droguería',
    description: 'Pedidos, consulta de productos y coordinación operativa.',
    route: '/industries/droguerias',
    icon: ShieldCheck,
    accent: 'from-[#0f2034] via-[#1f3b5d] to-[#2a8fca]',
  },
  {
    id: 'other',
    name: 'Otro negocio',
    description: 'Diseñamos un flujo exacto para tu operación.',
    route: '/dashboard/onboarding',
    icon: BriefcaseBusiness,
    accent: 'from-[#14263d] via-[#1c3556] to-[#607cad]',
  },
];

const pains = [
  {
    title: 'Atención lenta',
    text: 'Las consultas se acumulan y la operación se vuelve más costosa.',
    icon: TrendingUp,
  },
  {
    title: 'Pérdida de oportunidades',
    text: 'Cada lead sin respuesta clara es un cliente que se va.',
    icon: ArrowRight,
  },
  {
    title: 'Carga manual',
    text: 'Tareas repetitivas consumen tiempo valioso del equipo.',
    icon: Building2,
  },
  {
    title: 'Operación frágil',
    text: 'Sin estructura, la experiencia cambia según la persona y el turno.',
    icon: MessageSquareText,
  },
];

const pillars = [
  {
    title: 'Responde rápido',
    text: 'Atención inteligente en tiempo real para cada canal crítico.',
  },
  {
    title: 'Agenda y coordina',
    text: 'Citas, confirmaciones y seguimiento sin depender de tareas repetitivas.',
  },
  {
    title: 'Prioriza y escala',
    text: 'Reglas de flujo para crecer sin perder control ni calidad.',
  },
  {
    title: 'Mantiene control',
    text: 'Políticas, escalamiento y seguridad con visión operativa real.',
  },
];

const trustTags = ['Atención', 'Ventas', 'Agenda', 'Triage', 'Operación'];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(33,92,218,0.14),_transparent_26%),linear-gradient(180deg,_#f7faff_0%,_#edf4ff_100%)] text-slate-900">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
            <Image src="/upway.png" alt="Upway logo" width={40} height={40} className="h-10 w-10 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">UPWAY</span>
            <span className="text-xl font-black tracking-[-0.05em] text-slate-900">Business</span>
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <Link href="#soluciones" className="transition hover:text-slate-900">Soluciones</Link>
          <Link href="#sectores" className="transition hover:text-slate-900">Sectores</Link>
          <Link href="#proceso" className="transition hover:text-slate-900">Proceso</Link>
          <Link href="#contacto" className="transition hover:text-slate-900">Contacto</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300 md:inline-flex">
            Acceso
          </Link>
          <Link href="#contacto" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5">
            Ver demo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
        <section className="rounded-[38px] border border-slate-200 bg-white/80 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8 lg:p-10">
          
          {/* BANNER PANORÁMICO SUPERIOR DE SOPHIE V2 (ABARCA TODO EL ANCHO ARRIBA) */}
          <div className="relative mb-10 overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-r from-slate-950 via-[#0d1727] to-slate-950 p-6 md:p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-4 relative h-44 md:h-52 overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-inner">
                <video 
                  src="/sophie-animada.webm" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="h-full w-full object-cover object-center scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
              </div>
              <div className="md:col-span-8 space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-[#7dd3fc] backdrop-blur-md border border-white/10">
                  <Sparkles className="h-3.5 w-3.5" /> Sophie v2 • Empleado Digital Autónomo
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  Operación y Triage en Vivo 24/7
                </h2>
                <p className="text-sm text-blue-100/80 leading-relaxed max-w-2xl">
                  Orquestando llamadas telefónicas, chats de WhatsApp y flujos operativos con contexto de negocio absoluto en tiempo real. Diseñado para escalar sin fricción.
                </p>
              </div>
            </div>
          </div>

          {/* DOS COLUMNAS DEBAJO DEL BANNER */}
          <div className="grid items-center gap-10 lg:grid-cols-[1.06fr_0.94fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#1b5ed6]">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#dfeaff] bg-[#edf4ff] px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Upway Business
                </span>
                <span className="text-slate-500">Premium ops</span>
              </div>

              <h1 className="mt-6 max-w-xl text-5xl font-black leading-[0.9] tracking-[-0.07em] text-slate-900 md:text-[5.15rem]">
                Operación inteligente para crecer con control.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 md:text-xl">
                Centralizamos atención, ventas, agenda y escalamiento para empresas que quieren crecer con velocidad,
                consistencia y disciplina operativa.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="#contacto" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5">
                  Agendar consultoría
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#sectores" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
                  Ver sectores
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                {trustTags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* COLUMNA DERECHA: EL CUADRO NEGRO (DASHBOARD) */}
            <div className="relative">
              <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 p-4 shadow-[0_32px_80px_rgba(15,23,42,0.18)]">
                <div className="rounded-[26px] border border-white/10 bg-gradient-to-br from-[#0d1727] via-[#152c48] to-[#1d5fd9] p-5 text-white">
                  <div className="flex items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#7dd3fc]" />
                      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-blue-100/80">Operación activa</span>
                    </div>
                    <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-medium text-blue-100/80">24/7</span>
                  </div>

                  <div className="mt-2 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-blue-100/70">Atenciones</div>
                      <div className="mt-3 text-3xl font-black tracking-[-0.06em]">+38%</div>
                      <div className="mt-2 text-sm text-blue-100/75">respuestas más rápidas</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-blue-100/70">Carga</div>
                      <div className="mt-3 text-3xl font-black tracking-[-0.06em]">-42%</div>
                      <div className="mt-2 text-sm text-blue-100/75">manual de atención</div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-[#0b1422]/80 p-4">
                    <div className="flex items-center justify-between text-sm text-blue-100/75">
                      <span>Trabajo crítico</span>
                      <span className="rounded-full bg-[#18a66e]/15 px-2 py-1 text-[10px] font-medium text-green-300">en vivo</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {['Triaje asistido', 'Agenda inteligente', 'Escalamiento humano', 'Reglas de seguridad'].map((item, index) => (
                        <div key={item} className="flex items-center gap-3 text-sm text-white/90">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-[#9fd4ff]">
                            {index + 1}
                          </div>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section id="sectores" className="mt-20">
          <div className="mb-7 max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#1b5ed6]">Sectores</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900 md:text-4xl">
              Un sistema hecho para operar con cada modelo de negocio.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sectors.map(({ id, name, description, route, icon: Icon, accent }) => (
              <Link
                key={id}
                href={route}
                className="group relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-1 shadow-[0_20px_50px_rgba(15,23,42,0.05)] transition hover:-translate-y-1"
              >
                <div className={`relative flex min-h-[220px] flex-col justify-between rounded-[26px] bg-gradient-to-br ${accent} p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/80 transition-transform group-hover:translate-x-1" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black tracking-[-0.05em]">{name}</h3>
                    <p className="mt-3 max-w-xs text-sm leading-6 text-white/80">{description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="soluciones" className="mt-20 rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm md:p-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#1b5ed6]">Problema</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900 md:text-4xl">
              El problema no es la IA. Es operar sin estructura.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pains.map(({ title, text, icon: Icon }) => (
              <div key={title} className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1b5ed6]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-[-0.04em] text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="proceso" className="mt-20">
          <div className="max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#1b5ed6]">Solución</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900 md:text-4xl">
              Atención, ventas y coordinación inteligente.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pillars.map((item, index) => (
              <div key={item.title} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.04)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-[-0.04em] text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contacto" className="mt-20">
          <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-[#0d1727] via-[#122841] to-[#1b5ed6] p-8 text-white shadow-[0_30px_80px_rgba(13,23,39,0.24)] md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-blue-100/80">Upway</p>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">
                  Diseñemos tu flujo ideal.
                </h2>
                <p className="mt-4 text-base leading-7 text-blue-100/80">
                  Armaramos la solución, definiremos el modelo operativo y te ayudaremos a convertir cada interacción en una ventaja real.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5">
                  Hablar con un especialista
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#sectores" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
                  Elegir mi industria
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-2 w-full max-w-7xl border-t border-slate-200/80 px-6 py-8 text-sm text-slate-600 md:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-sm">
              <Image src="/upway.png" alt="Upway logo" width={28} height={28} className="h-7 w-7 object-contain" />
            </div>
            <span className="font-semibold text-slate-800">Upway Business</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <Link href="#soluciones" className="transition hover:text-slate-900">Privacidad</Link>
            <Link href="#sectores" className="transition hover:text-slate-900">Términos</Link>
            <a href="mailto:contacto@upway.business" className="transition hover:text-slate-900">contacto@upway.business</a>
          </div>
        </div>
      </footer>
    </main>
  );
}