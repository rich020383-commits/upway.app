"use client";

import { useEffect, useState } from 'react';

type Consumption = { month: string; messages: number; voiceCalls: number; voiceMinutes: number; telnyxCost: number; vapiCost: number; billedCost: number };

export default function AnalyticsPage() {
  const [consumption, setConsumption] = useState<Consumption | null>(null);
  const [summary, setSummary] = useState({ totalLeads: 0, appointments: 0, todayAppointments: 0, pendingReminders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/business/dashboard');
        const data = await res.json();
        if (res.ok) {
          setConsumption(data.consumption ?? null);
          setSummary(data.summary ?? { totalLeads: 0, appointments: 0, todayAppointments: 0, pendingReminders: 0 });
        }
      } catch (error) {
        console.error('Error cargando analytics health:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const telnyxCost = consumption?.telnyxCost ?? consumption?.vapiCost ?? 0;
  const metrics = [
    { label: 'Leads totales', value: String(summary.totalLeads), delta: `${consumption?.messages ?? 0} mensajes` },
    { label: 'Citas próximas', value: String(summary.appointments), delta: `${summary.todayAppointments} hoy` },
    { label: 'Costo voz · Telnyx', value: `$${Number(telnyxCost).toFixed(2)}`, delta: `${consumption?.voiceCalls ?? 0} llamadas` },
    { label: 'Minutos voz', value: `${consumption?.voiceMinutes ?? 0}`, delta: `facturado $${Number(consumption?.billedCost ?? 0).toFixed(2)}` },
  ];

  const messages = consumption?.messages ?? 0;
  const voiceCalls = consumption?.voiceCalls ?? 0;
  const total = messages + voiceCalls;
  const channels = [
    { name: 'WhatsApp', value: total > 0 ? Math.round((messages / total) * 100) : 0, color: '#5cc8a2' },
    { name: 'Telnyx', value: total > 0 ? Math.round((voiceCalls / total) * 100) : 0, color: '#7aa8ff' },
    { name: 'Web', value: 0, color: '#d8d9f7' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Analytics</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Performance clínica</h1>
        <p className="mt-1 text-sm text-slate-500">
          {loading ? 'Cargando métricas reales…' : 'Métricas operativas reales · leads, citas y voz Telnyx.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="upway-surface rounded-[24px] p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">{metric.label}</div>
            <div className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-900">{metric.value}</div>
            <div className="mt-2 text-xs font-semibold text-emerald-600">Δ {metric.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        {/* COLUMNA IZQUIERDA: Canales de Atención */}
        <div className="upway-surface rounded-[28px] p-5">
          <div className="mb-4 text-lg font-black tracking-[-0.04em] text-slate-900">Canales de atención</div>
          <div className="space-y-4">
            {channels.map((channel) => (
              <div key={channel.name}>
                <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
                  <span>{channel.name}</span>
                  <span>{channel.value}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${channel.value}%`, background: channel.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: Reemplazo del JSON por Estado del Sistema */}
        <div className="upway-surface rounded-[28px] p-5 flex flex-col justify-center items-center text-center bg-slate-50/50">
          <div className="mb-2 text-lg font-black tracking-[-0.04em] text-slate-900">Sincronización Activa</div>
          <p className="text-sm text-slate-500 mb-5 max-w-xs">
            Los datos de rendimiento y canales se están procesando y actualizando en tiempo real.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold text-emerald-700 shadow-sm border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Conexión Estable
          </div>
        </div>
      </div>
    </div>
  );
}