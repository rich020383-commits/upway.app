import { summarizeHealthMetrics } from '@/lib/health/data';

export default async function HealthOverviewPage() {
  const metrics = await summarizeHealthMetrics();

  const statCards = [
    { label: 'Atenciones', value: metrics.conversations, delta: '0%' },
    { label: 'Resolución', value: `${metrics.resolved}%`, delta: '0%' },
    { label: 'Escalaciones', value: metrics.escalations, delta: '0%' },
    { label: 'No-show', value: `${metrics.noShows}%`, delta: '0%' },
  ];

  const conversations = [
    { patient: 'Laura Mendoza', need: 'Información del paciente', channel: 'WhatsApp', time: '09:30', status: 'Activo' },
    { patient: 'María Fernanda', need: 'Consulta de seguimiento', channel: 'Vapi', time: '09:45', status: 'Pendiente' },
    { patient: 'Carlos Ramírez', need: 'Escalado a humano', channel: 'WhatsApp', time: '10:02', status: 'Urgente' },
  ];

  const donutSegments = [
    { label: 'WhatsApp', value: 0, color: '#5cc8a2' },
    { label: 'Vapi', value: 0, color: '#7aa8ff' },
    { label: 'Web', value: 0, color: '#d8d9f7' },
  ];

  const graphBars = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const agenda = [
    { name: 'María Fernández', reason: 'Dolor abdominal', priority: 'Alta' },
    { name: 'Javier Silva', reason: 'Seguimiento postoperatorio', priority: 'Media' },
    { name: 'Ana López', reason: 'Consulta general', priority: 'Baja' },
    { name: 'Luis Ortega', reason: 'Alergia / urgencia', priority: 'Crítica' },
  ];

  const donutValue = donutSegments.reduce((sum, item) => sum + item.value, 0);
  const donutStyle = {
    background: `conic-gradient(#5cc8a2 0 0%, #7aa8ff 0% 0%, #d8d9f7 0% 100%)`,
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[1.38fr_0.92fr]">
        <div className="upway-surface rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Opción 1</div>
              <div className="mt-2 text-[31px] font-black tracking-[-0.05em] text-slate-900">Resumen Ejecutivo</div>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600">13 mayo 2024</div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-[20px] border border-slate-200 bg-slate-50/90 p-4 shadow-[0_8px_18px_rgba(15,23,42,0.02)]">
                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">{card.label}</div>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <div className="text-[27px] font-black tracking-[-0.06em] text-slate-900">{card.value}</div>
                  <div className="text-[10px] font-bold text-emerald-600">{card.delta}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
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

            <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">Actividad 24h</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">últimas 24h</div>
              </div>

              <div className="flex h-36 items-end gap-2">
                {graphBars.map((value, index) => (
                  <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center justify-end">
                    <div className="w-full rounded-t-[10px] bg-[linear-gradient(180deg,#7ba9ff,#3d6ae4)]" style={{ height: `${value}%` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="upway-surface rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Opción 2</div>
              <div className="mt-2 text-[31px] font-black tracking-[-0.05em] text-slate-900">Bandeja de Entrada</div>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600">En línea</div>
          </div>

          <div className="space-y-3">
            {conversations.map((item) => (
              <div key={item.patient} className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-slate-50/90 p-3">
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
            {agenda.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50/90 p-3">
                <div>
                  <div className="text-sm font-bold text-slate-800">{item.name}</div>
                  <div className="text-xs text-slate-600">{item.reason}</div>
                </div>
                <span className={[
                  'rounded-full px-2.5 py-1 text-[10px] font-bold',
                  item.priority === 'Crítica' ? 'bg-red-50 text-red-700' :
                  item.priority === 'Alta' ? 'bg-amber-50 text-amber-700' :
                  item.priority === 'Media' ? 'bg-yellow-50 text-yellow-700' : 'bg-emerald-50 text-emerald-700'
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
              ['Información general', 'Clínica Santa María'],
              ['Políticas y protocolos', 'Triage + cancelación + escalamiento'],
              ['Usuarios y accesos', '5 perfiles activos'],
              ['Integraciones', 'WhatsApp + Vapi + CRM'],
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
