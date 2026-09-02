import { buildHealthQuery } from '@/lib/health/data';

export default function AgentsPage() {
  const query = buildHealthQuery({ organizationId: 'org-1', clinicId: 'clinic-1', role: 'triage-manager' }, 'agents');

  const agents = [
    { name: 'Sophie Care', channel: 'WhatsApp + Vapi', tone: 'Empático y preciso', status: 'Activa' },
    { name: 'Recepción Triage', channel: 'Web + WhatsApp', tone: 'Clásico y sereno', status: 'Revisando' },
    { name: 'Consentimiento', channel: 'Vapi + SMS', tone: 'Formal y claro', status: 'Listo' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Agentes</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Perfiles clínicos</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {agents.map((agent) => (
          <div key={agent.name} className="upway-surface rounded-[26px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-11 w-11 rounded-2xl bg-[#edf4ff] text-[#1b5ed6] flex items-center justify-center font-bold">{agent.name.charAt(0)}</div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">{agent.status}</span>
            </div>
            <div className="text-xl font-black tracking-[-0.04em] text-slate-900">{agent.name}</div>
            <div className="mt-3 text-sm text-slate-600">Canal: {agent.channel}</div>
            <div className="mt-1 text-sm text-slate-600">Tono: {agent.tone}</div>
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
