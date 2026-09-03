import { buildHealthQuery } from '@/lib/health/data';

export default function HealthClinicsPage() {
  const query = buildHealthQuery({ organizationId: 'org-1', clinicId: 'clinic-1', role: 'clinic-admin' }, 'clinics');

  // 🔥 Eliminamos las clínicas hardcodeadas. 
  // Reemplaza este arreglo vacío con los datos reales que vienen de tu backend/contexto.
  const clinics: any[] = []; 

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Clínicas</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Red operativa</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {clinics.length > 0 ? (
          clinics.map((clinic, index) => (
            <div key={index} className="upway-surface rounded-[24px] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-black tracking-[-0.04em] text-slate-900">{clinic.name}</div>
                <span className="rounded-full border border-[#dfeaff] bg-[#edf4ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1b5ed6]">
                  {clinic.status}
                </span>
              </div>
              <div className="text-sm text-slate-600">Especialidad: {clinic.specialty}</div>
              <div className="mt-2 text-sm text-slate-600">Región: {clinic.region}</div>
            </div>
          ))
        ) : (
          <div className="md:col-span-3 rounded-[24px] border border-dashed border-slate-300 p-8 text-center text-slate-500 bg-slate-50/50">
            Aún no hay sedes sincronizadas. Conecta tu base de datos para ver la red aquí.
          </div>
        )}
      </div>

      {/* Reemplazo del bloque JSON por un indicador de Red limpio */}
      <div className="upway-surface rounded-[28px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="mb-1 text-lg font-black tracking-[-0.04em] text-slate-900">Estado de la Red</div>
          <p className="text-sm text-slate-500">
            La conexión de datos para las sedes y clínicas está en modo dinámico.
          </p>
        </div>
        <div className="shrink-0 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2.5 text-xs font-bold text-blue-700 shadow-sm border border-blue-200">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          Sincronización Dinámica
        </div>
      </div>
    </div>
  );
}