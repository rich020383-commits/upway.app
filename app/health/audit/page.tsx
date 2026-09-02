'use client';

import { useEffect, useState } from 'react';

type AuditItem = {
  id: string;
  type: 'health_audit' | 'webhook_event';
  provider: string;
  actor: string;
  action: string;
  entity: string;
  status: string;
  createdAt: string;
  clinicName: string;
};

export default function HealthAuditPage() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAuditTrail() {
      try {
        const response = await fetch('/api/health/audit', { cache: 'no-store' });
        const payload = await response.json();
        if (!isMounted) return;
        setItems(payload.items ?? []);
      } catch (error) {
        console.error('Error loading audit trail:', error);
        if (isMounted) {
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadAuditTrail();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Auditoría</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Historial operativo</h1>
      </div>

      <div className="upway-surface rounded-[28px] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-lg font-black tracking-[-0.04em] text-slate-900">Cadena de eventos</div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Live feed</div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">Cargando historial…</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            Aún no hay eventos registrados para esta clínica.
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((entry) => (
              <div key={`${entry.type}-${entry.id}`} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-lg font-black tracking-[-0.04em] text-slate-900">{entry.action}</div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                    {entry.status}
                  </span>
                </div>
                <div className="text-sm text-slate-600">Proveedor: {entry.provider}</div>
                <div className="mt-2 text-sm text-slate-600">Entidad: {entry.entity}</div>
                <div className="mt-2 text-sm text-slate-600">Actor: {entry.actor}</div>
                <div className="mt-2 text-sm text-slate-600">Clínica: {entry.clinicName}</div>
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {new Date(entry.createdAt).toLocaleString('es-CL')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
