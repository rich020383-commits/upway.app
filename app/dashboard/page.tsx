import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, CalendarRange, MessageCircleMore, Headphones } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      
      {/* Navbar Superior */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-black text-lg shadow-sm">
              UP
            </div>
            <span className="font-extrabold tracking-tight text-xl text-slate-900">
              Upway <span className="text-slate-500 font-medium text-sm">Business</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#soluciones" className="hover:text-slate-900 transition">Soluciones</a>
            <a href="#sectores" className="hover:text-slate-900 transition">Sectores</a>
            <a href="#proceso" className="hover:text-slate-900 transition">Proceso</a>
            <a href="#contacto" className="hover:text-slate-900 transition">Contacto</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition">
              Acceso
            </Link>
            <Link 
              href="/dashboard/onboarding/lienzo?segment=general" 
              className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition"
            >
              Ver demo <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Columna Izquierda: Mensaje Directo al Empresario */}
          <div className="lg:col-span-6 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-700 shadow-sm">
              <Sparkles size={14} className="text-slate-900" /> Premium Enterprise Ops
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.08]">
              Operación inteligente para crecer con control.
            </h1>
            
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              Centralizamos atención, ventas, agenda y escalamiento para empresas y clínicas que quieren crecer con velocidad, consistencia y disciplina operativa.
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link 
                href="/dashboard/onboarding/lienzo?segment=general" 
                className="flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-sm font-bold text-white shadow-xl hover:bg-slate-800 transition"
              >
                Agendar consultoría <ArrowRight size={18} />
              </Link>
              <a 
                href="#soluciones" 
                className="flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-700 shadow-sm hover:border-slate-400 transition"
              >
                Ver soluciones
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4">
              {['Atención', 'Ventas', 'Agenda', 'Triage', 'Operación'].map((tag, i) => (
                <span key={i} className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Columna Derecha: El Command Center con Sophie v2 (Video Animado Prominente) */}
          <div className="lg:col-span-6">
            <div className="relative rounded-[32px] border border-slate-800 bg-[#0A0D14] p-6 shadow-[0_30px_70px_rgba(15,23,42,0.2)] text-white">
              
              {/* Barra de Estado Superior */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  Operación Activa
                </div>
                <span className="text-xs font-mono text-slate-400">24/7 AI Engine</span>
              </div>

              {/* INTEGRACIÓN PRINCIPAL DE SOPHIE V2 (VIDEO ANIMADO DESTACADO) */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 my-6 p-4 flex items-center gap-5 shadow-inner">
                <div className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md">
                  <video 
                    src="/sophie-optimizada.webm" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 mb-1">
                    <Sparkles size={14} /> Sophie v2 • Empleado Digital
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Orquestando llamadas, chats y flujos clínicos en tiempo real con contexto de negocio absoluto.
                  </p>
                </div>
              </div>

              {/* Estadísticas en vivo */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5">
                  <p className="text-xs font-semibold text-slate-400 mb-1">ATENCIONES</p>
                  <p className="text-3xl font-black tracking-tight text-white">+38%</p>
                  <p className="text-[11px] text-slate-400 mt-1">respuestas más rápidas</p>
                </div>
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5">
                  <p className="text-xs font-semibold text-slate-400 mb-1">CARGA</p>
                  <p className="text-3xl font-black tracking-tight text-white">-42%</p>
                  <p className="text-[11px] text-slate-400 mt-1">manual de atención</p>
                </div>
              </div>

              {/* Lista de Trabajo Crítico */}
              <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                  <span>Trabajo crítico</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> en vivo
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-slate-300 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300">1</span>
                  Triage asistido y calificación
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-slate-300 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300">2</span>
                  Agenda inteligente sincronizada
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-slate-300 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300">3</span>
                  Escalamiento humano automático
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Sección de Soluciones / Pilares */}
      <section id="soluciones" className="bg-white py-24 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 mb-4">
              Infraestructura unificada para escalar
            </h2>
            <p className="text-slate-600 text-lg">
              Todo lo que tu empresa o clínica necesita para operar con precisión quirúrgica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="rounded-3xl border border-slate-200 p-8 bg-[#F8FAFC] flex flex-col justify-between transition hover:shadow-md">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 mb-6 shadow-sm">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Centro de Control</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Inbox multicanal y tableros visuales para coordinar a todo tu equipo con trazabilidad total.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 p-8 bg-[#F8FAFC] flex flex-col justify-between transition hover:shadow-md">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 mb-6 shadow-sm">
                  <CalendarRange size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Agenda Inteligente</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Gestión impecable de turnos, especialistas y disponibilidad sin cruces de horarios.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 p-8 bg-[#F8FAFC] flex flex-col justify-between transition hover:shadow-md">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 mb-6 shadow-sm">
                  <MessageCircleMore size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">WhatsApp IA</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Captura, calificación y recordatorios automáticos operando 24/7 sin descuidar ningún lead.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 p-8 bg-[#F8FAFC] flex flex-col justify-between transition hover:shadow-md">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 mb-6 shadow-sm">
                  <Headphones size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Voz IA (Sophie v2)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Recepcionista telefónica autónoma con voz humana natural para manejar alto tráfico de llamadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-[#F8FAFC] py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs">
              UP
            </div>
            <span className="font-bold text-slate-900">Upway Business</span>
          </div>
          <p>© 2026 Upway. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Panel</Link>
            <Link href="/dashboard/onboarding/lienzo" className="hover:text-slate-900 transition">Configuración</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}