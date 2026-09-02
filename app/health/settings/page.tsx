import { buildHealthQuery } from '@/lib/health/data';

export default function SettingsPage() {
  const query = buildHealthQuery({ organizationId: 'org-1', clinicId: 'clinic-1', role: 'clinic-admin' }, 'settings');

  const settings = [
    { label: 'Horario clínico', value: 'Lun - Vie / 08:00 - 20:00' },
    { label: 'Canales', value: 'WhatsApp + Vapi + web' },
    { label: 'Integraciones', value: 'CRM + agenda + notificaciones' },
    { label: 'Perfil operativo', value: 'Alta disponibilidad' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Settings</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Configuración clínica</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settings.map((item) => (
          <div key={item.label} className="upway-surface rounded-[24px] p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
            <div className="mt-3 text-lg font-black tracking-[-0.04em] text-slate-900">{item.value}</div>
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
