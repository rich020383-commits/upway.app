import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarCheck2,
  ClipboardList,
  Home,
  MessageSquareText,
  PhoneCall,
  Repeat,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Sophie para inmobiliarias — atiende leads y agenda visitas 24/7 | Upway',
  description:
    'Sophie atiende las llamadas de tus interesados 24/7 con la mayor autonomía posible: califica el lead (presupuesto, intención, urgencia) según los criterios que tú definas, agenda la visita sobre tu operación real y deja el lead listo para tu equipo, con escalamiento a un asesor humano.',
  alternates: { canonical: '/inmobiliarias' },
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
    text: 'Agendar por WhatsApp y notas sueltas termina en cruces de horario, olvidos y reagendaciones. La visita que no se confirma con el asesor correcto no termina en cierre.',
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
  { de: 'Consulta por WhatsApp', a: 'Lead calificado con presupuesto y zona' },
  { de: 'Interesado que no apareció', a: 'Visita reprogramada sin fricción' },
  { de: 'Pregunta sobre un inmueble', a: 'Seguimiento activo con el asesor correcto' },
];

export default function InmobiliariasPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(88,117,255,0.16),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#edf4ff_100%)] text-slate-900">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 shadow-sm">
            <Home className="h-5 w-5 text-[#1b5ed6]" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Upway</div>
            <div className="text-lg font-black tracking-[-0.05em]">Inmobiliarias</div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 md:inline-flex"
          >
            Volver a Upway
          </Link>
          <Link
            href="/precios"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5"
          >
            Ver planes y precios
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
        <section className="py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1b5ed6]">
              Sophie · Empleado Digital de voz
            </div>
            <h1 className="font-display text-4xl font-black leading-[1.08] tracking-[-0.04em] text-slate-900 md:text-[3.2rem]">
              Ningún lead de inmobiliaria se queda sin responder.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Sophie atiende las llamadas de tus interesados 24/7, toma la información conforme a los
              criterios de calificación que tú definas y agenda la visita sobre tu operación real — mientras habla, aparta el horario.
              Cada interacción queda registrada con trazabilidad auditable para sincronizar con tu sistema. Cuando la negociación lo pide, escala a tu asesor con todo el contexto.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/precios"
                className="inline-flex items-center gap-2 rounded-full bg-[#1b5ed6] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(27,94,214,0.25)] transition hover:-translate-y-0.5"
              >
                Ver planes y precios
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login?segment=inmobiliaria"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400"
              >
                Activar mi operación
              </Link>
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Implementación white-glove: Upway conecta la voz dedicada y la deja operando. Tú no tocas consolas ni tokens.
            </p>
          </div>
        </section>

        <section className="py-10">
          <h2 className="font-display text-2xl font-black tracking-[-0.03em] text-slate-900 md:text-3xl">
            Lo que se pierde cuando nadie contesta
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {problemas.map(({ title, text, icon: Icon }) => (
              <div key={title} className="rounded-[20px] border border-slate-200 bg-white/80 p-5">
                <Icon className="h-5 w-5 text-[#1b5ed6]" />
                <h3 className="mt-3 text-sm font-black text-slate-900">{title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <h2 className="font-display text-2xl font-black tracking-[-0.03em] text-slate-900 md:text-3xl">
            Sophie no solo responde. Trabaja.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {capacidad.map(({ title, text, icon: Icon }) => (
              <div key={title} className="rounded-[22px] border border-[#dfe9ff] bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9f3ff] text-[#1b5ed6]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-[0.08em] text-[#163557]">{title}</h3>
                </div>
                <p className="mt-3 text-[13px] leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <h2 className="font-display text-2xl font-black tracking-[-0.03em] text-slate-900 md:text-3xl">
            Una llamada puede convertirse en:
          </h2>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {casos.map(({ de, a }) => (
              <div
                key={de}
                className="flex items-center justify-between gap-4 rounded-[18px] border border-[#dfe9ff] bg-white px-5 py-4"
              >
                <span className="text-[13px] font-semibold text-slate-500">{de}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#1b5ed6]" />
                <span className="text-right text-[13px] font-black text-[#163557]">{a}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-[#1b5ed6] shrink-0" />
              <div>
                <h3 className="text-sm font-black text-slate-900 mb-2">Basado en investigación del sector inmobiliario</h3>
                <p className="text-[13px] leading-6 text-slate-600">
                  Los datos que sustentan esta landing provienen de estudios publicados del sector inmobiliario LATAM y EE.UU.:
                  estudio de respuesta de leads (MIT / InsideSales — ventana de 5 minutos y factor 21× de calificación);
                  encuesta Inman 2025 (tiempo promedio de respuesta 15+ horas); análisis de Pinova en 10.000 leads (tasa de conversión
                  0.4–1.2% vs 4–6% con respuesta en minutos y seguimiento estructurado); y datos sectoriales de Unami y SalesRook
                  (78% de compradores eligen al primero que responde; 40–62% de leads llegan fuera de horario; hasta 80% de ventas
                  requieren 5+ seguimientos). Upway publicará resultados con datos reales de sus clientes cuando los tenga.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="rounded-[28px] bg-[linear-gradient(135deg,_#0f172a_0%,_#132642_100%)] p-8 text-white md:p-12">
            <h2 className="font-display text-2xl font-black tracking-[-0.03em] md:text-3xl">
              ¿Qué podría hacer Sophie dentro de tu inmobiliaria?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Cuéntanos tu operación y te mostramos el flujo concreto: qué responde Sophie, qué agenda,
              cuándo escala y qué queda registrado.
            </p>
            <Link
              href="/precios"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5"
            >
              Ver planes y precios
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </main>
  );
}
