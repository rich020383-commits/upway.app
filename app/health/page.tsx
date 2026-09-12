"use client";

import { useEffect, useState } from 'react';

type DashboardInboxItem = {
  id: string;
  clientPhone: string;
  clientName?: string | null;
  status: string;
  updatedAt: string;
  lead?: { id: string; nombre: string; estado: string } | null;
  messages: { id: string; senderRole: string; content: string; createdAt: string }[];
};

type DashboardPayload = {
  summary: { totalLeads: number; newLeads: number; appointments: number; todayAppointments: number; pendingReminders: number; dueReminders: number };
  pipeline: Record<string, number>;
  nextAppointments: { id: string; clienteNombre: string; fechaHora: string; estado: string }[];
  inbox: DashboardInboxItem[];
  consumption?: { month: string; messages: number; voiceCalls: number; voiceMinutes: number; telnyxCost: number; vapiCost: number; billedCost: number };
};

type ComplianceItem = { id: string; title: string; status: string; value: string };
type AgentPayload = { id: string; name: string; channels: { whatsapp: boolean; telnyx?: boolean; vapi?: boolean }; status: string };

function parseCount(value: string): number {
  const m = value.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

export default function HealthOverviewPage() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [compliance, setCompliance] = useState<ComplianceItem[]>([]);
  const [agent, setAgent] = useState<AgentPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, compRes, agentRes] = await Promise.all([
          fetch('/api/business/dashboard'),
          fetch('/api/health/compliance'),
          fetch('/api/health/agents'),
        ]);
        if (dashRes.ok) setDashboard(await dashRes.json());
        if (compRes.ok) {
          const comp = await compRes.json();
          setCompliance(comp.items ?? []);
        }
        if (agentRes.ok) {
          const ag = await agentRes.json();
          setAgent(ag.items?.[0] ?? null);
        }
      } catch (error) {
        console.error('Error cargando resumen health:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const todayLabel = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const consumption = dashboard?.consumption;
  const telnyxCost = consumption?.telnyxCost ?? consumption?.vapiCost ?? 0;

  const statCards = [
    { label: 'Leads totales', value: dashboard?.summary.totalLeads ?? 0, delta: `${dashboard?.summary.newLeads ?? 0} nuevos` },
    { label: 'Citas próximas', value: dashboard?.summary.appointments ?? 0, delta: `${dashboard?.summary.todayAppointments ?? 0} hoy` },
    { label: 'Recordatorios vencidos', value: dashboard?.summary.dueReminders ?? 0, delta: `${dashboard?.summary.pendingReminders ?? 0} pendientes` },
    { label: 'Costo voz · Telnyx', value: `$${Number(telnyxCost).toFixed(2)}`, delta: `${consumption?.voiceCalls ?? 0} llamadas` },
  ];

  const conversations = (dashboard?.inbox ?? []).slice(0, 3).map((c) => ({
    patient: c.clientName || c.lead?.nombre || c.clientPhone,
    need: c.lead ? `Lead: ${c.lead.nombre} · ${c.lead.estado}` : (c.messages?.[0]?.content ?? 'Sin mensajes').slice(0, 80),
    channel: 'WhatsApp',
    time: c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
    status: c.status,
  }));

  const messages = consumption?.messages ?? 0;
  const voiceCalls = consumption?.voiceCalls ?? 0;
  const channelTotal = messages + voiceCalls;
  const whatsappPct = channelTotal > 0 ? Math.round((messages / channelTotal) * 100) : 0;
  const telnyxPct = channelTotal > 0 ? Math.round((voiceCalls / channelTotal) * 100) : 0;
  const donutSegments = [
    { label: 'WhatsApp', value: whatsappPct, color: '#5cc8a2' },
    { label: 'Telnyx', value: telnyxPct, color: '#7aa8ff' },
    { label: 'Web', value: 0, color: '#d8d9f7' },
  ];
  const donutValue = channelTotal;
  const donutStyle = {
    background: `conic-gradient(#5cc8a2 0 ${whatsappPct}%, #7aa8ff ${whatsappPct}% ${whatsappPct + telnyxPct}%, #d8d9f7 ${whatsappPct + telnyxPct}% 100%)`,
  };

  const pipeline = dashboard?.pipeline ?? {};
  const pipelineEntries = Object.entries(pipeline);
  const pipelineMax = Math.max(1, ...pipelineEntries.map(([, v]) => v));
  const graphBars = pipelineEntries.length > 0
    ? pipelineEntries.map(([, v]) => Math.round((v / pipelineMax) * 100))
    : [0, 0, 0, 0, 0, 0];

  const agenda = (dashboard?.nextAppointments ?? []).slice(0, 4).map((a) => ({
    name: a.clienteNombre,
    reason: `${new Date(a.fechaHora).toLocaleString('es-CO')} · ${a.estado}`,
    priority: a.estado === 'PENDING' ? 'Pendiente' : a.estado === 'CONFIRMED' ? 'Confirmada' : a.estado,
  }));

  const triageCount = parseCount(compliance.find((i) => i.id === 'compliance-triage')?.value ?? '0');
  const faqsCount = parseCount(compliance.find((i) => i.id === 'compliance-faqs')?.value ?? '0');
  const policiesCount = parseCount(compliance.find((i) => i.id === 'compliance-policies')?.value ?? '0');
  const telnyxOn = agent ? Boolean(agent.channels.telnyx ?? agent.channels.vapi) : false;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[1.38fr_0.92fr]">
        <div className="upway-surface rounded-[30px] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Centro de mando</div>
              <div className="mt-2 text-[31px] font-black tracking-[-0.05em] text-slate-900">Resumen Ejecutivo</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Operación activa</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600">{todayLabel}</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-4 shadow-[0_12px_26px_rgba(15,23,42,0.03)] transition-transform duration-200 hover:-translate-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">{card.label}</div>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <div className="text-[27px] font-black tracking-[-0.06em] text-slate-900">{card.value}</div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">{card.delta}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">Interacciones por canal</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">Volumen</div>
              </div>

              <div className="flex items-center justify-center py-2">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full" style={donutStyle}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-center shadow-inner">
                    <div>
                      <div className="text-[18px] font-black leading-none text-slate-900">{donutValue}</div>
                      <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Total</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {donutSegments.map((segment) => (
                  <div key={segment.label} className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: segment.color }} />{segment.label}</span>
                    <span className="font-semibold">{segment.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">Actividad 24h</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">últimas 24h</div>
              </div>

              <div className="flex h-36 items-end gap-2">
                {graphBars.map((value, index) => (
                  <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center justify-end">
                    <div className="w-full rounded-t-[12px] bg-[linear-gradient(180deg,#7ba9ff,#3d6ae4)] shadow-[0_10px_20px_rgba(61,106,228,0.2)]" style={{ height: `${value}%` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="upway-surface rounded-[30px] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Bandeja</div>
              <div className="mt-2 text-[31px] font-black tracking-[-0.05em] text-slate-900">Entrada activa</div>
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">En línea</div>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Cargando conversaciones reales…
              </div>
            )}
            {!loading && conversations.length === 0 && (
              <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Sin conversaciones activas. Los mensajes de WhatsApp aparecerán aquí.
              </div>
            )}
            {conversations.map((item) => (
              <div key={`${item.patient}-${item.time}`} className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-slate-50/90 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#eaf3ff,#dfeeff)] text-sm font-black text-[#1b5ed6]">{item.patient.slice(0, 2).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-bold text-slate-800">{item.patient}</div>
                    <span className="text-[10px] font-semibold text-slate-500">{item.time}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">{item.need}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600">{item.channel}</span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{item.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="upway-surface rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xl font-black tracking-[-0.04em] text-slate-900">Agenda de pacientes</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Hoy</div>
          </div>

          <div className="space-y-3">
            {!loading && agenda.length === 0 && (
              <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Sin citas próximas. Agenda desde Operaciones y aparecerán aquí.
              </div>
            )}
            {agenda.map((item) => (
              <div key={`${item.name}-${item.reason}`} className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50/90 p-3">
                <div>
                  <div className="text-sm font-bold text-slate-800">{item.name}</div>
                  <div className="text-xs text-slate-600">{item.reason}</div>
                </div>
                <span className={[
                  'rounded-full px-2.5 py-1 text-[10px] font-bold',
                  item.priority === 'Pendiente' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                ].join(' ')}>{item.priority}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="upway-surface rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xl font-black tracking-[-0.04em] text-slate-900">Configuración</div>
            <button className="rounded-full border border-[#dfeaff] bg-[#edf4ff] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1b5ed6]">Editar</button>
          </div>

          <div className="space-y-4">
            {[
              ['Agente clínico', agent ? `${agent.name} · ${agent.status}` : 'Sin agente configurado'],
              ['Políticas y protocolos', `${policiesCount} políticas · ${triageCount} reglas triaje · ${faqsCount} FAQs`],
              ['Canales reales', `WhatsApp + Telnyx${telnyxOn ? ' (voz activa)' : ' (voz en espera)'} + CRM`],
              ['Voz del mes', `${consumption?.voiceCalls ?? 0} llamadas · $${Number(telnyxCost).toFixed(2)} Telnyx`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">{label}</div>
                <div className="mt-2 text-sm font-semibold text-slate-800">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
