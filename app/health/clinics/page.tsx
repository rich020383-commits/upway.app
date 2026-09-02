import { buildHealthQuery } from '@/lib/health/data';

export default function HealthClinicsPage() {
  const query = buildHealthQuery({ organizationId: 'org-1', clinicId: 'clinic-1', role: 'clinic-admin' }, 'clinics');

  const clinics = [
    {
      name: 'Clínica Santa María',
      specialty: 'Medicina general / urgencias',
      status: 'Activa',
      region: 'Providencia',
    },
    {
      name: 'Centro Médico Norte',
      specialty: 'Cardiología y seguimiento',
      status: 'En prueba',
      region: 'Las Condes',
    },
    {
      name: 'Clínica Vida Integral',
      specialty: 'Atención primaria y consultas',
      status: 'Pendiente',
      region: 'Ñuñoa',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Clínicas</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Red operativa</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {clinics.map((clinic) => (
          <div key={clinic.name} className="upway-surface rounded-[24px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-black tracking-[-0.04em] text-slate-900">{clinic.name}</div>
              <span className="rounded-full border border-[#dfeaff] bg-[#edf4ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1b5ed6]">{clinic.status}</span>
            </div>
            <div className="text-sm text-slate-600">Especialidad: {clinic.specialty}</div>
            <div className="mt-2 text-sm text-slate-600">Región: {clinic.region}</div>
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
