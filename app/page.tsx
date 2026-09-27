'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Phone, Sparkles, Calendar, Bell, Users, Shield, ShieldCheck, RefreshCw, ClipboardCheck, BadgeCheck, CalendarDays, ArrowRight, Headphones, Home as HomeIcon } from 'lucide-react';
import Footer from '@/components/Footer';
import SophieChatButton from '@/components/sophie-chat-button';

const UpwayLogo = ({ className = '' }: { className?: string }) => (
  <div className={`inline-flex items-center px-4 py-2 rounded-2xl bg-black shadow-lg overflow-hidden ${className}`}>
    <Image src="/upway.png" alt="Upway" width={1000} height={667} quality={90} sizes="160px" preload className="h-7 md:h-8 w-auto object-contain" />
  </div>
);

/* Capacidad operativa: el flujo de una línea de atención, de la llamada al
   escalamiento. Deliberadamente acotado a lo administrativo — atención,
   registro, agenda, confirmación y escalamiento. La valoración clínica y las
   decisiones de salud NO entran aquí: siguen en el equipo profesional.

   Este bloque es COMÚN a las tres verticales, así que el texto evita nombrar un
   sector concreto. Antes decía "paciente" y "software de salud", lo que hacía que
   la raíz respondiera "¿tu operación es salud?" en el primer pantallazo y dejara
   a Center e Inmobiliaria como apéndice de una página de salud.

   Son SEIS, no nueve. Eran nueve tarjetas (tres filas) y las tres últimas
   repetían en otra forma lo que ya dicen el bloque de dolor/cura y las
   verticales. "Entrega del dato" y "Lo puedes auditar" siguen siendo
   diferenciadores reales — sobre todo en salud: si se quieren recuperar, esas
   dos son las que vuelven primero. */
const capacidad = [
  {
    title: 'Atiende la línea',
    text: 'Responde 24/7 con voz natural, sostiene varias llamadas al mismo tiempo y retoma el hilo de cada conversación sin dejar el tono ocupado.',
    icon: Phone,
  },
  {
    title: 'Entiende y resuelve',
    text: 'No sigue un guion: escucha, deduce la intención, consulta lo que tu operación necesita y contesta lo que corresponde en cada caso.',
    icon: Sparkles,
  },
  {
    title: 'Registra el dato',
    text: 'Captura con validación, relee para confirmar y deja evidencia de cada corrección. Sin adivinar, sin texto libre donde no aplica.',
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
];

/* Las tres verticales. Health va primero y es la tarjeta insignia: es el
   producto más construido (17 módulos en su panel, agenda clínica, triaje,
   políticas y cumplimiento), mientras Center e Inmobiliaria arrancan con
   onboarding, caso y panel. Igualar las tres visualmente daría a entender que
   los tres productos maduran igual, y no es el caso.

   LA TARJETA ES LA IMAGEN. Los recortes son piezas de marca que ya llevan
   nombre, propuesta y contenido, así que en la tarjeta solo va la imagen con
   los botones encima. Antes la imagen se metía en una caja 2:1 arriba de un
   bloque blanco con nombre, claim, párrafo, cuatro viñetas y "Para: ...": la
   foto quedaba apretada y el mismo mensaje se leía dos veces, en dos
   tamaños. Por eso el arreglo ya no guarda `claim`, `texto`, `puntos` ni
   `para`: viven en el arte, que es donde se leen mejor.

   La tarjeta cae a un
   treatment con icono SOLO si el archivo no llega a cargarse, para que un 404
   en /public nunca se vea como una tarjeta rota. */
const verticales = [
  {
    id: 'health',
    nombre: 'Upway Health',
    href: '/salud',
    loginHref: '/login?segment=health',
    insignia: true,
    imagen: '/verticales/salud.jpg',
  },
  {
    id: 'center',
    nombre: 'Upway Center',
    href: '/center',
    loginHref: '/login?segment=center',
    insignia: false,
    imagen: '/verticales/center.jpg',
  },
  {
    id: 'inmobiliaria',
    nombre: 'Upway Inmobiliarias',
    href: '/inmobiliarias',
    loginHref: '/login?segment=inmobiliaria',
    insignia: false,
    imagen: '/verticales/inmobiliaria.jpg',
  },
];

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const [heroVideoLoaded, setHeroVideoLoaded] = useState(false);
  const [splashVideoLoaded, setSplashVideoLoaded] = useState(false);
  const [imagenesCaidas, setImagenesCaidas] = useState<Record<string, boolean>>({});
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

  /**
   * 🔒 Bloquea el scroll del documento mientras el splash está visible.
   * Sin esto, al deslizar durante la animación el navegador colapsaba la
   * barra de direcciones y el splash (anclado al viewport) dejaba ver el
   * desplazamiento de la página por el borde inferior del celular.
   */
  useEffect(() => {
    if (!showSplash || typeof document === 'undefined') return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [showSplash]);

  /**
   * 🖤 Blindaje anti-línea-blanca: mientras el splash está visible, el
   * documento detrás (html + body) se tiñe de negro. Cualquier costura de
   * sub-píxel, hueco de composición del video o redondeo del viewport asoma
   * NEGRO — el blanco de la página ya no puede aparecer por ningún borde.
   * Se restaura al desmontar el splash (los estilos inline vuelven a vacío
   * y manda la clase del theme).
   */
  useEffect(() => {
    if (!showSplash || typeof document === 'undefined') return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.backgroundColor;
    const prevBody = body.style.backgroundColor;
    html.style.backgroundColor = '#000000';
    body.style.backgroundColor = '#000000';
    return () => {
      html.style.backgroundColor = prevHtml;
      body.style.backgroundColor = prevBody;
    };
  }, [showSplash]);

  /**
   * ⏱️ Red de seguridad del splash: si el video no dispara `onEnded`
   * (autoplay bloqueado, ahorro de datos, red lenta o códec no soportado),
   * la pantalla se cierra igual. Nadie se queda en negro.
   */
  useEffect(() => {
    if (!showSplash || shouldSkipSplash) return;

    const id = window.setTimeout(() => {
      setFadeOut(true);
      window.setTimeout(() => setShowSplash(false), 500);
    }, 5000);

    return () => window.clearTimeout(id);
  }, [showSplash, shouldSkipSplash]);

  const handleVideoEnd = () => {
    setFadeOut(true);
    setTimeout(() => {
      setShowSplash(false);
    }, 500);
  };

  return (
    <>
      {/* PANTALLA DE CARGA (SPLASH SCREEN) - SOLO MÓVIL
          Alto en `100dvh` (viewport visible real, sin la barra del navegador).
          Con `inset-0` el bloque medía el viewport "con barra visible" y, al
          colapsarse la barra al deslizar, aparecía un desplazamiento de la
          página por el borde inferior. El `style` inline deja el fallback a
          `h-screen` (100vh) en navegadores que aún no entienden dvh. */}
      {showSplash && (
        <div
          style={{
            // +2mm por cada lado: sella la costura de sub-píxel entre el
            // contenedor (100dvh) y el borde real del viewport — si el browser
            // redondea hacia abajo, asomaba la página blanca por debajo.
            // Fallback: si un browser no entiende dvh en calc, ignora estas
            // líneas inline y aplica las clases h-screen/w-full/top-0/left-0.
            top: '-2mm',
            left: '-2mm',
            width: 'calc(100% + 4mm)',
            height: 'calc(100dvh + 4mm)',
          }}
          className={`fixed z-[9999] flex h-screen w-full items-center justify-center overflow-hidden overscroll-contain bg-black transition-opacity duration-500 md:hidden ${
            fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Icono de inicio: se ve mientras el video carga y se funde en el
              logo animado (icon-512.png — el mismo del launcher PWA). */}
          {/* eslint-disable-next-line @next/next/no-img-element -- splash: PNG local pequeño que debe pintar en el primer frame, sin pasar por /_next/image */}
          <img
            src="/icon-512.png"
            alt="Upway"
            className={`absolute w-[46vw] max-w-[260px] transition-opacity duration-300 ${
              splashVideoLoaded ? 'opacity-0' : 'opacity-100'
            }`}
          />
          {/* Logo animado: el archivo original es vertical 720×1280 (9:16).
              En pantalla completa el viewport es más alto, así que `object-cover`
              ampliaba el video para llenar la altura y recortaba los costados:
              por eso "UPWAY BUSINESS" quedaba incompleto. `object-contain`
              conserva el cuadro 9:16 completo y lo centra sin deformarlo. El
              contenedor negro llena el espacio restante, así que la experiencia
              sigue viéndose de borde a borde. No se modifica ni recomprime el MP4. */}
          <video
            src="/logo-animado.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onLoadedData={() => setSplashVideoLoaded(true)}
            onError={handleVideoEnd}
            onEnded={handleVideoEnd}
            className={`absolute inset-0 h-full w-full bg-black object-contain object-center transition-opacity duration-300 ${
              splashVideoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      )}

      <main className="min-h-screen overflow-x-hidden bg-white text-[#0d3168] font-sans selection:bg-[#11b7b1] selection:text-white">
        {/* NAVBAR SUPERIOR */}
        <header className="upway-topbar sticky top-0 z-50 flex items-center justify-between px-5 md:px-[5%] border-b border-[#edf3f8] bg-white/90 backdrop-blur-md">
          <a href="#inicio" className="flex items-center">
            <UpwayLogo />
          </a>
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-[22px] text-[13px] font-medium text-[#31547f] xl:gap-[30px]">
            <a href="#solucion" className="hover:text-[#103a77] transition">Solución</a>
            <a href="#verticales" className="hover:text-[#103a77] transition">Verticales</a>
            <a href="#por-que" className="hover:text-[#103a77] transition">Beneficios</a>
            <Link href="/precios" className="hover:text-[#103a77] transition">Precios</Link>
            <a href="#contacto" className="hover:text-[#103a77] transition">Contacto</a>
          </nav>
            <a
              href="#verticales"
              className="inline-flex md:hidden items-center gap-1.5 rounded-full border border-[#0ba9a9] bg-white px-3 py-[8px] text-[11px] font-bold text-[#0d3168]"
            >
              Verticales
            </a>
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
            {/* VIDEO CINEMATOGRÁFICO DE SOPHIE V2
                Móvil: servimos `sophie-mobile.mp4` (H.264 720p, ~1.1MB, con
                decodificación por hardware en cualquier celular) en lugar del
                master VP9 4K de 6.9MB, que obligaba a decodificar 3830x2160
                en software y trababa el scroll. El `poster` se pinta al
                instante, así el bloque nunca aparece vacío ni desplaza el
                contenido al cargar. */}
            <div className="relative mb-14 overflow-hidden rounded-[24px] border border-[#e2edf5] bg-white shadow-[0_30px_80px_rgba(15,31,54,0.10)] md:rounded-[32px]">
              <div className="relative aspect-video w-full overflow-hidden rounded-t-[24px] md:aspect-auto md:h-[500px] md:rounded-[32px] lg:h-[560px]">
                <video
                  ref={heroVideoRef}
                  src={heroVideoReady ? (isMobile ? '/sophie-mobile.mp4' : '/sophie-optimizada.webm') : undefined}
                  poster="/sophie-poster.jpg"
                  autoPlay={heroVideoReady}
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedData={() => setHeroVideoLoaded(true)}
                  disablePictureInPicture
                  controlsList="nodownload nofullscreen"
                  className={`h-full w-full object-cover object-center transition-opacity duration-300 ${
                    heroVideoLoaded || isMobile ? 'opacity-100' : 'opacity-0'
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
                  <Sparkles size={14} className="text-[#0ba9a9]" /> La inteligencia que mueve al agente
                </div>
                <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-[#0d3168] md:text-5xl">
                  Sophie v2:
                  <br />
                  IA que entiende, atiende y agenda por ti.
                </h2>
                <p className="max-w-xl text-lg font-medium leading-relaxed text-[#55718f]">
                  No es un guion que se reproduce: Sophie escucha, entiende lo que la persona pide, consulta lo que tu
                  operación necesita y agenda sobre tu disponibilidad real. Mientras habla aparta el cupo, así nadie
                  más lo toma y se acaban los cruces de horarios.
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
                  <SophieChatButton className="inline-flex items-center justify-center gap-2 rounded-full border border-[#9fe0dc] bg-[#e7fbfa] px-6 py-3.5 text-sm font-bold text-[#0d8a88] transition hover:border-[#0ba9a9] hover:bg-[#d7f5f2]" />
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
                        <Sparkles size={14} /> Upway
                      </div>
                      <p className="text-xs font-medium text-[#55718f] leading-relaxed">
                        Sincronizando atención, agenda y seguimiento con contexto operativo completo.
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

        {/* HERO — la portada es de Upway, no de una vertical.
            Sin fotografía de una vertical: la portada es común a las tres y una
            foto de sector haría que el primer pantallazo respondiera "¿tu
            operación es salud?", dejando a las otras dos como apéndice. El peso
            visual del hero lo carga el titular y el bloque de dolor/cura que va
            justo antes de las tarjetas. */}
        <section id="inicio" className="max-w-[900px] mx-auto pt-[45px] md:pt-[70px] pb-[35px] px-5 text-center bg-[radial-gradient(circle_at_50%_0%,_#e8fbfa,_transparent_55%)]">
          <div className="flex flex-col items-center">
            <div className="text-[#0ba9a9] font-bold text-[13px] mb-[17px]">♥ &nbsp; La línea de atención de tu negocio, con IA</div>
            <h1 className="font-display text-[35px] md:text-[52px] leading-[1.06] tracking-[-2px] md:tracking-[-2.6px] m-0 mb-[22px] font-extrabold">
              Atiende, agenda y confirma con quien te llama.<br />
              <em className="not-italic text-[#11b4b0]">Las 24 horas, sin perder un dato.</em>
            </h1>
            <p className="text-[16px] leading-[1.65] text-[#49698f] max-w-[600px]">
              Una inteligencia artificial con voz que responde tu línea 24/7: entiende lo que le piden, agenda sobre tu
              disponibilidad real y entrega el dato estructurado a tu sistema. Funciona en salud, en servicio técnico y
              en inmobiliaria, con las reglas de cada una.
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
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-[20px] text-[#315982] text-[10px] font-semibold uppercase tracking-wide mt-2">
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><Phone className="h-3.5 w-3.5" /> Voz IA 24/7</span>
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><Calendar className="h-3.5 w-3.5" /> Agenda propia</span>
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><Shield className="h-3.5 w-3.5" /> Datos correctos la primera vez</span>
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><Users className="h-3.5 w-3.5" /> Trazabilidad completa</span>
            </div>
          </div>
        </section>

        {/* CAPACIDAD OPERATIVA */}
        <section id="capacidad" className="max-w-[1180px] mx-[15px] md:mx-auto my-[55px] md:my-[70px]">
          <div className="text-center">
            <div className="text-[#0ba9a9] font-bold text-[13px] mb-[17px]">Capacidad operativa</div>
            <h2 className="font-display text-[35px] leading-[1.12] tracking-[-1.5px] mb-[18px] font-extrabold text-[#0d3168]">
              La línea no solo contesta. Sostiene la operación.
            </h2>
            <p className="text-[13px] leading-[1.7] text-[#55718f] max-w-[760px] mx-auto">
              Atender, registrar, agendar, confirmar y escalar. La valoración clínica y las decisiones de salud siguen en
              tu equipo profesional.
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

        {/* DOLOR Y CURA — el poder de Upway, en cualquier vertical.
            Va justo antes de las tarjetas a propósito: primero el visitante
            entiende qué dolor se le quita, y después elige por dónde empezar.
            El texto es deliberadamente COMÚN a las tres verticales (no dice
            "paciente" ni "cita"): el detalle clínico vive en /salud y el
            comercial en cada landing. */}
        <section id="dolor-y-cura" className="max-w-[1180px] mx-[15px] md:mx-auto mb-[20px]">
          <div className="rounded-[30px] overflow-hidden border border-[#d9e9f6] bg-white shadow-[0_24px_60px_rgba(15,31,54,0.10)]">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* EL DOLOR */}
              <div className="p-[22px] sm:p-[30px] md:p-[44px] bg-[#f7f9fc]">
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#e3eaf2] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#8a5a5a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d98a8a]" />
                  Lo que hoy te cuesta
                </div>
                <h3 className="font-display text-[23px] md:text-[27px] leading-[1.18] font-extrabold text-[#0d3168] mt-[16px] mb-[8px]">
                  El dolor no es la tecnología. Es lo que pasa cuando nadie atiende.
                </h3>
                <ul className="mt-[22px] space-y-[14px]">
                  {[
                    'La línea suena y nadie contesta: se va la venta, la cita o el soporte.',
                    'La agenda se llena sola, pero con ausencias y cruces de horario.',
                    'El dato queda en papel, en WhatsApp o en la cabeza de alguien.',
                    'Cada respuesta es un comercial interrumpido en lo que sí sabe hacer.',
                    'No hay forma de saber qué pasó, ni quién lo atendió, ni cuándo.',
                  ].map((d) => (
                    <li key={d} className="flex items-start gap-[11px] text-[13px] leading-[1.6] text-[#5b6f86]">
                      <span className="mt-[5px] grid h-[16px] w-[16px] shrink-0 place-items-center rounded-full bg-[#fbeaea] text-[10px] font-black text-[#c96a6a]">
                        ✕
                      </span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              {/* LA CURA */}
              <div className="p-[22px] sm:p-[30px] md:p-[44px] bg-[linear-gradient(150deg,#0c3775_0%,#0b6a72_58%,#0ba9a9_100%)] text-white">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7ef0d8]" />
                  Lo que Upway cambia
                </div>
                <h3 className="font-display text-[23px] md:text-[27px] leading-[1.18] font-extrabold mt-[16px] mb-[8px]">
                  Sophie contesta, agenda y deja el dato listo para tu sistema.
                </h3>
                <ul className="mt-[22px] space-y-[14px]">
                  {[
                    'La línea se atiende 24/7, con voz natural y sin guion fijo: siempre hay alguien.',
                    'La cita se aparta mientras habla y se confirma sola: menos ausencias.',
                    'El dato llega estructurado y validado a tu sistema, sin retranscribir.',
                    'Tu equipo solo entra cuando el caso lo pide, con todo el contexto arriba.',
                    'Cada llamada queda con usuario, rol, fecha y hora: se puede auditar.',
                  ].map((c) => (
                    <li key={c} className="flex items-start gap-[11px] text-[13px] leading-[1.6] text-white/90">
                      <span className="mt-[5px] grid h-[16px] w-[16px] shrink-0 place-items-center rounded-full bg-white/20 text-[9px] font-black text-white">
                        ✓
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
                <p className="mt-[26px] pt-[20px] border-t border-white/15 text-[12px] leading-[1.6] text-white/75">
                  Y esto se activa en las tres verticales con las reglas de cada una: el mismo agente, distinta
                  configuración.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* LAS TRES VERTICALES */}
        <section id="verticales" className="bg-[#f4faff] py-[65px] px-[5%]">
          <div className="max-w-[1180px] mx-auto text-center">
            <div className="text-[#0ba9a9] font-bold text-[13px] mb-[17px]">Elige tu vertical</div>
            <h2 className="font-display text-[35px] leading-[1.12] tracking-[-1.5px] mb-[18px] font-extrabold text-[#0d3168]">
              La misma inteligencia, tres operaciones distintas.
            </h2>
            <p className="text-[#55718f] leading-[1.7] max-w-[760px] mx-auto">
              Cada vertical habla del problema que resuelve y del sistema al que le entrega el dato, con sus propios
              catálogos y sus propias reglas.
            </p>
          </div>

          <div className="max-w-[1180px] mx-auto mt-[38px] grid grid-cols-1 lg:grid-cols-3 gap-[18px] items-start">
            {verticales.map((v) => (
              <article
                key={v.id}
                className={`group flex flex-col bg-white rounded-[22px] overflow-hidden border ${
                  v.insignia
                    ? 'border-[#9fc6ee] shadow-[0_18px_44px_#153f6826] lg:-translate-y-2'
                    : 'border-[#e0edf6] shadow-[0_8px_25px_#153f6810]'
                } transition hover:-translate-y-1 hover:shadow-[0_16px_40px_#153f6822]`}
              >
                {/* Las tres verticales ya tienen fotografía. El fallback con
                    icono no es decorativo: si un archivo se pierde en un
                    despliegue, la tarjeta cae al treatment en vez de quedar
                    con el ícono de imagen rota. */}
                <div className="relative aspect-[420/210] overflow-hidden bg-[#eaf4fb]">
                  {v.imagen && !imagenesCaidas[v.id] ? (
                    <Image
                      src={v.imagen}
                      alt={v.nombre}
                      width={420}
                      height={210}
                      quality={90}
                      sizes="(max-width: 1024px) 92vw, 400px"
                      onError={() => setImagenesCaidas((prev) => ({ ...prev, [v.id]: true }))}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-[linear-gradient(135deg,#0d3168,#0b6a72)]">
                      <span className="text-center px-6">
                        <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-white/15 text-[#50e1d5]">
                          {v.id === 'center' ? (
                            <Headphones className="h-7 w-7" />
                          ) : (
                            <HomeIcon className="h-7 w-7" />
                          )}
                        </span>
                        <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-white/70">
                          {v.nombre}
                        </span>
                      </span>
                    </div>
                  )}
                  {v.insignia && (
                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-[6px] text-[10px] font-black uppercase tracking-[0.08em] text-[#0d3168] shadow">
                      El más completo
                    </span>
                  )}
                  {/* Los botones van ENCIMA de la pieza, sobre un degradado y en
                      dos columnas. Encima para no recortar la imagen con un pie
                      de texto blanco; en dos columnas para que ocupen solo la
                      franja inferior y el arte se vea entero. */}
                  <div className="absolute inset-x-0 bottom-0 grid grid-cols-2 gap-2 bg-gradient-to-t from-[#081a30]/95 via-[#081a30]/70 to-transparent p-[12px] pt-12">
                    <Link
                      href={v.href}
                      className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-[11px] text-[12px] font-bold transition ${
                        v.insignia
                          ? 'bg-[linear-gradient(115deg,#0ba9a9,#0c3775)] text-white hover:-translate-y-[1px]'
                          : 'bg-white text-[#0d3168] hover:bg-[#e7fbfa]'
                      }`}
                    >
                      {v.nombre}
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                    <Link
                      href={v.loginHref}
                      className="flex items-center justify-center rounded-full border border-white/50 px-3 py-[11px] text-[12px] font-bold text-white transition hover:bg-white/15"
                    >
                      Entrar
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* POR QUÉ UPWAY */}
        <section id="por-que" className="max-w-[1180px] mx-[15px] md:mx-auto my-[55px] md:my-[80px] px-5">
          <div className="text-center mb-[32px]">
            <div className="text-[#0ba9a9] font-bold text-[13px] mb-[17px]">Por qué Upway</div>
            <h2 className="font-display text-[35px] leading-[1.12] tracking-[-1.5px] mb-[18px] font-extrabold text-[#0d3168]">
              Un solo sistema, no tres productos distintos.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[15px]">
            {[
              {
                icon: Phone,
                t: 'La línea nunca queda ocupada',
                d: 'Cada llamada entrante se atiende, a cualquier hora y en temporada alta. Varias a la vez.',
              },
              {
                icon: CalendarDays,
                t: 'Menos ausencias, más adherencia',
                d: 'Confirmación y recordatorios sobre la misma agenda, sin llamadas manuales.',
              },
              {
                icon: RefreshCw,
                t: 'Procesos más eficientes',
                d: 'El dato llega estructurado a tu sistema: tu equipo deja de retranscribir.',
              },
              {
                icon: ShieldCheck,
                t: 'Seguridad y trazabilidad',
                d: 'Cada acceso y cada corrección con usuario, rol, fecha y hora.',
              },
              {
                icon: Users,
                t: 'Escalamiento según tu protocolo',
                d: 'Cuando el caso lo pide, la llamada pasa a tu equipo con el contexto completo.',
              },
              {
                icon: BadgeCheck,
                t: 'Un solo lugar de trabajo',
                d: 'Agenda, casos, leads y agente en el mismo panel, sin licencias de terceros.',
              },
            ].map(({ t, d, icon: Icon }) => (
              <article
                key={t}
                className="rounded-[17px] border border-[#e0edf6] bg-white p-[22px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee]"
              >
                <span className="grid place-items-center w-[34px] h-[34px] rounded-full bg-[#e7fbfa] text-[#079fa0]">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="text-[13px] font-bold mt-[13px] mb-[6px] text-[#0d3168]">{t}</h3>
                <p className="text-[12px] leading-[1.6] text-[#55718f]">{d}</p>
              </article>
            ))}
          </div>
        </section>

        {/* CTA CONTACTO */}
        <section id="contacto" className="py-[48px] px-5 md:px-[8%] flex flex-col md:flex-row items-center justify-between bg-[linear-gradient(110deg,#103d79,#0b858d)] text-white gap-8">
          <div>
            <small className="text-[13px] text-[#50e1d5] font-semibold block mb-2">Empieza por tu vertical</small>
            <h2 className="font-display text-[28px] max-w-[650px] m-0 font-extrabold leading-[1.2]">
              Tu operación merece una <em className="not-italic text-[#50e1d5]">comunicación más inteligente.</em>
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
              const subject = `Solicitud de demo Upway — ${institucion || nombre || 'Nueva solicitud'}`;
              const body = [
                `Nombre: ${nombre}`,
                `Institución/Empresa: ${institucion}`,
                `Teléfono: ${telefono}`,
                '',
                'Solicito una demo de Upway.',
              ].join('\n');
              window.location.href = `mailto:contacto@upway.business?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            }}
          >
            <input name="nombre" required placeholder="Tu nombre" className="rounded-full px-4 py-2.5 text-[13px] text-[#0d3168] bg-white/95 border border-white/40 placeholder:text-[#7b93ab] outline-none focus:ring-2 focus:ring-[#50e1d5]" />
            <input name="institucion" placeholder="Institución, empresa o agencia" className="rounded-full px-4 py-2.5 text-[13px] text-[#0d3168] bg-white/95 border border-white/40 placeholder:text-[#7b93ab] outline-none focus:ring-2 focus:ring-[#50e1d5]" />
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

