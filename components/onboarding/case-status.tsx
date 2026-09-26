'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  FileSearch,
  Loader2,
  PenLine,
  TriangleAlert,
} from 'lucide-react';
import VoicePlayground from '@/components/onboarding/voice-playground';
import {
  submissionCompanyName,
  submissionRows,
  verticalBasePath,
  type OnboardingConfig,
} from '@/lib/onboarding/types';

type Status =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'NEEDS_CHANGES'
  | 'APPROVED'
  | 'ACTIVE'
  | 'BLOCKED'
  | 'ARCHIVED'
  | null;

type Activation = {
  sede: boolean;
  agenteNombre: string | null;
  numeroTexto: string | null;
  vozLabel: string | null;
  pasos: {
    sede: boolean;
    asistente: boolean;
    numero: boolean;
    voz: boolean;
    encendida: boolean;
  };
};

type Payload = {
  answers: Record<string, string>;
  step: number;
  status: Status;
  caseRef?: string | null;
  submittedAt?: string | null;
  activation?: Activation | null;
};

/** Estado → etiqueta y tono. Sin esto la pantalla mentiría: "Enviado" no es "Aprobado". */
const STATUS: Record<
  Exclude<Status, null>,
  { label: string; blurb: string; tone: string; ring: string }
> = {
  DRAFT: {
    label: 'Borrador',
    blurb: 'Todavía no enviaste el caso.',
    tone: 'text-slate-300',
    ring: 'border-slate-700 bg-slate-900/60',
  },
  IN_PROGRESS: {
    label: 'En borrador',
    blurb: 'Tu avance está guardado. Falta enviarlo a revisión.',
    tone: 'text-slate-300',
    ring: 'border-slate-700 bg-slate-900/60',
  },
  PENDING_REVIEW: {
    label: 'En revisión',
    blurb: 'El equipo de Upway está validando tu configuración.',
    tone: 'text-[#50e1d5]',
    ring: 'border-[#50e1d5]/40 bg-[#0ba9a9]/10',
  },
  NEEDS_CHANGES: {
    label: 'Necesita cambios',
    blurb: 'Te pedimos un ajuste antes de continuar.',
    tone: 'text-amber-300',
    ring: 'border-amber-400/50 bg-amber-400/10',
  },
  APPROVED: {
    label: 'Aprobado',
    blurb: 'Configuración aprobada. Falta confirmar el pago para activar.',
    tone: 'text-emerald-300',
    ring: 'border-emerald-400/50 bg-emerald-400/10',
  },
  ACTIVE: {
    label: 'Activo',
    blurb: 'Tu operación está activa en Upway.',
    tone: 'text-emerald-300',
    ring: 'border-emerald-400/50 bg-emerald-400/10',
  },
  BLOCKED: {
    label: 'Bloqueado',
    blurb: 'El caso está detenido. Escríbenos para revisarlo.',
    tone: 'text-rose-300',
    ring: 'border-rose-400/50 bg-rose-400/10',
  },
  ARCHIVED: {
    label: 'Archivado',
    blurb: 'Este caso ya no está activo.',
    tone: 'text-slate-400',
    ring: 'border-slate-700 bg-slate-900/60',
  },
};

const card = 'rounded-2xl border border-[#1E293B] bg-[#0b121c] p-4 sm:p-5';
const label = 'text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500';


/**
 * "Estado de mi caso" — el piso del embudo de Inmobiliaria y Center.
 *
 * Antes de existir esta pantalla, las verticales no clínicas terminaban en un
 * callejón sin salida: el wizard decía "Solicitud enviada" y ofrecía un único
 * enlace de vuelta a la landing. El caso existía en `VerticalOnboardingSession`
 * con su caseRef y su estado, pero eso solo lo veía Upway por correo: el cliente
 * no tenía forma de seguirlo, corregirlo ni volver a él.
 *
 * Lee el MISMO endpoint del wizard (`/api/onboarding`) en vez de duplicar la
 * consulta: así la pantalla y el borrador nunca se contradicen.
 */
export default function CaseStatus({ config }: { config: OnboardingConfig }) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/onboarding?segment=${config.segment}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? 'No se pudo leer tu caso.');
        if (alive) setData(json as Payload);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : 'No se pudo leer tu caso.');
      });
    return () => {
      alive = false;
    };
  }, [config.segment]);

  const base = verticalBasePath(config.segment);
  const onboardingHref = `${base}/onboarding`;
  const homeHref = base;

  if (error) {
    return (
      <Shell config={config} homeHref={homeHref}>
        <div className={`${card} flex items-start gap-3 border-rose-500/40`}>
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-rose-300" />
          <p className="text-[15px] text-rose-200 sm:text-sm">{error}</p>
        </div>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell config={config} homeHref={homeHref}>
        <p className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 size={16} className="animate-spin" /> Cargando tu caso…
        </p>
      </Shell>
    );
  }

  const status = data.status ?? 'DRAFT';
  const info = STATUS[status];
  const sent = status !== 'DRAFT' && status !== 'IN_PROGRESS';
  const rows = submissionRows(config, data.answers ?? {});
  const act = data.activation ?? null;

  return (
    <Shell config={config} homeHref={homeHref}>
      {/* Estado real. Nunca "Aprobado" mientras el equipo no lo aprobó. */}
      <div className={`rounded-2xl border p-5 ${info.ring}`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
          Estado del caso
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className={`font-display text-[30px] font-extrabold sm:text-[28px] ${info.tone}`}>{info.label}</h1>
          {data.caseRef && (
            <span className="font-mono text-[12px] font-semibold text-[#50e1d5]">
              Ref {data.caseRef}
            </span>
          )}
        </div>
        <p className="mt-2 text-[15px] text-slate-300 sm:text-sm">{info.blurb}</p>
        {data.submittedAt && (
          <p className="mt-1 text-[13px] text-slate-500 sm:text-[12px]">
            Enviado el{' '}
            {new Date(data.submittedAt).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
            .
          </p>
        )}
      </div>

      {/* Qué necesitamos de vos: la pantalla que antes no existía. */}
      <div className={card}>
        <p className={label}>Qué necesitamos de vos</p>
        {status === 'NEEDS_CHANGES' ? (
          <p className="mt-2 text-[15px] font-semibold text-amber-200 sm:text-sm">
            Tu caso tiene algo que ajustar. Editá la configuración y volvé a enviarla: el
            equipo la revisa de nuevo.
          </p>
        ) : sent ? (
          <p className="mt-2 text-[15px] text-slate-300 sm:text-sm">
            Nada por ahora. Revisamos tu configuración y te contactamos para validar el plan
            y el arranque.{' '}
            <span className="text-slate-400">No hay activación automática.</span>
          </p>
        ) : (
          <p className="mt-2 text-[15px] text-slate-300 sm:text-sm">
            Todavía no enviaste el caso. Completa la configuración y envíala para que el
            equipo la revise.
          </p>
        )}
      </div>

      {/* Qué pasa después. Explícito, para que nadie adivine el camino. */}
      <div className={card}>
        <p className={label}>Qué pasa después</p>
        <ol className="mt-3 space-y-3">
          {[
            { done: sent, text: 'Envías tu configuración' },
            {
              done: status === 'APPROVED' || status === 'ACTIVE',
              text: 'Validamos el caso y aprobamos el plan',
            },
            { done: status === 'ACTIVE', text: 'Confirmas el pago y activamos tu número' },
            { done: status === 'ACTIVE', text: 'Tu asistente empieza a recibir llamadas' },
          ].map((step, i) => (
            <li key={step.text} className="flex items-start gap-3">
              {step.done ? (
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400" />
              ) : (
                <CircleDashed size={17} className="mt-0.5 shrink-0 text-slate-600" />
              )}
              <span className={`text-[15px] sm:text-sm ${step.done ? 'text-slate-200' : 'text-slate-500'}`}>
                <span className="mr-2 font-mono text-[11px] text-slate-600">{i + 1}</span>
                {step.text}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Puesta en marcha. La activación la hace Upway a mano y antes el cliente
          no tenía forma de saber en qué punto estaba: solo un "Enviado a
          revisión". Cada paso sale de un campo real de la sede, no de un
          progreso inventado. */}
      {act && act.pasos.sede && (
        <div className={card}>
          <p className={label}>Puesta en marcha</p>
          <ul className="mt-3 space-y-2.5">
            {[
              { ok: act.pasos.sede, text: 'Sede operativa creada' },
              { ok: act.pasos.asistente, text: 'Agente configurado' },
              { ok: act.pasos.voz, text: 'Voz asignada' },
              { ok: act.pasos.numero, text: 'Número dedicado conectado' },
              { ok: act.pasos.encendida, text: 'Recibiendo llamadas' },
            ].map((p) => (
              <li key={p.text} className="flex items-center gap-2.5">
                {p.ok ? (
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                ) : (
                  <CircleDashed size={16} className="shrink-0 text-slate-600" />
                )}
                <span
                  className={`text-[15px] sm:text-sm ${p.ok ? 'text-slate-200' : 'text-slate-500'}`}
                >
                  {p.text}
                </span>
              </li>
            ))}
          </ul>
          {act.numeroTexto && (
            <p className="mt-3 border-t border-[#1E293B] pt-3 font-mono text-[13px] text-slate-300">
              {act.numeroTexto}
            </p>
          )}
          {!act.pasos.encendida && act.pasos.numero && (
            <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
              Tu número ya está asignado. Upway lo activa en la llamada de validación; te
              avisamos por correo en cuanto esté recibiendo llamadas.
            </p>
          )}
        </div>
      )}

      {/* Anticipaba únicamente la clonación y dejaba pensar que sin clonar no hay
          voz. Las voces de fábrica ya se pueden escuchar: este bloque es el que
          de verdad muestra el producto antes de aprobar. */}
      <div className={card}>
        <p className={label}>Probá la voz de tu asistente</p>
        <div className="mt-3">
          <VoicePlayground agentName={submissionCompanyName(data.answers ?? {})} />
        </div>
      </div>

      {/* Lo que el cliente le envió a Upway, tal cual. Sirve para detectar un
          error de dedo sin tener que esperar el correo. */}
      {rows.length > 0 && (
        <div className={card}>
          <p className={label}>Lo que nos enviaste</p>
          <dl className="mt-3 divide-y divide-[#1E293B]">
            {rows.map(([field, value]) => (
              <div
                key={field}
                className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <dt className="text-[13px] text-slate-500 sm:text-[12px]">{field}</dt>
                <dd className="text-[14px] font-semibold text-slate-200 sm:text-[13px] sm:text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href={onboardingHref}
          className="inline-flex items-center gap-2 rounded-full bg-[#0ba9a9] px-5 py-3 text-[13px] font-bold text-white transition hover:-translate-y-0.5"
        >
          {status === 'NEEDS_CHANGES' ? <PenLine size={15} /> : <FileSearch size={15} />}
          {status === 'NEEDS_CHANGES' ? 'Editar y reenviar' : 'Ver el formulario'}
        </Link>
        <Link
          href={homeHref}
          className="inline-flex items-center gap-2 rounded-full border border-[#1E293B] px-5 py-3 text-[13px] font-bold text-slate-300 transition hover:-translate-y-0.5"
        >
          Volver a {config.label} <ArrowRight size={15} />
        </Link>
      </div>
    </Shell>
  );
}

function Shell({
  config,
  homeHref,
  children,
}: {
  config: OnboardingConfig;
  homeHref: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#070B12] pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-[max(env(safe-area-inset-top),1.5rem)] text-slate-100">
      <div className="mx-auto w-full space-y-4 px-3 sm:max-w-6xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Upway · {config.label}
          </p>
          <Link
            href={homeHref}
            className="text-[12px] text-slate-500 transition hover:text-slate-300"
          >
            Salir
          </Link>
        </div>
        {children}
      </div>
    </main>
  );
}
