'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MessageCircle, Phone, Sparkles, Calendar, Bell, HeartPulse, Users, Clock, Shield } from 'lucide-react';
import { LEGAL_ENTITY } from '@/lib/legal';

const UpwayLogo = ({ className = '' }: { className?: string }) => (
  <div className={`inline-flex items-center px-4 py-2 rounded-2xl bg-black shadow-lg overflow-hidden ${className}`}>
    <Image src="/upway.png" alt="Upway" width={1000} height={667} quality={90} sizes="160px" preload className="h-7 md:h-8 w-auto object-contain" />
  </div>
);

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const [heroVideoLoaded, setHeroVideoLoaded] = useState(false);
  const [splashVideoLoaded, setSplashVideoLoaded] = useState(false);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  // Apaga el splash en pantallas grandes (>= 768px)
  const shouldSkipSplash = typeof window !== 'undefined' && window.innerWidth >= 768;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateBreakpoint = () => setIsMobile(mediaQuery.matches);

    if (mediaQuery.matches !== isMobile) {
      const id = requestAnimationFrame(() => setIsMobile(mediaQuery.matches));
      return () => cancelAnimationFrame(id);
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateBreakpoint);
      return () => mediaQuery.removeEventListener('change', updateBreakpoint);
    }

    mediaQuery.addListener(updateBreakpoint);
    return () => mediaQuery.removeListener(updateBreakpoint);
  }, [isMobile]);

  useEffect(() => {
    if (!shouldSkipSplash) return;
    const id = requestAnimationFrame(() => setShowSplash(false));
    return () => cancelAnimationFrame(id);
  }, [shouldSkipSplash]);

  useEffect(() => {
    if (typeof window === 'undefined' || !heroVideoRef.current) return;

    if (!('IntersectionObserver' in window)) {
      const id = requestAnimationFrame(() => setHeroVideoReady(true));
      return () => cancelAnimationFrame(id);
    }

    const video = heroVideoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHeroVideoReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px 0px' }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  /**
   * Scroll reveal premium: anima cada sección al entrar en viewport.
   * - Fail-open: si no hay IntersectionObserver o el usuario prefiere menos
   *   movimiento, el contenido queda visible sin tocar nada.
   * - Se salta la primera sección (el hero = elemento LCP): animarlo
   *   retrasaría la pintura principal.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>('main > section, main > footer')
    ).slice(1);
    if (targets.length === 0) return;

    // El estado oculto se aplica SOLO aquí, cuando ya sabemos que podemos animar.
    targets.forEach((el) => el.classList.add('reveal-pending'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          element.classList.remove('reveal-pending');
          element.classList.add('reveal-in');
          observer.unobserve(element);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleVideoEnd = () => {
    setFadeOut(true);
    setTimeout(() => {
      setShowSplash(false);
    }, 500);
  };

  return (
    <>
      {/* PANTALLA DE CARGA (SPLASH SCREEN) - SOLO MÓVIL */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-[9999] flex md:hidden items-center justify-center bg-[#050b16] transition-opacity duration-500 ${
            fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <video
            src="/logo-animado.mp4"
            autoPlay
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setSplashVideoLoaded(true)}
            onEnded={handleVideoEnd}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              splashVideoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      )}

      <main className="min-h-screen overflow-x-hidden bg-white text-[#0d3168] font-sans selection:bg-[#11b7b1] selection:text-white scroll-smooth">
        {/* NAVBAR SUPERIOR */}
        <header className="sticky top-0 z-50 flex h-[74px] items-center justify-between px-5 md:px-[5%] border-b border-[#edf3f8] bg-white/90 backdrop-blur-md">
          <a href="#inicio" className="flex items-center">
            <UpwayLogo />
          </a>
          <nav className="hidden md:flex gap-[34px] text-[13px] font-medium text-[#31547f]">
            <a href="#solucion" className="hover:text-[#103a77] transition">Solución</a>
            <a href="#agenda" className="hover:text-[#103a77] transition">Agenda</a>
            <a href="#beneficios" className="hover:text-[#103a77] transition">Beneficios</a>
            <a href="#sectores" className="hover:text-[#103a77] transition">Sectores</a>
            <a href="#contacto" className="hover:text-[#103a77] transition">Contacto</a>
          </nav>
          <a
            href="#contacto"
            className="hidden sm:inline-flex items-center justify-center rounded-full bg-[#0c3775] px-[23px] py-[10px] md:py-[14px] text-[11px] md:text-[13px] font-bold text-white hover:bg-[#092a5c] transition shadow-md"
          >
            Solicita una demo →
          </a>
        </header>

        {/* HERO */}
        <section id="inicio" className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 pt-[45px] md:pt-[70px] pb-[55px] px-5 md:px-[5%] items-center bg-[radial-gradient(circle_at_80%_30%,_#e8fbfa,_transparent_40%)]">
          <div className="flex flex-col">
            <div className="text-[#0ba9a9] font-bold text-[13px] mb-[17px]">♥ &nbsp; Software de atención en salud</div>
            <h1 className="font-display text-[35px] md:text-[52px] leading-[1.06] tracking-[-2px] md:tracking-[-2.6px] m-0 mb-[22px] font-extrabold">
              Conecta tu centro de salud con tus pacientes.<br />
              <em className="not-italic text-[#11b4b0]">Más simple, más humano.</em>
            </h1>
            <p className="text-[16px] leading-[1.65] text-[#49698f] max-w-[600px]">
              Un asistente de voz para tu clínica, consultorio o IPS, conectado a la Agenda Upway y a tu panel operativo. Atención telefónica, gestión de solicitudes y seguimiento por correo en una misma plataforma, para clínicas, IPS, EPS, centros de salud y consultorios.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 my-[26px]">
              <a
                href="#contacto"
                className="inline-flex items-center justify-center rounded-full bg-[#0c3775] px-[23px] py-[14px] text-[13px] font-bold text-white hover:bg-[#092a5c] hover:shadow-[0_22px_48px_rgba(12,55,117,0.42)] transition">
                Solicita una demo gratuita →
              </a>
              <a
                href="#solucion"
                className="inline-flex items-center justify-center rounded-full border border-[#b8cce3] bg-white px-[23px] py-[14px] text-[13px] font-bold text-[#0c3775] hover:bg-slate-50 hover:shadow-[0_22px_48px_rgba(12,55,117,0.22)] transition">
                Descubre cómo funciona
              </a>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-[20px] text-[#315982] text-[10px] font-semibold uppercase tracking-wide mt-2">
              <span className="flex items-center gap-1.5 text-cyan-500"><Phone className="h-3.5 w-3.5" /> Voz IA 24/7</span>
              <span className="flex items-center gap-1.5 text-cyan-500"><Calendar className="h-3.5 w-3.5" /> Agenda propia</span>
              <span className="flex items-center gap-1.5 text-cyan-500"><Bell className="h-3.5 w-3.5" /> Confirmaciones por correo</span>
              <span className="flex items-center gap-1.5 text-cyan-500"><Shield className="h-3.5 w-3.5" /> Datos y trazabilidad</span>
            </div>
          </div>
          <div className="relative mt-8 md:mt-0">
            <Image
              src="/hero-doctora.png"
              alt="Profesional de salud usando tecnología"
              width={490}
              height={390}
              preload
              quality={90}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 46vw, 600px"
              className="w-full rounded-[34px] block shadow-[0_0_0_2px_rgba(11,169,169,0.12),0_30px_90px_rgba(11,169,169,0.30)] health-glow-breath object-cover"
            />
            <div className="absolute left-2 md:-left-[35px] top-[40px] md:top-[65px] bg-white border border-[#e2edf5] rounded-[15px] p-[13px_17px] shadow-[0_12px_35px_#173e6820] text-[11px] leading-tight">
              ◉ <b className="font-bold">Recordatorio de cita</b>
              <br />
              <small className="text-gray-500 text-[10px]">Cita confirmada para mañana</small>
            </div>
            <div className="absolute -right-2 md:-right-[18px] bottom-[20px] md:bottom-[30px] bg-white border border-[#e2edf5] rounded-[15px] p-[13px_17px] shadow-[0_12px_35px_#173e6820] text-[11px] text-[#087c7d] font-medium">
              ✓ <b className="font-bold">Pacientes más satisfechos</b>
            </div>
          </div>
        </section>

        {/* SECCIÓN SOPHIE V2 + VIDEO EN VIVO */}
        <section className="bg-[linear-gradient(180deg,#f7fbff_0%,#eef5ff_100%)] py-20 px-5 md:px-[5%] border-y border-[#e2edf5]">
          <div className="max-w-7xl mx-auto">
            {/* VIDEO CINEMATOGRÁFICO DE SOPHIE V2 */}
            <div className="relative mb-14 overflow-hidden rounded-[24px] border border-[#e2edf5] bg-white shadow-[0_30px_80px_rgba(15,31,54,0.10)] md:rounded-[32px]">
              <div className="relative aspect-video w-full overflow-hidden rounded-t-[24px] md:aspect-auto md:h-[500px] md:rounded-[32px] lg:h-[560px]">
                <video
                  ref={heroVideoRef}
                  src={heroVideoReady ? '/sophie-optimizada.webm' : undefined}
                  autoPlay={heroVideoReady && !isMobile ? true : heroVideoReady}
                  loop
                  muted
                  playsInline
                  preload={heroVideoReady ? 'metadata' : 'none'}
                  onLoadedData={() => setHeroVideoLoaded(true)}
                  disablePictureInPicture
                  controlsList="nodownload nofullscreen"
                  className={`h-full w-full object-cover object-center transition-opacity duration-300 ${
                    heroVideoLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-white/25 via-transparent to-white/5 md:block"></div>
              </div>

              <div className="relative z-10 flex flex-col justify-between gap-4 border-t border-[#e2edf5] bg-white/90 p-4 backdrop-blur-md sm:p-6 md:absolute md:bottom-6 md:left-6 md:right-6 md:flex-row md:items-end md:gap-6 md:rounded-[20px] md:border md:border-white/70 md:bg-white/85 md:p-5 md:shadow-[0_18px_50px_rgba(15,31,54,0.16)]">
                <div className="max-w-2xl space-y-2 sm:space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-700">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
                    </span>
                    Sophie v2 • Empleado Digital Autónomo
                  </div>
                  <h2 className="font-display text-xl font-black leading-tight tracking-tight text-slate-900 sm:text-2xl md:text-4xl">
                    Triage y atención en vivo <span className="text-[#0ba9a9]">24/7</span>
                  </h2>
                  <p className="text-xs leading-relaxed text-slate-500 sm:text-sm md:text-base">
                    Atendiendo llamadas con triage clínico y agendamiento en tiempo real sobre nuestra propia agenda: sin Google Calendar, sin Calendly y sin licencias de terceros.
                  </p>
                </div>
                <div className="flex shrink-0 gap-2 pt-2 sm:pt-0">
                  <a
                    href="tel:+573126427856"
                    className="btn-glow-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 sm:w-auto sm:px-7 sm:py-3.5"
                  >
                    <Phone className="h-4 w-4" /> Hablar con un asesor
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan-700 shadow-sm">
                  <Sparkles size={14} className="text-cyan-600" /> Operación Autónoma
                </div>
                <h2 className="font-display text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
                  Sophie v2:
                  <br />
                  IA telefónica que además agenda por ti.
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                  Automatiza el alto tráfico de llamadas: Sophie responde con voz humana, califica urgencias y reserva la cita sobre tu agenda real. Mientras habla aparta el cupo, así nadie más lo toma y se acaban los cruces de horarios.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <a
                    href="https://wa.me/573126427856?text=Hola%20Upway%2C%20quiero%20conocer%20la%20agenda%20y%20la%20voz%20IA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c3775] px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#092a5c] shadow-md"
                  >
                    <MessageCircle className="h-4 w-4" /> Escríbenos por WhatsApp
                  </a>
                  <a
                    href="mailto:contacto@upway.business?subject=Quiero%20hablar%20con%20un%20experto%20de%20Upway%20Health"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300 bg-cyan-50 px-6 py-3.5 text-sm font-bold text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-100"
                  >
                    Hablar con un experto <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative rounded-[32px] border border-[#e0edf6] bg-white p-6 shadow-[0_30px_70px_rgba(15,31,54,0.12)] text-slate-900">
                  <div className="flex items-center justify-between pb-6 border-b border-[#e8f0f8]">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-700">
                      <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></span>
                      Operación activa
                    </div>
                    <span className="text-xs font-mono text-slate-400">live</span>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-[#e0edf6] bg-[#f4f9ff] my-6 p-4 flex items-center gap-5 shadow-inner">
                    <div className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden border border-cyan-100 bg-gradient-to-br from-cyan-100 via-cyan-50 to-white shadow-md flex items-center justify-center">
                      <Sparkles size={28} className="text-cyan-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 mb-1">
                        <Sparkles size={14} /> Upway Health
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Sincronizando atención, agenda y seguimiento comercial con contexto operativo completo.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="rounded-2xl bg-white border border-[#e0edf6] p-5">
                      <p className="text-xs font-semibold text-slate-400 mb-1">ATENCIÓN</p>
                      <p className="text-3xl font-black tracking-tight text-slate-900">24/7</p>
                      <p className="text-[11px] text-slate-500 mt-1">sin depender de una persona en línea</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-[#e0edf6] p-5">
                      <p className="text-xs font-semibold text-slate-400 mb-1">AGENDA</p>
                      <p className="text-3xl font-black tracking-tight text-slate-900">0</p>
                      <p className="text-[11px] text-slate-500 mt-1">licencias de terceros</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#f4f9ff]/60 border border-[#e0edf6] p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>Trabajo crítico</span>
                      <span className="text-emerald-600 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> en vivo
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-600 bg-white px-3 py-2 rounded-xl border border-[#e0edf6]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#e9f3ff] text-[10px] font-bold text-[#1b5ed6]">1</span>
                      Calificación y priorización inteligente
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-600 bg-white px-3 py-2 rounded-xl border border-[#e0edf6]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#e9f3ff] text-[10px] font-bold text-[#1b5ed6]">2</span>
                      Agenda y disponibilidad sincronizadas
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-600 bg-white px-3 py-2 rounded-xl border border-[#e0edf6]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#e9f3ff] text-[10px] font-bold text-[#1b5ed6]">3</span>
                      Seguimiento y escalamiento automáticos
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PANEL / SOLUCIÓN */}
        <section id="solucion" className="max-w-[1180px] mx-[15px] md:mx-auto my-[30px] md:my-[50px] p-[30px] md:p-[55px] rounded-[30px] bg-[#f5fbff] grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-[45px]">
          <div>
            <div className="text-[#0ba9a9] font-bold text-[13px] mb-[17px]">Todo en una sola plataforma</div>
            <h2 className="font-display text-[35px] leading-[1.12] tracking-[-1.5px] mb-[18px] font-extrabold">
              Comunicación y gestión para una mejor atención.
            </h2>
            <p className="text-[#55718f] leading-[1.6]">
              Optimiza la operación de tu institución de salud con tecnología que simplifica procesos, mejora la experiencia del paciente y aumenta la eficiencia de tu equipo.
            </p>
            <div className="grid grid-cols-2 gap-[14px] mt-[25px] text-[12px] font-semibold text-[#0d3168]">
              <span className="flex items-center gap-2 before:content-['✓'] before:text-[#10b7b2]">Automatiza recordatorios</span>
              <span className="flex items-center gap-2 before:content-['✓'] before:text-[#10b7b2]">Reduce ausencias</span>
              <span className="flex items-center gap-2 before:content-['✓'] before:text-[#10b7b2]">Integra canales</span>
              <span className="flex items-center gap-2 before:content-['✓'] before:text-[#10b7b2]">Protege datos</span>
            </div>
          </div>
          <div className="bg-white border border-[#dce9f4] rounded-[18px] p-[17px] shadow-[0_20px_45px_#173e6815]">
            <div className="flex items-center justify-between gap-3 mb-[15px]">
              <div className="font-extrabold text-[#0d3168]">
                UPWAY <small className="text-[#10a9aa] tracking-[1px]">HEALTH</small>
              </div>
              <span className="rounded-full border border-[#dce9f4] bg-[#f7fbff] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-[#7b93ab]">
                Vista ilustrativa
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[0.7fr_1fr_1fr] gap-[10px]">
              <aside className="bg-[#f7fbff] rounded-[12px] p-[14px] text-[10px] leading-[2] text-[#224a76] font-medium">
                ⌂ Inicio<br />▦ Agenda<br />◉ Triage<br />◇ Bandeja<br />▥ Reportes<br />🔍 Auditoría
              </aside>
              <div className="bg-[#f7fbff] rounded-[12px] p-[14px] text-[10px] text-[#54718f]">
                <b className="text-[#0d3168] block mb-1">Hoy · Agenda de citas</b>
                <p className="bg-white p-[4px_8px] rounded-[7px] my-[7px] leading-[1.3] shadow-sm border border-slate-100">María González · 08:00</p>
                <p className="bg-white p-[4px_8px] rounded-[7px] my-[7px] leading-[1.3] shadow-sm border border-slate-100">Carlos Ramírez · 09:30</p>
                <p className="bg-white p-[4px_8px] rounded-[7px] my-[7px] leading-[1.3] shadow-sm border border-slate-100">Laura Torres · 11:00</p>
                <p className="bg-white p-[4px_8px] rounded-[7px] my-[7px] leading-[1.3] shadow-sm border border-slate-100">Andrés Silva · 14:00</p>
              </div>
              <div className="bg-[#f7fbff] rounded-[12px] p-[14px] text-[10px] text-[#54718f]">
                <b className="text-[#0d3168] block mb-1">Canales y agenda</b>
                <p className="bg-white p-[4px_8px] rounded-[7px] my-[7px] leading-[1.3] shadow-sm border border-slate-100">● Voz IA · triage y agenda</p>
                <p className="bg-white p-[4px_8px] rounded-[7px] my-[7px] leading-[1.3] shadow-sm border border-slate-100">● Agenda nativa · sin terceros</p>
                <p className="bg-white p-[4px_8px] rounded-[7px] my-[7px] leading-[1.3] shadow-sm border border-slate-100">○ WhatsApp Business · al conectarlo tú</p>
              </div>
            </div>
          </div>
        </section>

        {/* AGENDA UPWAY */}
        <section id="agenda" className="max-w-[1180px] mx-[15px] md:mx-auto my-[30px] md:my-[50px] p-[30px] md:p-[55px] rounded-[30px] border border-[#e0edf6] bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-[45px] items-start">
            <div>
              <div className="text-[#0ba9a9] font-bold text-[13px] mb-[17px]">Agenda Upway</div>
              <h2 className="font-display text-[35px] leading-[1.12] tracking-[-1.5px] mb-[18px] font-extrabold text-[#0d3168]">
                Una agenda que pertenece a tu operación.
              </h2>
              <p className="text-[#55718f] leading-[1.6]">
                Organiza profesionales, servicios y disponibilidad en un espacio propio. Tu equipo y tu asistente de voz trabajan sobre la misma agenda, sin depender de un calendario personal ni de licencias de terceros.
              </p>
              <div className="mt-[26px] rounded-[18px] border border-[#dce9f4] bg-[#f4f9ff] p-[18px]">
                <div className="flex items-center gap-2 text-[12px] font-bold text-[#0d3168]">
                  <Sparkles className="h-4 w-4 text-[#0ba9a9]" /> Voz con identidad propia
                </div>
                <p className="text-[12px] leading-[1.6] text-[#55718f] mt-[9px]">
                  Tu institución recibe una voz femenina o masculina de catálogo y define el saludo, el tono y las instrucciones de atención. La personalización con una voz propia se evalúa según compatibilidad técnica y autorización de su titular.
                </p>
              </div>
              <p className="text-[11px] leading-[1.6] text-[#7b93ab] mt-[16px]">
                Prestamos asistencia administrativa y orientación según los protocolos de la institución. No sustituimos la valoración de un profesional de salud.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
              <article className="rounded-[17px] border border-[#e0edf6] bg-[#f7fbff] p-[18px] transition hover:-translate-y-0.5 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
                <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]"><Users className="h-4 w-4" /></span>
                <h3 className="text-[13px] font-bold mt-[13px] mb-[6px] text-[#0d3168]">Profesionales y recursos</h3>
                <p className="text-[11px] leading-[1.5] text-[#55718f]">Organiza quién atiende y dónde, por profesional o consultorio.</p>
              </article>
              <article className="rounded-[17px] border border-[#e0edf6] bg-[#f7fbff] p-[18px] transition hover:-translate-y-0.5 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
                <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]"><Clock className="h-4 w-4" /></span>
                <h3 className="text-[13px] font-bold mt-[13px] mb-[6px] text-[#0d3168]">Servicios y horarios</h3>
                <p className="text-[11px] leading-[1.5] text-[#55718f]">Define la duración de cada servicio y los turnos de atención.</p>
              </article>
              <article className="rounded-[17px] border border-[#e0edf6] bg-[#f7fbff] p-[18px] transition hover:-translate-y-0.5 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
                <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]"><Calendar className="h-4 w-4" /></span>
                <h3 className="text-[13px] font-bold mt-[13px] mb-[6px] text-[#0d3168]">Gestión de citas</h3>
                <p className="text-[11px] leading-[1.5] text-[#55718f]">Confirma, reprograma o cancela desde el panel operativo.</p>
              </article>
              <article className="rounded-[17px] border border-[#e0edf6] bg-[#f7fbff] p-[18px] transition hover:-translate-y-0.5 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
                <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]"><HeartPulse className="h-4 w-4" /></span>
                <h3 className="text-[13px] font-bold mt-[13px] mb-[6px] text-[#0d3168]">Estados de atención</h3>
                <p className="text-[11px] leading-[1.5] text-[#55718f]">Identifica pacientes en sala, atendidos y ausencias del día.</p>
              </article>
              <article className="rounded-[17px] border border-[#e0edf6] bg-[#f7fbff] p-[18px] transition hover:-translate-y-0.5 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
                <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]"><Bell className="h-4 w-4" /></span>
                <h3 className="text-[13px] font-bold mt-[13px] mb-[6px] text-[#0d3168]">Lista de espera</h3>
                <p className="text-[11px] leading-[1.5] text-[#55718f]">Mantén visibles las solicitudes pendientes de cupo.</p>
              </article>
              <article className="rounded-[17px] border border-[#e0edf6] bg-[#f7fbff] p-[18px] transition hover:-translate-y-0.5 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
                <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]"><Shield className="h-4 w-4" /></span>
                <h3 className="text-[13px] font-bold mt-[13px] mb-[6px] text-[#0d3168]">Trazabilidad</h3>
                <p className="text-[11px] leading-[1.5] text-[#55718f]">Consulta los movimientos registrados en la agenda.</p>
              </article>
            </div>
          </div>
        </section>

        {/* BENEFICIOS */}
        <section id="beneficios" className="max-w-[1180px] mx-auto my-[55px] md:my-[80px] grid grid-cols-1 md:grid-cols-[0.7fr_1.3fr] gap-[60px] items-center px-5 md:px-[5%]">
          <Image
            src="/atencion-paciente.png"
            alt="Atención médica centrada en el paciente"
            width={375}
            height={285}
            quality={90}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 45vw, 470px"
            className="w-full rounded-[35px] object-cover"
          />
          <div>
            <div className="text-[#0ba9a9] font-bold text-[13px] mb-[17px]">Beneficios reales para tu institución</div>
            <h2 className="font-display text-[35px] leading-[1.12] tracking-[-1.5px] mb-[18px] font-extrabold text-[#0d3168]">
              Una solución pensada en la salud y en las personas.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[25px]">
              <article className="py-[15px]">
                <b className="text-[#0d3168]">Mayor acceso</b>
                <p className="text-[12px] my-[7px] text-[#55718f]">Facilita la comunicación y el agendamiento.</p>
              </article>
              <article className="py-[15px]">
                <b className="text-[#0d3168]">Mejor adherencia</b>
                <p className="text-[12px] my-[7px] text-[#55718f]">Recordatorios y seguimiento continuo.</p>
              </article>
              <article className="py-[15px]">
                <b className="text-[#0d3168]">Procesos más eficientes</b>
                <p className="text-[12px] my-[7px] text-[#55718f]">Reduce carga administrativa.</p>
              </article>
              <article className="py-[15px]">
                <b className="text-[#0d3168]">Seguridad y trazabilidad</b>
                <p className="text-[12px] my-[7px] text-[#55718f]">Seguimiento de cada interacción.</p>
              </article>
            </div>
          </div>
        </section>

        {/* SECTORES */}
        <section id="sectores" className="bg-[#f4faff] py-[65px] px-[5%] text-center">
          <div className="text-[#0ba9a9] font-bold text-[13px] mb-[17px]">Ideal para</div>
          <h2 className="font-display text-[35px] leading-[1.12] tracking-[-1.5px] mb-[18px] font-extrabold text-[#0d3168]">
            Todos los actores del sistema de salud.
          </h2>
          <p className="text-[#55718f] leading-[1.6] mb-[30px]">
            Una plataforma flexible para diferentes modelos de atención.
          </p>
          <div className="max-w-[1180px] mx-auto mb-[20px] flex justify-center">
            <Link href="/precios" className="inline-flex items-center gap-2 rounded-full border border-[#1b5ed6] bg-[#edf5ff] px-5 py-2 text-[12px] font-bold text-[#1b5ed6] transition hover:bg-[#1b5ed6] hover:text-white">
              💰 Ver planes y precios →
            </Link>
          </div>
          <div className="max-w-[1180px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[15px] text-left">
            <Link href="/login?segment=health" className="block bg-white border border-[#e0edf6] rounded-[17px] p-[20px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
              <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]">✚</span>
              <h3 className="text-[14px] font-bold my-[15px] mb-[7px] text-[#0d3168]">Clínicas</h3>
              <p className="text-[11px] leading-[1.5] text-[#55718f]">Optimiza la atención hospitalaria y la gestión de pacientes.</p>
              <span className="mt-[14px] inline-flex items-center gap-1 text-[11px] font-bold text-[#0ba9a9]">Comenzar onboarding →</span>
            </Link>
            <Link href="/login?segment=health" className="block bg-white border border-[#e0edf6] rounded-[17px] p-[20px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
              <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]">♧</span>
              <h3 className="text-[14px] font-bold my-[15px] mb-[7px] text-[#0d3168]">IPS</h3>
              <p className="text-[11px] leading-[1.5] text-[#55718f]">Mejora la operación y comunicación con tu población.</p>
              <span className="mt-[14px] inline-flex items-center gap-1 text-[11px] font-bold text-[#0ba9a9]">Comenzar onboarding →</span>
            </Link>
            <Link href="/login?segment=health" className="block bg-white border border-[#e0edf6] rounded-[17px] p-[20px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
              <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]">▣</span>
              <h3 className="text-[14px] font-bold my-[15px] mb-[7px] text-[#0d3168]">EPS</h3>
              <p className="text-[11px] leading-[1.5] text-[#55718f]">Fortalece el acceso, seguimiento y trazabilidad.</p>
              <span className="mt-[14px] inline-flex items-center gap-1 text-[11px] font-bold text-[#0ba9a9]">Comenzar onboarding →</span>
            </Link>
            <Link href="/login?segment=health" className="block bg-white border border-[#e0edf6] rounded-[17px] p-[20px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
              <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]">◫</span>
              <h3 className="text-[14px] font-bold my-[15px] mb-[7px] text-[#0d3168]">Centros de salud</h3>
              <p className="text-[11px] leading-[1.5] text-[#55718f]">Simplifica citas y coordinación.</p>
              <span className="mt-[14px] inline-flex items-center gap-1 text-[11px] font-bold text-[#0ba9a9]">Comenzar onboarding →</span>
            </Link>
            <Link href="/login?segment=health" className="block bg-white border border-[#e0edf6] rounded-[17px] p-[20px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
              <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]">◉</span>
              <h3 className="text-[14px] font-bold my-[15px] mb-[7px] text-[#0d3168]">Consultorios</h3>
              <p className="text-[11px] leading-[1.5] text-[#55718f]">Lleva tu práctica médica al siguiente nivel.</p>
              <span className="mt-[14px] inline-flex items-center gap-1 text-[11px] font-bold text-[#0ba9a9]">Comenzar onboarding →</span>
            </Link>
          </div>

          {/* Imagen de Sectores (ruta corregida) */}
          <div className="max-w-[1180px] mx-auto mt-12 rounded-[25px] overflow-hidden shadow-[0_20px_50px_#153f6815] border border-[#e0edf6]">
            <Image
              src="/sectores-salud.png"
              alt="Sectores de atención"
              width={890}
              height={195}
              quality={90}
              sizes="(max-width: 1180px) 100vw, 1180px"
              className="w-full h-auto object-cover"
            />
          </div>
        </section>

        {/* CTA CONTACTO */}
        <section id="contacto" className="py-[48px] px-5 md:px-[8%] flex flex-col md:flex-row items-center justify-between bg-[linear-gradient(110deg,#103d79,#0b858d)] text-white gap-8">
          <div>
            <small className="text-[13px] text-[#50e1d5] font-semibold block mb-2">Transforma la atención en salud hoy</small>
            <h2 className="font-display text-[28px] max-w-[650px] m-0 font-extrabold leading-[1.2]">
              Tu institución merece una <em className="not-italic text-[#50e1d5]">comunicación más inteligente.</em>
            </h2>
          </div>
          <a
            href="mailto:contacto@upway.business?subject=Solicitud%20de%20demo%20Upway%20Health"
            className="inline-flex shrink-0 items-center justify-center px-[23px] py-[14px] rounded-full font-bold text-[13px] bg-white text-[#123e77] hover:bg-slate-100 transition"
          >
            Solicita una demo gratuita →
          </a>
        </section>

        {/* FOOTER */}
        <footer className="flex flex-col items-center justify-between gap-6 border-t border-[#e2edf5] px-5 py-10 md:flex-row md:px-[5%]">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <div className="font-extrabold text-[25px] tracking-[-1px] text-[#103a77]">
              UPW<span className="text-[#11b7b1]">▲</span>Y <small className="text-[10px] tracking-[2px] ml-1 font-bold">HEALTH</small>
            </div>
            <span className="text-center text-[11px] leading-relaxed text-[#55718f] md:text-left">
              Tecnología que cuida · © {new Date().getFullYear()} <strong className="font-semibold text-[#31547f]">{LEGAL_ENTITY}</strong>
            </span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 text-[12px] font-medium text-[#55718f]">
            <a href="mailto:contacto@upway.business" className="transition hover:text-[#103a77]">contacto@upway.business</a>
            <Link href="/privacy" className="transition hover:text-[#103a77]">Privacidad</Link>
            <Link href="/terminos" className="transition hover:text-[#103a77]">Términos y Condiciones</Link>
            {/* Social links */}
            <a href="https://www.linkedin.com/company/upwayhealth" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn de Upway Health" className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#0d3168]/10 text-[#0a66c2] hover:bg-[#0d3168]/20 hover:text-white transition shadow-[0_4px_14px_rgba(10,102,194,0.15)]">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.05-.28-3.5-.15-.25-.35-.45-.59-.61-.36-.25-.8-.4-1.23-.45-.42-.05-.84-.03-1.27.08-.3.08-.59.21-.85.4-.33.22-.63.52-.83.87a5.4 5.4 0 0 0-.52 1.57c-.02.1-.04.2-.04.3v6.82h-3.56V9h3.42v1.21h.05a3.78 3.78 0 0 1 2.96-1.31c1.72 0 2.98 1.11 3.43 2.64a6.5 6.5 0 0 1-.4 4.5c-.39.83-1 1.53-1.82 2.03-.42.28-.9.48-1.4.57a5 5 0 0 1-1.03.08c-1.31-.12-2.42-.74-3.3-1.66v4.58h-3.56v10h10.96v-8.79Zm-12.12-11.16v-.01a.96.96 0 0 1 0 1.92.96.96 0 0 1 0-1.91Z"/></svg>
            </a>
          </nav>
        </footer>
      </main>
    </>
  );
}
