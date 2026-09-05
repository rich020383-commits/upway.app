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
      <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
        <div className="mx-auto max-w-7xl animate-pulse space-y-4">
          <div className="h-8 w-52 rounded bg-slate-800" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 rounded-xl bg-slate-800" />
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

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-[0_25px_80px_rgba(2,6,23,0.6)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Upway Business OS · Command Center</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Centro de operaciones · {industry.label}</h1>
            <p className="mt-1 text-sm text-slate-400">Visión ejecutiva del pipeline, agenda y automatización adaptada a tu negocio.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Sistema en operación
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {industry.metrics.map((metric) => (
            <div key={metric.key} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.45)]">
              <p className="text-sm text-slate-400">{metric.label}</p>
              <p className={`mt-4 text-3xl font-semibold ${metric.accent}`}>{metricValue(metric.key)}</p>
              <p className="mt-2 text-xs text-slate-500">{metric.hint}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {industry.serviceCards.map((card) => (
            <div key={card.title} className={`rounded-2xl border p-4 shadow-[0_10px_40px_rgba(15,23,42,0.25)] ${card.tone}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.22em] opacity-80">{card.badge}</span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm opacity-85">{card.text}</p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">KPI por responsable</h2>
            <span className="text-xs uppercase tracking-[0.22em] text-slate-400">{data?.agentPerformance?.length ?? 0} agentes</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {(data?.agentPerformance ?? []).map((agent) => (
              <div key={agent.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="font-medium text-white">{agent.name}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-semibold text-sky-300">{agent.totalLeads}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Leads</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-amber-300">{agent.active}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Activos</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-emerald-300">{agent.closedWon}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Cerrados</p>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-center text-[11px] text-violet-200">
                  {agent.withAppointment} con cita agendada
                </div>
              </div>
            ))}
            {(!data?.agentPerformance || data.agentPerformance.length === 0) && (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                Sin agentes con leads asignados todavía.
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Pipeline de leads</h2>
              <span className="text-xs uppercase tracking-[0.22em] text-slate-400">{data?.leads.length ?? 0} registros</span>
            </div>

            <div className="grid gap-4 xl:grid-cols-5">
              {pipelineColumns.map((stage) => (
                <div key={stage.key} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-sm font-medium text-white">{stage.label}</span>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300">
                      {stage.leads.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {stage.leads.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-3 text-center text-xs text-slate-500">
                        Vacío
                      </div>
                    ) : (
                      stage.leads.map((lead) => {
                        const currentStage = normalizeStage(lead.estado);
                        const nextStage = pipelineStages.find((item) => item.key === currentStage)?.next;
                        const selectedUser = selectedUserByLead[lead.id] ?? lead.assignedTo?.id ?? '';

                        return (
                          <div key={lead.id} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-white">{lead.nombre}</p>
                                <p className="mt-1 text-xs text-slate-400">{lead.phone || 'Sin teléfono'}</p>
                              </div>
                              <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-200">
                                {statusLabels[lead.estado] ?? lead.estado}
                              </span>
                            </div>

                            <div className="mt-3 text-xs text-slate-400">
                              <div>Origen: {lead.origen}</div>
                              <div>Asignado: {lead.assignedTo ? (lead.assignedTo.name || lead.assignedTo.email || 'Sin nombre') : 'Sin asignar'}</div>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <select
                                value={selectedUser}
                                onChange={(event) => setSelectedUserByLead((current) => ({ ...current, [lead.id]: event.target.value }))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100"
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
                                className="flex-1 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2 py-2 text-[11px] font-medium text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {assigningId === lead.id ? 'Asignando...' : 'Asignar'}
                              </button>
                              <button
                                onClick={() => handleCreateReminder(lead.id)}
                                className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-2 py-2 text-[11px] font-medium text-violet-200"
                              >
                                Reminder
                              </button>
                            </div>

                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => handleQuickBooking(lead)}
                                disabled={bookingSubmitting && bookingLeadId === lead.id}
                                className="flex-1 rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/10 px-2 py-2 text-[11px] font-medium text-fuchsia-200 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {bookingSubmitting && bookingLeadId === lead.id ? 'Agendando...' : 'Cita rápida'}
                              </button>
                              <button
                                onClick={() => openTimeline(lead.id)}
                                className="rounded-lg border border-slate-600 bg-slate-800/60 px-2 py-2 text-[11px] font-medium text-slate-200"
                              >
                                Timeline
                              </button>
                            </div>

                            {nextStage && (
                              <button
                                onClick={() => handleStatusChange(lead.id, nextStage)}
                                disabled={statusUpdatingId === lead.id}
                                className="mt-3 w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-2 text-[11px] font-medium text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
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
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-white">Automatización</h2>
                <button
                  onClick={handleRunAutomation}
                  disabled={runningAutomation}
                  className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-medium text-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {runningAutomation ? 'Procesando...' : 'Ejecutar'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Pendientes</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-300">{automation.pendingReminders}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Vencidos</p>
                  <p className="mt-2 text-2xl font-semibold text-rose-300">{automation.dueReminders}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                Trigger activo: lead → seguimiento → cita → cierre
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h2 className="mb-4 text-xl font-semibold text-white">Agenda de {industry.appointmentNoun.toLowerCase()}s</h2>
              <div className="space-y-3">
                {(data?.nextAppointments ?? []).map((appointment) => (
                  <div key={appointment.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <p className="font-medium text-white">{appointment.clienteNombre}</p>
                    <p className="mt-1 text-sm text-slate-400">{new Date(appointment.fechaHora).toLocaleString()}</p>
                    <span className="mt-2 inline-flex rounded-full border border-violet-500/40 bg-violet-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-violet-200">
                      {appointment.estado}
                    </span>
                  </div>
                ))}
                {(!data?.nextAppointments || data.nextAppointments.length === 0) && (
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-500">
                    Sin citas programadas.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h2 className="mb-4 text-xl font-semibold text-white">Inbox live</h2>
              <div className="space-y-3">
                {(data?.inbox ?? []).map((conversation) => (
                  <div key={conversation.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white">{conversation.clientName || conversation.clientPhone}</p>
                        <p className="text-xs text-slate-400">{conversation.clientPhone}</p>
                      </div>
                      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                        {conversation.status}
                      </span>
                    </div>

                    {conversation.lead && (
                      <p className="mt-2 text-xs text-sky-300">Lead: {conversation.lead.nombre}</p>
                    )}

                    {conversation.messages.slice(0, 2).map((message) => (
                      <p key={message.id} className="mt-2 text-xs text-slate-300 line-clamp-2">
                        {message.senderRole}: {message.content}
                      </p>
                    ))}
                  </div>
                ))}
                {(!data?.inbox || data.inbox.length === 0) && (
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-500">
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
            className="h-full w-full max-w-md overflow-y-auto border-l border-slate-800 bg-slate-900 p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Timeline del lead</h2>
              <button onClick={closeTimeline} className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300">
                Cerrar
              </button>
            </div>

            {timelineLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-800" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {timelineActivities.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-500">
                    Sin actividad registrada para este lead.
                  </div>
                )}
                {timelineActivities.map((activity, index) => (
                  <div key={activity.id} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                    {index < timelineActivities.length - 1 && (
                      <span className="absolute left-[4px] top-4 h-full w-px bg-slate-800" />
                    )}
                    <p className="text-sm font-medium text-white">
                      {activityTypeLabels[activity.type] ?? activity.type}
                    </p>
                    {activity.summary && (
                      <p className="mt-1 text-xs text-slate-400">{activity.summary}</p>
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
