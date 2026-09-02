import { buildHealthQuery } from '@/lib/health/data';

export default function HealthPoliciesPage() {
  const query = buildHealthQuery({ organizationId: 'org-1', clinicId: 'clinic-1', role: 'compliance-reviewer' }, 'policies');

  const policies = [
    { title: 'Cancelación', detail: '24h antes del turno para evitar penalizaciones y mantener continuidad.' },
    { title: 'Escalación', detail: 'Cualquier riesgo clínico o evidencia de urgencia derivada a atención humana.' },
    { title: 'Cumplimiento', detail: 'Revisión documental de consentimiento y protocolos de atención.' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Políticas</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Control operativo</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {policies.map((policy) => (
          <div key={policy.title} className="upway-surface rounded-[24px] p-5">
            <div className="mb-4 text-lg font-black tracking-[-0.04em] text-slate-900">{policy.title}</div>
            <p className="text-sm leading-7 text-slate-600">{policy.detail}</p>
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
