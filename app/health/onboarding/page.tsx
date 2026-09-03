'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  onboardingStages,
  getHealthStatusForStage,
  getOnboardingStageMeta,
  getOnboardingStageStatus,
  type OnboardingStage,
} from '@/lib/health/onboarding';
import { useBusinessContext } from '@/components/business-context';

type OnboardingForm = {
  clinicName: string;
  specialty: string;
  location: string;
  careModel: string;
  schedule: string;
  priority: string;
  agentName: string;
  mission: string;
  triageRules: string;
  tone: string;
  responseStyle: string;
  policy: string;
  cancellationWindow: string;
  faq: string;
  channel: string;
  webhook: string;
  approval: boolean;
};

const initialForm: OnboardingForm = {
  clinicName: 'Mi clínica',
  specialty: 'Medicina general y urgencias',
  location: 'Providencia, Santiago',
  careModel: 'Triage asistido + atención prioritaria',
  schedule: 'Lun - Vie 08:00 - 20:00',
  priority: 'Urgencias / atención prioritaria / seguimiento',
  agentName: 'Alicia Health Assistant',
  mission: 'Atender pacientes con empatía, aclarar dudas frecuentes, agendar citas y canalizar casos con riesgo a personal humano.',
  triageRules: 'Si el paciente reporta dolor intenso o síntomas agudos, priorizar urgencia.\nSi se detecta posible embarazo, alergia grave o pérdida de consciencia, escalar.\nSi la consulta requiere confirmación clínica, formular preguntas de contexto antes de agendar.',
  tone: 'Empático, claro y profesional',
  responseStyle: 'Breve, humano, claro y sin tecnicismos',
  policy: 'Escalar a humano cuando exista riesgo clínico o no se pueda confirmar la intención del paciente.',
  cancellationWindow: '24 horas antes del turno',
  faq: '¿Cuánto tarda la respuesta? En promedio, 30-90 segundos para consultas urgentes y 2-4 minutos para casos de seguimiento.',
  channel: 'WhatsApp + Vapi',
  webhook: 'WhatsApp Business + Vapi API + CRM',
  approval: true,
};

const parseStoredForm = (input: unknown): Partial<OnboardingForm> => {
  if (!input || typeof input !== 'object') return {};
  const source = input as Record<string, unknown>;

  return {
    clinicName: typeof source.clinicName === 'string' ? source.clinicName : initialForm.clinicName,
    specialty: typeof source.specialty === 'string' ? source.specialty : initialForm.specialty,
    location: typeof source.location === 'string' ? source.location : initialForm.location,
    careModel: typeof source.careModel === 'string' ? source.careModel : initialForm.careModel,
    schedule: typeof source.schedule === 'string' ? source.schedule : initialForm.schedule,
    priority: typeof source.priority === 'string' ? source.priority : initialForm.priority,
    agentName: typeof source.agentName === 'string' ? source.agentName : initialForm.agentName,
    mission: typeof source.mission === 'string' ? source.mission : initialForm.mission,
    triageRules: typeof source.triageRules === 'string' ? source.triageRules : initialForm.triageRules,
    tone: typeof source.tone === 'string' ? source.tone : initialForm.tone,
    responseStyle: typeof source.responseStyle === 'string' ? source.responseStyle : initialForm.responseStyle,
    policy: typeof source.policy === 'string' ? source.policy : initialForm.policy,
    cancellationWindow: typeof source.cancellationWindow === 'string' ? source.cancellationWindow : initialForm.cancellationWindow,
    faq: typeof source.faq === 'string' ? source.faq : initialForm.faq,
    channel: typeof source.channel === 'string' ? source.channel : initialForm.channel,
    webhook: typeof source.webhook === 'string' ? source.webhook : initialForm.webhook,
    approval: typeof source.approval === 'boolean' ? source.approval : initialForm.approval,
  };
};

const stageContent: Record<
  OnboardingStage,
  (form: OnboardingForm, onChange: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => void) => React.ReactNode
> = {
  'clinic-setup': (form, onChange) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Nombre de la clínica</label>
        <input value={form.clinicName} onChange={(event) => onChange('clinicName', event.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Especialidad principal</label>
        <input value={form.specialty} onChange={(event) => onChange('specialty', event.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Ubicación / sucursal</label>
        <input value={form.location} onChange={(event) => onChange('location', event.target.value)} style={inputStyle} />
      </div>
    </div>
  ),
  'specialty-and-care-model': (form, onChange) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Modelo de atención</label>
        <input value={form.careModel} onChange={(event) => onChange('careModel', event.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Horario operativo</label>
        <input value={form.schedule} onChange={(event) => onChange('schedule', event.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Nivel de prioridad</label>
        <input value={form.priority} onChange={(event) => onChange('priority', event.target.value)} style={inputStyle} />
      </div>
    </div>
  ),
  'agent-profile': (form, onChange) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Nombre del agente</label>
        <input value={form.agentName} onChange={(event) => onChange('agentName', event.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Misión del agente</label>
        <textarea value={form.mission} onChange={(event) => onChange('mission', event.target.value)} style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} />
      </div>
    </div>
  ),
  'triage-rules': (form, onChange) => (
    <div style={{ display: 'grid', gap: 12 }}>
      <label style={labelStyle}>Reglas de triaje</label>
      <textarea value={form.triageRules} onChange={(event) => onChange('triageRules', event.target.value)} style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }} />
    </div>
  ),
  'tone-and-voice': (form, onChange) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Tono</label>
        <input value={form.tone} onChange={(event) => onChange('tone', event.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Estilo de respuesta</label>
        <input value={form.responseStyle} onChange={(event) => onChange('responseStyle', event.target.value)} style={inputStyle} />
      </div>
    </div>
  ),
  'policies-and-escalation': (form, onChange) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Política de cancelación</label>
        <input value={form.cancellationWindow} onChange={(event) => onChange('cancellationWindow', event.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Escalación de seguridad</label>
        <textarea value={form.policy} onChange={(event) => onChange('policy', event.target.value)} style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} />
      </div>
    </div>
  ),
  'faq-content': (form, onChange) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>FAQ estratégica</label>
        <textarea value={form.faq} onChange={(event) => onChange('faq', event.target.value)} style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} />
      </div>
    </div>
  ),
  'channel-integration': (form, onChange) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Canales activos</label>
        <input value={form.channel} onChange={(event) => onChange('channel', event.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Webhook / integración</label>
        <input value={form.webhook} onChange={(event) => onChange('webhook', event.target.value)} style={inputStyle} />
      </div>
    </div>
  ),
  'review-and-approve': (form, onChange) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12, background: '#f4f8ff', border: '1px solid #dfe9ff', borderRadius: 14, padding: 16 }}>
        <div style={{ fontWeight: 800, color: '#163557' }}>Resumen de configuración</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#36557c', display: 'grid', gap: 8 }}>
          <li>{form.clinicName}</li>
          <li>{form.specialty}</li>
          <li>{form.agentName}</li>
          <li>{form.channel}</li>
          <li>{form.tone}</li>
        </ul>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#1b3558', fontWeight: 700 }}>
        <input type="checkbox" checked={form.approval} onChange={(event) => onChange('approval', event.target.checked)} />
        Aprobación del responsable clínico
      </label>
    </div>
  ),
  'go-live': (form) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ background: '#ecfff4', border: '1px solid #cfeedd', borderRadius: 14, padding: 18 }}>
        <div style={{ fontWeight: 800, color: '#16492f', marginBottom: 8 }}>Listo para activación</div>
        <div style={{ color: '#2d6e52' }}>La clínica puede pasar a producción con revisión final y monitorización del primer día.</div>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Modo de activación</label>
        <input value={form.approval ? 'Go-live gradual con pruebas de 48h' : 'Pendiente de aprobación del responsable'} readOnly style={inputStyle} />
      </div>
    </div>
  ),
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#4c6686',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  border: '1px solid #dfeaf7',
  borderRadius: 12,
  background: '#f8fbff',
  color: '#17314a',
  padding: '12px 14px',
  fontSize: 14,
  fontWeight: 600,
  outline: 'none',
};

export default function HealthOnboardingPage() {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<OnboardingForm>(initialForm);
  const { clinicId, organizationId } = useBusinessContext();
  const router = useRouter();

  const updateField = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clinicName = form.clinicName.trim() || 'Mi clínica';
      localStorage.setItem('upway-health-clinic-name', clinicName);
      localStorage.setItem('upway-health-organization-name', 'Upway Health');
    }
  }, [form.clinicName]);

  useEffect(() => {
    async function loadExistingSession() {
      try {
        const response = await fetch(`/api/health/onboarding?clinicId=${encodeURIComponent(clinicId)}&organizationId=${encodeURIComponent(organizationId)}`);
        const data = await response.json();
        const nextIndex = onboardingStages.indexOf(data.currentStep ?? onboardingStages[0]);

        let storedForm: Record<string, unknown> = {};
        if (data.formData && typeof data.formData === 'object') {
          storedForm = data.formData as Record<string, unknown>;
        } else if (typeof data.notes === 'string') {
          try {
            const parsedNotes = JSON.parse(data.notes);
            storedForm = parsedNotes && typeof parsedNotes === 'object' ? parsedNotes : {};
          } catch {
            storedForm = {};
          }
        }

        setForm((current) => ({ ...current, ...parseStoredForm(storedForm) }));
        setCurrentStageIndex(nextIndex >= 0 ? nextIndex : 0);
      } catch (error) {
        console.warn('Unable to load onboarding session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadExistingSession();
  }, [clinicId, organizationId]);

  const currentStage = onboardingStages[currentStageIndex];
  const stageMeta = useMemo(() => getOnboardingStageMeta(currentStage), [currentStage]);
  const progress = ((currentStageIndex + 1) / onboardingStages.length) * 100;

  const renderStage = stageContent[currentStage] ?? (() => null);

  const persistCurrentStage = async (nextIndex: number, nextForm = form) => {
    const step = onboardingStages[nextIndex] ?? onboardingStages[0];
    const status =
      nextIndex === onboardingStages.length - 1
        ? 'ACTIVE'
        : nextIndex === onboardingStages.length - 2 && !nextForm.approval
          ? 'NEEDS_CHANGES'
          : getHealthStatusForStage(step);

    try {
      await fetch('/api/health/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          clinicId,
          currentStep: step,
          status,
          notes: JSON.stringify(nextForm),
          formData: nextForm,
        }),
      });
    } catch (error) {
      console.warn('Failed to persist onboarding state:', error);
    }
  };

  const goNext = async () => {
    const nextIndex = Math.min(currentStageIndex + 1, onboardingStages.length - 1);
    setCurrentStageIndex(nextIndex);
    await persistCurrentStage(nextIndex);
  };

  const goPrev = async () => {
    const nextIndex = Math.max(currentStageIndex - 1, 0);
    setCurrentStageIndex(nextIndex);
    await persistCurrentStage(nextIndex);
  };

  const finalizeOnboarding = async () => {
    setIsSubmitting(true);
    const normalizedClinicName = form.clinicName.trim() || 'Mi clínica';

    if (typeof window !== 'undefined') {
      localStorage.setItem('upway-health-clinic-name', normalizedClinicName);
      localStorage.setItem('upway-health-organization-name', 'Upway Health');
    }

    try {
      await persistCurrentStage(onboardingStages.length - 1, {
        ...form,
        clinicName: normalizedClinicName,
      });
      router.push('/health');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (currentStageIndex === onboardingStages.length - 1) {
      await finalizeOnboarding();
      return;
    }

    await goNext();
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.14),_transparent_28%),linear-gradient(180deg,_#f5f9ff_0%,_#edf5ff_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-[#1b5ed6]" />
            Upway Health
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
            {Math.round(progress)}% completado
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
          {isLoading ? (
            <section className="upway-surface rounded-[28px] p-6">
              <div className="text-slate-700 font-semibold">Cargando sesión de onboarding…</div>
            </section>
          ) : (
            <section className="upway-surface rounded-[30px] p-5 md:p-7">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500">Onboarding</div>
                  <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900 md:text-[2rem]">{stageMeta.label}</h1>
                </div>
                <div className="rounded-full border border-[#dfeaff] bg-[#edf4ff] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1b5ed6]">
                  {stageMeta.subtitle}
                </div>
              </div>

              <div className="mb-6 rounded-[20px] border border-slate-200 bg-slate-50/90 p-4 shadow-[0_8px_18px_rgba(15,23,42,0.02)]">
                <p className="text-sm leading-6 text-slate-600">{stageMeta.description}</p>
              </div>

              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
                  <span>Progreso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,_#1b5ed6_0%,_#64a3ff_50%,_#9ad9ff_100%)] shadow-[0_10px_24px_rgba(27,94,214,0.25)] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-5">{renderStage(form, updateField)}</div>

              <div className="mt-7 flex items-center justify-between gap-3">
                <button
                  onClick={goPrev}
                  disabled={currentStageIndex === 0}
                  className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${
                    currentStageIndex === 0
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Anterior
                </button>

                <button
                  onClick={handlePrimaryAction}
                  disabled={isSubmitting}
                  className="rounded-full bg-[linear-gradient(135deg,_#1b5ed6_0%,_#4d8bff_100%)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_18px_40px_rgba(27,94,214,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(27,94,214,0.32)] disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {isSubmitting
                    ? 'Finalizando…'
                    : currentStageIndex === onboardingStages.length - 1
                      ? 'Finalizar activación'
                      : 'Siguiente'}
                </button>
              </div>
            </section>
          )}

          <aside className="upway-surface rounded-[30px] p-5 md:p-6">
            <div className="mb-4 text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500">Checklist</div>

            <div className="space-y-2.5">
              {onboardingStages.map((stage) => {
                const status = getOnboardingStageStatus(currentStage, stage);
                const isCurrent = stage === currentStage;

                return (
                  <div
                    key={stage}
                    className={`flex items-center justify-between gap-3 rounded-[18px] border p-3 transition-all ${
                      isCurrent ? 'border-[#d3e2ff] bg-[#edf5ff]' : 'border-slate-200 bg-white/80'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800">{getOnboardingStageMeta(stage).label}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">{getOnboardingStageMeta(stage).subtitle}</div>
                    </div>
                    <span
                      className={`inline-flex min-w-[72px] items-center justify-center rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
                        status === 'done'
                          ? 'bg-emerald-50 text-emerald-700'
                          : status === 'active'
                            ? 'bg-[#edf5ff] text-[#1b5ed6]'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-[24px] bg-[linear-gradient(135deg,_#0f172a_0%,_#132642_100%)] p-4 text-white shadow-[0_18px_42px_rgba(15,23,42,0.18)]">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-300">Health readiness</div>
              <div className="mt-3 text-4xl font-black tracking-[-0.06em]">{Math.round(((currentStageIndex + 1) / onboardingStages.length) * 100)}%</div>
              <div className="mt-2 text-sm leading-6 text-slate-200">
                Configuración lista para validación clínica y lanzamiento controlado.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
