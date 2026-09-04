'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  HeartPulse,
  Landmark,
  MessageSquareText,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Stethoscope,
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

const healthLevels = [
  {
    level: 'Nivel 1 · Captura y triage',
    title: 'Cada consulta entra clasificada, sin esperas',
    text: 'Sophie evalúa síntomas, urgencia y perfil del paciente en segundos por WhatsApp o llamada, aplicando tus protocolos clínicos y escalando casos críticos de inmediato.',
    icon: Stethoscope,
  },
  {
    level: 'Nivel 2 · Agenda inteligente',
    title: 'Agenda llena, cero no-show',
    text: 'Confirmaciones, recordatorios y reprogramación automática 24/7. La agenda coordinada por IA reduce las ausencias y libera a tu equipo humano para lo que importa.',
    icon: CalendarClock,
  },
  {
    level: 'Nivel 3 · Operación clínica soportada',
    title: 'Cumplimiento, auditoría y control total',
    text: 'Políticas de privacidad, registro de auditoría y escalamiento humano con supervisión. Cumplimiento normativo y trazabilidad de cada decisión clínica.',
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <main className="upway-dark-shell relative min-h-screen text-slate-100">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[#2d78ff]/20 blur-[140px]" />

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-[0_10px_30px_rgba(45,120,255,0.25)] backdrop-blur-md">
            <Image src="/upway.png" alt="Upway logo" width={40} height={40} className="h-10 w-10 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7dd3fc]">UPWAY</span>
            <span className="text-xl font-black tracking-[-0.05em] text-white">Business</span>
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
          <Link href="#soluciones" className="transition hover:text-white">Soluciones</Link>
          <Link href="#sectores" className="transition hover:text-white">Sectores</Link>
          <Link href="#proceso" className="transition hover:text-white">Proceso</Link>
          <Link href="#contacto" className="transition hover:text-white">Contacto</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 backdrop-blur-md transition hover:border-white/30 hover:bg-white/10 md:inline-flex">
            Acceso
          </Link>
          <Link href="#contacto" className="btn-glow-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5">
            Ver demo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 md:px-10">
      <section>

          {/* VIDEO CINEMATOGRÁFICO DE SOPHIE V2 — RESPLANDOR PREMIUM */}
          <div className="relative mb-14 overflow-hidden rounded-[32px] border border-white/15 bg-slate-950 shadow-[0_40px_120px_rgba(2,8,18,0.7)] ring-1 ring-[#2d78ff]/25">
            <div className="absolute -inset-px rounded-[32px] bg-gradient-to-r from-[#2d78ff]/40 via-transparent to-[#7dd3fc]/30 opacity-60 blur-sm" />

            {/* VIDEO — en móvil ocupa todo el ancho sin texto encima */}
            <div className="relative h-[320px] w-full overflow-hidden rounded-t-[32px] md:h-[500px] lg:h-[560px] md:rounded-[32px]">
              <video
                src="/sophie-animada.webm"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                controlsList="nodownload nofullscreen"
                className="h-full w-full object-cover object-center [transform:translateZ(0)] [will-change:transform]"
              />
              {/* Degradados cinematográficos — solo en desktop para fusionar el texto */}
              <div className="absolute inset-0 hidden bg-gradient-to-t from-[#050b16] via-[#050b16]/20 to-transparent md:block"></div>
              <div className="absolute inset-0 hidden bg-gradient-to-r from-[#050b16]/60 via-transparent to-[#050b16]/50 md:block"></div>
            </div>

            {/* Contenido flotante: panel propio en móvil, overlay en desktop */}
            <div className="relative z-10 flex flex-col justify-between gap-6 border-t border-white/10 bg-[#0a1424]/95 px-6 py-8 backdrop-blur-md md:absolute md:bottom-12 md:left-12 md:right-12 md:flex-row md:items-end md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
              <div className="max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#7dd3fc]/30 bg-[#7dd3fc]/10 px-4 py-1.5 text-xs font-bold text-[#7dd3fc] shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7dd3fc] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7dd3fc]" />
                  </span>
                  Sophie v2 • Empleado Digital Autónomo
                </div>
                <h2 className="text-2xl font-black leading-tight tracking-tight text-white md:text-5xl">
                  Operación y Triage en Vivo <span className="text-shimmer">24/7</span>
                </h2>
                <p className="text-sm leading-relaxed text-blue-100/90 md:text-base">
                  Orquestando llamadas telefónicas, chats de WhatsApp y flujos operativos con contexto de negocio absoluto en tiempo real. Diseñado para escalar sin fricción.
                </p>
              </div>
              <div className="shrink-0">
                <Link
                  href="#contacto"
                  className="btn-glow-primary inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                >
                  Probar en vivo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* HERO COPY + DASHBOARD EN VIVO */}
          <div className="grid items-center gap-10 lg:grid-cols-[1.06fr_0.94fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#7dd3fc]">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#7dd3fc]/25 bg-[#7dd3fc]/10 px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Upway Business
                </span>
                <span className="text-slate-400">Infraestructura operativa premium</span>
              </div>

              <h1 className="mt-6 max-w-xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-white md:text-[5rem]">
                Operación <span className="text-shimmer">inteligente</span> para crecer con control.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-8 text-slate-400 md:text-xl">
                Centralizamos atención, ventas, agenda y escalamiento para empresas que quieren crecer con velocidad,
                consistencia y disciplina operativa.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="#contacto" className="btn-glow-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5">
                  Agendar consultoría
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#sectores" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur-md transition hover:border-white/30 hover:bg-white/10">
                  Ver sectores
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                {trustTags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* COLUMNA DERECHA: EL CUADRO NEGRO (DASHBOARD) */}
            <div className="relative">
              <div className="absolute -inset-6 rounded-[40px] bg-[#2d78ff]/15 blur-3xl animate-pulse-glow" />
              <div className="glass-dark relative overflow-hidden rounded-[32px] p-4">
                <div className="rounded-[26px] border border-white/10 bg-gradient-to-br from-[#0d1727] via-[#152c48] to-[#1d5fd9] p-5 text-white">
                  <div className="flex items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#7dd3fc]" />
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

        {/* SPOTLIGHT HEALTH — ARGUMENTOS CLÍNICOS EN NIVELES LÓGICOS */}
        <section id="health" className="relative mt-24 overflow-hidden rounded-[36px] border border-emerald-400/20 bg-gradient-to-br from-[#04120e] via-[#06231c] to-[#0a1626] p-6 md:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-teal-500/10 blur-[90px]" />

          <div className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold text-emerald-300">
                <HeartPulse className="h-4 w-4" />
                Vertical Health · Nuestro segmento más exclusivo
              </div>
              <h2 className="mt-6 text-3xl font-black leading-[1.05] tracking-[-0.05em] text-white md:text-[2.9rem]">
                Automatización clínica con <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">rigor médico</span> y excelencia operativa.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-8 text-slate-400">
                Clínicas, consultorios y centros médicos operan 24/7 con Sophie: triage clínico asistido, agenda inteligente, cumplimiento normativo y escalamiento humano supervisado.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/industries/clinicas" className="btn-glow-health inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5">
                  Ver Health en detalle
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/health" className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/5 px-6 py-3.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/10">
                  <Stethoscope className="h-4 w-4" />
                  Explorar consola Health
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  ['24/7', 'cobertura total'],
                  ['-42%', 'carga manual'],
                  ['100%', 'trazabilidad'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <div className="text-2xl font-black tracking-[-0.05em] text-emerald-300">{value}</div>
                    <div className="mt-1 text-[11px] leading-4 text-slate-400">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {healthLevels.map(({ level, title, text, icon: Icon }, index) => (
                <div key={level} className="card-lift group relative rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md hover:border-emerald-400/30 hover:bg-emerald-400/[0.06]">
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      {index < healthLevels.length - 1 && (
                        <div className="absolute left-1/2 top-14 h-6 w-px -translate-x-1/2 bg-gradient-to-b from-emerald-400/40 to-transparent" />
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-300/90">{level}</div>
                      <h3 className="mt-1.5 text-lg font-bold tracking-[-0.03em] text-white">{title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-slate-400">{text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="sectores" className="mt-24">
          <div className="mb-8 max-w-3xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#7dd3fc]">Sectores</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white md:text-4xl">
              Un sistema hecho para operar con cada modelo de negocio.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-400">
              Health es nuestro vertical insignia. Además, desplegamos la misma infraestructura de automatización para otras industrias con flujos a medida.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sectors.map(({ id, name, description, route, icon: Icon, accent }) => (
              <Link
                key={id}
                href={route}
                className="card-lift group relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.03] p-1 backdrop-blur-md hover:border-[#7dd3fc]/30"
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

        <section id="soluciones" className="mt-24 rounded-[32px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md md:p-10">
          <div className="max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#7dd3fc]">Problema</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white md:text-4xl">
              El problema no es la IA. Es operar sin estructura.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pains.map(({ title, text, icon: Icon }) => (
              <div key={title} className="card-lift rounded-[26px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm hover:border-[#7dd3fc]/25">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#7dd3fc]/20 bg-[#7dd3fc]/10 text-[#7dd3fc]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-[-0.04em] text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="proceso" className="mt-24">
          <div className="max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#7dd3fc]">Solución</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white md:text-4xl">
              Atención, ventas y coordinación inteligente.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pillars.map((item, index) => (
              <div key={item.title} className="card-lift rounded-[28px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md hover:border-[#7dd3fc]/25">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#2d78ff] to-[#1447b8] text-sm font-bold text-white shadow-[0_8px_20px_rgba(45,120,255,0.4)]">
                  {index + 1}
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-[-0.04em] text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contacto" className="mt-24">
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0d1727] via-[#122841] to-[#1b5ed6] p-8 text-white shadow-[0_40px_100px_rgba(2,8,18,0.6)] md:p-12">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#7dd3fc]/20 blur-[80px]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
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
      </div>

      <footer className="relative z-10 mx-auto mt-2 w-full max-w-7xl border-t border-white/10 px-6 py-8 text-sm text-slate-400 md:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/5">
              <Image src="/upway.png" alt="Upway logo" width={28} height={28} className="h-7 w-7 object-contain" />
            </div>
            <span className="font-semibold text-white">Upway Business</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <Link href="#soluciones" className="transition hover:text-white">Privacidad</Link>
            <Link href="#sectores" className="transition hover:text-white">Términos</Link>
            <a href="mailto:contacto@upway.business" className="transition hover:text-white">contacto@upway.business</a>
          </div>
        </div>
      </footer>
    </main>
  );
}