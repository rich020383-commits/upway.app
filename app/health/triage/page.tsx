import { buildHealthQuery } from '@/lib/health/data';

export default function HealthTriagePage() {
  const query = buildHealthQuery({ organizationId: 'org-1', clinicId: 'clinic-1', role: 'triage-manager' }, 'triage');

  const rules = [
    'Si hay dolor intenso o signos agudos, priorizar urgencia inmediata.',
    'Ante pérdida de consciencia, alergia grave o embarazo con sangrado, escalar a humano.',
    'Si el paciente llega a consulta sin datos suficientes, completar contexto antes de agendar.',
    'Para seguimiento postoperatorio, confirmar horario, síntomas y reencaminamiento.',
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Triage</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Reglas de clasificación</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rules.map((rule, index) => (
          <div key={rule} className="upway-surface rounded-[24px] p-5">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#edf4ff] text-sm font-black text-[#1b5ed6]">{index + 1}</div>
            <p className="text-sm leading-7 text-slate-700">{rule}</p>
          </div>
        ))}
      </div>

      <div className="upway-surface rounded-[28px] p-5">
        <div className="mb-3 text-lg font-black tracking-[-0.04em] text-slate-900">Query base</div>
        <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-4 text-sm text-slate-100">{JSON.stringify(query, null, 2)}</pre>
      </div>
    </div>
  );
}
