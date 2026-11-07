'use client';

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Phone, Sparkles, Calendar, Bell, Users, Shield, ShieldCheck, Database, RefreshCw, ClipboardCheck, BadgeCheck, CalendarDays, ArrowRight, Headphones, Home as HomeIcon } from 'lucide-react';
import Footer from '@/components/Footer';
import SophieChatButton from '@/components/sophie-chat-button';
import { abrirChat } from '@/lib/chat-event';
import ScrambleText from '@/components/landing/scramble-text';
import CountUp from '@/components/landing/count-up';
// import VoiceDemo from '@/components/landing/voice-demo'; — DESACTIVADO (costo alto)
import PromoBanner from '@/components/landing/promo-banner';

/* El logo animado es el splash de arranque de la app, no un adorno de la
   página: se marca en sessionStorage para que solo aparezca al iniciar. La `v1`
   permite invalidar la preferencia si algún día cambia el video. Se comparte
   con la landing de salud a propósito: es la misma animación de arranque, no
   dos predecibles distintas. */
const SPLASH_KEY = 'upway:splash:v2';

/* ¿Corre dentro de la app instalada (WebAPK de Android desde Chrome o "Agregar
   a inicio" en iOS)? El manifest arranca en modo `fullscreen` — sin barra del
   sistema, como app nativa — y en ese contexto el splash es el ARRANQUE de la
   app: se muestra en cada apertura. En navegador normal se respeta el
   sessionStorage (una vez por pestaña); en la app, el sistema puede reanudar
   la tarea con el sessionStorage vivo y saltarse el splash, así que ahí se
   ignora la marca. `fullscreen` va primero porque es el modo del manifest;
   F11 en escritorio también lo activa, pero allí el corte de >= 768px manda
   antes. */
function esAppInstalada(): boolean {
  return (
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

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

   Son OCHO. Bajaron a seis y se recuperaron "Entrega del dato" y "Lo
   puedes auditar" porque las dos son diferenciadores reales —en salud
   son el argumento entero: entrega estructurada al HIS y trazabilidad
   con usuario, rol, fecha y hora—. Lo que sigue fuera es "Aprende de
   tu operación", que era la más floja: repetía lo que ya dicen las
   tres verticales al hablar de sus catálogos y sus reglas. */
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
  {
    title: 'Entrega el dato',
    text: 'Cada atención sale estructurada, validada y auditable hacia tu sistema. Tu equipo deja de retranscribir.',
    icon: Database,
  },
  {
    title: 'Lo puedes auditar',
    text: 'Usuario, rol, fecha y hora en cada consulta. El agente no improvisa respuestas que no estén en lo que le definiste.',
    icon: ShieldCheck,
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
    imagen: '/salud-upway.png',
  },
  {
    id: 'center',
    nombre: 'Upway Center',
    href: '/center',
    loginHref: '/login?segment=center',
    insignia: false,
    imagen: '/center-upway.png',
  },
  {
    id: 'inmobiliaria',
    nombre: 'Upway Inmobiliarias',
    href: '/inmobiliarias',
    loginHref: '/login?segment=inmobiliaria',
    insignia: false,
    imagen: '/inmo-upway.png',
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
  const splashVideoRef = useRef<HTMLVideoElement | null>(null);

  /* El logo animado es un splash de ARRANQUE, no un adorno de la página. Antes
     `showSplash` arrancaba en `true`, así que se repetía en CADA visita a la
     raíz. Se marca `upway:splash:v1` en sessionStorage y no vuelve a aparecer
     en la sesión: es la MISMA clave que usa /salud, para que abrir la portada
     y luego caer a salud no dispare dos animaciones seguidas.

     Se lee con useSyncExternalStore y no con useState + useEffect porque
     sessionStorage no existe en el servidor: leerlo al inicializar daría
     mismatch de hidratación. El tercer argumento (getServerSnapshot) es el
     que React usa durante la hidratación, así que servidor y cliente arrancan
     de acuerdo en "ya visto" y no se pinta nada hasta resolver el valor real.
  */
  const yaVistoElSplash = useSyncExternalStore(
    // No hay nada que escuchar: la decisión se toma una vez al abrir la página.
    () => () => {},
    () => {
      // En escritorio el splash nunca se ha mostrado (se corta en >= 768px).
      if (window.innerWidth >= 768) return true;
      // App instalada: el splash acompaña SIEMPRE el arranque de la app.
      if (esAppInstalada()) return false;
      try {
        return window.sessionStorage.getItem(SPLASH_KEY) === '1';
      } catch {
        // Sin sessionStorage (modo privado, cookies bloqueadas) se muestra.
        return false;
      }
    },
    // Servidor e hidratación: siempre "ya visto", o sea, no se pinta nada.
    () => true
  );

  // Marca la sesión. Va en un efecto y no dentro de getSnapshot porque
  // getSnapshot tiene que ser puro: escribir ahí puede dispararse dos veces.
  useEffect(() => {
    if (yaVistoElSplash) return;
    try {
      window.sessionStorage.setItem(SPLASH_KEY, '1');
    } catch {
      /* si no se puede guardar, se repetirá la próxima vez: no es grave */
    }
  }, [yaVistoElSplash]);

  /**
   * Si el splash está en pantalla. Los efectos de bloqueo de scroll y de fondo
   * negro dependen de ESTE valor y no de `showSplash`: si dependieran de
   * `showSplash` seguirían bloqueando la página los cinco segundos completos
   * en cada visita, con la pantalla ya oculta y el fondo en negro.
   */
  const splashActivo = !yaVistoElSplash && showSplash;

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
   * ?? Bloquea el scroll del documento mientras el splash está visible.
   * Sin esto, al deslizar durante la animación el navegador colapsaba la
   * barra de direcciones y el splash (anclado al viewport) dejaba ver el
   * desplazamiento de la página por el borde inferior del celular.
   */
  useEffect(() => {
    if (!splashActivo || typeof document === 'undefined') return;

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
  }, [splashActivo]);

  /**
   * ?? Blindaje anti-línea-blanca: mientras el splash está visible, el
   * documento detrás (html + body) se tiñe de negro. Cualquier costura de
   * sub-píxel, hueco de composición del video o redondeo del viewport asoma
   * NEGRO — el blanco de la página ya no puede aparecer por ningún borde.
   * Se restaura al desmontar el splash (los estilos inline vuelven a vacío
   * y manda la clase del theme).
   */
  useEffect(() => {
    if (!splashActivo || typeof document === 'undefined') return;
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
  }, [splashActivo]);

  /** Cierra el splash con el fundido de 500 ms. Lo usan `onEnded` del video
      (la animación dura 4 s y al terminar pasa a la landing sin esperar el
      tope) y la red de seguridad de abajo. */
  const cerrarSplash = useCallback(() => {
    setFadeOut(true);
    window.setTimeout(() => setShowSplash(false), 500);
  }, []);

  /**
   * ?? Red de seguridad del splash: si el video no dispara `onEnded`
   * (autoplay bloqueado, ahorro de datos, red lenta o códec no soportado),
   * la pantalla se cierra igual a los 5 s. Nadie se queda en negro.
   */
  useEffect(() => {
    if (!splashActivo) return;

    const id = window.setTimeout(cerrarSplash, 5000);

    return () => window.clearTimeout(id);
  }, [splashActivo, cerrarSplash]);

  /**
   * Refuerzo de autoplay: en algunos móviles el atributo `autoPlay` se evalúa
   * antes de que React asigne `muted` en la hidratación y el navegador bloquea
   * el arranque. Un `play()` explícito al activarse el splash cubre ese caso;
   * si el navegador aún lo rechaza, queda el fallback ícono + texto hasta que
   * la red de seguridad (5 s) cierre la pantalla.
   */
  useEffect(() => {
    if (!splashActivo) return;
    const video = splashVideoRef.current;
    if (!video) return;
    video.muted = true;
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => { /* autoplay bloqueado: se ve el fallback */ });
    }
  }, [splashActivo]);

  return (
    <>
      {/* PANTALLA DE CARGA (SPLASH SCREEN) - SOLO MÓVIL
          Alto en `100dvh` (viewport visible real, sin la barra del navegador).
          Con `inset-0` el bloque medía el viewport "con barra visible" y, al
          colapsarse la barra al deslizar, aparecía un desplazamiento de la
          página por el borde inferior. El `style` inline deja el fallback a
          `h-screen` (100vh) en navegadores que aún no entienden dvh. */}
      {splashActivo && (
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
          className={`fixed z-[9999] flex h-[calc(100dvh+4mm)] items-center justify-center overflow-hidden bg-black transition-opacity duration-500 md:hidden ${
            fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Fallback mientras carga el video: ícono + texto de marca. Es el
              mismo texto que trae el video ("UPWAY BUSINESS"), para que el
              arranque nunca se vea sin logo ni leyenda si la red está lenta.
              Se oculta en cuanto el video tiene primer cuadro listo. */}
          <div
            className={`absolute flex flex-col items-center gap-3 transition-opacity duration-300 ${
              splashVideoLoaded ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- splash: PNG local pequeño que debe pintar en el primer frame, sin pasar por /_next/image */}
            <img src="/icon-512.png" alt="Upway" className="w-[64px] h-[64px]" />
            <span className="text-[13px] font-semibold tracking-[0.35em] text-white">
              UPWAY BUSINESS
            </span>
          </div>
           {/* Logo animado: archivo vertical 720×1280 (9:16). `preload="auto"`
               descarga el primer cuadro de inmediato — con "metadata" el evento
               `loadeddata` no llegaba a tiempo y el video quedaba invisible
               tras el ícono. `onCanPlay`/`onPlaying` refuerzan la señal de
               "listo" y el `play()` explícito cubre móviles que ignoran el
               autoplay del atributo. `object-contain` conserva el 9:16
               completo sin recortar; el fondo negro llena el resto. */}
           <video
             ref={splashVideoRef}
             src="/logo-animado.mp4"
             autoPlay
             muted
             playsInline
             preload="auto"
             onLoadedData={() => setSplashVideoLoaded(true)}
             onCanPlay={() => setSplashVideoLoaded(true)}
             onPlaying={() => setSplashVideoLoaded(true)}
             onEnded={cerrarSplash}
             className={`absolute inset-0 h-full w-full object-contain object-center bg-black transition-opacity duration-500 ${
               splashVideoLoaded ? 'opacity-100' : 'opacity-0'
             }`}
           />
        </div>
      )}

      <main className="min-h-screen overflow-x-hidden bg-white text-[#0d3168] font-sans selection:bg-[#11b7b1] selection:text-white">
        {/* PROMO: Implementación gratis fin de año */}
        <div className="mx-auto max-w-[1320px] px-5 pt-4 md:px-8">
          <PromoBanner />
        </div>
        {/* NAVBAR SUPERIOR */}
        <header className="upway-topbar sticky top-0 z-50 flex items-center justify-between px-5 md:px-[5%] border-b border-[#edf3f8] bg-white/90 backdrop-blur-md">
          {/* Botón header demo en vivo DESACTIVADO */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-[20px] text-[#315982] text-[12px] font-semibold uppercase tracking-wide mt-2">
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><Phone className="h-3.5 w-3.5" /> Voz IA 24/7</span>
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><Calendar className="h-3.5 w-3.5" /> Agenda propia</span>
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><Shield className="h-3.5 w-3.5" /> Datos correctos la primera vez</span>
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><Users className="h-3.5 w-3.5" /> Trazabilidad completa</span>
            </div>
        </header>

        {/* CIFRAS VERIFICADAS + DEMO DE VOZ EN VIVO
            El escaparate: el visitante elige voz, escribe y escucha el producto
            sin registrarse. Las cifras son datos reales del proyecto (catálogo
            verificado contra la API, catálogo DANE cargado, catálogo RDA
            oficial), no adornos de marketing: si mañana cambian, cambian los
            números de esta banda. */}
        <section
          id="prueba"
          className="upway-noise upway-demo-frame relative mx-[15px] my-[55px] max-w-[1180px] overflow-hidden rounded-[28px] bg-gradient-to-b from-[#f7fdff] to-white px-5 py-10 md:mx-auto md:my-[70px] md:rounded-[36px] md:px-12 md:py-14"
        >
          <div className="relative text-center">
            <div className="flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-widest text-[#0ba9a9]">
              <span className="upway-live-dot inline-block h-2 w-2 rounded-full bg-[#11b4b0]" aria-hidden="true" />
              Escúchalo ahora
            </div>
            <h2 className="font-display mb-3 text-[30px] font-extrabold leading-[1.1] tracking-[-1.5px] text-[#0d3168] md:text-[42px]">
              Elige una voz y pídele que hable.
            </h2>
            <p className="mx-auto max-w-[640px] text-[16px] leading-relaxed text-[#49698f]">
              Es la misma síntesis de voz que corre en la línea de tus clientes.
              Escribe tu propia frase: en treinta segundos sabrás si suena a
              producto o a juguete.
            </p>
          </div>

          {/* Banda de cifras: el número ES el argumento. CountUp anima una vez
              al entrar y termina siempre en el valor real del HTML. */}
          <div className="relative my-8 grid grid-cols-1 gap-4 border-y border-[#e0edf6] py-6 sm:grid-cols-3">
            {[
              {
                n: 1000,
                suf: '+',
                label: 'voces de catálogo disponibles',
                nota: 'con voces en español y colombianas',
              },
              {
                n: 1122,
                suf: '',
                label: 'municipios validados con el DANE',
                nota: 'catálogo oficial cargado y verificado',
              },
              {
                n: 17,
                suf: '',
                label: 'tipos de documento oficiales',
                nota: 'según el catálogo normativo del IHCE',
              },
            ].map((c) => (
              <div key={c.label} className="text-center">
                <div className="font-display text-[38px] font-extrabold leading-none tracking-tight text-[#0c3775] md:text-[44px]">
                  <CountUp to={c.n} />
                  <span className="text-[#11b4b0]">{c.suf}</span>
                </div>
                <div className="mt-2 text-[15px] font-bold text-[#31547f]">{c.label}</div>
                <div className="text-[13px] text-[#7b93ab]">{c.nota}</div>
              </div>
            ))}
          </div>

          <div className="relative">
            {/* <VoiceDemo /> desactivado: demo en vivo con captura de datos a agenda (costo alto) */}
          </div>
        </section>

        {/* CTA: Demo en vivo con Sophie */}
                {/* Sección demo en vivo DESACTIVADA: captura de datos a agenda (costo alto).
             Se deja solo el número de teléfono para llamada directa.
        */}

        {/* ANTES / DESPUÉS — el video del "mientras dormías": llamadas perdidas
            de la noche ? red de llamadas ? el cliente dormido con 500 llamadas
            atendidas. Nativo, con controles y SIN autoplay (regla de la casa);
            preload=metadata + póster para que el scroll no arrastre 3.7 MB. */}
        <section id="mientras" className="max-w-[1180px] mx-[15px] md:mx-auto my-[55px] md:my-[70px]">
          <div className="text-center">
            <div className="text-[13px] font-bold uppercase tracking-widest text-[#0ba9a9]">
              Mientras tú dormías
            </div>
            <h2 className="font-display mb-3 text-[30px] font-extrabold leading-[1.1] tracking-[-1.5px] text-[#0d3168] md:text-[42px]">
              <span className="text-[#e2555f]">Llamadas perdidas</span> a las 3&nbsp;a.&nbsp;m. ?{' '}
              <span className="text-[#11b4b0]">500 atendidas</span> mientras dormías.
            </h2>
            <p className="mx-auto max-w-[640px] text-[16px] leading-relaxed text-[#49698f]">
              Antes y después de poner a Upway en la línea: mientras tú duermes, el
              agente contesta, agenda y deja todo listo para la mañana.
            </p>
          </div>
          <div className="upway-demo-frame relative mt-7 overflow-hidden rounded-[28px] bg-black md:rounded-[36px]">
            <video
              controls
              preload="metadata"
              playsInline
              poster="/sophie-poster.jpg"
              className="block w-full"
              src="/captura-llamada.mp4"
            >
              Tu navegador no puede reproducir este video. Escríbenos y te lo contamos.
            </video>
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
                        ?
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
                        ?
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
          <div className="max-w-[1320px] mx-auto text-center">
            <div className="text-[#0ba9a9] font-bold text-[13px] mb-[17px]">Elige tu vertical</div>
            <h2 className="font-display text-[35px] leading-[1.12] tracking-[-1.5px] mb-[18px] font-extrabold text-[#0d3168]">
              La misma inteligencia, tres operaciones distintas.
            </h2>
            <p className="text-[#55718f] leading-[1.7] max-w-[760px] mx-auto">
              Cada vertical habla del problema que resuelve y del sistema al que le entrega el dato, con sus propios
              catálogos y sus propias reglas.
            </p>
          </div>

          <div className="max-w-[1320px] mx-auto mt-[38px] grid grid-cols-1 lg:grid-cols-3 gap-[18px]">
            {verticales.map((v) => (
              <article
                key={v.id}
                className={`group flex flex-col bg-white rounded-[22px] overflow-hidden border ${
                  v.insignia
                    ? 'border-[#9fc6ee] shadow-[0_18px_44px_#153f6826]'
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
                      sizes="(max-width: 1024px) 92vw, 440px"
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
                </div>

                {/* Los botones van DEBAJO de la pieza, no encima. Con el velo
                    encima tapaba justo los rótulos que el arte trae abajo a la
                    izquierda ("Gestión de citas médicas", "Historia clínica
                    digital"): la parte que más argumentaba a favor. Debajo se
                    lee la pieza entera y la tarjeta sigue siendo la imagen. */}
                <div className="grid grid-cols-2 gap-2 p-[12px]">
                  {/* Botón final demo en vivo DESACTIVADO */}
            <Link href="/precios" className="inline-flex items-center justify-center gap-2 rounded-full border border-white text-white px-6 py-3 text-[14px] font-bold transition hover:bg-white/10">
              Ver planes y precios
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}



