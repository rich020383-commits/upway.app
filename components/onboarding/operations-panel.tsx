'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck2,
  Clock,
  Loader2,
  PhoneCall,
  TrendingUp,
  TriangleAlert,
  UserPlus,
} from 'lucide-react';
import { verticalBasePath, type OnboardingConfig } from '@/lib/onboarding/types';
import VoiceAuthorizations from '@/components/onboarding/voice-authorizations';

type Activation = {
  pasos: { sede: boolean; asistente: boolean; numero: boolean; voz: boolean; encendida: boolean };
};

type Dash = {
  summary?: {
    totalLeads: number;
    newLeads: number;
    appointments: number;
    todayAppointments: number;
  };
  leads?: Array<{
    id: string;
    nombre: string;
    estado: string;
    motivo?: string | null;
    phone?: string | null;
    createdAt: string;
  }>;
  nextAppointments?: Array<{
    id: string;
    clienteNombre: string;
    clienteTelefono: string;
    fechaHora: string;
    estado: string;
  }>;
  pipeline?: Record<string, number>;
  consumption?: { voiceCalls: number; voiceMinutes: number; voiceCost: number };
};

/**
 * Vocabulario por vertical. El panel es el mismo para las dos, pero no puede
 * decir lo mismo: para una inmobiliaria un lead es un interesado y una cita es
 * una visita; para un center es una solicitud y una atención. Decirle
 * "Interesados" a un centro de servicio técnico es lo mismo que ponerle la
 * etiqueta equivocada a un producto.
 */
const COPY: Record<
  string,
  { interesados: string; nuevos: string; citas: string; minutos: string; recientes: string; motivo: string }
> = {
  inmobiliaria: {
    interesados: 'Interesados',
    nuevos: 'Nuevos interesados',
    citas: 'Visitas agendadas',
    minutos: 'Minutos de voz',
    recientes: 'Interesados recientes',
    motivo: 'Qué necesitaba',
  },
  center: {
    interesados: 'Solicitudes',
    nuevos: 'Solicitudes nuevas',
    citas: 'Atenciones agendadas',
    minutos: 'Minutos de voz',
    recientes: 'Solicitudes recientes',
    motivo: 'Qué pedía',
  },
};

const card = 'rounded-2xl border border-[#1E293B] bg-[#0b121c] p-4 sm:p-5';
const label = 'text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500';

const ESTADO_LEAD: Record<string, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  APPOINTMENT_BOOKED: 'Visita agendada',
  FOLLOW_UP: 'Seguimiento',
  CLOSED_WON: 'Cerrado ganado',
  CLOSED_LOST: 'Cerrado perdido',
};

/**
 * Panel de operaciones de Center / Inmobiliaria.
 *
 * No es un panel nuevo: consume `/api/business/dashboard`, que ya existe, ya
 * está protegido con `getOwnedTienda` (tenancy estricto, el IDOR que auditamos
 * y cerramos) y ya devuelve leads, citas, pipeline y consumo. Lo que faltaba era
 * la puerta de entrada para las verticales no clínicas.
 *
 * El gate va AQUÍ, no en la API: esa API la consume también el panel de Health
 * (`app/health/page.tsx`), así que restringarla por caso aprobaría el caso de
 * Health. Y no hace falta restringarla: un cliente en revisión solo ve sus
 * PROPIOS datos, que además están vacíos porque su agente aún no recibe
 * llamadas. El candado protege la promesa, no la información.
 */
export default function OperationsPanel({ config }: { config: OnboardingConfig }) {
  const [status, setStatus] = useState<string | null>(null);
  const [activation, setActivation] = useState<Activation | null>(null);
  const [dash, setDash] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const base = verticalBasePath(config.segment);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/onboarding?segment=${config.segment}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? 'No se pudo leer tu caso.');
        if (!alive) return;
        const estado: string = data.status ?? 'DRAFT';
        setStatus(estado);
        setActivation(data.activation ?? null);

        if (estado !== 'APPROVED' && estado !== 'ACTIVE') {
          setLoading(false);
          return;
        }
        const dres = await fetch('/api/business/dashboard', { cache: 'no-store' });
        const ddata = await dres.json().catch(() => ({}));
        if (!dres.ok) throw new Error(ddata.error ?? 'No se pudo cargar el panel.');
        if (alive) setDash(ddata);
      } catch (e: unknown) {
        if (alive) setError(e instanceof Error ? e.message : 'No se pudo cargar el panel.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [config.segment]);

  if (loading) {
    return (
      <Wrap base={base} label={config.label}>
        <p className="flex items-center gap-2 text-[15px] text-slate-400 sm:text-sm">
          <Loader2 size={16} className="animate-spin" /> Cargando tu panel…
        </p>
      </Wrap>
    );
  }

  if (error) {
    return (
      <Wrap base={base} label={config.label}>
        <div className={`${card} flex items-start gap-3 border-rose-500/40`}>
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-rose-300" />
          <p className="text-[15px] text-rose-200 sm:text-sm">{error}</p>
        </div>
      </Wrap>
    );
  }

  // El panel se abre al aprobar el caso, igual que la clonación de voz: antes de
  // eso no hay operación que mirar y una pantalla vacía sería ruido.
  if (status !== 'APPROVED' && status !== 'ACTIVE') {
    return (
      <Wrap base={base} label={config.label}>
        <div className={card}>
          <h1 className="font-display text-[26px] font-extrabold text-slate-200 sm:text-[24px]">
            Tu panel se abre al aprobar tu plan
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-300 sm:text-sm">
            {status === 'DRAFT' || status === 'IN_PROGRESS'
              ? 'Todavía no enviaste tu caso. Cuando lo envíes, el equipo de Upway lo revisa y te lo aprovamos.'
              : 'Tu caso está en revisión del equipo de Upway. Apenas lo aprobemos, aquí vas a ver los interesados que calificamos, las visitas agendadas y el consumo de tu plan.'}
          </p>
          <Link
            href={`${base}/caso`}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0ba9a9] px-5 py-3 text-[13px] font-bold text-white transition hover:-translate-y-0.5"
          >
            Ver el estado de mi caso
          </Link>
        </div>
      </Wrap>
    );
  }


  const s = dash?.summary;
  const leads = dash?.leads ?? [];
  const citas = dash?.nextAppointments ?? [];
  const consumo = dash?.consumption;
  const vacio = (s?.totalLeads ?? 0) === 0 && citas.length === 0;
  const copy = COPY[config.segment] ?? COPY.inmobiliaria;

  return (
    <Wrap base={base} label={config.label}>
      <div>
        <p className={label}>Panel de operaciones</p>
        <h1 className="mt-1 font-display text-[26px] font-extrabold text-slate-100 sm:text-[24px]">
          Tu operación
        </h1>
      </div>

      {/* Vacío real: el panel no finge una actividad que todavía no existe. */}
      {vacio && (
        <div className={`${card} border-[#50e1d5]/30 bg-[#0ba9a9]/5`}>
          <p className="text-[15px] font-semibold text-[#50e1d5] sm:text-sm">
            Todavía no hay operación registrada
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-300 sm:text-sm">
            {activation?.pasos.encendida
              ? 'Tu agente ya recibe llamadas. En cuanto entre la primera, el interesado y la visita agendada aparecen aquí.'
              : 'Tu agente todavía no está recibiendo llamadas. En cuanto Upway termine la puesta en marcha, los interesados que califique y las visitas que agende van a aparecer aquí.'}
          </p>
          <Link
            href={`${base}/caso`}
            className="mt-4 inline-flex items-center gap-2 text-[13px] font-bold text-[#50e1d5] underline underline-offset-4"
          >
            Ver el estado de mi caso
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: UserPlus, n: s?.totalLeads ?? 0, t: copy.interesados },
          { icon: TrendingUp, n: s?.newLeads ?? 0, t: copy.nuevos },
          { icon: CalendarCheck2, n: s?.appointments ?? 0, t: copy.citas },
          { icon: Clock, n: consumo?.voiceMinutes ?? 0, t: copy.minutos },
        ].map((k) => (
          <div key={k.t} className={card}>
            <k.icon size={16} className="text-slate-500" />
            <p className="mt-2 font-display text-[24px] font-extrabold text-slate-100">{k.n}</p>
            <p className="mt-0.5 text-[12px] text-slate-500">{k.t}</p>
          </div>
        ))}
      </div>

      {citas.length > 0 && (
        <div className={card}>
          <p className={label}>Próximas citas</p>
          <ul className="mt-3 divide-y divide-[#1E293B]">
            {citas.map((c) => (
              <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                <div>
                  <p className="text-[15px] font-semibold text-slate-200 sm:text-sm">
                    {c.clienteNombre}
                  </p>
                  <p className="font-mono text-[12px] text-slate-500">{c.clienteTelefono}</p>
                </div>
                <p className="text-[13px] text-slate-400">
                  {new Date(c.fechaHora).toLocaleString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {leads.length > 0 && (
        <div className={card}>
          <p className={label}>{copy.recientes}</p>
          <ul className="mt-3 divide-y divide-[#1E293B]">
            {leads.slice(0, 15).map((l) => (
              <li key={l.id} className="py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[15px] font-semibold text-slate-200 sm:text-sm">{l.nombre}</p>
                  <span className="rounded-full bg-[#0ba9a9]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#50e1d5]">
                    {ESTADO_LEAD[l.estado] ?? l.estado}
                  </span>
                </div>
                {l.motivo && (
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{l.motivo}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Revocación: la ley 1581 da a la persona el derecho a que su voz deje de
          usarse, y tiene que poder hacerlo sin hablar con soporte. */}
      <div className={card}>
        <p className={label}>Voces clonadas y autorizaciones</p>
        <div className="mt-3">
          <VoiceAuthorizations />
        </div>
      </div>

      {consumo && consumo.voiceCalls > 0 && (
        <p className="flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
          <PhoneCall size={13} />
          {consumo.voiceCalls} llamada{consumo.voiceCalls === 1 ? '' : 's'} atendida
          {consumo.voiceCalls === 1 ? '' : 's'} este mes · {consumo.voiceMinutes} min ·{' '}
          {consumo.voiceCost} USD
        </p>
      )}
    </Wrap>
  );
}

function Wrap({
  base,
  label: nombre,
  children,
}: {
  base: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#070B12] pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-[max(env(safe-area-inset-top),1.5rem)] text-slate-100">
      <div className="mx-auto w-full space-y-4 px-3 sm:max-w-6xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Upway · {nombre}
          </p>
          <Link
            href={`${base}/caso`}
            className="text-[12px] text-slate-500 transition hover:text-slate-300"
          >
            Mi caso
          </Link>
        </div>
        {children}
      </div>
    </main>
  );
}
