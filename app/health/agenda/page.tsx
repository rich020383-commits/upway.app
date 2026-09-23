'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type AppointmentView = {
  id: string;
  serviceId: string;
  serviceName: string;
  resourceId: string;
  resourceName: string;
  patientName: string;
  patientPhone: string | null;
  patientEmail: string | null;
  slotStart: string;
  slotEnd: string;
  status: string;
  source: string;
  timezone: string;
  notes: string | null;
  requiresDocuments: boolean;
  prepInstructions: string | null;
};

type ServiceView = {
  id: string;
  name: string;
  durationMinutes: number;
  color: string;
  requiresDocuments: boolean;
  isActive: boolean;
};

type ResourceView = {
  id: string;
  name: string;
  kind: string;
  timezone: string;
  isActive: boolean;
  serviceIds: string[];
  locationLabel: string | null;
};

type DayView = {
  dateKey: string;
  dateLabel: string;
  status: 'open' | 'closed';
  slots: Array<{
    start: string;
    end: string;
    startLabel: string;
    endLabel: string;
    resourceId: string;
    resourceName: string;
  }>;
};

type WaitlistRow = {
  id: string;
  patientName: string;
  patientPhone: string | null;
  patientEmail: string | null;
  serviceName: string;
  priority: number;
  status: string;
  offeredSlot: string | null;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CHECKED_IN: 'En sala',
  COMPLETED: 'Atendida',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
  REBOOKED: 'Reprogramada',
};

const statusStyles: Record<string, string> = {
  PENDING: 'border-[#dfeaff] bg-[#edf4ff] text-[#1b5ed6]',
  CONFIRMED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CHECKED_IN: 'border-sky-200 bg-sky-50 text-sky-700',
  COMPLETED: 'border-slate-200 bg-slate-100 text-slate-700',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
  NO_SHOW: 'border-amber-200 bg-amber-50 text-amber-700',
  REBOOKED: 'border-violet-200 bg-violet-50 text-violet-700',
};

const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'REBOOKED'];

/** Tonos de los botones de operación (clases literales para que Tailwind las incluya). */
const actionToneStyles: Record<string, string> = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  sky: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
  slate: 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200',
  amber: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
  violet: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100',
  rose: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
};

function bogotaDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, day + days));
  const monthKey = String(cursor.getUTCMonth() + 1).padStart(2, '0');
  const dayKey = String(cursor.getUTCDate()).padStart(2, '0');
  return `${cursor.getUTCFullYear()}-${monthKey}-${dayKey}`;
}

function timeLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export default function HealthAgendaPage() {
  const [dateKey, setDateKey] = useState(() => bogotaDateKey());
  const [resourceId, setResourceId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [tab, setTab] = useState<'agenda' | 'cupos' | 'espera'>('agenda');

  const [appointments, setAppointments] = useState<AppointmentView[]>([]);
  const [services, setServices] = useState<ServiceView[]>([]);
  const [resources, setResources] = useState<ResourceView[]>([]);
  const [days, setDays] = useState<DayView[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([]);
  const [timezone, setTimezone] = useState('America/Bogota');

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleFor, setRescheduleFor] = useState<AppointmentView | null>(null);
  const [bookSlot, setBookSlot] = useState<DayView['slots'][number] | null>(null);
  const [rescheduleDays, setRescheduleDays] = useState<DayView[]>([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const [form, setForm] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    notes: '',
  });

  // Este loader no hace setState antes del primer `await` para poder invocarse
  // desde un effect sin provocar renders en cascada (regla react-hooks).
  const loadAgenda = useCallback(async () => {
    try {
      const query = new URLSearchParams({ from: dateKey, to: dateKey });
      if (resourceId) query.set('resourceId', resourceId);

      const response = await fetch(`/api/health/agenda?${query.toString()}`, {
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'No se pudo cargar la agenda');

      setAppointments(payload.appointments ?? []);
      setServices(payload.config?.services ?? []);
      setResources(payload.config?.resources ?? []);
      if (payload.config?.timezone) setTimezone(payload.config.timezone);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando la agenda');
    } finally {
      setLoading(false);
    }
  }, [dateKey, resourceId]);

  const loadAvailability = useCallback(async () => {
    if (!serviceId) return;
    try {
      const query = new URLSearchParams({ view: 'availability', serviceId, dateKey, days: '7' });
      if (resourceId) query.set('resourceId', resourceId);

      const response = await fetch(`/api/health/agenda?${query.toString()}`, {
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'No se pudieron calcular los cupos');

      setDays(payload.days ?? []);
      if (payload.timezone) setTimezone(payload.timezone);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error calculando cupos');
    }
  }, [serviceId, dateKey, resourceId]);

  const loadWaitlist = useCallback(async () => {
    try {
      const query = new URLSearchParams({ view: 'waitlist' });
      if (serviceId) query.set('serviceId', serviceId);

      const response = await fetch(`/api/health/agenda?${query.toString()}`, {
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'No se pudo cargar la lista de espera');

      setWaitlist(payload.entries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando lista de espera');
    }
  }, [serviceId]);

  const loadRescheduleAvailability = useCallback(async (target: AppointmentView) => {
    setRescheduleLoading(true);
    try {
      const query = new URLSearchParams({
        view: 'availability',
        serviceId: target.serviceId,
        dateKey: bogotaDateKey(),
        days: '14',
      });

      const response = await fetch(`/api/health/agenda?${query.toString()}`, {
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'No se pudieron calcular los cupos');

      setRescheduleDays(payload.days ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error calculando cupos para reprogramar');
    } finally {
      setRescheduleLoading(false);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      await loadAgenda();
    };
    void bootstrap();
  }, [loadAgenda]);

  useEffect(() => {
    const bootstrap = async () => {
      if (tab === 'cupos' && serviceId) await loadAvailability();
      if (tab === 'espera') await loadWaitlist();
    };
    void bootstrap();
  }, [tab, serviceId, loadAvailability, loadWaitlist]);

  const act = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      setBusy(action);
      setNotice(null);
      setError(null);
      try {
        const response = await fetch('/api/health/agenda', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...payload }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'No se pudo completar la operación');

        setNotice('Operación aplicada correctamente.');
        await loadAgenda();
        if (tab === 'cupos') await loadAvailability();
        if (tab === 'espera') await loadWaitlist();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error en la operación');
        return false;
      } finally {
        setBusy(null);
      }
    },
    [loadAgenda, loadAvailability, loadWaitlist, tab]
  );

  const activeServices = useMemo(() => services.filter((service) => service.isActive), [services]);
  const servicesById = useMemo(() => {
    const map = new Map<string, ServiceView>();
    for (const service of services) map.set(service.id, service);
    return map;
  }, [services]);
  const metrics = useMemo(
    () => ({
      total: appointments.length,
      pending: appointments.filter((item) => item.status === 'PENDING').length,
      confirmed: appointments.filter((item) => item.status === 'CONFIRMED').length,
      done: appointments.filter((item) => item.status === 'COMPLETED').length,
    }),
    [appointments]
  );

  /** Alias `const`: conserva el estrechamiento de tipos dentro de los closures de los modales. */
  const bookingSlot = bookSlot;
  const rescheduleTarget = rescheduleFor;

  const applyReschedule = async (slot: DayView['slots'][number]) => {
    if (!rescheduleTarget) return;
    const done = await act('reschedule', {
      appointmentId: rescheduleTarget.id,
      slotStart: slot.start,
      resourceId: slot.resourceId,
    });
    if (done) setRescheduleFor(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
            Agenda Premium Upway
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">
            Operación diaria
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Cupos, citas y lista de espera propias: sin terceros. El agente de voz reserva con estas
            mismas reglas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              setDateKey((current) => shiftDateKey(current, -1));
            }}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-50"
          >
            ← Anterior
          </button>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              setDateKey(bogotaDateKey());
            }}
            className="rounded-full border border-[#dfeaff] bg-[#edf4ff] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#1b5ed6] transition hover:bg-[#dfeaff]"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              setDateKey((current) => shiftDateKey(current, 1));
            }}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-50"
          >
            Siguiente →
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Citas del día', value: metrics.total },
          { label: 'Por confirmar', value: metrics.pending },
          { label: 'Confirmadas', value: metrics.confirmed },
          { label: 'Atendidas', value: metrics.done },
        ].map((card) => (
          <div key={card.label} className="upway-surface rounded-[24px] p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
              {card.label}
            </div>
            <div className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="upway-surface flex flex-col gap-4 rounded-[24px] p-5 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
            Fecha
          </label>
          <input
            type="date"
            value={dateKey}
            onChange={(event) => {
              setLoading(true);
              setError(null);
              setDateKey(event.target.value);
            }}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
            Recurso
          </label>
          <select
            value={resourceId}
            onChange={(event) => {
              setLoading(true);
              setError(null);
              setResourceId(event.target.value);
            }}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            <option value="">Todos</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
            Servicio
          </label>
          <select
            value={serviceId}
            onChange={(event) => {
              setServiceId(event.target.value);
              setDays([]);
            }}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            <option value="">Selecciona un servicio</option>
            {activeServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} · {service.durationMinutes} min
              </option>
            ))}
          </select>
        </div>
      </div>

      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['agenda', 'Citas del día'],
            ['cupos', 'Cupos disponibles'],
            ['espera', 'Lista de espera'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={
              tab === value
                ? 'rounded-full bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white'
                : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-600 transition hover:bg-slate-50'
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'agenda' ? (
        <div className="space-y-3">
          {loading ? (
            <div className="upway-surface rounded-[24px] p-6 text-sm font-semibold text-slate-500">
              Cargando citas…
            </div>
          ) : null}

          {!loading && appointments.length === 0 ? (
            <div className="upway-surface rounded-[24px] p-6 text-sm text-slate-500">
              No hay citas para el {dateKey}. Cambia la fecha o créalas desde la pestaña{' '}
              <span className="font-semibold text-slate-700">Cupos disponibles</span>.
            </div>
          ) : null}

          {appointments.map((appointment) => {
            const statusKey = String(appointment.status).toUpperCase();
            const rowTimezone = appointment.timezone || timezone;
            const status = appointment.status;
            const isTerminal = TERMINAL_STATUSES.includes(status);
            const duration = servicesById.get(appointment.serviceId)?.durationMinutes;

            const operations: Array<{ label: string; action: string; tone: string; allowed: boolean }> = [
              {
                label: 'Confirmar',
                action: 'confirm',
                tone: 'emerald',
                allowed: status === 'PENDING' || status === 'REBOOKED',
              },
              { label: 'En sala', action: 'check_in', tone: 'sky', allowed: status === 'CONFIRMED' },
              {
                label: 'Atendida',
                action: 'complete',
                tone: 'slate',
                allowed: status === 'CHECKED_IN' || status === 'CONFIRMED',
              },
              {
                label: 'No asistió',
                action: 'no_show',
                tone: 'amber',
                allowed: status === 'CONFIRMED' || status === 'CHECKED_IN',
              },
            ];

            return (
              <article key={appointment.id} className="upway-surface rounded-[24px] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-[#dfeaff] bg-[#edf4ff]">
                      <span className="text-lg font-black tracking-[-0.04em] text-[#1b5ed6]">
                        {timeLabel(appointment.slotStart, rowTimezone)}
                      </span>
                      <span className="text-[10px] font-bold text-[#1b5ed6]/70">
                        {timeLabel(appointment.slotEnd, rowTimezone)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-black tracking-[-0.03em] text-slate-900">
                          {appointment.patientName}
                        </h2>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                            statusStyles[statusKey] ?? 'border-slate-200 bg-slate-100 text-slate-600'
                          }`}
                        >
                          {statusLabels[statusKey] ?? appointment.status}
                        </span>
                        {appointment.requiresDocuments ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                            Documentos
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-sm text-slate-600">
                        {appointment.serviceName}
                        {duration ? ` · ${duration} min` : ''} · {appointment.resourceName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {appointment.patientPhone ?? 'sin teléfono'} ·{' '}
                        {appointment.patientEmail ?? 'sin correo'} · origen {appointment.source}
                      </p>

                      {appointment.notes ? (
                        <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          {appointment.notes}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:max-w-[340px] lg:justify-end">
                    {operations.map((operation) => (
                      <button
                        key={operation.action}
                        type="button"
                        disabled={Boolean(busy) || !operation.allowed}
                        onClick={() => void act(operation.action, { appointmentId: appointment.id })}
                        className={`rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-40 ${actionToneStyles[operation.tone]}`}
                      >
                        {operation.label}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={Boolean(busy) || isTerminal}
                      onClick={() => {
                        setRescheduleFor(appointment);
                        setRescheduleDays([]);
                        void loadRescheduleAvailability(appointment);
                      }}
                      className={`rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition disabled:opacity-40 ${actionToneStyles.violet}`}
                    >
                      Reprogramar
                    </button>

                    <button
                      type="button"
                      disabled={Boolean(busy) || isTerminal}
                      onClick={() => {
                        if (window.confirm(`¿Cancelar la cita de ${appointment.patientName}?`)) {
                          void act('cancel', { appointmentId: appointment.id });
                        }
                      }}
                      className={`rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition disabled:opacity-40 ${actionToneStyles.rose}`}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
      {tab === 'cupos' ? (
        <div className="space-y-4">
          {!serviceId ? (
            <div className="upway-surface rounded-[24px] p-6 text-sm text-slate-500">
              Selecciona un <span className="font-semibold text-slate-700">Servicio</span> arriba para
              calcular los cupos reales según horarios, duración, buffers y citas ya reservadas.
            </div>
          ) : (
            <>
              <div className="upway-surface flex flex-wrap items-center justify-between gap-3 rounded-[24px] p-4">
                <div>
                  <p className="text-sm font-black tracking-[-0.03em] text-slate-900">
                    {servicesById.get(serviceId)?.name ?? 'Servicio'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {servicesById.get(serviceId)?.durationMinutes ?? '—'} min por cita · zona horaria{' '}
                    {timezone} · 7 días desde {dateKey}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadAvailability()}
                  className="rounded-full border border-[#dfeaff] bg-[#edf4ff] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#1b5ed6] transition hover:bg-[#dfeaff]"
                >
                  Recalcular
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {days.map((day) => (
                  <section key={day.dateKey} className="upway-surface rounded-[24px] p-4">
                    <header className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black tracking-[-0.03em] text-slate-900">
                          {day.dateLabel}
                        </p>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
                          {day.dateKey}
                        </p>
                      </div>
                      <span
                        className={
                          day.status === 'open'
                            ? 'rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700'
                            : 'rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500'
                        }
                      >
                        {day.status === 'open'
                          ? `${day.slots.length} ${day.slots.length === 1 ? 'cupo' : 'cupos'}`
                          : 'Cerrado'}
                      </span>
                    </header>

                    {day.slots.length === 0 ? (
                      <p className="mt-3 text-xs text-slate-500">
                        {day.status === 'open'
                          ? 'Sin cupos libres: ocupados, con buffer o dentro del tiempo mínimo de anticipación.'
                          : 'No hay ventana de atención configurada para este día.'}
                      </p>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {day.slots.map((slot) => (
                          <button
                            key={`${slot.start}-${slot.resourceId}`}
                            type="button"
                            disabled={Boolean(busy)}
                            onClick={() => setBookSlot(slot)}
                            title={`${slot.resourceName} · ${slot.startLabel}-${slot.endLabel}`}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-[#1b5ed6]/30 hover:bg-[#edf4ff] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {slot.startLabel}
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>

              {days.length === 0 ? (
                <div className="upway-surface rounded-[24px] p-6 text-sm text-slate-500">
                  Sin datos de disponibilidad todavía. Revisa que el recurso tenga horario semanal
                  configurado y que el servicio esté asignado a un recurso activo.
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {tab === 'espera' ? (
        <div className="space-y-3">
          {waitlist.length === 0 ? (
            <div className="upway-surface rounded-[24px] p-6 text-sm text-slate-500">
              La lista de espera está vacía
              {serviceId ? ' para el servicio seleccionado' : ''}. El agente de voz agrega pacientes aquí
              cuando no hay cupo disponible.
            </div>
          ) : null}

          {waitlist.map((entry) => {
            const statusKey = String(entry.status).toUpperCase();
            const waitlistStatusStyles: Record<string, string> = {
              WAITING: 'border-[#dfeaff] bg-[#edf4ff] text-[#1b5ed6]',
              OFFERED: 'border-violet-200 bg-violet-50 text-violet-700',
              BOOKED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
              EXPIRED: 'border-slate-200 bg-slate-100 text-slate-600',
              CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
            };

            return (
              <div
                key={entry.id}
                className="upway-surface flex flex-col gap-3 rounded-[24px] p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black tracking-[-0.03em] text-slate-900">
                      {entry.patientName}
                    </p>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                        waitlistStatusStyles[statusKey] ?? 'border-slate-200 bg-slate-100 text-slate-600'
                      }`}
                    >
                      {statusKey}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                      Prioridad {entry.priority}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {entry.serviceName} · {entry.patientPhone ?? 'sin teléfono'} ·{' '}
                    {entry.patientEmail ?? 'sin correo'}
                  </p>
                </div>

                <div className="text-xs text-slate-500 md:text-right">
                  {entry.offeredSlot ? (
                    <p className="font-semibold text-violet-700">
                      Cupo ofrecido: {timeLabel(entry.offeredSlot, timezone)}
                    </p>
                  ) : (
                    <p>Registrado {timeLabel(entry.createdAt, timezone)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {bookingSlot ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="max-h-[88dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
                  Nueva cita
                </p>
                <h2 className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-900">
                  {servicesById.get(serviceId)?.name ?? 'Servicio'}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {bookingSlot.startLabel}–{bookingSlot.endLabel} · {bookingSlot.resourceName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookSlot(null)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-600 transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <input
                value={form.patientName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, patientName: event.target.value }))
                }
                placeholder="Nombre del paciente *"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1b5ed6]/40"
              />
              <input
                value={form.patientPhone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, patientPhone: event.target.value }))
                }
                placeholder="Teléfono"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1b5ed6]/40"
              />
              <input
                value={form.patientEmail}
                onChange={(event) =>
                  setForm((current) => ({ ...current, patientEmail: event.target.value }))
                }
                placeholder="Correo"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1b5ed6]/40"
              />
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                rows={3}
                placeholder="Notas para el equipo"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1b5ed6]/40"
              />
            </div>

            <button
              type="button"
              disabled={Boolean(busy) || !form.patientName.trim()}
              onClick={async () => {
                const done = await act('book', {
                  serviceId,
                  slotStart: bookingSlot.start,
                  resourceId: bookingSlot.resourceId,
                  patientName: form.patientName.trim(),
                  patientPhone: form.patientPhone.trim() || null,
                  patientEmail: form.patientEmail.trim() || null,
                  notes: form.notes.trim() || null,
                });
                if (done) {
                  setBookSlot(null);
                  setForm({ patientName: '', patientPhone: '', patientEmail: '', notes: '' });
                }
              }}
              className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy === 'book' ? 'Reservando…' : 'Confirmar reserva'}
            </button>
          </div>
        </div>
      ) : null}

      {rescheduleTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="flex max-h-[88dvh] w-full max-w-2xl flex-col rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
                  Reprogramar cita
                </p>
                <h2 className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-900">
                  {rescheduleTarget.patientName}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {rescheduleTarget.serviceName} · actual:{' '}
                  {timeLabel(rescheduleTarget.slotStart, rescheduleTarget.timezone || timezone)} con{' '}
                  {rescheduleTarget.resourceName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRescheduleFor(null);
                  setRescheduleDays([]);
                }}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-600 transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
              {rescheduleLoading ? (
                <p className="text-sm font-semibold text-slate-500">Calculando cupos disponibles…</p>
              ) : null}

              {!rescheduleLoading && rescheduleDays.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay cupos disponibles en los próximos 14 días para este servicio.
                </p>
              ) : null}

              {rescheduleDays.map((day) => (
                <section key={day.dateKey}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black tracking-[-0.03em] text-slate-900">
                      {day.dateLabel}
                    </p>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
                      {day.status === 'open' ? `${day.slots.length} cupos` : 'cerrado'}
                    </span>
                  </div>

                  {day.slots.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-500">Sin cupos libres.</p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {day.slots.map((slot) => (
                        <button
                          key={`${slot.start}-${slot.resourceId}`}
                          type="button"
                          disabled={Boolean(busy)}
                          onClick={() => void applyReschedule(slot)}
                          title={`${slot.resourceName} · ${slot.startLabel}-${slot.endLabel}`}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {slot.startLabel}
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Al elegir un cupo, la cita actual pasa a <span className="font-semibold">Reprogramada</span> y
              se crea la nueva cita en el horario seleccionado. Si hay lista de espera, el sistema la
              notifica.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}