import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Check,
  Clock,
  FileSearch,
  FileText,
  Headphones,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Upway Center — Call center 24/7 con IA | Servicio técnico y al cliente',
  description:
    'Upway Center atiende las llamadas de tu servicio técnico y servicio al cliente 24/7 con un agente de IA, con grabación, log de eventos y evidencia exportable. Precios desde $699.000/mes.',
};

const cop = (n: number) => '$' + n.toLocaleString('es-CO');

const PLANES = [
  {
    id: 'linea',
    nombre: 'Línea',
    minutos: 1000,
    precio: 699000,
    setup: 490000,
    numeros: 1,
    ideal: 'Una línea de soporte o recepción que no puede quedarse sin contestar.',
    incluye: [
      '1 número telefónico dedicado',
      'Agente 24/7 con tu guion y tu catálogo',
      'Grabación y log de eventos de cada llamada',
      'Escalado a humano con contexto',
    ],
  },
  {
    id: 'atencion',
    nombre: 'Atención',
    minutos: 3000,
    precio: 1949000,
    setup: 990000,
    numeros: 2,
    ideal: 'Empresas con dos líneas (soporte y citas/estado de caso) y volumen diario.',
    incluye: [
      '2 números telefónicos dedicados',
      'Todo lo del plan Línea',
      'Agenda y confirmación de datos',
      'Reporte mensual de intenciones y escalamientos',
    ],
  },
  {
    id: 'soporte',
    nombre: 'Soporte',
    minutos: 8000,
    precio: 4990000,
    setup: 1890000,
    numeros: 4,
    ideal: 'Operaciones de servicio técnico con varias marcas o sedes.',
    incluye: [
      '4 números telefónicos dedicados',
      'Todo lo del plan Atención',
      'Export por API, webhook o CSV para tu CRM/ticketing',
      'Catálogo de intenciones por línea de servicio',
    ],
  },
  {
    id: 'operacion',
    nombre: 'Operación',
    minutos: 25000,
    precio: 14990000,
    setup: 3400000,
    numeros: 8,
    ideal: 'Centros de contacto que hoy ya operan con turnos y quieren dejar de pagar horas.',
    incluye: [
      '8 números telefónicos dedicados',
      'Todo lo del plan Soporte',
      'Revisión de calidad quincenal sobre grabaciones',
      'SLA de respuesta acordado por escrito',
    ],
  },
];

const NO_HACE = [
  'Ventas en frío ni cierre comercial: nuestro agente atiende y clasifica, no persuade.',
  'Cobranza ni presión de pago: queda fuera de alcance sin revisión legal.',
  'Decisiones clínicas ni diagnósticos: eso es Upway Health, un producto aparte.',
  'Milagros de catálogo: resuelve con la información que tú nos entregas; si no se la das, no la inventa.',
];

const PASOS = [
  {
    n: '01',
    titulo: 'Definimos guion y catálogo',
    texto:
      'En la semana 1 cerramos qué se resuelve solo (estados, FAQs, agenda, políticas) y qué escala a humano. Catálogo cerrado, sin ambigüedades.',
  },
  {
    n: '02',
    titulo: 'Conectamos tu número',
    texto:
      'Portabilidad o desvío de tus líneas actuales. Puedes empezar con una sola línea sin tocar tu operación.',
  },
  {
    n: '03',
    titulo: 'Operamos y escalamos',
    texto:
      'El agente contesta 24/7, clasifica por intención, resuelve el primer contacto y transfiere lo importante con el contexto completo.',
  },
  {
    n: '04',
    titulo: 'Auditas cada llamada',
    texto:
      'Grabación, log de eventos y evidencia exportable por API, webhook o CSV. Métrica principal: % resuelto sin escalamiento.',
  },
];

export default function CenterPage() {
  return (
    <main className="min-h-screen bg-white text-[#0d3168] selection:bg-[#11b7b1] selection:text-white">
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
              Center
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/center/caso"
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
              href="/center/precios"
              className="inline-flex items-center gap-2 rounded-full bg-[#0c3775] px-[18px] py-[10px] text-[12px] font-bold text-white shadow-md transition hover:bg-[#092a5c] md:px-[23px] md:text-[13px]"
            >
              Ver planes
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-5 md:px-[5%]">
        {/* Hero */}
        <section className="relative bg-[radial-gradient(circle_at_80%_20%,_#e8fbfa,_transparent_45%)] pb-[35px] pt-[45px] md:pb-[45px] md:pt-[70px]">
          <div className="max-w-[860px]">
            <div className="mb-[17px] inline-flex items-center gap-2 rounded-full border border-[#bfe9e6] bg-[#effbfa] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0d8a88]">
              Upway Center · Call center 24/7 con IA
            </div>
            <h1 className="font-display text-[35px] font-extrabold leading-[1.06] tracking-[-2px] md:text-[52px] md:tracking-[-2.6px]">
              Servicio técnico y al cliente sin tirar una llamada.{' '}
              <em className="not-italic text-[#11b4b0]">Contestamos, clasificamos y escalamos.</em>
            </h1>
            <p className="mt-[22px] max-w-[720px] text-[16px] leading-[1.65] text-[#49698f]">
              Upway Center es nuestro call center: un agente de IA atiende tus llamadas entrantes 24/7 con tu guion y tu
              catálogo, resuelve el primer contacto —estados, FAQs, agenda, políticas— y transfiere lo importante a tu equipo
              con el contexto completo. Cada llamada queda grabada, con log de eventos y evidencia exportable a tu CRM o
              ticketing. Atendemos y confirmamos los datos conforme a, auditables.
            </p>
            <div className="my-[26px] flex flex-col gap-3 sm:flex-row">
              <Link
                href="/center/precios"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c3775] px-[23px] py-[14px] text-[13px] font-bold text-white transition hover:bg-[#092a5c] hover:shadow-[0_22px_48px_rgba(12,55,117,0.42)]"
              >
                Ver planes y precios
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login?segment=center"
                className="inline-flex items-center justify-center rounded-full border border-[#b8cce3] bg-white px-[23px] py-[14px] text-[13px] font-bold text-[#0c3775] transition hover:bg-slate-50 hover:shadow-[0_22px_48px_rgba(12,55,117,0.22)]"
              >
                Activar mi operación
              </Link>
            </div>
          </div>
        </section>
        {/* Qué hace */}
        <section className="py-[30px] md:py-[45px]">
          <div className="mb-[17px] text-[13px] font-bold text-[#0ba9a9]">Qué hace Upway Center</div>
          <h2 className="font-display max-w-[760px] text-[26px] font-extrabold leading-[1.12] tracking-[-1.5px] md:text-[32px]">
            Un call center completo, sin contratar turnos ni ampliar la nómina
          </h2>
          <div className="mt-[24px] grid gap-[15px] sm:grid-cols-2">
            <div className="rounded-[17px] border border-[#e0edf6] bg-white p-[20px] shadow-[0_8px_25px_#153f6810]">
              <Phone className="mb-3 h-5 w-5 text-[#0ba9a9]" />
              <h3 className="text-[13px] font-bold text-[#0d3168]">Contesta todas las llamadas</h3>
              <p className="mt-[8px] text-[12px] leading-[1.65] text-[#55718f]">
                Entrantes 24/7 —de día, de noche y en festivos— sin colas ni buzón de voz, con tu guion y tu catálogo.
              </p>
            </div>
            <div className="rounded-[17px] border border-[#e0edf6] bg-white p-[20px] shadow-[0_8px_25px_#153f6810]">
              <FileText className="mb-3 h-5 w-5 text-[#0ba9a9]" />
              <h3 className="text-[13px] font-bold text-[#0d3168]">Resuelve con información tuya</h3>
              <p className="mt-[8px] text-[12px] leading-[1.65] text-[#55718f]">
                Estados de caso, FAQs, agenda y políticas se responden con lo que tú apruebas. Si no está en el catálogo, no
                se inventa.
              </p>
            </div>
            <div className="rounded-[17px] border border-[#e0edf6] bg-white p-[20px] shadow-[0_8px_25px_#153f6810]">
              <Headphones className="mb-3 h-5 w-5 text-[#0ba9a9]" />
              <h3 className="text-[13px] font-bold text-[#0d3168]">Escala a tu equipo con contexto</h3>
              <p className="mt-[8px] text-[12px] leading-[1.65] text-[#55718f]">
                Cuando la llamada lo requiere, transfiere al agente correcto con el resumen de lo que pidió el cliente y lo
                que ya se resolvió.
              </p>
            </div>
            <div className="rounded-[17px] border border-[#e0edf6] bg-white p-[20px] shadow-[0_8px_25px_#153f6810]">
              <ShieldCheck className="mb-3 h-5 w-5 text-[#0ba9a9]" />
              <h3 className="text-[13px] font-bold text-[#0d3168]">Todo queda auditado</h3>
              <p className="mt-[8px] text-[12px] leading-[1.65] text-[#55718f]">
                Grabación, log de eventos y evidencia exportable por API, webhook o CSV: datos conforme a y trazables.
              </p>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="py-[30px] md:py-[45px]">
          <div className="mb-[17px] inline-flex items-center gap-2 text-[13px] font-bold text-[#0ba9a9]">
            <Clock className="h-4 w-4" /> Cómo funciona
          </div>
          <h2 className="font-display max-w-[760px] text-[26px] font-extrabold leading-[1.12] tracking-[-1.5px] md:text-[32px]">
            De la primera llamada al reporte, en cuatro pasos
          </h2>
          <div className="mt-[24px] grid gap-[15px] md:grid-cols-2 lg:grid-cols-4">
            {PASOS.map((p) => (
              <div
                key={p.n}
                className="rounded-[17px] border border-[#e0edf6] bg-white p-[20px] shadow-[0_8px_25px_#153f6810]"
              >
                <span className="font-display text-[26px] font-extrabold tracking-[-1px] text-[#11b4b0]">{p.n}</span>
                <h3 className="mt-2 text-[13px] font-bold text-[#0d3168]">{p.titulo}</h3>
                <p className="mt-[8px] text-[12px] leading-[1.65] text-[#55718f]">{p.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Límites honestos */}
        <section className="py-[30px] md:py-[45px]">
          <div className="mb-[17px] text-[13px] font-bold text-[#0ba9a9]">Límites honestos</div>
          <h2 className="font-display max-w-[760px] text-[26px] font-extrabold leading-[1.12] tracking-[-1.5px] md:text-[32px]">
            Lo que Upway Center no hace
          </h2>
          <p className="mt-[12px] max-w-[720px] text-[14px] leading-[1.65] text-[#49698f]">
            Preferimos decírtelo antes de que actives: es la mejor base para que la operación funcione desde la semana 1.
          </p>
          <div className="mt-[24px] grid gap-[12px] md:grid-cols-2">
            {NO_HACE.map((item) => (
              <div key={item} className="flex gap-3 rounded-[17px] border border-[#e0edf6] bg-[#f8fbfe] p-[18px]">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-[#e2574c]" />
                <p className="text-[12px] leading-[1.65] text-[#55718f]">{item}</p>
              </div>
            ))}
          </div>
        </section>
        {/* Precios */}
        <section className="py-[30px] md:py-[45px]">
          <div className="mb-[17px] text-[13px] font-bold text-[#0ba9a9]">Precios</div>
          <h2 className="font-display max-w-[760px] text-[26px] font-extrabold leading-[1.12] tracking-[-1.5px] md:text-[32px]">
            Planes claros, en COP, sin letra pequeña
          </h2>
          <div className="mt-[24px] grid gap-[15px] md:grid-cols-2 lg:grid-cols-4">
            {PLANES.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col rounded-[17px] border border-[#e0edf6] bg-white p-[20px] shadow-[0_8px_25px_#153f6810] transition hover:-translate-y-1"
              >
                <h3 className="font-display text-[18px] font-extrabold tracking-[-0.5px]">{plan.nombre}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-[24px] font-extrabold tracking-[-0.8px]">{cop(plan.precio)}</span>
                  <span className="text-[11px] font-semibold text-[#7b93ab]">/mes</span>
                </div>
                <p className="mt-1 text-[11px] text-[#7b93ab]">
                  {plan.minutos.toLocaleString('es-CO')} min · {plan.numeros} número{plan.numeros > 1 ? 's' : ''}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-[#0d8a88]">Implementación: {cop(plan.setup)}</p>
                <ul className="mt-3 flex-1 space-y-1.5 border-t border-[#e8f0f8] pt-3 text-[11px] leading-[1.55] text-[#55718f]">
                  {plan.incluye.slice(0, 3).map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#0ba9a9]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-[24px]">
            <Link
              href="/center/precios"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c3775] px-[23px] py-[14px] text-[13px] font-bold text-white transition hover:bg-[#092a5c]"
            >
              Ver todos los detalles de precios
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="py-[30px] md:py-[45px]">
          <div className="rounded-[28px] bg-[linear-gradient(115deg,#103d79,#0b858d)] p-[30px] text-white md:p-[46px]">
            <small className="mb-[10px] block text-[13px] font-semibold text-[#50e1d5]">Upway Center</small>
            <h2 className="font-display max-w-[680px] text-[26px] font-extrabold leading-[1.2] md:text-[32px]">
              ¿Listo para que ninguna llamada de tu servicio{' '}
              <em className="not-italic text-[#50e1d5]">se quede sin contestar?</em>
            </h2>
            <p className="mt-[14px] max-w-[620px] text-[13px] leading-[1.7] text-white/85">
              Activa el plan que corresponda a tu volumen o escríbenos y armamos la operación contigo: qué resuelve el agente,
              qué escala a tu equipo y qué queda grabado.
            </p>
            <div className="mt-[24px] flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login?segment=center"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-[23px] py-[14px] text-[13px] font-bold text-[#0c3775] transition hover:-translate-y-0.5"
              >
                Activar mi operación
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/center/precios"
                className="inline-flex items-center justify-center rounded-full border border-white/50 px-[23px] py-[14px] text-[13px] font-bold text-white transition hover:bg-white/10"
              >
                Ver planes y precios
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}