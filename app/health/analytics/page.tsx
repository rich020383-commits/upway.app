import { buildHealthQuery } from '@/lib/health/data';

export default function AnalyticsPage() {
  const query = buildHealthQuery({ organizationId: 'org-1', clinicId: 'clinic-1', role: 'analyst' }, 'analytics');

  const metrics = [
    { label: 'Conversiones', value: '0', delta: '0%' },
    { label: 'Resolución', value: '0%', delta: '0%' },
    { label: 'Atención media', value: '0m', delta: '0%' },
    { label: 'Retención', value: '0%', delta: '0%' },
  ];

  const channels = [
    { name: 'WhatsApp', value: 0, color: '#5cc8a2' },
    { name: 'Vapi', value: 0, color: '#7aa8ff' },
    { name: 'Web', value: 0, color: '#d8d9f7' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Analytics</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Performance clínica</h1>
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