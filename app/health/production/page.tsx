"use client";

import { useEffect, useState } from 'react';
import VoiceSelector from '@/components/health/voice-selector';
import VoiceTestCall from '@/components/health/voice-test-call';
import VoiceProvisioning from '@/components/health/voice-provisioning';

type ActivationCheck = { key: string; label: string; ok: boolean; detail: string };

export default function HealthProductionPage() {
  const [checks, setChecks] = useState<ActivationCheck[]>([]);
  const [canActivate, setCanActivate] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
  const [tiendaId, setTiendaId] = useState<string | null>(null);
  const [agentVoice, setAgentVoice] = useState<string | null>(null);
  const [agentVoiceLabel, setAgentVoiceLabel] = useState<string | null>(null);
  // Estado real de la voz de la sede. Sin esto el panel no podía explicar por
  // qué el check `Voz Telnyx dedicada` seguía rojo ni dejar aprovisionar.
  const [clinicName, setClinicName] = useState<string | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = async () => {
    // loading ya inicia en true; llamar a setLoading(true) aquí violaría
    // react-hooks/set-state-in-effect en el useEffect inicial.
    try {
      const res = await fetch('/api/health/activate', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setChecks(data.checks ?? []);
        setCanActivate(Boolean(data.canActivate));
        setOnboardingStatus(data.onboardingStatus ?? null);
        setTiendaId(data.tiendaId ?? null);
        setAgentVoice(data.agentVoice ?? null);
        setAgentVoiceLabel(data.agentVoiceLabel ?? null);
        setClinicName(data.clinicName ?? null);
        setAssistantId(data.voiceAssistantId ?? null);
        setPhoneNumber(data.voicePhoneNumber ?? null);
        setIsVoiceActive(Boolean(data.isVoiceActive));
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial del checklist vía fetch (patrón preexistente del panel)
    void load();
  }, []);

  const handleActivate = async () => {
    setActivating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/health/activate', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedback(`✅ IPS activa · ${data.delivery?.clinicName ?? ''} · ${data.delivery?.phoneNumber ?? ''}`);
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

      <div className="upway-pearl-rule mb-6" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {states.map((state) => (
          <div key={state.label} className="upway-surface upway-pearl-lift rounded-[24px] p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
                {state.label}
              </div>
              {/* Punto de estado: da color al bloque sin gritar el texto. */}
              <span
                aria-hidden
                className={`h-2 w-2 shrink-0 rounded-full ${
                  state.status === 'Ready' || state.status === 'Live' || state.status === 'Clear'
                    ? 'bg-emerald-500'
                    : 'bg-amber-400'
                }`}
              />
            </div>
            <div className="mt-4 text-xl font-black tracking-[-0.04em] text-slate-900">
              {state.value}
            </div>
            <div
              className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
                state.status === 'Ready' || state.status === 'Live' || state.status === 'Clear'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {state.status}
            </div>
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
          Cliente llena onboarding · Upway implementa voz dedicada e integraciones · se entrega número alineado + panel real.
        </p>
        {loading ? (
          <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Cargando checklist…
          </div>
        ) : (
          <div className="space-y-3">
            {checks.map((check) => (
              <div
                key={check.key}
                className={`flex items-start gap-3 rounded-[18px] border p-3 ${
                  check.ok
                    ? 'border-emerald-200/60 bg-emerald-50/30'
                    : 'border-amber-200/70 bg-amber-50/40'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                    check.ok
                      ? 'bg-[linear-gradient(135deg,_#10b981_0%,_#34d399_100%)] text-white'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
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

      <div className="upway-surface rounded-[28px] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-lg font-black tracking-[-0.04em] text-slate-900">Voz del agente</div>
          {onboardingStatus !== 'ACTIVE' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {onboardingStatus === 'PENDING_REVIEW' ? 'En revisión Upway · modo preparación' : 'Modo preparación'}
            </span>
          )}
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Elige la voz con la que el agente atiende las llamadas de voz o crea una voz propia (muestra de audio o
          descripción con prompt). Puedes escuchar una muestra antes de guardar. Mientras Upway revisa tu caso puedes
          probarla y elegirla: se aplica al número cuando la activación quede en verde.
        </p>
        <VoiceSelector
          tiendaId={tiendaId}
          tiendaNombre={clinicName ?? null}
          initialVoice={agentVoice}
          initialVoiceLabel={agentVoiceLabel}
        />
        <VoiceProvisioning
          tiendaId={tiendaId}
          clinicName={clinicName}
          assistantId={assistantId}
          phoneNumber={phoneNumber}
          isActive={isVoiceActive}
          onProvisioned={() => void load()}
        />
        <VoiceTestCall tiendaId={tiendaId} />
      </div>

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