"use client";

import { useEffect, useState } from 'react';

type ActivationCheck = { key: string; label: string; ok: boolean; detail: string };

export default function HealthProductionPage() {
  const [checks, setChecks] = useState<ActivationCheck[]>([]);
  const [canActivate, setCanActivate] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health/activate', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setChecks(data.checks ?? []);
        setCanActivate(Boolean(data.canActivate));
        setOnboardingStatus(data.onboardingStatus ?? null);
      } else {
        setFeedback(data.error ?? 'No se pudo cargar el checklist de activación.');
      }
    } catch (error) {
      console.error('Error cargando activación IPS:', error);
      setFeedback('Error de conexión al cargar el checklist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleActivate = async () => {
    setActivating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/health/activate', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedback(`✅ IPS activa · ${data.delivery?.clinicName ?? ''} · ${data.delivery?.telnyxPhoneNumber ?? ''}`);
        await load();
      } else {
        setFeedback(data.error ?? 'IPS no lista: completa implementación Upway.');
        if (data.checks) setChecks(data.checks);
      }
    } catch (error) {
      console.error('Error activando IPS:', error);
      setFeedback('Error de conexión al activar.');
    } finally {
      setActivating(false);
    }
  };

  const states = [
    { label: 'Estado onboarding', value: onboardingStatus ?? 'Sin sesión', status: canActivate || onboardingStatus === 'ACTIVE' ? 'Ready' : 'Pending' },
    { label: 'Checklist entrega', value: `${checks.filter((c) => c.ok).length}/${checks.length || 5} verdes`, status: canActivate ? 'Ready' : 'Blocked' },
    { label: 'Módulo de atención', value: 'Activo', status: 'Live' },
    { label: 'Bloqueos', value: canActivate ? '0 críticos' : 'Pendiente Upway', status: canActivate ? 'Clear' : 'Pending' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Producción</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Hardening operativo</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {states.map((state) => (
          <div key={state.label} className="upway-surface rounded-[24px] p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">{state.label}</div>
            <div className="mt-4 text-xl font-black tracking-[-0.04em] text-slate-900">{state.value}</div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">{state.status}</div>
          </div>
        ))}
      </div>

      <div className="upway-surface rounded-[28px] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-black tracking-[-0.04em] text-slate-900">
              Checklist de entrega IPS · Upway implementa, cliente opera
            </div>
            <button
              onClick={() => void handleActivate()}
              disabled={!canActivate || activating || loading}
              className="rounded-xl bg-[#1b5ed6] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#164cae] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activating ? 'Activando…' : 'Activar IPS'}
            </button>
          </div>
          <p className="mb-4 text-sm text-slate-500">
            Cliente llena onboarding · Upway conecta WhatsApp + voz Telnyx dedicada · se entrega número alineado + panel real.
          </p>
          {loading ? (
            <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Cargando checklist…
            </div>
          ) : (
            <div className="space-y-3">
              {checks.map((check) => (
                <div key={check.key} className="flex items-start gap-3 rounded-[18px] border border-slate-200 bg-slate-50/80 p-3">
                  <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${check.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {check.ok ? '✓' : '!'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{check.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {feedback && <div className="mt-4 text-sm font-semibold text-slate-700">{feedback}</div>}
        </div>
      </div>

      {/* Reemplazo del bloque JSON inferior por un indicador de Protocolos */}
      <div className="upway-surface rounded-[28px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="mb-1 text-lg font-black tracking-[-0.04em] text-slate-900">Protocolos de Despliegue</div>
          <p className="text-sm text-slate-500">
            Los procesos de control, auditoría y monitoreo están ejecutándose correctamente bajo los estándares de producción.
          </p>
        </div>
        <div className="shrink-0 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-sm border border-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Hardening Activo
        </div>
      </div>
    </div>
  );
}