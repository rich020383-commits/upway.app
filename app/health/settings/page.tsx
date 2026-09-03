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

      {/* Reemplazo del bloque "Query base" por un indicador de estado profesional */}
      <div className="upway-surface rounded-[28px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="mb-1 text-lg font-black tracking-[-0.04em] text-slate-900">Estado de configuración</div>
          <p className="text-sm text-slate-500">
            Los parámetros operativos, horarios y canales están alineados y sincronizados.
          </p>
        </div>
        <div className="shrink-0 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-sm border border-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Sistema sincronizado
        </div>
      </div>
    </div>
  );
}