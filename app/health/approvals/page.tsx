'use client';

import { useEffect, useMemo, useState } from 'react';

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';

type ApprovalItem = {
  id: string;
  sessionId: string;
  clinicId: string;
  title: string;
  summary: string;
  status: ApprovalStatus;
  reviewer: string;
  requestedBy: string;
  createdAt: string;
  reviewedAt?: string | null;
  entityType: string;
  entityId: string;
};

const statusLabels: Record<ApprovalStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  CHANGES_REQUESTED: 'Pide cambios',
};

const statusStyles: Record<ApprovalStatus, string> = {
  PENDING: 'border-[#dfeaff] bg-[#edf4ff] text-[#1b5ed6]',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  CHANGES_REQUESTED: 'border-amber-200 bg-amber-50 text-amber-700',
};

export default function HealthApprovalsPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadApprovals() {
      try {
        const response = await fetch('/api/health/approvals?role=compliance-reviewer&organizationId=org-1&clinicId=clinic-1', {
          cache: 'no-store',
        });

        const payload = await response.json();

        if (!isMounted) return;

        if (!response.ok) {
          throw new Error(payload.error || 'No se pudo cargar la cola de aprobaciones');
        }

        setItems(payload.items ?? []);
      } catch (error) {
        console.error('Error loading approvals:', error);

        if (isMounted) {
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadApprovals();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    return {
      pending: items.filter((item) => item.status === 'PENDING').length,
      approved: items.filter((item) => item.status === 'APPROVED').length,
      changes: items.filter((item) => item.status === 'CHANGES_REQUESTED').length,
    };
  }, [items]);

  async function updateApproval(id: string, action: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED') {
    setBusyId(id);

    try {
      const response = await fetch('/api/health/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          action,
          role: 'compliance-reviewer',
          organizationId: 'org-1',
          clinicId: 'clinic-1',
          reviewedBy: 'compliance-reviewer',
          comments: `Aprobación actualizada mediante review human de ${new Date().toLocaleString('es-CL')}.`,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'La aprobación no pudo actualizarse');
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: action,
                reviewer: 'compliance-reviewer',
                reviewedAt: payload.item?.reviewedAt ?? new Date().toISOString(),
              }
            : item,
        ),
      );
    } catch (error) {
      console.error('Approval update failed:', error);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Aprobaciones</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Cola de validación</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="upway-surface rounded-[24px] p-5">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Pendientes</div>
          <div className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">{metrics.pending}</div>
        </div>
        <div className="upway-surface rounded-[24px] p-5">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Aprobadas</div>
          <div className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">{metrics.approved}</div>
        </div>
        <div className="upway-surface rounded-[24px] p-5">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Con cambios</div>
          <div className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">{metrics.changes}</div>
        </div>
      </div>

      {loading ? (
        <div className="upway-surface rounded-[28px] p-5 text-sm text-slate-600">Cargando cola de aprobaciones…</div>
      ) : items.length === 0 ? (
        <div className="upway-surface rounded-[28px] p-5 text-sm text-slate-600">No hay aprobaciones pendientes para esta clínica.</div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="upway-surface rounded-[24px] p-5">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-lg font-black tracking-[-0.04em] text-slate-900">{item.title}</div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${statusStyles[item.status]}`}>
                  {statusLabels[item.status]}
                </span>
              </div>

              <p className="text-sm leading-7 text-slate-600">{item.summary}</p>

              <div className="mt-4 grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid-cols-3">
                <div>Requester: {item.requestedBy}</div>
                <div>Reviewer: {item.reviewer}</div>
                <div>{new Date(item.createdAt).toLocaleString('es-CL')}</div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void updateApproval(item.id, 'APPROVED')}
                  disabled={busyId === item.id}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  onClick={() => void updateApproval(item.id, 'CHANGES_REQUESTED')}
                  disabled={busyId === item.id}
                  className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Solicitar cambios
                </button>
                <button
                  type="button"
                  onClick={() => void updateApproval(item.id, 'REJECTED')}
                  disabled={busyId === item.id}
                  className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
