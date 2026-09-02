"use client";

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

type ComplianceItem = {
  id: string;
  title: string;
  status: string;
  value: string;
};

export default function CompliancePage() {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompliance = async () => {
      try {
        const res = await fetch('/api/health/compliance');
        const data = await res.json();
        setItems(data.items ?? []);
      } catch (error) {
        console.error('Error cargando control de cumplimiento:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCompliance();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Compliance</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Control clínico</h1>
      </div>

      {loading ? (
        <div className="upway-surface flex items-center gap-3 rounded-[26px] p-6 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando indicadores de cumplimiento...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="upway-surface rounded-[24px] p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">{item.title}</div>
              <div className="mt-4 text-xl font-black tracking-[-0.04em] text-slate-900">{item.status}</div>
              <div className="mt-2 text-sm text-slate-600">{item.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
