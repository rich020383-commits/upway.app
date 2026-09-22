import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Clock, Phone, ShieldCheck } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Precios — Upway Center',
  description:
    'Planes de Upway Center desde $699.000/mes. Minutos de voz con agente IA 24/7, implementación única y minuto adicional a $690. Precios vigentes desde el 1 de octubre de 2026.',
};

const cop = (n: number) => '$' + n.toLocaleString('es-CO');
const conIVA = (n: number) => cop(Math.round(n * 1.19));

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
      'Grabación y log de eventos',
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
    ideal: 'Dos líneas (soporte y estado de caso) con volumen diario.',
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
    ideal: 'Servicio técnico con varias marcas o sedes.',
    incluye: [
      '4 números telefónicos dedicados',
      'Todo lo del plan Atención',
      'Export por API, webhook o CSV',
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
    ideal: 'Centros de contacto que hoy pagan turnos y horas.',
    incluye: [
      '8 números telefónicos dedicados',
      'Todo lo del plan Soporte',
      'Revisión de calidad quincenal sobre grabaciones',
      'SLA de respuesta acordado por escrito',
    ],
  },
];

const faqs = [
  {
    q: '¿Qué pasa si me quedo sin minutos?',
    a: 'El minuto adicional se cobra a $690 COP: el agente sigue atendiendo sin cortar la llamada y el consumo queda en el reporte con trazabilidad.',
  },
  {
    q: '¿Upway Center reemplaza a mi equipo de soporte?',
    a: 'No. El agente resuelve el primer contacto con tu catálogo y escala a tu equipo lo que requiere criterio humano, con el resumen de la llamada. Tú defines qué se resuelve solo y qué se transfiere.',
  },
  {
    q: '¿Puedo escuchar las llamadas y auditar lo que se dijo?',
    a: 'Sí. Cada llamada queda con su grabación, su log de eventos y su evidencia exportable por API, webhook o CSV. Métrica principal: porcentaje de llamadas resueltas sin escalamiento.',
  },
  {
    q: '¿Necesito cambiar mis números actuales?',
    a: 'No. Conectamos por portabilidad o desvío de tus líneas actuales, y puedes empezar con una sola línea sin tocar tu operación. La implementación es white-glove: nosotros dejamos todo operando.',
  },
  {
    q: '¿Hay permanencia?',
    a: 'No. Planes mensuales con implementación única solo al activar. Puedes subir o bajar de plan según tu volumen de llamadas.',
  },
  {
    q: '¿Qué NO hace Upway Center?',
    a: 'No hace ventas en frío ni cierre comercial, no hace cobranza ni presión de pago, y no toma decisiones clínicas (eso es Upway Health, un producto aparte). Resuelve con la información que tú nos entregas; si no está en el catálogo, no la inventa.',
  },
];

const overageCOP = 690;

export default function CenterPreciosPage() {
  return (
    <main className="min-h-screen bg-white text-[#0d3168] selection:bg-[#11b7b1] selection:text-white">
      <header className="sticky top-0 z-50 border-b border-[#edf3f8] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-[74px] w-full max-w-[1180px] items-center justify-between px-5 md:px-[5%]">
          <Link href="/center" className="flex items-center gap-3" aria-label="Volver a la landing de Upway Center">
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
              Center · Precios
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/center"
              className="hidden rounded-full border border-[#dce9f4] bg-white px-4 py-2 text-[12px] font-bold text-[#0d3168] transition hover:border-[#9fc6ee] sm:inline-flex"
            >
              Ver la solución
            </Link>
            <Link
              href="/login?segment=center"
              className="inline-flex items-center gap-2 rounded-full bg-[#0c3775] px-[18px] py-[10px] text-[12px] font-bold text-white shadow-md transition hover:bg-[#092a5c] md:px-[23px] md:text-[13px]"
            >
              Activar mi operación
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-5 md:px-[5%]">
        {/* Encabezado */}
        <section className="bg-[radial-gradient(circle_at_80%_20%,_#e8fbfa,_transparent_45%)] pb-[20px] pt-[45px] md:pt-[70px]">
          <div className="mb-[17px] inline-flex items-center gap-2 rounded-full border border-[#bfe9e6] bg-[#effbfa] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0d8a88]">
            Precios en COP · Vigentes desde el 1 de octubre de 2026
          </div>
          <h1 className="font-display max-w-[820px] text-[35px] font-extrabold leading-[1.06] tracking-[-2px] md:text-[52px] md:tracking-[-2.6px]">
            Planes de Upway Center.{' '}
            <em className="not-italic text-[#11b4b0]">Minutos, números y precios sin letra pequeña.</em>
          </h1>
          <p className="mt-[18px] max-w-[720px] text-[15px] leading-[1.65] text-[#49698f]">
            Cada plan incluye minutos de voz con el agente de IA, números telefónicos dedicados, grabación, log de eventos y
            evidencia exportable. Implementación única solo al activar; sin permanencia y sin licencias de terceros cobradas
            aparte.
          </p>
        </section>
        {/* Planes */}
        <section className="py-[30px] md:py-[45px]">
          <div className="grid gap-[15px] md:grid-cols-2">
            {PLANES.map((plan) => {
              const featured = plan.id === 'atencion';
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-[24px] border p-[26px] transition hover:-translate-y-1 ${
                    featured
                      ? 'border-transparent bg-[linear-gradient(135deg,#0c3775,#0b858d)] text-white shadow-[0_20px_50px_rgba(12,55,117,0.35)]'
                      : 'border-[#e0edf6] bg-white text-[#0d3168] shadow-[0_8px_25px_#153f6810]'
                  }`}
                >
                  {featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0ba9a9] px-4 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-lg">
                      Más popular
                    </div>
                  )}
                  <h3 className="font-display text-[20px] font-extrabold tracking-[-0.5px]">{plan.nombre}</h3>
                  <p className={`mt-1 text-[12px] leading-[1.6] ${featured ? 'text-white/80' : 'text-[#55718f]'}`}>
                    {plan.ideal}
                  </p>
                  <div className="mt-[18px] flex items-baseline gap-2">
                    <span className="font-display text-[30px] font-extrabold tracking-[-1px]">{cop(plan.precio)}</span>
                    <span className={`text-[12px] font-semibold ${featured ? 'text-white/70' : 'text-[#7b93ab]'}`}>
                      /mes + IVA
                    </span>
                  </div>
                  <p className={`mt-1 text-[11px] ${featured ? 'text-white/60' : 'text-[#7b93ab]'}`}>
                    Total con IVA 19%: {conIVA(plan.precio)}
                  </p>
                  <p className={`mt-1 text-[11px] font-semibold ${featured ? 'text-[#50e1d5]' : 'text-[#0d8a88]'}`}>
                    Implementación única: {cop(plan.setup)}
                  </p>
                  <ul
                    className={`mt-[18px] flex-1 space-y-2 border-t pt-[16px] text-[12px] leading-[1.55] ${
                      featured ? 'border-white/20' : 'border-[#e8f0f8]'
                    }`}
                  >
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0ba9a9]" />
                      {plan.minutos.toLocaleString('es-CO')} minutos de voz incluidos
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0ba9a9]" />
                      {plan.numeros} número{plan.numeros > 1 ? 's' : ''} telefónico{plan.numeros > 1 ? 's' : ''} dedicado
                      {plan.numeros > 1 ? 's' : ''}
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0ba9a9]" />
                      Minuto adicional: {cop(overageCOP)}
                    </li>
                    {plan.incluye.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0ba9a9]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login?segment=center"
                    className={`mt-[20px] inline-flex items-center justify-center gap-2 rounded-full px-[20px] py-[13px] text-[13px] font-bold transition ${
                      featured
                        ? 'bg-white text-[#0c3775] hover:-translate-y-0.5'
                        : 'bg-[#0c3775] text-white hover:bg-[#092a5c]'
                    }`}
                  >
                    Activar este plan <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
          <p className="mx-auto mt-[18px] max-w-[720px] text-center text-[11px] leading-[1.6] text-[#7b93ab]">
            Los planes estiman tu volumen de llamadas entrantes. Si tu operación no encaja en ninguno —varias sedes, horarios
            especiales o integraciones a medida— lo cotizamos aparte, sin costos ocultos.
          </p>
        </section>
        {/* Transparencia */}
        <section className="py-[30px] md:py-[45px]">
          <div className="mb-[17px] text-[13px] font-bold text-[#0ba9a9]">Transparencia</div>
          <h2 className="font-display text-[26px] font-extrabold leading-[1.12] tracking-[-1.5px] md:text-[32px]">
            Qué incluye y qué no, antes de que preguntes
          </h2>
          <div className="mt-[24px] grid gap-[15px] sm:grid-cols-3">
            <div className="rounded-[17px] border border-[#e0edf6] bg-white p-[20px] shadow-[0_8px_25px_#153f6810]">
              <Phone className="mb-3 h-5 w-5 text-[#0ba9a9]" />
              <h3 className="text-[13px] font-bold text-[#0d3168]">Incluido en todos los planes</h3>
              <p className="mt-[8px] text-[12px] leading-[1.65] text-[#55718f]">
                Agente 24/7, grabación y log de eventos de cada llamada, escalado a humano con contexto y reporte de consumo.
              </p>
            </div>
            <div className="rounded-[17px] border border-[#e0edf6] bg-white p-[20px] shadow-[0_8px_25px_#153f6810]">
              <Clock className="mb-3 h-5 w-5 text-[#0ba9a9]" />
              <h3 className="text-[13px] font-bold text-[#0d3168]">Minuto adicional</h3>
              <p className="mt-[8px] text-[12px] leading-[1.65] text-[#55718f]">
                {cop(overageCOP)} COP por minuto cuando se agotan los incluidos, sin cortar la operación y con el consumo
                reflejado en tu reporte.
              </p>
            </div>
            <div className="rounded-[17px] border border-[#e0edf6] bg-white p-[20px] shadow-[0_8px_25px_#153f6810]">
              <ShieldCheck className="mb-3 h-5 w-5 text-[#0ba9a9]" />
              <h3 className="text-[13px] font-bold text-[#0d3168]">Fuera de alcance, sin rodeos</h3>
              <p className="mt-[8px] text-[12px] leading-[1.65] text-[#55718f]">
                Ventas en frío, cobranza y decisiones clínicas no están incluidos: atendemos y confirmamos datos conforme a,
                auditables. Si no está en tu catálogo, no se inventa.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-[30px] md:py-[45px]">
          <div className="mb-[17px] text-[13px] font-bold text-[#0ba9a9]">Preguntas frecuentes</div>
          <h2 className="font-display text-[26px] font-extrabold leading-[1.12] tracking-[-1.5px] md:text-[32px]">
            Lo que preguntan antes de activar
          </h2>
          <div className="mt-[24px] grid gap-[12px] md:grid-cols-2">
            {faqs.map(({ q, a }) => (
              <div key={q} className="rounded-[17px] border border-[#e0edf6] bg-white p-[20px] shadow-[0_8px_25px_#153f6810]">
                <h3 className="text-[13px] font-bold text-[#0d3168]">{q}</h3>
                <p className="mt-[8px] text-[12px] leading-[1.65] text-[#55718f]">{a}</p>
              </div>
            ))}
          </div>
        </section>
        {/* CTA */}
        <section className="py-[30px] md:py-[45px]">
          <div className="rounded-[28px] bg-[linear-gradient(115deg,#103d79,#0b858d)] p-[30px] text-white md:p-[46px]">
            <small className="mb-[10px] block text-[13px] font-semibold text-[#50e1d5]">Upway Center</small>
            <h2 className="font-display max-w-[680px] text-[26px] font-extrabold leading-[1.2] md:text-[32px]">
              Tu operación de llamadas, lista para{' '}
              <em className="not-italic text-[#50e1d5]">activarse hoy</em>
            </h2>
            <p className="mt-[14px] max-w-[620px] text-[13px] leading-[1.7] text-white/85">
              Elige tu plan o escríbenos si tu volumen no encaja en ninguno: te decimos exactamente qué incluye, en cuánto
              tiempo queda operando y qué consumos esperar por minuto.
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
                href="/center"
                className="inline-flex items-center justify-center rounded-full border border-white/50 px-[23px] py-[14px] text-[13px] font-bold text-white transition hover:bg-white/10"
              >
                Ver qué hace Upway Center
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}