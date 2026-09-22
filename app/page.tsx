'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MessageCircle, Phone, Sparkles, Calendar, Bell, HeartPulse, Users, Clock, Shield, ShieldCheck, Database, FileText, RefreshCw, ClipboardCheck, BadgeCheck, CalendarDays, Home as HomeIcon } from 'lucide-react';
import Footer from '@/components/Footer';

const UpwayLogo = ({ className = '' }: { className?: string }) => (
  <div className={`inline-flex items-center px-4 py-2 rounded-2xl bg-black shadow-lg overflow-hidden ${className}`}>
    <Image src="/upway.png" alt="Upway" width={1000} height={667} quality={90} sizes="160px" preload className="h-7 md:h-8 w-auto object-contain" />
  </div>
);

/* Capacidad operativa: lo que Sophie sostiene en la operación diaria.
   Deliberadamente acotado a lo administrativo — atención, registro, agenda,
   confirmación, escalamiento y entrega del dato. La valoración clínica y las
   decisiones de salud NO entran aquí: siguen en el equipo profesional. */
const capacidad = [
  {
    title: 'Atiende la línea',
    text: 'Responde 24/7 con voz natural, sostiene varias llamadas al tiempo y retoma el hilo de cada paciente sin dejar tono ocupado.',
    icon: Phone,
  },
  {
    title: 'Registra el dato',
    text: 'Captura con catálogos oficiales de Colombia, relee y confirma dígito a dígito, y deja evidencia de cada corrección.',
    icon: ClipboardCheck,
  },
  {
    title: 'Agenda',
    text: 'Consulta tu disponibilidad real, aparta el cupo mientras habla y confirma la cita sobre la Agenda Upway.',
    icon: Calendar,
  },
  {
    title: 'Confirma y recuerda',
    text: 'Confirmaciones, recordatorios, reprogramaciones y lista de espera sobre la misma agenda, sin llamadas manuales.',
    icon: Bell,
  },
  {
    title: 'Escala a tu equipo',
    text: 'Cuando el caso lo pide, pasa la llamada a tu personal con el contexto y los datos ya capturados, según el protocolo que definas.',
    icon: Users,
  },
  {
    title: 'Entrega el dato',
    text: 'Cada atención sale estructurada, validada y auditable hacia tu software de salud o tu HIS. Tu equipo deja de retranscribir.',
    icon: Database,
  },
];

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
          className={`fixed inset-0 z-[9999] flex md:hidden items-center justify-center bg-white transition-opacity duration-500 ${
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
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-[22px] text-[13px] font-medium text-[#31547f] xl:gap-[30px]">
            <a href="#solucion" className="hover:text-[#103a77] transition">Solución</a>
            <a href="#agenda" className="hover:text-[#103a77] transition">Agenda</a>
            <a href="#beneficios" className="hover:text-[#103a77] transition">Beneficios</a>
            <a href="#sectores" className="hover:text-[#103a77] transition">Sectores</a>
            <Link
              href="/inmobiliarias"
              className="inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(115deg,#0ba9a9,#0c3775)] px-3.5 py-[7px] text-[12px] font-bold text-white shadow-[0_8px_20px_rgba(11,169,169,0.28)] transition hover:-translate-y-[1px] hover:shadow-[0_12px_26px_rgba(12,55,117,0.35)]"
            >
              <HomeIcon className="h-3.5 w-3.5" />
              Inmobiliarias
              <span className="rounded-full bg-white/25 px-[7px] py-[2px] text-[8px] font-black uppercase tracking-[0.1em] text-white">
                Nuevo
              </span>
            </Link>
            <Link
              href="/center"
              className="inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(115deg,#0ba9a9,#0c3775)] px-3.5 py-[7px] text-[12px] font-bold text-white shadow-[0_8px_20px_rgba(11,169,169,0.28)] transition hover:-translate-y-[1px] hover:shadow-[0_12px_26px_rgba(12,55,117,0.35)]"
            >
              🎧 Upway Center
            </Link>
            <Link href="/precios" className="hover:text-[#103a77] transition">Precios</Link>
            <a href="#contacto" className="hover:text-[#103a77] transition">Contacto</a>
          </nav>
            <Link
              href="/inmobiliarias"
              className="inline-flex md:hidden items-center gap-1.5 rounded-full bg-[linear-gradient(115deg,#0ba9a9,#0c3775)] px-3 py-[8px] text-[11px] font-bold text-white shadow-md"
            >
              <HomeIcon className="h-3.5 w-3.5" />
              Inmobiliarias
            </Link>
            <a
              href="#contacto"
              className="hidden sm:inline-flex items-center justify-center rounded-full bg-[#0c3775] px-[23px] py-[10px] md:py-[14px] text-[11px] md:text-[13px] font-bold text-white hover:bg-[#092a5c] transition shadow-md"
            >
              Solicita una demo →
            </a>
          </div>
        </header>

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
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#bfe9e6] bg-[#e7fbfa] px-3 py-1 text-[11px] font-bold text-[#0d8a88]">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0ba9a9] opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#079fa0]" />
                    </span>
                    Sophie v2 • Atención de voz en vivo
                  </div>
                  <h2 className="font-display text-xl font-extrabold leading-tight tracking-tight text-[#0d3168] sm:text-2xl md:text-4xl">
                    Atención y priorización en vivo <span className="text-[#0ba9a9]">24/7</span>
                  </h2>
                  <p className="text-xs font-medium leading-relaxed text-[#55718f] sm:text-sm md:text-base">
                    Atendiendo llamadas con priorización asistida por los protocolos de tu institución y agendamiento en tiempo real sobre nuestra propia agenda: sin Google Calendar, sin Calendly y sin licencias de terceros.
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
                <div className="inline-flex items-center gap-2 rounded-full border border-[#bfe9e6] bg-[#e7fbfa] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#0d8a88] shadow-sm">
                  <Sparkles size={14} className="text-[#0ba9a9]" /> Agente de Voz Conforme
                </div>
                <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-[#0d3168] md:text-5xl">
                  Sophie v2:
                  <br />
                  IA telefónica que además agenda por ti.
                </h2>
                <p className="max-w-xl text-lg font-medium leading-relaxed text-[#55718f]">
                  Automatiza el alto tráfico de llamadas: Sophie responde con voz humana, prioriza según los protocolos de tu institución y reserva la cita sobre tu agenda real. Mientras habla aparta el cupo, así nadie más lo toma y se acaban los cruces de horarios.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <a
                    href="https://wa.me/573126427856?text=Hola%20Upway%2C%20quiero%20conocer%20la%20agenda%20y%20la%20voz%20IA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c3775] px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#092a5c] shadow-md"
                  >
                    <MessageCircle className="h-4 w-4" /> Escríbenos por mensaje
                  </a>
                  <a
                    href="mailto:contacto@upway.business?subject=Quiero%20hablar%20con%20un%20experto%20de%20Upway%20Health"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#9fe0dc] bg-[#e7fbfa] px-6 py-3.5 text-sm font-bold text-[#0d8a88] transition hover:border-[#0ba9a9] hover:bg-[#d7f5f2]"
                  >
                    Hablar con un experto <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative rounded-[32px] border border-[#e0edf6] bg-white p-6 shadow-[0_30px_70px_rgba(15,31,54,0.12)] text-[#0d3168]">
                  <div className="flex items-center justify-between pb-6 border-b border-[#e8f0f8]">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0d8a88]">
                      <span className="h-2 w-2 rounded-full bg-[#0ba9a9] animate-pulse"></span>
                      Operación activa
                    </div>
                    <span className="text-xs font-mono text-[#7b93ab]">live</span>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-[#d7f5f2] bg-[#f4f9ff] my-6 p-4 flex items-center gap-5 shadow-inner">
                    <div className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden border border-[#d7f5f2] bg-gradient-to-br from-[#e7fbfa] via-[#f2fcfb] to-white shadow-md flex items-center justify-center">
                      <Sparkles size={28} className="text-[#0ba9a9]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0d8a88] mb-1">
                        <Sparkles size={14} /> Upway Health
                      </div>
                      <p className="text-xs font-medium text-[#55718f] leading-relaxed">
                        Sincronizando atención, agenda y seguimiento comercial con contexto operativo completo.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="rounded-2xl bg-white border border-[#e0edf6] p-5">
                      <p className="text-xs font-semibold text-[#7b93ab] mb-1">ATENCIÓN</p>
                      <p className="text-3xl font-extrabold tracking-tight text-[#0d3168]">24/7</p>
                      <p className="text-[11px] font-medium text-[#55718f] mt-1">sin depender de una persona en línea</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-[#e0edf6] p-5">
                      <p className="text-xs font-semibold text-[#7b93ab] mb-1">AGENDA</p>
                      <p className="text-3xl font-extrabold tracking-tight text-[#0d3168]">0</p>
                      <p className="text-[11px] font-medium text-[#55718f] mt-1">licencias de terceros</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#f4f9ff]/60 border border-[#e0edf6] p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-[#55718f] mb-2">
                      <span>Trabajo crítico</span>
                      <span className="text-[#0f9d6b] flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#12b76a]"></span> en vivo
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-[#55718f] bg-white px-3 py-2 rounded-xl border border-[#e0edf6]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#e9f3ff] text-[10px] font-bold text-[#1b5ed6]">1</span>
                      Priorización asistida y escalamiento humano
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-[#55718f] bg-white px-3 py-2 rounded-xl border border-[#e0edf6]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#e9f3ff] text-[10px] font-bold text-[#1b5ed6]">2</span>
                      Agenda y disponibilidad sincronizadas
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-[#55718f] bg-white px-3 py-2 rounded-xl border border-[#e0edf6]">
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
            <div className="text-[#0ba9a9] font-bold text-[13px] mb-[17px]">Se integra a tu operación, no la reemplaza</div>
            <h2 className="font-display text-[35px] leading-[1.12] tracking-[-1.5px] mb-[18px] font-extrabold">
              Comunicación y gestión para una mejor atención.
            </h2>
            <p className="text-[#55718f] leading-[1.6]">
              Upway trabaja sobre tu operación actual: tu línea telefónica, tu agenda y tu software de salud. Tu equipo conserva el control; nosotros atendemos, coordinamos y entregamos la información ordenada.
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
                ⌂ Inicio<br />▦ Agenda<br />◉ Prioridades<br />◇ Bandeja<br />▥ Reportes<br />🔍 Auditoría
              </aside>
              <div className="bg-[#f7fbff] rounded-[12px] p-[14px] text-[10px] text-[#54718f]">
                <b className="text-[#0d3168] block mb-1">Hoy · Agenda de citas</b>
                <p className="bg-white p-[4px_8px] rounded-[7px] my-[7px] leading-[1.3] shadow-sm border border-[#e8f0f8]">María González · 08:00</p>
                <p className="bg-white p-[4px_8px] rounded-[7px] my-[7px] leading-[1.3] shadow-sm border border-[#e8f0f8]">Carlos Ramírez · 09:30</p>
                <p className="bg-white p-[4px_8px] rounded-[7px] my-[7px] leading-[1.3] shadow-sm border border-[#e8f0f8]">Laura Torres · 11:00</p>
                <p className="bg-white p-[4px_8px] rounded-[7px] my-[7px] leading-[1.3] shadow-sm border border-[#e8f0f8]">Andrés Silva · 14:00</p>
              </div>
              <div className="bg-[#f7fbff] rounded-[12px] p-[14px] text-[10px] text-[#54718f]">
                <b className="text-[#0d3168] block mb-1">Canales y agenda</b>
                <p className="bg-white p-[4px_8px] rounded-[7px] my-[7px] leading-[1.3] shadow-sm border border-[#e8f0f8]">● Voz IA · prioridad y agenda</p>
                <p className="bg-white p-[4px_8px] rounded-[7px] my-[7px] leading-[1.3] shadow-sm border border-[#e8f0f8]">● Agenda nativa · sin terceros</p>
              </div>
            </div>
          </div>
        </section>

        {/* HERO — APLICADO en salud */}
        <section id="inicio" className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 pt-[45px] md:pt-[70px] pb-[55px] px-5 md:px-[5%] items-center bg-[radial-gradient(circle_at_80%_30%,_#e8fbfa,_transparent_40%)]">
          <div className="flex flex-col">
            <div className="text-[#0ba9a9] font-bold text-[13px] mb-[17px]">♥ &nbsp; Recepcionista con IA para salud</div>
            <h1 className="font-display text-[35px] md:text-[52px] leading-[1.06] tracking-[-2px] md:tracking-[-2.6px] m-0 mb-[22px] font-extrabold">
              Atiende, agenda y confirma con tus pacientes.<br />
              <em className="not-italic text-[#11b4b0]">Las 24 horas, sin perder un dato.</em>
            </h1>
            <p className="text-[16px] leading-[1.65] text-[#49698f] max-w-[600px]">
              Una recepcionista con voz que responde tu línea 24/7: agenda citas en la Agenda Upway, confirma con el paciente y captura sus datos de forma correcta la primera vez, para que lleguen ordenados a tu operación y a tu software de salud.
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
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><Phone className="h-3.5 w-3.5" /> Voz IA 24/7</span>
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><Calendar className="h-3.5 w-3.5" /> Agenda propia</span>
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><Shield className="h-3.5 w-3.5" /> Datos correctos la primera vez</span>
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><Users className="h-3.5 w-3.5" /> Trazabilidad completa</span>
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

        {/* CAPACIDAD OPERATIVA */}
        <section id="capacidad" className="max-w-[1180px] mx-[15px] md:mx-auto my-[55px] md:my-[70px]">
          <div className="text-center">
            <div className="text-[#0ba9a9] font-bold text-[13px] mb-[17px]">Capacidad operativa</div>
            <h2 className="font-display text-[35px] leading-[1.12] tracking-[-1.5px] mb-[18px] font-extrabold text-[#0d3168]">
              Sophie no solo contesta. Sostiene tu operación.
            </h2>
            <p className="text-[13px] leading-[1.7] text-[#55718f] max-w-[760px] mx-auto">
              Atender, registrar, agendar, confirmar, escalar y entregar el dato: todo lo administrativo de una línea de
              atención. La valoración clínica y las decisiones de salud siguen en tu equipo profesional.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[15px] mt-[32px]">
            {capacidad.map(({ title, text, icon: Icon }) => (
              <article
                key={title}
                className="rounded-[17px] border border-[#e0edf6] bg-white p-[22px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]"
              >
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#0d3168]">{title}</h3>
                </div>
                <p className="text-[12px] leading-[1.6] text-[#55718f] mt-[13px]">{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* DATOS CONFORMES */}
        <section id="datos" className="max-w-[1180px] mx-[15px] md:mx-auto my-[30px] md:my-[50px] p-[30px] md:p-[55px] rounded-[30px] bg-[linear-gradient(120deg,#0d3168,#0b6a72)] text-white">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-[45px] items-start">
            <div>
              <div className="text-[#50e1d5] font-bold text-[13px] mb-[17px]">Captura de identidad conforme</div>
              <h2 className="font-display text-[35px] leading-[1.12] tracking-[-1.5px] mb-[18px] font-extrabold">
                El dato correcto desde el primer contacto.
              </h2>
              <p className="leading-[1.6] text-white/85">
                La mayoría de los rechazos de registros en salud nacen de datos mal tomados: un documento mal digitado, un nombre incompleto, una fecha de nacimiento dudosa. Nuestra recepcionista captura el dato con catálogos oficiales de Colombia (tipo de documento, sexo, municipio), confirma cada dato con el paciente, dígito a dígito cuando es necesario, y deja evidencia trazable de cada corrección.
              </p>
              <p className="leading-[1.6] text-white/70 text-[13px] mt-[14px]">
                Tu institución conserva la responsabilidad de su registro clínico y sus transmisiones; Upway garantiza que el dato capturado en la atención inicial llegue estructurado, validado y auditable.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-[14px]">
              <article className="rounded-[17px] border border-white/15 bg-white/10 p-[18px]">
                <h3 className="text-[14px] font-bold mb-[6px]">Catálogos oficiales, nunca texto libre</h3>
                <p className="text-[12px] leading-[1.55] text-white/75">Tipo de documento, sexo y municipio se validan contra catálogos cerrados. Si un dato no es claro, se vuelve a preguntar: no se adivina.</p>
              </article>
              <article className="rounded-[17px] border border-white/15 bg-white/10 p-[18px]">
                <h3 className="text-[14px] font-bold mb-[6px]">Doble confirmación con el paciente</h3>
                <p className="text-[12px] leading-[1.55] text-white/75">El documento se relee y se confirma dígito a dígito en la llamada. La corrección queda registrada con evidencia.</p>
              </article>
              <article className="rounded-[17px] border border-white/15 bg-white/10 p-[18px]">
                <h3 className="text-[14px] font-bold mb-[6px]">Auditoría con usuario, rol, fecha y hora</h3>
                <p className="text-[12px] leading-[1.55] text-white/75">Cada acceso y cada corrección quedan trazados, con tratamiento de datos bajo la Ley 1581 y encargo registrado.</p>
              </article>
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

        {/* PANEL DE DATOS AUDITABLES / CONEXIÓN AL HIS */}
        <section id="panel" className="max-w-[1180px] mx-[15px] md:mx-auto my-[30px] md:my-[50px] p-[30px] md:p-[55px] rounded-[30px] bg-[#f5fbff]">
          <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-[45px] items-start">
            <div>
              <div className="text-[#0ba9a9] font-bold text-[13px] mb-[17px]">Panel de datos auditables</div>
              <h2 className="font-display text-[35px] leading-[1.12] tracking-[-1.5px] mb-[18px] font-extrabold text-[#0d3168]">
                El dato conforme, listo para tu HIS.
              </h2>
              <p className="text-[#55718f] leading-[1.6]">
                La agenda es nuestra, así que todo lo que ocurre en ella queda registrado en un panel que tu institución puede auditar: qué se agendó, quién llamó, qué datos se capturaron y qué se corrigió. Desde ahí la información sale estructurada hacia tu software de salud o tu HIS.
              </p>
              <div className="mt-[22px] rounded-[18px] border border-[#dce9f4] bg-white p-[18px]">
                <div className="flex items-center gap-2 text-[12px] font-bold text-[#0d3168]">
                  <Database className="h-4 w-4 text-[#0ba9a9]" /> Sin retranscribir
                </div>
                <p className="text-[12px] leading-[1.6] text-[#55718f] mt-[9px]">
                  Tu equipo deja de pasar llamadas a mano al sistema. Cada registro llega con los campos completos, validados contra catálogos oficiales y con su historial de cambios.
                </p>
              </div>
              <p className="text-[11px] leading-[1.6] text-[#7b93ab] mt-[16px]">
                Upway responde por el dato capturado, validado y auditable que entrega. La historia clínica, la facturación y las transmisiones oficiales siguen a cargo de tu institución.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
              <article className="rounded-[17px] border border-[#e0edf6] bg-white p-[18px] transition hover:-translate-y-0.5 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
                <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]"><ClipboardCheck className="h-4 w-4" /></span>
                <h3 className="text-[13px] font-bold mt-[13px] mb-[6px] text-[#0d3168]">Historial por cita</h3>
                <p className="text-[11px] leading-[1.5] text-[#55718f]">Cada cita con su llamada, sus datos y sus correcciones.</p>
              </article>
              <article className="rounded-[17px] border border-[#e0edf6] bg-white p-[18px] transition hover:-translate-y-0.5 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
                <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]"><FileText className="h-4 w-4" /></span>
                <h3 className="text-[13px] font-bold mt-[13px] mb-[6px] text-[#0d3168]">Exportación estructurada</h3>
                <p className="text-[11px] leading-[1.5] text-[#55718f]">Consolidado descargable para cargar donde ya trabajas.</p>
              </article>
              <article className="rounded-[17px] border border-[#e0edf6] bg-white p-[18px] transition hover:-translate-y-0.5 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
                <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]"><RefreshCw className="h-4 w-4" /></span>
                <h3 className="text-[13px] font-bold mt-[13px] mb-[6px] text-[#0d3168]">Integración con tu sistema</h3>
                <p className="text-[11px] leading-[1.5] text-[#55718f]">Conecta el flujo a tu software de salud o a tu HIS.</p>
              </article>
              <article className="rounded-[17px] border border-[#e0edf6] bg-white p-[18px] transition hover:-translate-y-0.5 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
                <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]"><BadgeCheck className="h-4 w-4" /></span>
                <h3 className="text-[13px] font-bold mt-[13px] mb-[6px] text-[#0d3168]">Datos conformes</h3>
                <p className="text-[11px] leading-[1.5] text-[#55718f]">Catálogos oficiales, doble confirmación y evidencia de cada cambio.</p>
              </article>
              <article className="rounded-[17px] border border-[#e0edf6] bg-white p-[18px] transition hover:-translate-y-0.5 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
                <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]"><CalendarDays className="h-4 w-4" /></span>
                <h3 className="text-[13px] font-bold mt-[13px] mb-[6px] text-[#0d3168]">Estados y seguimiento</h3>
                <p className="text-[11px] leading-[1.5] text-[#55718f]">Confirmadas, atendidas, ausentes y en lista de espera.</p>
              </article>
              <article className="rounded-[17px] border border-[#e0edf6] bg-white p-[18px] transition hover:-translate-y-0.5 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
                <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]"><ShieldCheck className="h-4 w-4" /></span>
                <h3 className="text-[13px] font-bold mt-[13px] mb-[6px] text-[#0d3168]">Auditoría de accesos</h3>
                <p className="text-[11px] leading-[1.5] text-[#55718f]">Usuario, rol, fecha y hora en cada consulta al dato.</p>
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
                <b className="text-[#0d3168]">La línea nunca queda ocupada</b>
                <p className="text-[12px] my-[7px] text-[#55718f]">Cada llamada entrante se atiende, a cualquier hora y en temporada alta.</p>
              </article>
              <article className="py-[15px]">
                <b className="text-[#0d3168]">Menos ausencias, más adherencia</b>
                <p className="text-[12px] my-[7px] text-[#55718f]">Confirmación y recordatorios sobre la misma agenda, sin llamadas manuales.</p>
              </article>
              <article className="py-[15px]">
                <b className="text-[#0d3168]">Procesos más eficientes</b>
                <p className="text-[12px] my-[7px] text-[#55718f]">El dato llega estructurado a tu software: tu equipo deja de retranscribir.</p>
              </article>
              <article className="py-[15px]">
                <b className="text-[#0d3168]">Seguridad y trazabilidad</b>
                <p className="text-[12px] my-[7px] text-[#55718f]">Cada acceso y cada corrección con usuario, rol, fecha y hora.</p>
              </article>
              <article className="py-[15px]">
                <b className="text-[#0d3168]">Escalamiento según tu protocolo</b>
                <p className="text-[12px] my-[7px] text-[#55718f]">Cuando el caso lo pide, la llamada pasa a tu equipo con el contexto completo.</p>
              </article>
              <article className="py-[15px]">
                <b className="text-[#0d3168]">Una sola agenda</b>
                <p className="text-[12px] my-[7px] text-[#55718f]">Profesionales, sedes y cupos sobre el mismo sistema, sin licencias de terceros.</p>
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
          <div className="max-w-[1180px] mx-auto mb-[22px] flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[12px] text-[#55718f]">
            <span className="font-semibold">¿Tu operación no es salud? Sophie también trabaja para</span>
            <Link
              href="/inmobiliarias"
              className="inline-flex items-center gap-2 rounded-full border border-[#bfe9e6] bg-white px-4 py-2 text-[12px] font-bold text-[#0d3168] shadow-[0_6px_18px_#153f6814] transition hover:-translate-y-0.5 hover:border-[#0ba9a9] hover:shadow-[0_10px_24px_#153f6820]"
            >
              <HomeIcon className="h-3.5 w-3.5 text-[#0ba9a9]" />
              Inmobiliarias
              <span className="rounded-full bg-[#e7fbfa] px-2 py-[2px] text-[8px] font-black uppercase tracking-[0.08em] text-[#0d8a88]">Nuevo</span>
            </Link>
            <Link
              href="/center"
              className="inline-flex items-center gap-2 rounded-full border border-[#bfe9e6] bg-white px-4 py-2 text-[12px] font-bold text-[#0d3168] shadow-[0_6px_18px_#153f6814] transition hover:-translate-y-0.5 hover:border-[#0ba9a9] hover:shadow-[0_10px_24px_#153f6820]"
            >
              🎧 Upway Center
              <span className="rounded-full bg-[#e7fbfa] px-2 py-[2px] text-[8px] font-black uppercase tracking-[0.08em] text-[#0d8a88]">Nuevo</span>
            </Link>
          </div>
          <div className="max-w-[1180px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[15px] text-left">
            <Link href="/login?segment=health" className="block overflow-hidden bg-white border border-[#e0edf6] rounded-[17px] p-[20px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
              <div className="relative -mx-[20px] -mt-[20px] mb-[16px] aspect-[220/140] overflow-hidden bg-[#eaf4fb]">
                <Image
                  src="/sectores/clinicas.jpg"
                  alt="Clínicas atendidas por Upway Health"
                  width={220}
                  height={140}
                  quality={90}
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 224px"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]">✚</span>
              <h3 className="text-[14px] font-bold my-[15px] mb-[7px] text-[#0d3168]">Clínicas</h3>
              <p className="text-[11px] leading-[1.5] text-[#55718f]">Optimiza la atención hospitalaria y la gestión de pacientes.</p>
              <span className="mt-[14px] inline-flex items-center gap-1 text-[11px] font-bold text-[#0ba9a9]">Comenzar onboarding →</span>
            </Link>
            <Link href="/login?segment=health" className="block overflow-hidden bg-white border border-[#e0edf6] rounded-[17px] p-[20px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
              <div className="relative -mx-[20px] -mt-[20px] mb-[16px] aspect-[220/140] overflow-hidden bg-[#eaf4fb]">
                <Image
                  src="/sectores/ips.jpg"
                  alt="IPS atendidas por Upway Health"
                  width={220}
                  height={140}
                  quality={90}
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 224px"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]">♧</span>
              <h3 className="text-[14px] font-bold my-[15px] mb-[7px] text-[#0d3168]">IPS</h3>
              <p className="text-[11px] leading-[1.5] text-[#55718f]">Mejora la operación y comunicación con tu población.</p>
              <span className="mt-[14px] inline-flex items-center gap-1 text-[11px] font-bold text-[#0ba9a9]">Comenzar onboarding →</span>
            </Link>
            <Link href="/login?segment=health" className="block overflow-hidden bg-white border border-[#e0edf6] rounded-[17px] p-[20px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
              <div className="relative -mx-[20px] -mt-[20px] mb-[16px] aspect-[220/140] overflow-hidden bg-[#eaf4fb]">
                <Image
                  src="/sectores/eps.jpg"
                  alt="EPS atendidas por Upway Health"
                  width={220}
                  height={140}
                  quality={90}
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 224px"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]">▣</span>
              <h3 className="text-[14px] font-bold my-[15px] mb-[7px] text-[#0d3168]">EPS</h3>
              <p className="text-[11px] leading-[1.5] text-[#55718f]">Fortalece el acceso, seguimiento y trazabilidad.</p>
              <span className="mt-[14px] inline-flex items-center gap-1 text-[11px] font-bold text-[#0ba9a9]">Comenzar onboarding →</span>
            </Link>
            <Link href="/login?segment=health" className="block overflow-hidden bg-white border border-[#e0edf6] rounded-[17px] p-[20px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
              <div className="relative -mx-[20px] -mt-[20px] mb-[16px] aspect-[220/140] overflow-hidden bg-[#eaf4fb]">
                <Image
                  src="/sectores/centros-de-salud.jpg"
                  alt="Centros de salud atendidos por Upway Health"
                  width={220}
                  height={140}
                  quality={90}
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 224px"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]">◫</span>
              <h3 className="text-[14px] font-bold my-[15px] mb-[7px] text-[#0d3168]">Centros de salud</h3>
              <p className="text-[11px] leading-[1.5] text-[#55718f]">Simplifica citas y coordinación.</p>
              <span className="mt-[14px] inline-flex items-center gap-1 text-[11px] font-bold text-[#0ba9a9]">Comenzar onboarding →</span>
            </Link>
            <Link href="/login?segment=health" className="block overflow-hidden bg-white border border-[#e0edf6] rounded-[17px] p-[20px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]">
              <div className="relative -mx-[20px] -mt-[20px] mb-[16px] aspect-[220/140] overflow-hidden bg-[#eaf4fb]">
                <Image
                  src="/sectores/consultorios.jpg"
                  alt="Consultorios atendidos por Upway Health"
                  width={220}
                  height={140}
                  quality={90}
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 224px"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]">◉</span>
              <h3 className="text-[14px] font-bold my-[15px] mb-[7px] text-[#0d3168]">Consultorios</h3>
              <p className="text-[11px] leading-[1.5] text-[#55718f]">Lleva tu práctica médica al siguiente nivel.</p>
              <span className="mt-[14px] inline-flex items-center gap-1 text-[11px] font-bold text-[#0ba9a9]">Comenzar onboarding →</span>
            </Link>
          </div>
        </section>

        {/* CONFIANZA REGULATORIA */}
        <section className="max-w-[1180px] mx-[15px] md:mx-auto my-[30px] md:my-[50px] p-[26px] md:p-[36px] rounded-[24px] border border-[#e0edf6] bg-[#f7fbff]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[18px] text-[#0d3168]">
            <div>
              <span className="block text-[18px] mb-1 text-[#079fa0]">◈</span>
              <h3 className="text-[13px] font-bold mb-[4px]">Ley 1581 de 2012</h3>
              <p className="text-[11px] leading-[1.5] text-[#55718f]">Tratamiento de datos personales con política pública y registro ante la SIC.</p>
            </div>
            <div>
              <span className="block text-[18px] mb-1 text-[#079fa0]">▣</span>
              <h3 className="text-[13px] font-bold mb-[4px]">Contrato de encargo</h3>
              <p className="text-[11px] leading-[1.5] text-[#55718f]">Cada institución firma un encargo de tratamiento antes de activar la captura de datos.</p>
            </div>
            <div>
              <span className="block text-[18px] mb-1 text-[#079fa0]">◉</span>
              <h3 className="text-[13px] font-bold mb-[4px]">Auditoría de accesos</h3>
              <p className="text-[11px] leading-[1.5] text-[#55718f]">Usuario, rol, fecha y hora registrados en cada acceso a información de pacientes.</p>
            </div>
            <div>
              <span className="block text-[18px] mb-1 text-[#079fa0]">◇</span>
              <h3 className="text-[13px] font-bold mb-[4px]">Frontera clínica clara</h3>
              <p className="text-[11px] leading-[1.5] text-[#55718f]">Asistencia administrativa según los protocolos de la institución. No sustituimos la valoración médica.</p>
            </div>
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
          <form
            className="shrink-0 w-full max-w-[340px] flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const nombre = String(data.get('nombre') ?? '').trim();
              const institucion = String(data.get('institucion') ?? '').trim();
              const telefono = String(data.get('telefono') ?? '').trim();
              const subject = `Solicitud de demo Upway Health — ${institucion || nombre || 'Nueva solicitud'}`;
              const body = [
                `Nombre: ${nombre}`,
                `Institución: ${institucion}`,
                `Teléfono: ${telefono}`,
                '',
                'Solicito una demo de Upway Health.',
              ].join('\n');
              window.location.href = `mailto:contacto@upway.business?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            }}
          >
            <input name="nombre" required placeholder="Tu nombre" className="rounded-full px-4 py-2.5 text-[13px] text-[#0d3168] bg-white/95 border border-white/40 placeholder:text-[#7b93ab] outline-none focus:ring-2 focus:ring-[#50e1d5]" />
            <input name="institucion" placeholder="Institución o consultorio" className="rounded-full px-4 py-2.5 text-[13px] text-[#0d3168] bg-white/95 border border-white/40 placeholder:text-[#7b93ab] outline-none focus:ring-2 focus:ring-[#50e1d5]" />
            <input name="telefono" required inputMode="tel" placeholder="Teléfono de contacto" className="rounded-full px-4 py-2.5 text-[13px] text-[#0d3168] bg-white/95 border border-white/40 placeholder:text-[#7b93ab] outline-none focus:ring-2 focus:ring-[#50e1d5]" />
            <button type="submit" className="rounded-full font-bold text-[13px] bg-white text-[#123e77] hover:bg-slate-100 transition px-[23px] py-[14px]">
              Solicita una demo gratuita →
            </button>
            <a href="tel:+573126427856" className="text-center text-[11px] text-[#50e1d5] hover:underline">
              o llámanos: +57 312 642 7856
            </a>
          </form>
                 </section>

         {/* FOOTER */}
        <Footer />
      </main>
    </>
  );
}

