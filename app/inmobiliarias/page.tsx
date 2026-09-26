import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Database,
  FileSearch,
  FileText,
  Handshake,
  Home,
  LayoutDashboard,
  MapPin,
  MessageSquareText,
  PhoneCall,
  PhoneIncoming,
  RefreshCw,
  Repeat,
  ShieldCheck,
  Target,
  Timer,
  TrendingUp,
  UserCheck,
  Wallet,
} from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Sophie para inmobiliarias — atiende, califica y agenda visitas 24/7 | Upway',
  description:
    'Sophie atiende las llamadas de tus interesados 24/7, califica con los criterios que tú definas, agenda la visita sobre tu operación real y hace seguimiento. Datos conformes y auditables para sincronizar con tu CRM, con escalamiento a un asesor humano.',
  keywords: [
    'agente de voz inmobiliario',
    'IA para inmobiliarias',
    'contestar llamadas inmobiliaria',
    'agendar visitas automáticamente',
    'calificación de leads inmobiliarios',
  ],
  alternates: { canonical: '/inmobiliarias' },
  openGraph: {
    title: 'Sophie para inmobiliarias — atiende, califica y agenda visitas 24/7',
    description:
      'Agente de voz con IA que contesta a tus interesados 24/7, califica con tus criterios, agenda la visita y deja el lead listo y auditable para tu equipo.',
    url: '/inmobiliarias',
    type: 'website',
  },
};

const problemas = [
  {
    title: 'La ventana de 5 minutos se pierde',
    text: 'Los estudios del sector indican que responder en los primeros 5 minutos multiplica hasta 21× la probabilidad de calificar un lead frente a esperar 30 minutos. Cuando el interesado pasa a la competencia en ese minuto, la oportunidad ya no vuelve.',
    icon: PhoneCall,
  },
  {
    title: 'El 78% compra al primero que responde',
    text: 'Los compradores inmobiliarios eligen al que contesta primero, no al que cobra menos. Cada lead que tarda en recibir respuesta es un cliente que se va con otro. El promedio del sector sigue siendo de 8 a 15 horas; ese hueco es donde se pierden las ventas.',
    icon: ShieldCheck,
  },
  {
    title: 'El 62% de los leads llega fuera de horario',
    text: 'Si dependes de un humano, la mayoría del tráfico —noche, madrugadas y fines de semana— espera hasta el día siguiente o se enfría sin que nadie lo note. No es falta de ganas, es un hueco estructural del sistema.',
    icon: MessageSquareText,
  },
  {
    title: 'Visitas que se pierden en la coordinación',
    text: 'Agendar con mensajes sueltos y notas en el celular termina en cruces de horario, olvidos y reagendaciones. La visita que no se confirma con el asesor correcto no termina en cierre.',
    icon: CalendarCheck2,
  },
];

const capacidad = [
  {
    title: 'Atiende',
    text: 'Responde las llamadas entrantes 24/7 con voz humana y natural, y retoma el hilo de cada interesado.',
    icon: PhoneCall,
  },
  {
    title: 'Califica',
    text: 'Toma intención, presupuesto, zona de interés y nivel de urgencia conforme a los criterios que tú definas, antes de pasar el lead al equipo comercial.',
    icon: ClipboardList,
  },
  {
    title: 'Agenda',
    text: 'Coordina la visita sobre tu operación real, aparta el horario mientras habla y envía la confirmación.',
    icon: CalendarCheck2,
  },
  {
    title: 'Hace seguimiento',
    text: 'Retoma leads activos, confirma asistencia y reagenda cuando el interesado no aparece.',
    icon: Repeat,
  },
  {
    title: 'Escala a humano',
    text: 'Cuando la negociación lo pide, transfiere la conversación a un asesor con todo el contexto.',
    icon: UserCheck,
  },
  {
    title: 'Deja trazabilidad',
    text: 'Cada llamada queda registrada: qué pidió el interesado, qué se acordó y qué sigue.',
    icon: ShieldCheck,
  },
];

const casos = [
  { de: 'Llamada fuera de horario', a: 'Visita agendada para el lunes' },
  { de: 'Consulta por un inmueble', a: 'Lead calificado con presupuesto y zona' },
  { de: 'Interesado que no apareció', a: 'Visita reprogramada sin fricción' },
  { de: 'Pregunta por financiación', a: 'Ficha del lead lista para el asesor' },
];

const captura = [
  {
    title: 'Catálogos cerrados, nunca texto libre',
    text: 'Tipo de operación (arriendo o venta), zona o barrio y rango de presupuesto se eligen de listas, no se escriben a mano. Si un dato no es claro, Sophie vuelve a preguntar: no lo adivina.',
  },
  {
    title: 'Doble confirmación con el interesado',
    text: 'El teléfono se relee en la llamada y la zona de interés se repite antes de agendar. Cada corrección queda registrada con evidencia.',
  },
  {
    title: 'Auditoría con usuario, rol, fecha y hora',
    text: 'Cada acceso y cada ajuste sobre el dato del interesado quedan trazados, con tratamiento de datos bajo la Ley 1581 y encargo registrado.',
  },
];

const panelDatos = [
  {
    title: 'Historial por llamada',
    text: 'Cada contacto con su grabación, su transcripción y los datos que dejó.',
    icon: ClipboardCheck,
  },
  {
    title: 'Exportación estructurada',
    text: 'Consolidado descargable para cargar donde ya trabajas.',
    icon: FileText,
  },
  {
    title: 'Integración con tu CRM',
    text: 'Conecta el flujo a tu CRM inmobiliario o a tu sistema interno.',
    icon: RefreshCw,
  },
  {
    title: 'Datos conformes',
    text: 'Catálogos cerrados, doble confirmación y evidencia de cada cambio.',
    icon: BadgeCheck,
  },
  {
    title: 'Estados y seguimiento',
    text: 'Nuevo, contactado, visita agendada, visitó y pendiente de decisión.',
    icon: CalendarDays,
  },
  {
    title: 'Auditoría de accesos',
    text: 'Usuario, rol, fecha y hora en cada consulta al dato.',
    icon: ShieldCheck,
  },
];

const estudio = [
  {
    dato: '5 minutos',
    title: 'La ventana donde se decide la venta',
    text: 'Responder dentro de los primeros 5 minutos multiplica hasta 21× la probabilidad de calificar un lead frente a esperar 30 minutos. Pasada la ventana, la oportunidad ya no vuelve.',
    fuente: 'MIT / InsideSales — Lead Response Study',
    icon: Timer,
  },
  {
    dato: '78%',
    title: 'Compra quien contesta primero',
    text: 'Los compradores e inquilinos se quedan con la inmobiliaria que responde primero, no con la que publica mejor precio. Velocidad de respuesta por encima de catálogo.',
    fuente: 'Unami / SalesRook — comportamiento de comprador inmobiliario',
    icon: Target,
  },
  {
    dato: '8 a 15 horas',
    title: 'El tiempo de respuesta promedio del sector',
    text: 'La mayoría de inmobiliarias tarda entre 8 y 15 horas en contestar un contacto entrante. Ese hueco es donde se enfría la intención de compra.',
    fuente: 'Inman 2025 — respuesta de leads inmobiliarios',
    icon: Clock,
  },
  {
    dato: '40–62%',
    title: 'El tráfico llega fuera de horario',
    text: 'Una parte mayoritaria de los contactos entra de noche, en madrugadas o en fines de semana. Con atención humana, ese tráfico espera al día siguiente o se pierde.',
    fuente: 'Datos sectoriales Unami',
    icon: PhoneIncoming,
  },
  {
    dato: '0,4–1,2% vs 4–6%',
    title: 'Lo que cambia responder a tiempo',
    text: 'Con respuesta lenta, la conversión se queda entre 0,4% y 1,2%. Con respuesta en minutos y seguimiento estructurado, sube a 4–6%. Es la misma demanda, con otro proceso.',
    fuente: 'Pinova — análisis sobre 10.000 leads',
    icon: TrendingUp,
  },
  {
    dato: '5+ toques',
    title: 'Cerrar exige insistir',
    text: 'Hasta 80% de las ventas requiere 5 o más contactos de seguimiento. Sin un sistema que los ejecute, el seguimiento depende de la memoria del asesor.',
    fuente: 'SalesRook — ciclo de venta inmobiliaria',
    icon: Repeat,
  },
];

const aporte = [
  {
    title: 'Atiende 24/7',
    text: 'Cubre el 40–62% de tráfico que entra fuera de horario, sin turnos extra.',
  },
  {
    title: 'Contesta en el primer timbre',
    text: 'Aprovecha la ventana de 5 minutos: ningún contacto queda esperando 8–15 horas.',
  },
  {
    title: 'Califica con tus criterios',
    text: 'Operación, zona, presupuesto y momento de decisión definidos por ti, no por la IA.',
  },
  {
    title: 'Agenda sobre tu operación',
    text: 'Aparta el cupo mientras habla y confirma la visita: la cita deja de depender del asesor disponible.',
  },
  {
    title: 'Ejecuta el seguimiento',
    text: 'Los 5+ toques se cumplen de forma sistemática, no según la memoria de cada asesor.',
  },
  {
    title: 'Entrega el dato conforme',
    text: 'Tu CRM recibe la ficha limpia, confirmada y auditable: el equipo cierra, no transcribe.',
  },
];

const beneficios = [
  {
    title: 'Ningún lead se enfría',
    text: 'Cada llamada entrante se atiende, a cualquier hora y en temporada alta.',
  },
  {
    title: 'Visitas que sí ocurren',
    text: 'Confirmación y recordatorios sobre la misma agenda, sin llamadas manuales del equipo.',
  },
  {
    title: 'El asesor llega con contexto',
    text: 'Presupuesto, zona, urgencia y objeciones ya están escritos antes del primer contacto humano.',
  },
  {
    title: 'Menos trabajo administrativo',
    text: 'El dato llega estructurado a tu CRM: tu equipo deja de retranscribir y de perseguir hojas de cálculo.',
  },
  {
    title: 'Seguridad y trazabilidad',
    text: 'Cada acceso y cada corrección con usuario, rol, fecha y hora.',
  },
  {
    title: 'Escalamiento según tu criterio',
    text: 'Cuando la negociación lo pide, la llamada pasa a tu asesor con el contexto completo.',
  },
];

const segmentos = [
  { title: 'Arriendo residencial', icon: Home },
  { title: 'Venta de usados', icon: Building2 },
  { title: 'Proyectos sobre planos', icon: MapPin },
  { title: 'Administración de inmuebles', icon: LayoutDashboard },
  { title: 'Finca raíz comercial', icon: Handshake },
  { title: 'Fondos de inversión inmobiliaria', icon: Wallet },
];

export default function InmobiliariasPage() {
  return (
    <main className="min-h-screen bg-white font-sans text-[#0d3168] selection:bg-[#11b7b1] selection:text-white">
      <header className="sticky top-0 z-50 border-b border-[#edf3f8] bg-white/90 backdrop-blur-md">
        <div className="upway-topbar mx-auto flex w-full max-w-[1180px] items-center justify-between px-5 md:px-[5%]">
          <Link href="/" className="flex items-center gap-3" aria-label="Volver a Upway">
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
              Inmobiliarias
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/inmobiliarias/caso"
              className="inline-flex items-center gap-2 rounded-full border border-[#b8cce3] bg-white px-4 py-2 text-[12px] font-bold text-[#0c3775] transition hover:border-[#9fc6ee]"
            >
              <FileSearch className="h-3.5 w-3.5" />
              Mi caso
            </Link>
            <Link
              href="/"
              className="hidden rounded-full border border-[#dce9f4] bg-white px-4 py-2 text-[12px] font-bold text-[#0d3168] transition hover:border-[#9fc6ee] lg:inline-flex"
            >
              Volver a Upway
            </Link>
            <Link
              href="/inmobiliarias/precios"
              className="inline-flex items-center gap-2 rounded-full bg-[#0c3775] px-[18px] py-[10px] text-[12px] font-bold text-white shadow-md transition hover:bg-[#092a5c] md:px-[23px] md:text-[13px]"
            >
              Ver planes
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-5 md:px-[5%]">
        <section className="relative bg-[radial-gradient(circle_at_80%_20%,_#e8fbfa,_transparent_45%)] pb-[35px] pt-[45px] md:pb-[45px] md:pt-[70px]">
          <div className="max-w-[860px]">
            <div className="mb-[17px] inline-flex items-center gap-2 rounded-full border border-[#bfe9e6] bg-[#effbfa] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0d8a88]">
              Sophie · Empleado Digital de voz · Inmobiliarias
            </div>
            <h1 className="font-display text-[35px] font-extrabold leading-[1.06] tracking-[-2px] md:text-[52px] md:tracking-[-2.6px]">
              Ningún lead de inmobiliaria se queda sin responder.{' '}
              <em className="not-italic text-[#11b4b0]">Atiende, califica y agenda solo.</em>
            </h1>
            <p className="mt-[22px] max-w-[720px] text-[16px] leading-[1.65] text-[#49698f]">
              Sophie contesta tus llamadas 24/7, califica al interesado con los criterios que tú definas, agenda la visita sobre
              tu operación real —mientras habla aparta el horario— y hace seguimiento hasta dejar el lead listo para tu equipo.
              Cuando la negociación lo pide, escala a tu asesor con todo el contexto.
            </p>
            <div className="my-[26px] flex flex-col gap-3 sm:flex-row">
              <Link
                href="/inmobiliarias/precios"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c3775] px-[23px] py-[14px] text-[13px] font-bold text-white transition hover:bg-[#092a5c] hover:shadow-[0_22px_48px_rgba(12,55,117,0.42)]"
              >
                Ver planes y precios
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login?segment=inmobiliaria"
                className="inline-flex items-center justify-center rounded-full border border-[#b8cce3] bg-white px-[23px] py-[14px] text-[13px] font-bold text-[#0c3775] transition hover:bg-slate-50 hover:shadow-[0_22px_48px_rgba(12,55,117,0.22)]"
              >
                Activar mi operación
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-[18px] text-[10px] font-semibold uppercase tracking-wide text-[#315982] sm:flex sm:flex-wrap sm:gap-[20px]">
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><PhoneCall className="h-3.5 w-3.5" /> Voz IA 24/7</span>
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><CalendarCheck2 className="h-3.5 w-3.5" /> Agenda sobre tu operación</span>
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><ShieldCheck className="h-3.5 w-3.5" /> Datos conformes y auditables</span>
              <span className="flex items-center gap-1.5 text-[#0ba9a9]"><UserCheck className="h-3.5 w-3.5" /> Escalamiento a tu asesor</span>
            </div>
            <p className="mt-[22px] max-w-[720px] text-[13px] font-medium leading-[1.6] text-[#55718f]">
              Implementación white-glove: Upway conecta la voz dedicada y la deja operando. Tú no tocas consolas ni tokens.
            </p>
          </div>
        </section>

        <section className="py-[30px] md:py-[45px]">
          <div className="mb-[17px] text-[13px] font-bold text-[#0ba9a9]">Lo que se pierde cuando nadie contesta</div>
          <h2 className="font-display text-[26px] font-extrabold leading-[1.12] tracking-[-1.5px] md:text-[35px]">
            El lead ya está llamando. El problema es cuándo se responde.
          </h2>
          <div className="mt-[30px] grid grid-cols-1 gap-[15px] sm:grid-cols-2 lg:grid-cols-4">
            {problemas.map(({ title, text, icon: Icon }) => (
              <div
                key={title}
                className="rounded-[17px] border border-[#e0edf6] bg-white p-[20px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]"
              >
                <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[#e7fbfa] text-[#079fa0]">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="my-[15px] mb-[7px] text-[14px] font-bold text-[#0d3168]">{title}</h3>
                <p className="text-[12px] font-medium leading-[1.6] text-[#55718f]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-[30px] md:py-[45px]">
          <div className="mb-[17px] text-[13px] font-bold text-[#0ba9a9]">Capacidad operativa</div>
          <h2 className="font-display text-[26px] font-extrabold leading-[1.12] tracking-[-1.5px] md:text-[35px]">
            Sophie no solo responde. Trabaja.
          </h2>
          <div className="mt-[30px] grid grid-cols-1 gap-[15px] sm:grid-cols-2 lg:grid-cols-3">
            {capacidad.map(({ title, text, icon: Icon }) => (
              <div
                key={title}
                className="rounded-[17px] border border-[#e0edf6] bg-white p-[22px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[#e7fbfa] text-[#079fa0]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#0d3168]">{title}</h3>
                </div>
                <p className="mt-[13px] text-[12px] font-medium leading-[1.6] text-[#55718f]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-[30px] md:py-[45px]">
          <div className="mb-[17px] text-[13px] font-bold text-[#0ba9a9]">Del mensaje al cierre</div>
          <h2 className="font-display text-[26px] font-extrabold leading-[1.12] tracking-[-1.5px] md:text-[35px]">
            Una llamada puede convertirse en:
          </h2>
          <div className="mt-[30px] grid gap-[12px] md:grid-cols-2">
            {casos.map(({ de, a }) => (
              <div
                key={de}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[17px] border border-[#e0edf6] bg-white px-[20px] py-[16px] shadow-[0_8px_25px_#153f6810]"
              >
                <span className="text-[12px] font-medium text-[#64809c]">{de}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#0ba9a9]" />
                <span className="text-right text-[12px] font-bold text-[#0d3168]">{a}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="estudio" className="my-[30px] rounded-[30px] bg-[#f5fbff] p-[30px] md:my-[50px] md:p-[55px]">
          <div className="text-center">
            <div className="mb-[17px] text-[13px] font-bold text-[#0ba9a9]">Estudio del sector inmobiliario</div>
            <h2 className="font-display mx-auto max-w-[760px] text-[26px] font-extrabold leading-[1.12] tracking-[-1.5px] text-[#0d3168] md:text-[35px]">
              Sabemos exactamente qué se pierde en una inmobiliaria.
            </h2>
            <p className="mx-auto mt-[16px] max-w-[720px] text-[13px] font-medium leading-[1.7] text-[#55718f]">
              Estos son los datos publicados que sostienen la operación de Sophie para inmobiliarias: respuesta de leads,
              velocidad de contacto y conversión. Cada uno viene de un estudio identificable, no de una promesa de marketing.
            </p>
          </div>

          <div className="mt-[32px] grid grid-cols-1 gap-[15px] sm:grid-cols-2 lg:grid-cols-3">
            {estudio.map(({ dato, title, text, fuente, icon: Icon }) => (
              <article
                key={title}
                className="flex flex-col rounded-[17px] border border-[#e0edf6] bg-white p-[22px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-[#e7fbfa] text-[#079fa0]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-display text-[22px] font-extrabold leading-none tracking-[-0.5px] text-[#0ba9a9]">
                    {dato}
                  </span>
                </div>
                <h3 className="mt-[15px] mb-[7px] text-[14px] font-bold text-[#0d3168]">{title}</h3>
                <p className="flex-1 text-[12px] font-medium leading-[1.6] text-[#55718f]">{text}</p>
                <p className="mt-[14px] border-t border-[#edf3f8] pt-[10px] text-[11px] font-semibold uppercase tracking-wide text-[#8299b2]">
                  {fuente}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="aporte" className="bg-[#f4faff] px-[5%] py-[55px] md:py-[65px]">
          <div className="mx-auto max-w-[1180px]">
            <div className="text-center">
              <div className="mb-[17px] text-[13px] font-bold text-[#0ba9a9]">Frente a cada dato</div>
              <h2 className="font-display mx-auto max-w-[760px] text-[26px] font-extrabold leading-[1.12] tracking-[-1.5px] text-[#0d3168] md:text-[35px]">
                Lo que Sophie cambia en esa misma operación.
              </h2>
              <p className="mx-auto mt-[16px] max-w-[720px] text-[13px] font-medium leading-[1.7] text-[#55718f]">
                No cambiamos tu forma de vender: cubrimos los huecos que los datos del sector dejan al descubierto —
                horarios, velocidad, seguimiento y calidad del dato—. La negociación y el cierre siguen en tu equipo.
              </p>
            </div>
            <div className="mt-[32px] grid grid-cols-1 gap-[15px] sm:grid-cols-2 lg:grid-cols-3">
              {aporte.map(({ title, text }) => (
                <article
                  key={title}
                  className="rounded-[17px] border border-[#e0edf6] bg-white p-[20px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]"
                >
                  <h3 className="mb-[7px] flex items-center gap-2 text-[14px] font-bold text-[#0d3168] before:content-['✓'] before:text-[#10b7b2]">
                    {title}
                  </h3>
                  <p className="text-[12px] font-medium leading-[1.6] text-[#55718f]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="captura" className="my-[30px] rounded-[30px] bg-[linear-gradient(120deg,#0d3168,#0b6a72)] p-[30px] text-white md:my-[50px] md:p-[55px]">
          <div className="grid grid-cols-1 items-start gap-[45px] lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-[17px] text-[13px] font-bold text-[#50e1d5]">Captura de datos conforme</div>
              <h2 className="font-display mb-[18px] text-[35px] font-extrabold leading-[1.12] tracking-[-1.5px]">
                El dato del interesado, correcto desde el primer contacto.
              </h2>
              <p className="font-medium leading-[1.6] text-white/85">
                La mayoría de los leads que se pierden nacen de datos mal tomados: un teléfono incompleto, un presupuesto
                dicho de memoria, una zona anotada a mano. Sophie captura el dato con catálogos cerrados sobre tu operación
                real —tipo de operación, zona o barrio, rango de presupuesto y urgencia—, confirma cada dato con el interesado
                y deja evidencia trazable de cada corrección.
              </p>
              <p className="mt-[14px] text-[13px] font-medium leading-[1.6] text-white/80">
                Tu inmobiliaria conserva la negociación y el cierre; Upway garantiza que el dato capturado llegue
                estructurado, validado y auditable a tu CRM.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-[14px]">
              {captura.map(({ title, text }) => (
                <article key={title} className="rounded-[17px] border border-white/15 bg-white/10 p-[18px]">
                  <h3 className="mb-[6px] text-[14px] font-bold">{title}</h3>
                  <p className="text-[12px] leading-[1.55] text-white/75">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="panel" className="my-[30px] rounded-[30px] bg-[#f5fbff] p-[30px] md:my-[50px] md:p-[55px]">
          <div className="grid grid-cols-1 items-start gap-[45px] lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="mb-[17px] text-[13px] font-bold text-[#0ba9a9]">Panel de datos auditables</div>
              <h2 className="font-display mb-[18px] text-[35px] font-extrabold leading-[1.12] tracking-[-1.5px] text-[#0d3168]">
                El lead conforme, listo para tu CRM.
              </h2>
              <p className="font-medium leading-[1.6] text-[#55718f]">
                La agenda y la captura son nuestras, así que todo lo que ocurre en una llamada queda registrado en un panel
                que tu inmobiliaria puede auditar: quién llamó, qué buscaba, qué se agendó y qué se corrigió. Desde ahí la
                información sale estructurada hacia tu CRM inmobiliario o tu sistema interno.
              </p>
              <div className="mt-[22px] rounded-[18px] border border-[#dce9f4] bg-white p-[18px]">
                <div className="flex items-center gap-2 text-[12px] font-bold text-[#0d3168]">
                  <Database className="h-4 w-4 text-[#0ba9a9]" /> Sin retranscribir
                </div>
                <p className="mt-[9px] text-[12px] font-medium leading-[1.6] text-[#55718f]">
                  Tu equipo deja de pasar llamadas a mano al CRM. Cada lead llega con los campos completos, validados contra
                  catálogos cerrados y con su historial de cambios.
                </p>
              </div>
              <p className="mt-[16px] text-[12px] font-medium leading-[1.6] text-[#64809c]">
                Upway responde por el dato capturado, validado y auditable que entrega. La calificación comercial final, la
                negociación y el cierre siguen a cargo de tu equipo.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              {panelDatos.map(({ title, text, icon: Icon }) => (
                <article
                  key={title}
                  className="rounded-[17px] border border-[#e0edf6] bg-white p-[18px] transition hover:-translate-y-0.5 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]"
                >
                  <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[#e7fbfa] text-[#079fa0]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-[13px] mb-[6px] text-[13px] font-bold text-[#0d3168]">{title}</h3>
                  <p className="text-[12px] font-medium leading-[1.6] text-[#55718f]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="beneficios" className="mx-auto my-[55px] grid max-w-[1180px] grid-cols-1 items-center gap-[60px] px-5 md:my-[80px] md:grid-cols-[0.7fr_1.3fr] md:px-[5%]">
          <div className="rounded-[28px] border border-[#dce9f4] bg-[#f7fbff] p-[22px] shadow-[0_20px_45px_#173e6815]">
            <div className="mb-[15px] flex items-center justify-between gap-3">
              <div className="text-[13px] font-extrabold text-[#0d3168]">
                UPWAY <small className="tracking-[1px] text-[#10a9aa]">INMOBILIARIAS</small>
              </div>
              <span className="rounded-full border border-[#dce9f4] bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-[#7b93ab]">
                Vista ilustrativa
              </span>
            </div>
            <div className="rounded-[14px] border border-[#e0edf6] bg-white p-[14px]">
              <div className="mb-[10px] text-[10px] font-bold uppercase tracking-wide text-[#7b93ab]">Lead conforme</div>
              <p className="my-[6px] rounded-[8px] border border-[#e8f0f8] bg-[#f7fbff] p-[7px_9px] text-[10px] text-[#31547f]">
                <b className="text-[#0d3168]">Interesado:</b> Camila Reyes
              </p>
              <p className="my-[6px] rounded-[8px] border border-[#e8f0f8] bg-[#f7fbff] p-[7px_9px] text-[10px] text-[#31547f]">
                <b className="text-[#0d3168]">Operación:</b> Arriendo · <b className="text-[#0d3168]">Zona:</b> Cedritos
              </p>
              <p className="my-[6px] rounded-[8px] border border-[#e8f0f8] bg-[#f7fbff] p-[7px_9px] text-[10px] text-[#31547f]">
                <b className="text-[#0d3168]">Presupuesto:</b> $2.400.000 – $2.800.000
              </p>
              <p className="my-[6px] rounded-[8px] border border-[#e8f0f8] bg-[#f7fbff] p-[7px_9px] text-[10px] text-[#31547f]">
                <b className="text-[#0d3168]">Urgencia:</b> Visitar esta semana
              </p>
              <p className="my-[6px] rounded-[8px] border border-[#d7f5f2] bg-[#e7fbfa] p-[7px_9px] text-[10px] font-semibold text-[#0d8a88]">
                ✓ Visita agendada · sábado 10:00am · asesor asignado
              </p>
            </div>
            <p className="mt-[12px] text-[11px] font-medium leading-[1.6] text-[#64809c]">
              Cada campo se capturó con catálogo cerrado, se confirmó en la llamada y quedó auditado con fecha y hora.
            </p>
          </div>
          <div>
            <div className="mb-[17px] text-[13px] font-bold text-[#0ba9a9]">Beneficios reales para tu inmobiliaria</div>
            <h2 className="font-display mb-[18px] text-[35px] font-extrabold leading-[1.12] tracking-[-1.5px] text-[#0d3168]">
              Una solución pensada en la operación inmobiliaria.
            </h2>
            <div className="grid grid-cols-1 gap-[25px] sm:grid-cols-2">
              {beneficios.map(({ title, text }) => (
                <article key={title} className="py-[15px]">
                  <b className="text-[#0d3168]">{title}</b>
                  <p className="my-[7px] text-[12px] font-medium text-[#55718f]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="segmentos" className="bg-[#f4faff] px-[5%] py-[55px] md:py-[65px] text-center">
          <div className="mx-auto max-w-[1180px]">
            <div className="mb-[17px] text-[13px] font-bold text-[#0ba9a9]">Segmentos que atendemos</div>
            <h2 className="font-display mx-auto max-w-[720px] text-[26px] font-extrabold leading-[1.12] tracking-[-1.5px] text-[#0d3168] md:text-[35px]">
              Distintos modelos de negocio, la misma atención sin huecos.
            </h2>
            <p className="mx-auto mt-[16px] max-w-[680px] text-[13px] font-medium leading-[1.7] text-[#55718f]">
              Sophie se configura con la operación real de cada inmobiliaria: sus zonas, sus tipos de inmueble, sus reglas de
              calificación y su forma de agendar. Estos son los modelos con los que trabaja hoy.
            </p>
            <div className="mt-[32px] grid grid-cols-1 gap-[15px] sm:grid-cols-2 lg:grid-cols-3">
              {segmentos.map(({ title, icon: Icon }) => (
                <div
                  key={title}
                  className="flex items-center gap-3 rounded-[17px] border border-[#e0edf6] bg-white p-[18px] text-left transition hover:-translate-y-0.5 hover:border-[#9fc6ee] hover:shadow-[0_12px_30px_#153f6820]"
                >
                  <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-[#e7fbfa] text-[#079fa0]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[13px] font-bold text-[#0d3168]">{title}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-[30px] md:py-[45px]">
          <div className="rounded-[24px] border border-[#e0edf6] bg-[#f7fbff] p-[26px] md:p-[36px]">
            <div className="flex items-start gap-4">
              <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-[#e7fbfa] text-[#079fa0]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <h3 className="mb-[8px] text-[13px] font-bold text-[#0d3168]">Basado en investigación del sector inmobiliario</h3>
                <p className="text-[12px] font-medium leading-[1.7] text-[#55718f]">
                  Los datos que sustentan esta landing provienen de estudios publicados del sector inmobiliario LATAM y EE.UU.:
                  estudio de respuesta de leads (MIT / InsideSales — ventana de 5 minutos y factor 21× de calificación);
                  encuesta Inman 2025 (tiempo promedio de respuesta 15+ horas); análisis de Pinova en 10.000 leads (tasa de conversión
                  0.4–1.2% vs 4–6% con respuesta en minutos y seguimiento estructurado); y datos sectoriales de Unami y SalesRook
                  (78% de compradores eligen al primero que responde; 40–62% de leads llegan fuera de horario; hasta 80% de ventas
                  requieren 5+ seguimientos). Upway publicará resultados con datos reales de sus clientes cuando los tenga.
                </p>
                <div className="mt-[16px] rounded-[14px] border border-[#dce9f4] bg-white p-[16px]">
                  <b className="text-[12px] text-[#0d3168]">Hasta dónde llega nuestra responsabilidad.</b>{' '}
                  <span className="text-[12px] font-medium leading-[1.7] text-[#55718f]">
                    Upway entrega el dato conforme y auditable —qué dijo el interesado, cuándo lo dijo y qué se acordó—.
                    La calificación comercial final, la negociación y el cierre siguen en tu equipo y en tu CRM.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-[30px] md:py-[45px]">
          <div className="rounded-[28px] bg-[linear-gradient(115deg,#103d79,#0b858d)] p-[30px] text-white md:p-[46px]">
            <small className="mb-[10px] block text-[13px] font-semibold text-[#50e1d5]">Sophie en tu inmobiliaria</small>
            <h2 className="font-display max-w-[680px] text-[26px] font-extrabold leading-[1.2] md:text-[32px]">
              ¿Qué podría hacer Sophie dentro de <em className="not-italic text-[#50e1d5]">tu operación?</em>
            </h2>
            <p className="mt-[14px] max-w-[620px] text-[13px] font-medium leading-[1.7] text-white/85">
              Cuéntanos tu operación y te mostramos el flujo concreto: qué responde Sophie, qué agenda, cuándo escala a tu asesor
              y qué queda registrado.
            </p>
            <div className="mt-[24px] flex flex-col gap-3 sm:flex-row">
              <Link
                href="/inmobiliarias/precios"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-[23px] py-[14px] text-[13px] font-bold text-[#0c3775] transition hover:-translate-y-0.5"
              >
                Ver planes y precios
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/#contacto"
                className="inline-flex items-center justify-center rounded-full border border-white/50 px-[23px] py-[14px] text-[13px] font-bold text-white transition hover:bg-white/10"
              >
                Hablar con Upway
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
