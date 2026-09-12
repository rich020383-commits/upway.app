"use client";

import { useEffect, useState } from 'react';

type InboxMessage = { id: string; senderRole: string; content: string; createdAt: string };
type InboxItem = {
  id: string;
  clientPhone: string;
  clientName?: string | null;
  status: string;
  updatedAt: string;
  lead?: { id: string; nombre: string; estado: string } | null;
  messages: InboxMessage[];
};

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/health/inbox');
        const data = await res.json();
        if (res.ok) {
          const raw = data.items ?? [];
          setItems(
            raw.map((r: { id: string; patient: string; channel: string; status: string; summary?: string; clientPhone?: string; updatedAt?: string }) => ({
              id: r.id,
              clientPhone: r.clientPhone ?? '',
              clientName: r.patient,
              status: r.status,
              updatedAt: r.updatedAt ?? new Date().toISOString(),
              lead: null,
              messages: [{ id: `${r.id}-m`, senderRole: 'USER', content: r.summary ?? 'Sin mensajes', createdAt: r.updatedAt ?? new Date().toISOString() }],
            }))
          );
        }
      } catch (error) {
        console.error('Error cargando inbox health:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Inbox</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Conversaciones activas</h1>
        <p className="mt-1 text-sm text-slate-500">Buzón omnicanal real · Conversation + Message (WhatsApp).</p>
      </div>

      {loading ? (
        <div className="upway-surface rounded-[26px] p-6 text-slate-500">Cargando conversaciones reales…</div>
      ) : items.length === 0 ? (
        <div className="upway-surface rounded-[26px] p-6 text-slate-600">
          Sin conversaciones activas. Los mensajes de WhatsApp aparecerán aquí.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => {
            const title = item.clientName || item.lead?.nombre || item.clientPhone;
            const last = item.messages?.[0]?.content ?? 'Sin mensajes';
            return (
              <div key={item.id} className="upway-surface rounded-[24px] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-lg font-black tracking-[-0.04em] text-slate-900">{title}</div>
                  <span className="rounded-full border border-[#dfeaff] bg-[#edf4ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1b5ed6]">{item.status}</span>
                </div>
                <div className="text-sm text-slate-600">Tel: {item.clientPhone}</div>
                {item.lead && <div className="mt-1 text-sm text-slate-600">Lead: {item.lead.nombre} · {item.lead.estado}</div>}
                <div className="mt-2 text-sm text-slate-600">Último: {last.slice(0, 90)}</div>
                <div className="mt-2 text-sm text-slate-600">Canal: WhatsApp</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
