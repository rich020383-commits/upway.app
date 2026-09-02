import { buildHealthQuery } from '@/lib/health/data';

export default function CompliancePage() {
  const query = buildHealthQuery({ organizationId: 'org-1', clinicId: 'clinic-1', role: 'compliance-reviewer' }, 'compliance');

  const checks = [
    { title: 'Consentimiento', status: 'Sin incidencias', value: '0 alertas' },
    { title: 'Versiones de políticas', status: 'Actualizadas', value: '0 pendientes' },
    { title: 'Auditoría de acceso', status: 'Sin eventos críticos', value: '0 revisiones' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Compliance</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Control clínico</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {checks.map((item) => (
          <div key={item.title} className="upway-surface rounded-[24px] p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">{item.title}</div>
            <div className="mt-4 text-xl font-black tracking-[-0.04em] text-slate-900">{item.status}</div>
            <div className="mt-2 text-sm text-slate-600">{item.value}</div>
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
