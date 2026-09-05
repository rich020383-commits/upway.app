'use client';

import { useEffect, useState } from 'react';
import { resolveIndustryConfig, type BusinessSegment } from '@/lib/industry-config';

type LeadStatusKey = 'NEW' | 'CONTACTED' | 'APPOINTMENT_BOOKED' | 'FOLLOW_UP' | 'CLOSED_WON' | 'CLOSED_LOST';

type LeadSummary = {
  id: string;
  nombre: string;
  phone?: string | null;
  estado: string;
  origen: string;
  prioridad: string;
  createdAt: string;
  tiendaId?: string;
  assignedTo?: { id: string; name?: string | null; email?: string | null } | null;
  conversations: { id: string }[];
  appointments: { id: string; fechaHora: string; estado: string }[];
};

type UserOption = { id: string; name?: string | null; email?: string | null };

type InboxMessage = {
  id: string;
  senderRole: string;
  content: string;
  createdAt: string;
};

type InboxConversation = {
  id: string;
  clientPhone: string;
  clientName?: string | null;
  status: string;
  updatedAt: string;
  lead?: { id: string; nombre: string; estado: string } | null;
  messages: InboxMessage[];
};

type AgentPerformance = {
  id: string;
  name: string;
  totalLeads: number;
  active: number;
  closedWon: number;
  withAppointment: number;
};

type LeadActivityEntry = {
  id: string;
  type: string;
  summary?: string | null;
  createdAt: string;
  actor?: { id: string; name?: string | null; email?: string | null } | null;
};

type TodayActions = {
  dueReminders: Array<{ id: string; leadId: string; nombre: string; phone?: string | null; scheduledFor: string }>;
  unassignedNewLeads: Array<{ id: string; nombre: string; phone?: string | null; createdAt: string }>;
  coldLeads: Array<{ id: string; nombre: string; phone?: string | null; estado: string; lastContactAt?: string | null }>;
  unconfirmedAppointments: Array<{ id: string; clienteNombre: string; fechaHora: string; estado: string }>;
};

type Trend = {
  leads: { current: number; previous: number; pct: number };
  citas: { current: number; previous: number; pct: number };
};

type Consumption = {
  month: string;
  messages: number;
  voiceCalls: number;
  voiceMinutes: number;
  vapiCost: number;
  billedCost: number;
};

type DashboardPayload = {
  segment?: string;
  summary: {
    totalLeads: number;
    newLeads: number;
    appointments: number;
    todayAppointments: number;
    pendingReminders: number;
    dueReminders: number;
  };
  pipeline: Record<string, number>;
  nextAppointments: Array<{ id: string; clienteNombre: string; fechaHora: string; estado: string }>;
  leads: LeadSummary[];
  inbox: InboxConversation[];
  agentPerformance: AgentPerformance[];
  todayActions?: TodayActions;
  trend?: Trend;
  consumption?: Consumption;
};

const statusLabels: Record<string, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  APPOINTMENT_BOOKED: 'Cita',
  FOLLOW_UP: 'Seguimiento',
  CLOSED_WON: 'Cerrado',
  CLOSED_LOST: 'Perdido',
  ARCHIVED: 'Archivado',
};

const activityTypeLabels: Record<string, string> = {
  LEAD_CREATED: 'Lead creado',
  LEAD_QUALIFIED: 'Lead calificado',
  LEAD_ASSIGNED: 'Lead asignado',
  MESSAGE_RECEIVED: 'Mensaje recibido',
  MESSAGE_SENT: 'Mensaje enviado',
  APPOINTMENT_CREATED: 'Cita creada',
  APPOINTMENT_CONFIRMED: 'Cita confirmada',
  REMINDER_SENT: 'Recordatorio enviado',
  FOLLOW_UP_SCHEDULED: 'Seguimiento programado',
  NOTE_ADDED: 'Nota añadida',
  STATUS_CHANGED: 'Cambio de estado',
};

function normalizeStage(status?: string | null): LeadStatusKey {
  const value = (status ?? 'NEW').toString().trim().toUpperCase().replace(/\s+/g, '_');

  switch (value) {
    case 'CONTACTADO':
    case 'CONTACTED':
      return 'CONTACTED';
    case 'CITA':
    case 'APPOINTMENT':
    case 'APPOINTMENT_BOOKED':
      return 'APPOINTMENT_BOOKED';
    case 'SEGUIMIENTO':
    case 'FOLLOW_UP':
      return 'FOLLOW_UP';
    case 'CERRADO':
    case 'CLOSED_WON':
      return 'CLOSED_WON';
    case 'PERDIDO':
    case 'CLOSED_LOST':
      return 'CLOSED_LOST';
    case 'QUALIFIED':
      return 'FOLLOW_UP';
    case 'NEW':
    default:
      return 'NEW';
  }
}

export default function OperacionesPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [selectedUserByLead, setSelectedUserByLead] = useState<Record<string, string>>({});
  const [automation, setAutomation] = useState({ pendingReminders: 0, dueReminders: 0 });
  const [timelineLeadId, setTimelineLeadId] = useState<string | null>(null);
  const [timelineActivities, setTimelineActivities] = useState<LeadActivityEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [bookingLeadId, setBookingLeadId] = useState<string | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/business/dashboard');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Error');
      setData(payload);
    } catch (error) {
      console.error('Error loading operations dashboard:', error);
    }
  };

  const loadAutomationStatus = async () => {
    try {
      const response = await fetch('/api/business/automation');
      const payload = await response.json();
      if (response.ok) {
        setAutomation({
          pendingReminders: payload.pendingReminders ?? 0,
          dueReminders: payload.dueReminders ?? 0,
        });
      }
    } catch (error) {
      console.error('Error loading automation status:', error);
    }
  };

  const handleRunAutomation = async () => {
    setRunningAutomation(true);
    try {
      const response = await fetch('/api/business/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 25 }),
      });
      const payload = await response.json();
      if (response.ok) {
        await loadDashboard();
        await loadAutomationStatus();
        console.info('Automation result:', payload);
      }
    } catch (error) {
      console.error('Error running automation:', error);
    } finally {
      setRunningAutomation(false);
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/business/users');
        const payload = await response.json();
        if (response.ok) setUsers(payload.users ?? []);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    loadUsers();
    loadDashboard().finally(() => setLoading(false));
    loadAutomationStatus();
  }, []);

  const handleAssignLead = async (leadId: string) => {
    const userId = selectedUserByLead[leadId];
    if (!userId) return;

    setAssigningId(leadId);
    try {
      const response = await fetch('/api/business/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, userId, status: 'CONTACTED', reason: 'Asignado desde dashboard operativo' }),
      });

      if (response.ok) {
        await loadDashboard();
      }
    } catch (error) {
      console.error('Error assigning lead:', error);
    } finally {
      setAssigningId(null);
    }
  };

  const handleStatusChange = async (leadId: string, nextStatus: LeadStatusKey) => {
    setStatusUpdatingId(leadId);
    try {
      const response = await fetch('/api/business/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status: nextStatus, reason: `Avance de pipeline a ${statusLabels[nextStatus]}` }),
      });

      if (response.ok) {
        await loadDashboard();
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleCreateReminder = async (leadId: string) => {
    const scheduledFor = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    try {
      await fetch('/api/business/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          scheduledFor,
          channel: 'whatsapp',
          message: 'Hola, queremos cerrar el seguimiento hoy mismo para confirmar la próxima acción.',
        }),
      });
      await loadDashboard();
      await loadAutomationStatus();
    } catch (error) {
      console.error('Error creating reminder:', error);
    }
  };

  const openTimeline = async (leadId: string) => {
    setTimelineLeadId(leadId);
    setTimelineLoading(true);
    try {
      const response = await fetch(`/api/business/leads/activity?leadId=${leadId}`);
      const payload = await response.json();
      if (response.ok) setTimelineActivities(payload.activities ?? []);
    } catch (error) {
      console.error('Error loading lead timeline:', error);
    } finally {
      setTimelineLoading(false);
    }
  };

  const closeTimeline = () => {
    setTimelineLeadId(null);
    setTimelineActivities([]);
  };

  const handleQuickBooking = async (lead: LeadSummary) => {
    setBookingLeadId(lead.id);
    setBookingSubmitting(true);
    try {
      const fechaHora = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await fetch('/api/business/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiendaId: lead.tiendaId,
          leadId: lead.id,
          clienteNombre: lead.nombre,
          clienteTelefono: lead.phone ?? '',
          fechaHora,
          notes: 'Cita rápida agendada desde el centro de operaciones',
          source: 'command-center',
        }),
      });
      await loadDashboard();
    } catch (error) {
      console.error('Error creating quick booking:', error);
    } finally {
      setBookingSubmitting(false);
      setBookingLeadId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-slate-900">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-52 rounded bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 rounded-xl bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const metrics = data?.summary ?? { totalLeads: 0, newLeads: 0, appointments: 0, todayAppointments: 0, pendingReminders: 0, dueReminders: 0 };
  const industry = resolveIndustryConfig((data?.segment ?? 'general') as BusinessSegment | undefined);
  const pipelineStages = industry.pipeline;
  const pipelineColumns = pipelineStages.map((stage) => ({
    ...stage,
    leads: (data?.leads ?? []).filter((lead) => normalizeStage(lead.estado) === stage.key),
  }));

  const metricValue = (key: string) => {
    switch (key) {
      case 'totalLeads': return metrics.totalLeads;
      case 'newLeads': return metrics.newLeads;
      case 'appointments': return metrics.appointments;
      case 'pendingReminders': return metrics.pendingReminders;
      case 'todayAppointments': return metrics.todayAppointments;
      default: return 0;
    }
  };

  const actions: TodayActions = data?.todayActions ?? { dueReminders: [], unassignedNewLeads: [], coldLeads: [], unconfirmedAppointments: [] };
  const accionesTotal = actions.dueReminders.length + actions.unassignedNewLeads.length + actions.coldLeads.length + actions.unconfirmedAppointments.length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.08),transparent_22%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.08),transparent_22%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-2 py-3 text-slate-900 sm:px-4">
      <div className="space-y-8">
        <div className="flex flex-col gap-3 rounded-[30px] border border-slate-200/80 bg-gradient-to-r from-white via-sky-50/80 to-white p-6 shadow-[0_26px_80px_rgba(15,23,42,0.06)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-600">Upway Business OS · Command Center</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Centro de operaciones · {industry.label}</h1>
            <p className="mt-1 text-sm text-slate-500">Visión ejecutiva del pipeline, agenda y automatización adaptada a tu negocio.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 shadow-[0_0_24px_rgba(16,185,129,0.10)]">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
            Sistema en operación
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {industry.metrics.map((metric) => (
            <div key={metric.key} className="group rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-5 shadow-[0_14px_50px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(15,23,42,0.12)]">
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className={`mt-4 text-3xl font-semibold ${metric.accent}`}>{metricValue(metric.key)}</p>
              <p className="mt-2 text-xs text-slate-500">{metric.hint}</p>
            </div>
          ))}
        </div>

        {/* 📈 TENDENCIA 7 DÍAS + 💰 CONSUMO */}
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_16px_55px_rgba(15,23,42,0.05)] backdrop-blur-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Tendencia · últimos 7 días</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: `Nuevos ${industry.audienceNoun}s`, data: data?.trend?.leads },
                { label: `${industry.appointmentNoun}s creados`, data: data?.trend?.citas },
              ].map((item) => {
                const t = item.data;
                const up = (t?.pct ?? 0) >= 0;
                return (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <p className="text-2xl font-semibold text-slate-900">{t?.current ?? 0}</p>
                      <span className={`text-xs font-semibold ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {up ? '▲' : '▼'} {Math.abs(t?.pct ?? 0)}%
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">vs semana anterior: {t?.previous ?? 0}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_16px_55px_rgba(15,23,42,0.05)] backdrop-blur-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Consumo del mes</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Mensajes</p>
                <p className="mt-2 text-2xl font-semibold text-sky-600">{data?.consumption?.messages ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Llamadas voz</p>
                <p className="mt-2 text-2xl font-semibold text-violet-600">{data?.consumption?.voiceCalls ?? 0}</p>
                <p className="text-[10px] text-slate-500">{data?.consumption?.voiceMinutes ?? 0} min</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Costo voz</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-600">${data?.consumption?.vapiCost ?? 0}</p>
                <p className="text-[10px] text-slate-500">facturado: ${data?.consumption?.billedCost ?? 0}</p>
              </div>
            </div>
          </section>
        </div>

        {/* 🎯 ACCIONES DE HOY */}
        <section className="rounded-[28px] border border-amber-500/30 bg-gradient-to-br from-white via-white to-amber-50/80 p-5 shadow-[0_20px_55px_rgba(251,191,36,0.07)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">🎯 Acciones de hoy</h2>
            <span className="text-xs uppercase tracking-[0.22em] text-amber-600">
              {accionesTotal} pendientes
            </span>
          </div>

          {accionesTotal === 0 ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800">
              ✅ Todo al día. No hay acciones críticas pendientes en tu operación.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-4">
              {/* Recordatorios vencidos */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <p className="mb-3 text-sm font-semibold text-amber-600">⏰ Recordatorios vencidos ({actions.dueReminders.length})</p>
                <div className="space-y-2">
                  {actions.dueReminders.length === 0 && <p className="text-xs text-slate-500">Nada vencido.</p>}
                  {actions.dueReminders.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => r.leadId && openTimeline(r.leadId)}
                      className="w-full rounded-lg border border-slate-200 bg-white/80 p-2 text-left text-xs text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50/60"
                    >
                      <span className="font-medium text-slate-900">{r.nombre}</span>
                      <span className="block text-[10px] text-slate-500">venció {new Date(r.scheduledFor).toLocaleDateString()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Leads sin asignar */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-rose-50 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <p className="mb-3 text-sm font-semibold text-rose-600">🚨 Sin asignar +24h ({actions.unassignedNewLeads.length})</p>
                <div className="space-y-2">
                  {actions.unassignedNewLeads.length === 0 && <p className="text-xs text-slate-500">Todo asignado.</p>}
                  {actions.unassignedNewLeads.map((l) => (
                    <div key={l.id} className="rounded-lg border border-slate-200 bg-white/80 p-2 text-xs">
                      <span className="font-medium text-slate-900">{l.nombre}</span>
                      <span className="block text-[10px] text-slate-500">creado {new Date(l.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leads fríos */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <p className="mb-3 text-sm font-semibold text-sky-600">🧊 Sin contacto +3 días ({actions.coldLeads.length})</p>
                <div className="space-y-2">
                  {actions.coldLeads.length === 0 && <p className="text-xs text-slate-500">Nadie enfriándose.</p>}
                  {actions.coldLeads.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => handleCreateReminder(l.id)}
                      className="w-full rounded-lg border border-slate-200 bg-white/80 p-2 text-left text-xs transition hover:border-sky-500/40 hover:bg-sky-50/70"
                    >
                      <span className="font-medium text-slate-900">{l.nombre}</span>
                      <span className="block text-[10px] text-slate-500">+ programar recordatorio</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Citas sin confirmar */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <p className="mb-3 text-sm font-semibold text-violet-600">📅 Próximas sin confirmar ({actions.unconfirmedAppointments.length})</p>
                <div className="space-y-2">
                  {actions.unconfirmedAppointments.length === 0 && <p className="text-xs text-slate-500">Todo confirmado.</p>}
                  {actions.unconfirmedAppointments.map((c) => (
                    <div key={c.id} className="rounded-lg border border-slate-200 bg-white/80 p-2 text-xs">
                      <span className="font-medium text-slate-900">{c.clienteNombre}</span>
                      <span className="block text-[10px] text-slate-500">{new Date(c.fechaHora).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-4">
          {industry.serviceCards.map((card) => (
            <div key={card.title} className={`rounded-2xl border p-4 shadow-[0_12px_42px_rgba(15,23,42,0.10)] transition-all duration-200 hover:-translate-y-0.5 ${card.tone}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.22em] opacity-80">{card.badge}</span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm opacity-85">{card.text}</p>
            </div>
          ))}
        </div>

        <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_55px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">KPI por responsable</h2>
            <span className="text-xs uppercase tracking-[0.22em] text-slate-500">{data?.agentPerformance?.length ?? 0} agentes</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {(data?.agentPerformance ?? []).map((agent) => (
              <div key={agent.id} className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <p className="font-medium text-slate-900">{agent.name}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-semibold text-sky-600">{agent.totalLeads}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Leads</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-amber-600">{agent.active}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Activos</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-emerald-600">{agent.closedWon}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Cerrados</p>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-center text-[11px] text-violet-700">
                  {agent.withAppointment} con cita agendada
                </div>
              </div>
            ))}
            {(!data?.agentPerformance || data.agentPerformance.length === 0) && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                Sin agentes con leads asignados todavía.
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_55px_rgba(15,23,42,0.05)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Pipeline de leads</h2>
              <span className="text-xs uppercase tracking-[0.22em] text-slate-500">{data?.leads.length ?? 0} registros</span>
            </div>

            <div className="grid gap-4 xl:grid-cols-5">
              {pipelineColumns.map((stage) => (
                <div key={stage.key} className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3 shadow-[0_12px_35px_rgba(15,23,42,0.04)]">
                  <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-sm font-medium text-slate-900">{stage.label}</span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600">
                      {stage.leads.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {stage.leads.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
                        Vacío
                      </div>
                    ) : (
                      stage.leads.map((lead) => {
                        const currentStage = normalizeStage(lead.estado);
                        const nextStage = pipelineStages.find((item) => item.key === currentStage)?.next;
                        const selectedUser = selectedUserByLead[lead.id] ?? lead.assignedTo?.id ?? '';

                        return (
                          <div key={lead.id} className="rounded-xl border border-slate-200 bg-white/80 p-3 shadow-[0_8px_22px_rgba(15,23,42,0.03)]">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-slate-900">{lead.nombre}</p>
                                <p className="mt-1 text-xs text-slate-500">{lead.phone || 'Sin teléfono'}</p>
                              </div>
                              <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-700">
                                {statusLabels[lead.estado] ?? lead.estado}
                              </span>
                            </div>

                            <div className="mt-3 text-xs text-slate-500">
                              <div>Origen: {lead.origen}</div>
                              <div>Asignado: {lead.assignedTo ? (lead.assignedTo.name || lead.assignedTo.email || 'Sin nombre') : 'Sin asignar'}</div>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <select
                                value={selectedUser}
                                onChange={(event) => setSelectedUserByLead((current) => ({ ...current, [lead.id]: event.target.value }))}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900 shadow-sm"
                              >
                                <option value="">Asignar agente</option>
                                {users.map((user) => (
                                  <option key={user.id} value={user.id}>{user.name || user.email || 'Usuario'}</option>
                                ))}
                              </select>
                            </div>

                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => handleAssignLead(lead.id)}
                                disabled={!selectedUserByLead[lead.id] && !lead.assignedTo?.id || assigningId === lead.id}
                                className="flex-1 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2 py-2 text-[11px] font-medium text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {assigningId === lead.id ? 'Asignando...' : 'Asignar'}
                              </button>
                              <button
                                onClick={() => handleCreateReminder(lead.id)}
                                className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-2 py-2 text-[11px] font-medium text-violet-700"
                              >
                                Reminder
                              </button>
                            </div>

                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => handleQuickBooking(lead)}
                                disabled={bookingSubmitting && bookingLeadId === lead.id}
                                className="flex-1 rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/10 px-2 py-2 text-[11px] font-medium text-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {bookingSubmitting && bookingLeadId === lead.id ? 'Agendando...' : 'Cita rápida'}
                              </button>
                              <button
                                onClick={() => openTimeline(lead.id)}
                                className="rounded-lg border border-slate-600 bg-slate-100 px-2 py-2 text-[11px] font-medium text-slate-700"
                              >
                                Timeline
                              </button>
                            </div>

                            {nextStage && (
                              <button
                                onClick={() => handleStatusChange(lead.id, nextStage)}
                                disabled={statusUpdatingId === lead.id}
                                className="mt-3 w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-2 text-[11px] font-medium text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {statusUpdatingId === lead.id ? 'Actualizando...' : `Mover a ${pipelineStages.find((s) => s.key === nextStage)?.label ?? statusLabels[nextStage]}`}
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_14px_45px_rgba(15,23,42,0.05)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">Automatización</h2>
                <button
                  onClick={handleRunAutomation}
                  disabled={runningAutomation}
                  className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-medium text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {runningAutomation ? 'Procesando...' : 'Ejecutar'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Pendientes</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-600">{automation.pendingReminders}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-rose-50 to-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Vencidos</p>
                  <p className="mt-2 text-2xl font-semibold text-rose-600">{automation.dueReminders}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800">
                Trigger activo: lead → seguimiento → cita → cierre
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_14px_45px_rgba(15,23,42,0.05)]">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Agenda de {industry.appointmentNoun.toLowerCase()}s</h2>
              <div className="space-y-3">
                {(data?.nextAppointments ?? []).map((appointment) => (
                  <div key={appointment.id} className="rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50 to-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <p className="font-medium text-slate-900">{appointment.clienteNombre}</p>
                    <p className="mt-1 text-sm text-slate-500">{new Date(appointment.fechaHora).toLocaleString()}</p>
                    <span className="mt-2 inline-flex rounded-full border border-violet-500/40 bg-violet-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-violet-700">
                      {appointment.estado}
                    </span>
                  </div>
                ))}
                {(!data?.nextAppointments || data.nextAppointments.length === 0) && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    Sin citas programadas.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_14px_45px_rgba(15,23,42,0.05)]">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Inbox live</h2>
              <div className="space-y-3">
                {(data?.inbox ?? []).map((conversation) => (
                  <div key={conversation.id} className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">{conversation.clientName || conversation.clientPhone}</p>
                        <p className="text-xs text-slate-500">{conversation.clientPhone}</p>
                      </div>
                      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-700">
                        {conversation.status}
                      </span>
                    </div>

                    {conversation.lead && (
                      <p className="mt-2 text-xs text-sky-600">Lead: {conversation.lead.nombre}</p>
                    )}

                    {conversation.messages.slice(0, 3).map((message) => (
                      <p key={message.id} className="mt-2 text-xs text-slate-600 line-clamp-2">
                        {message.senderRole}: {message.content}
                      </p>
                    ))}
                  </div>
                ))}
                {(!data?.inbox || data.inbox.length === 0) && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    Sin conversaciones activas.
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {timelineLeadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-sm" onClick={closeTimeline}>
          <div
            className="h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-slate-50 p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Timeline del lead</h2>
              <button onClick={closeTimeline} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600">
                Cerrar
              </button>
            </div>

            {timelineLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-200" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {timelineActivities.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Sin actividad registrada para este lead.
                  </div>
                )}
                {timelineActivities.map((activity, index) => (
                  <div key={activity.id} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                    {index < timelineActivities.length - 1 && (
                      <span className="absolute left-[4px] top-4 h-full w-px bg-slate-800" />
                    )}
                    <p className="text-sm font-medium text-slate-900">
                      {activityTypeLabels[activity.type] ?? activity.type}
                    </p>
                    {activity.summary && (
                      <p className="mt-1 text-xs text-slate-500">{activity.summary}</p>
                    )}
                    <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                      {new Date(activity.createdAt).toLocaleString()}
                      {activity.actor && ` · ${activity.actor.name || activity.actor.email}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
