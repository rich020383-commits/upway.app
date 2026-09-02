'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
} from 'lucide-react';

const painPoints = [
  {
    title: 'Pedidos sin respuesta',
    text: 'Los clientes preguntan por productos y disponibilidad, pero muchas veces no reciben una respuesta clara ni rápida.',
    icon: MessageSquareText,
  },
  {
    title: 'Atención fragmentada',
    text: 'El equipo de atención atiende a varios canales, pero la coordinación no siempre es consistente ni ordenada.',
    icon: Users,
  },
  {
    title: 'Disponibilidad incierta',
    text: 'Cuando no se sabe si un producto está disponible, se pierde el interés y la venta se complica.',
    icon: MapPin,
  },
  {
    title: 'Operación más pesada',
    text: 'El volumen de consultas y apoyo operativo aumenta y el equipo termina respondiendo manualmente todo.',
    icon: Clock3,
  },
];

const solutionPillars = [
  {
    title: 'Respuesta ágil',
    text: 'Atiende preguntas frecuentes sobre productos, horarios, disponibilidad y pedidos sin esperar al equipo humano.',
    icon: Sparkles,
  },
  {
    title: 'Disponibilidad guiada',
    text: 'Ayuda a confirmar si el producto está disponible y orienta al cliente con la siguiente mejor acción.',
    icon: BadgeCheck,
  },
  {
    title: 'Pedido asistido',
    text: 'Guiar a la persona para comprar, retirar o consultar con mayor claridad y menos fricción.',
    icon: ShoppingBag,
  },
  {
    title: 'Seguimiento útil',
    text: 'Mantén conversaciones activas para que no se pierda un pedido, recomendación o venta potencial.',
    icon: Truck,
  },
];

const benefits = [
  'Más pedidos aclarados y convertidos',
  'Menos consultas repetitivas y manuales',
  'Atención más clara y consistente',
  'Operación más escalable y ordenada',
];

const differentiators = [
  'Disponibilidad guiada',
  'Pedidos asistidos',
  'Atención 24/7',
  'Respuestas rápidas',
  'Coordinación operativa',
  'Servicio más claro',
];

export default function DrogueriasLandingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,125,255,0.16),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#edf4ff_100%)] text-slate-900">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-[#2457f5]" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Upway</div>
            <div className="text-lg font-black tracking-[-0.05em]">Droguerías</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 md:inline-flex">
            Iniciar sesión
          </Link>
          <Link href="/register?segment=drogueria" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5">
            Activar flujo droguería
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
        <section className="rounded-[36px] border border-slate-200 bg-white/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8 lg:p-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe7ff] bg-[#edf3ff] px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-[#2457f5]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Upway
              </div>

              <h1 className="mt-6 max-w-xl text-4xl font-black leading-[0.96] tracking-[-0.06em] text-slate-900 md:text-6xl">
                Respuesta más rápida para cada pedido, consulta y necesidad del cliente
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                Upway ayuda a droguerías y negocios de consumo a responder mejor, reducir fricción en pedidos y mantener una experiencia más clara para clientes y equipo.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register?segment=drogueria" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5">
                  Activar flujo droguería
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#contacto" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
                  Hablar con un especialista
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-[32px] bg-[radial-gradient(circle_at_center,_rgba(36,87,245,0.17),_transparent_55%)] blur-3xl" />
              <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
                <div className="rounded-[26px] border border-white/10 bg-gradient-to-br from-[#0d1727] via-[#132d51] to-[#2457f5] p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#93c5fd]" />
                      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-blue-100/80">care flow</span>
                    </div>
                    <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-medium text-blue-100/80">droguería</span>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-blue-100/70">Pedidos</div>
                      <div className="mt-3 text-3xl font-black tracking-[-0.06em]">+41%</div>
                      <div className="mt-2 text-sm text-blue-100/75">más consultas resueltas</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-blue-100/70">Tiempo</div>
                      <div className="mt-3 text-3xl font-black tracking-[-0.06em]">-38%</div>
                      <div className="mt-2 text-sm text-blue-100/75">menos demora operativa</div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-[#0b1422]/80 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-100/75">Flujo activo</span>
                      <span className="rounded-full bg-[#18a66e]/15 px-2 py-1 text-[10px] font-medium text-green-300">en vivo</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {['Consulta recibida', 'Producto o pedido validado', 'Respuesta guiada', 'Seguimiento y cierre'].map((item, index) => (
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

        <section className="mt-20 rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm md:p-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#2457f5]">Problema</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900 md:text-4xl">
              Cuando el cliente no sabe si hay disponibilidad o no recibe respuesta, la venta se pierde.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {painPoints.map(({ title, text, icon: Icon }) => (
              <div key={title} className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#2457f5]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-[-0.04em] text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <div className="max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#2457f5]">Solución</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900 md:text-4xl">
              Un flujo más claro para atender pedidos, dudas y disponibilidad
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {solutionPillars.map(({ title, text, icon: Icon }) => (
              <div key={title} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.04)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-[-0.04em] text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] md:p-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-blue-200/80">Beneficios</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white md:text-4xl">
              Beneficios reales para la operación diaria
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {benefits.map((item) => (
              <div key={item} className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <div className="max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#2457f5]">Diferenciadores</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900 md:text-4xl">
              Diseñado para negocios con mucha consulta y una operación dinámica
            </h2>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {differentiators.map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                {item}
              </span>
            ))}
          </div>
        </section>

        <section id="contacto" className="mt-20">
          <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-[#0d1727] via-[#122841] to-[#2457f5] p-8 text-white shadow-[0_30px_80px_rgba(13,23,39,0.24)] md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-blue-100/80">Upway</p>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">
                  Activar flujo droguería
                </h2>
                <p className="mt-4 text-base leading-7 text-blue-100/80">
                  Diseñemos atención más clara, mejor coordinación y más conversiones para tu operación diaria sin caer en procesos manuales y fragmentados.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/register?segment=drogueria" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5">
                  Hablar con un especialista
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-4 border-t border-slate-200/80 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/80 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-[#2457f5]" />
          </div>
          <span className="font-semibold text-slate-800">Upway</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="transition hover:text-slate-900">Inicio</Link>
          <Link href="/dashboard/onboarding?segment=drogueria" className="transition hover:text-slate-900">Onboarding</Link>
          <Link href="/login" className="transition hover:text-slate-900">Acceso</Link>
        </div>
      </footer>
    </main>
  );
}
