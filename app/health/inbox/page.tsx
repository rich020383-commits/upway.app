import { buildHealthQuery } from '@/lib/health/data';

export default function InboxPage() {
  const query = buildHealthQuery({ organizationId: 'org-1', clinicId: 'clinic-1', role: 'support-agent' }, 'inbox');

  const conversations = [
    { patient: 'María Fernández', reason: 'Dolor abdominal', queue: 'Alta prioridad', channel: 'WhatsApp' },
    { patient: 'Javier Silva', reason: 'Seguimiento postoperatorio', queue: 'En revisión', channel: 'Vapi' },
    { patient: 'Ana López', reason: 'Consulta general', queue: 'Sin urgencia', channel: 'Web' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Inbox</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Conversaciones activas</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {conversations.map((item) => (
          <div key={item.patient} className="upway-surface rounded-[24px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-black tracking-[-0.04em] text-slate-900">{item.patient}</div>
              <span className="rounded-full border border-[#dfeaff] bg-[#edf4ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1b5ed6]">{item.queue}</span>
            </div>
            <div className="text-sm text-slate-600">Motivo: {item.reason}</div>
            <div className="mt-2 text-sm text-slate-600">Canal: {item.channel}</div>
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
