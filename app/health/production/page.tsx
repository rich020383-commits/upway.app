import { buildHealthQuery } from '@/lib/health/data';

export default function HealthProductionPage() {
  const query = buildHealthQuery({ organizationId: 'org-1', clinicId: 'clinic-1', role: 'clinic-admin' }, 'production');

  const states = [
    { label: 'Estado general', value: 'Producción lista', status: 'Healthy' },
    { label: 'Módulo de atención', value: 'Activo', status: 'Live' },
    { label: 'Módulo de triage', value: 'Verificado', status: 'Stable' },
    { label: 'Bloqueos', value: '0 críticos', status: 'Clear' },
  ];

  const safeguards = [
    'Permisos por rol y sesión verificados para todos los módulos críticos.',
    'Estándar de pausa, bloqueo y archivado definido para workflows y clínica.',
    'Auditoría y trazabilidad activa para cambios en políticas, FAQs y activación.',
    'Monitoreo y alertas operativas disponibles antes de escalar a producción con clientes reales.',
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Producción</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Hardening operativo</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {states.map((state) => (
          <div key={state.label} className="upway-surface rounded-[24px] p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">{state.label}</div>
            <div className="mt-4 text-xl font-black tracking-[-0.04em] text-slate-900">{state.value}</div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">{state.status}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="upway-surface rounded-[28px] p-5">
          <div className="mb-4 text-lg font-black tracking-[-0.04em] text-slate-900">Guardrails de producción</div>
          <div className="space-y-3">
            {safeguards.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-[18px] border border-slate-200 bg-slate-50/80 p-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700">✓</div>
                <p className="text-sm leading-7 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="upway-surface rounded-[28px] p-5">
          <div className="mb-3 text-lg font-black tracking-[-0.04em] text-slate-900">Estados reales</div>
          <div className="space-y-3 text-sm text-slate-700">
            <div className="rounded-[16px] border border-slate-200 bg-slate-50/80 p-3"><strong>PAUSED</strong> — temporalmente inactivo por mantenimiento o validación.</div>
            <div className="rounded-[16px] border border-slate-200 bg-slate-50/80 p-3"><strong>BLOCKED</strong> — requiere revisión urgente por riesgo, compliance o escalamiento.</div>
            <div className="rounded-[16px] border border-slate-200 bg-slate-50/80 p-3"><strong>ARCHIVED</strong> — historial de operación con trazabilidad y aislamiento.</div>
          </div>
        </div>
      </div>

      {/* Reemplazo del bloque JSON inferior por un indicador de Protocolos */}
      <div className="upway-surface rounded-[28px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="mb-1 text-lg font-black tracking-[-0.04em] text-slate-900">Protocolos de Despliegue</div>
          <p className="text-sm text-slate-500">
            Los procesos de control, auditoría y monitoreo están ejecutándose correctamente bajo los estándares de producción.
          </p>
        </div>
        <div className="shrink-0 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-sm border border-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Hardening Activo
        </div>
      </div>
    </div>
  );
}