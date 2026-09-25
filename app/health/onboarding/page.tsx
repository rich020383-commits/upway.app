'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  onboardingStages,
  getHealthStatusForStage,
  getOnboardingStageMeta,
  getOnboardingStageStatus,
  type OnboardingStage,
} from '@/lib/health/onboarding';
import { FACILITY_TYPE_OPTIONS, IDENTITY_MODULE_COP, IDENTITY_MODULE_LABEL, type FacilityType } from '@/lib/health/plans';
import { getHealthPlan, estimateMinutesFromVolume, formatCOP } from '@/lib/health/plans-enterprise';
import { PlanPicker } from '@/components/health/plan-picker';
import { useBusinessContext } from '@/components/business-context';
import { Tooltip } from '@/components/ui/tooltip';

type OnboardingForm = {
  clinicName: string;
  specialty: string;
  location: string;
  facilityType: FacilityType | '';
  legalName: string;
  nit: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  dailyCalls: string;
  avgCallMinutes: string;
  planId: string;
  preferredAreaCode: string;
  existingPhone: string;
  crmOrAgenda: string;
  integrationMode: string;
  hisSystem: string;
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
  /** WhatsApp propio del cliente: 'si' = trae token Meta Developer; '' / 'no' = solo voz. */
  whatsappOwn: string;
  webhook: string;
  /** Add-on modulo de identidad conforme (Res. 866/2021) elegido por el cliente. */
  withIdentityModule: boolean;
  approval: boolean;
};

// Todo vacio. Los textos de ejemplo pasaron a ser placeholders en los inputs.
const initialForm: OnboardingForm = {
  clinicName: '',
  specialty: '',
  location: '',
  facilityType: '',
  legalName: '',
  nit: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  dailyCalls: '',
  avgCallMinutes: '3',
  planId: '',
  preferredAreaCode: '',
  existingPhone: '',
  crmOrAgenda: '',
  integrationMode: '',
  hisSystem: '',
  careModel: '',
  schedule: '',
  priority: '',
  agentName: '',
  mission: '',
  triageRules: '',
  tone: '',
  responseStyle: '',
  policy: '',
  cancellationWindow: '',
  faq: '',
  channel: '',
  whatsappOwn: '',
  webhook: '',
  withIdentityModule: false,
  approval: false, // Debe empezar desmarcado
};
// 🔥 Ayuda contextual por campo: explica qué se pide y por qué importa, para
// que el responsable clínico pueda completarlo sin adivinar el criterio.
const fieldHelp: Partial<Record<keyof OnboardingForm, string>> = {
  clinicName: 'Nombre comercial con el que tus pacientes identificaran la operacion.',
  specialty: 'Especialidad medica principal. Define el enfoque del agente y del triaje.',
  location: 'Sucursal o zona de atencion. Ayuda a contextualizar direcciones y horarios.',
  facilityType: 'Tipo de sede: define el plan recomendado y la capacidad simultanea.',
  legalName: 'Razon social para facturacion y contrato.',
  nit: 'NIT de la IPS/clinica. Necesario para activar billing.',
  contactName: 'Persona operativa que Upway contactara durante la implementacion.',
  contactPhone: 'Celular de contacto del responsable operativo.',
  contactEmail: 'Email del contacto para entregables y acceso al panel.',
  dailyCalls: 'Promedio de llamadas entrantes por dia (estimacion honesta).',
  avgCallMinutes: 'Duracion media de una llamada en minutos (tipico 2-5).',
  planId: 'Plan comercial con minutos incluidos y overage transparente.',
  preferredAreaCode: 'Indicativo preferido del numero dedicado (ej. 601 Bogota).',
  existingPhone: 'Si quieres portar un numero actual, indicalo aqui.',
  crmOrAgenda: 'Sistema de citas actual (Google Calendar, Softmedical, etc.).',
  integrationMode: 'Como va a consumir su sistema el dato del paciente. Define el trabajo de implementacion.',
  hisSystem: 'Historia clinica o sistema del cliente que recibira el dato conforme.',
  careModel: 'Cómo se atiende al paciente: triaje asistido, atención prioritaria, etc.',
  schedule: 'Horario real de operación. El agente lo usa para coordinar citas y urgencias.',
  priority: 'Niveles de prioridad con los que el agente clasificará cada consulta.',
  agentName: 'Nombre del asistente clínico que verán tus pacientes.',
  mission: 'Objetivo y límites del agente: qué debe resolver y qué debe escalar.',
  triageRules: 'Reglas de clasificación: cuándo priorizar, redirigir o escalar a humano.',
  tone: 'Tono verbal del agente (empático, formal, cercano…).',
  responseStyle: 'Forma de responder: longitud, lenguaje y nivel de detalle.',
  cancellationWindow: 'Anticipación mínima para cancelar o reprogramar sin penalización.',
  policy: 'Reglas de escalamiento y seguridad ante riesgo clínico.',
  faq: 'Preguntas frecuentes que el agente responderá de forma automática.',
  channel: 'Voz dedicada 24/7 e integraciones incluidas. Por politica interna de Upway no usamos ni integramos WhatsApp ni Meta.',
  whatsappOwn: 'Canal retirado: por politica interna de Upway no usamos ni integramos WhatsApp ni Meta. El canal oficial es la voz IA sobre linea telefonica.',
  withIdentityModule: 'Add-on por sede/mes: el agente pide el documento con catalogo cerrado (Res. 866/2021), lo confirma digito a digito y entrega el registro con evidencia.',
  webhook: 'Integraciones a conectar (agenda, CRM). Upway las implementa.',
};
function FieldHint({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-5 text-slate-500">
      <span className="mt-0.5 text-[#1b5ed6]">ℹ️</span>
      <span>{text}</span>
    </p>
  );
}

const strOf = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);

const parseStoredForm = (input: unknown): Partial<OnboardingForm> => {
  if (!input || typeof input !== 'object') return {};
  const source = input as Record<string, unknown>;
  const facility = strOf(source.facilityType);
  const validFacility = FACILITY_TYPE_OPTIONS.some((f) => f.id === facility)
    ? (facility as FacilityType)
    : initialForm.facilityType;

  const numStr = (v: unknown, fb: string) =>
    typeof v === 'string' ? v : typeof v === 'number' && Number.isFinite(v) ? String(v) : fb;

  return {
    clinicName: strOf(source.clinicName, initialForm.clinicName),
    specialty: strOf(source.specialty, initialForm.specialty),
    location: strOf(source.location, initialForm.location),
    facilityType: validFacility,
    legalName: strOf(source.legalName),
    nit: strOf(source.nit),
    contactName: strOf(source.contactName),
    contactPhone: strOf(source.contactPhone),
    contactEmail: strOf(source.contactEmail),
    dailyCalls: numStr(source.dailyCalls, ''),
    avgCallMinutes: numStr(source.avgCallMinutes, '3'),
    planId: strOf(source.planId),
    preferredAreaCode: strOf(source.preferredAreaCode),
    existingPhone: strOf(source.existingPhone),
    crmOrAgenda: strOf(source.crmOrAgenda),
    integrationMode: strOf(source.integrationMode),
    hisSystem: strOf(source.hisSystem),
    careModel: strOf(source.careModel, initialForm.careModel),
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
    whatsappOwn: strOf(source.whatsappOwn),
    webhook: typeof source.webhook === 'string' ? source.webhook : initialForm.webhook,
    withIdentityModule: typeof source.withIdentityModule === 'boolean' ? source.withIdentityModule : initialForm.withIdentityModule,
    approval: typeof source.approval === 'boolean' ? source.approval : initialForm.approval,
  };
};

const stageContent: Record<
  OnboardingStage,
  (form: OnboardingForm, onChange: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => void) => React.ReactNode
> = {
  'clinic-setup': (form, onChange) => (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #fde68a', background: '#fffbeb', fontSize: 12, color: '#92400e' }}>
        <span style={{ fontWeight: 700 }}>Campos obligatorios (*)</span> — Son necesarios para procesar tu solicitud.
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={labelStyle}>Nombre comercial <span style={{ color: '#dc2626' }}>*</span></label>
        <input placeholder="Ej. IPS Norte Salud" value={form.clinicName} onChange={(event) => onChange('clinicName', event.target.value)} style={{ ...inputStyle, borderColor: form.clinicName.trim() ? undefined : '#fca5a5' }} />
        <FieldHint text={fieldHelp.clinicName} />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={labelStyle}>Razon social</label>
        <input placeholder="Ej. Norte Salud IPS S.A.S." value={form.legalName} onChange={(event) => onChange('legalName', event.target.value)} style={inputStyle} />
        <FieldHint text={fieldHelp.legalName} />
      </div>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))' }}>
        <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
          <label style={labelStyle}>NIT <span style={{ color: '#dc2626' }}>*</span></label>
          <input placeholder="Ej. 900123456-1" value={form.nit} onChange={(event) => onChange('nit', event.target.value)} style={{ ...inputStyle, borderColor: form.nit.trim() ? undefined : '#fca5a5' }} />
          <FieldHint text={fieldHelp.nit} />
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={labelStyle}>Ubicacion / sucursal</label>
          <input placeholder="Ej. Chapinero, Bogota" value={form.location} onChange={(event) => onChange('location', event.target.value)} style={inputStyle} />
          <FieldHint text={fieldHelp.location} />
        </div>
      </div>
      <div style={{ padding: 12, borderRadius: 12, border: '1px solid #dfe9ff', background: '#f4f8ff', display: 'grid', gap: 10 }}>
        <div style={{ fontWeight: 800, color: '#163557' }}>Contacto de implementacion (white-glove)</div>
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={labelStyle}>Nombre del contacto <span style={{ color: '#dc2626' }}>*</span></label>
          <input placeholder="Ej. Ana Operaciones" value={form.contactName} onChange={(event) => onChange('contactName', event.target.value)} style={{ ...inputStyle, borderColor: form.contactName.trim() ? undefined : '#fca5a5' }} />
          <FieldHint text={fieldHelp.contactName} />
        </div>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))' }}>
          <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
            <label style={labelStyle}>Celular <span style={{ color: '#dc2626' }}>*</span></label>
            <input placeholder="Ej. 3001234567" value={form.contactPhone} onChange={(event) => onChange('contactPhone', event.target.value)} style={{ ...inputStyle, borderColor: form.contactPhone.trim() ? undefined : '#fca5a5' }} />
            <FieldHint text={fieldHelp.contactPhone} />
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <label style={labelStyle}>Email <span style={{ color: '#dc2626' }}>*</span></label>
            <input type="email" placeholder="Ej. ops@ips.com" value={form.contactEmail} onChange={(event) => onChange('contactEmail', event.target.value)} style={{ ...inputStyle, borderColor: form.contactEmail.trim() ? undefined : '#fca5a5' }} />
            <FieldHint text={fieldHelp.contactEmail} />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={labelStyle}>Especialidad principal</label>
        <input placeholder="Ej. Medicina general y urgencias" value={form.specialty} onChange={(event) => onChange('specialty', event.target.value)} style={inputStyle} />
        <FieldHint text={fieldHelp.specialty} />
      </div>
    </div>
  ),
  'plan-and-volume': (form, onChange) => (
    <PlanPicker form={form} onChange={onChange} hint={(t) => <FieldHint text={t} />} />
  ),
  'specialty-and-care-model': (form, onChange) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Modelo de atención</label>
        <input placeholder="Ej. Triage asistido + atención prioritaria" value={form.careModel} onChange={(event) => onChange('careModel', event.target.value)} style={inputStyle} />
        <FieldHint text={fieldHelp.careModel} />
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Horario operativo</label>
        <input placeholder="Ej. Lun - Vie 08:00 - 20:00" value={form.schedule} onChange={(event) => onChange('schedule', event.target.value)} style={inputStyle} />
        <FieldHint text={fieldHelp.schedule} />
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Nivel de prioridad</label>
        <input placeholder="Ej. Urgencias / atención prioritaria / seguimiento" value={form.priority} onChange={(event) => onChange('priority', event.target.value)} style={inputStyle} />
        <FieldHint text={fieldHelp.priority} />
      </div>
    </div>
  ),
  'agent-profile': (form, onChange) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Nombre del agente</label>
        <input placeholder="Ej. Alicia Health Assistant" value={form.agentName} onChange={(event) => onChange('agentName', event.target.value)} style={inputStyle} />
        <FieldHint text={fieldHelp.agentName} />
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Misión del agente</label>
        <textarea placeholder="Ej. Atender pacientes con empatía, aclarar dudas frecuentes..." value={form.mission} onChange={(event) => onChange('mission', event.target.value)} style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} />
        <FieldHint text={fieldHelp.mission} />
      </div>
    </div>
  ),
  'triage-rules': (form, onChange) => (
    <div style={{ display: 'grid', gap: 12 }}>
      <label style={labelStyle}>Reglas de triaje</label>
      <textarea placeholder="Ej. Si el paciente reporta dolor intenso, priorizar urgencia..." value={form.triageRules} onChange={(event) => onChange('triageRules', event.target.value)} style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }} />
      <FieldHint text={fieldHelp.triageRules} />
    </div>
  ),
  'tone-and-voice': (form, onChange) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Tono</label>
        <input placeholder="Ej. Empático, claro y profesional" value={form.tone} onChange={(event) => onChange('tone', event.target.value)} style={inputStyle} />
        <FieldHint text={fieldHelp.tone} />
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Estilo de respuesta</label>
        <input placeholder="Ej. Breve, humano, claro y sin tecnicismos" value={form.responseStyle} onChange={(event) => onChange('responseStyle', event.target.value)} style={inputStyle} />
        <FieldHint text={fieldHelp.responseStyle} />
      </div>
    </div>
  ),
  'policies-and-escalation': (form, onChange) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Política de cancelación</label>
        <input placeholder="Ej. 24 horas antes del turno" value={form.cancellationWindow} onChange={(event) => onChange('cancellationWindow', event.target.value)} style={inputStyle} />
        <FieldHint text={fieldHelp.cancellationWindow} />
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Escalación de seguridad</label>
        <textarea placeholder="Ej. Escalar a humano cuando exista riesgo clínico..." value={form.policy} onChange={(event) => onChange('policy', event.target.value)} style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} />
        <FieldHint text={fieldHelp.policy} />
      </div>
    </div>
  ),
  'faq-content': (form, onChange) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>FAQ estratégica</label>
        <textarea placeholder="Ej. ¿Cuánto tarda la respuesta? En promedio, 30-90 segundos..." value={form.faq} onChange={(event) => onChange('faq', event.target.value)} style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} />
        <FieldHint text={fieldHelp.faq} />
      </div>
    </div>
  ),
  'channel-integration': (form, onChange) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: 14, fontSize: 13, color: '#14532d' }}>
        Upway implementa por ti (white-glove): voz dedicada 24/7 e integraciones con tu agenda, sin tokens ni consolas.
        Por politica interna de Upway no usamos ni integramos WhatsApp ni Meta: el canal oficial es la voz IA sobre linea telefonica.
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Canales deseados</label>
        <input placeholder="Ej. Voz dedicada 24/7 e integraciones con la agenda" value={form.channel} onChange={(event) => onChange('channel', event.target.value)} style={inputStyle} />
        <FieldHint text={fieldHelp.channel} />
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Agenda / integracion a conectar</label>
        <input placeholder="Ej. Google Calendar + Softmedical" value={form.webhook} onChange={(event) => onChange('webhook', event.target.value)} style={inputStyle} />
        <FieldHint text={fieldHelp.webhook} />
      </div>
    </div>
  ),
  'review-and-approve': (form, onChange) => (
    <ReviewSummary form={form} onChange={onChange} />
  ),
  'go-live': (form) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ background: '#edf5ff', border: '1px solid #d3e2ff', borderRadius: 14, padding: 18 }}>
        <div style={{ fontWeight: 800, color: '#1b5ed6', marginBottom: 8 }}>Caso listo para revisión Upway</div>
        <div style={{ color: '#36557c' }}>
          Al enviar, tu caso pasa a revisión de Upway: validamos el caso de uso y definimos el costo de implementación
          y la recarga para iniciar operación. Nada se activa hasta que Upway lo apruebe y se fondee la recarga.
        </div>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={labelStyle}>Estado del caso</label>
        <input value={form.approval ? 'Checklist completo · pendiente revisión Upway' : 'Checklist incompleto: falta aprobación del responsable'} readOnly style={inputStyle} />
      </div>
    </div>
  ),
};

function PlanReviewBox({ form }: { form: OnboardingForm }) {
  const plan = getHealthPlan(form.planId);
  const mins = estimateMinutesFromVolume(Number(form.dailyCalls) || 0, Number(form.avgCallMinutes) || 0);
  return (
    <div style={{ display: 'grid', gap: 8, background: '#0f172a', color: '#e2e8f0', borderRadius: 14, padding: 16 }}>
      <div style={{ fontWeight: 800 }}>Plan + volumen</div>
      <div style={{ fontSize: 13, color: '#cbd5e1' }}>
        {plan ? `${plan.name} · ${formatCOP(plan.monthlyCOP)}/mes · setup ${formatCOP(plan.setupCOP)}` : 'Sin plan elegido (elige en paso Plan y volumen).'}
        {form.withIdentityModule && plan ? ` + ${formatCOP(IDENTITY_MODULE_COP)} identidad` : ''}
      </div>
      <div style={{ fontSize: 13, color: '#cbd5e1' }}>
        ~{mins.toLocaleString('es-CO')} min/mes estimados · {form.dailyCalls || '?'} llamadas/dia · NIT {form.nit || 'pendiente'} · contacto {form.contactName || 'pendiente'}
      </div>
    </div>
  );
}

function ReviewSummary({ form, onChange }: {
  form: OnboardingForm;
  onChange: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <PlanReviewBox form={form} />
      <div style={{ display: 'grid', gap: 12, background: '#f4f8ff', border: '1px solid #dfe9ff', borderRadius: 14, padding: 16 }}>
        <div style={{ fontWeight: 800, color: '#163557' }}>Resumen de configuracion</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#36557c', display: 'grid', gap: 8 }}>
          <li>{form.clinicName || 'Sin nombre definido'}</li>
          <li>{form.specialty || 'Sin especialidad definida'}</li>
          <li>{form.agentName || 'Sin nombre de agente'}</li>
          <li>{form.channel || 'Sin canales configurados'}</li>
          <li>{form.tone || 'Tono no especificado'}</li>
        </ul>
      </div>
      <div style={{ display: 'grid', gap: 8, background: '#f8fbff', border: '1px solid #dfe9ff', borderRadius: 14, padding: 16 }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: '#1b3558', fontWeight: 700, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.withIdentityModule} onChange={(event) => onChange('withIdentityModule', event.target.checked)} />
          <span>
            Contratar {IDENTITY_MODULE_LABEL} (+ {formatCOP(IDENTITY_MODULE_COP)}/sede/mes + IVA)
          </span>
        </label>
        <FieldHint text={fieldHelp.withIdentityModule} />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#1b3558', fontWeight: 700, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.approval} onChange={(event) => onChange('approval', event.target.checked)} />
          Aprobacion del responsable clinico
        </label>
        <FieldHint text="Marca esta casilla solo cuando el responsable clinico haya validado la configuracion. Sin aprobacion, el sistema no activara el modo go-live." />
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#4c6686',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  border: '1px solid #dfeaf7',
  borderRadius: 10,
  background: '#f8fbff',
  color: '#17314a',
  padding: '9px 12px',
  fontSize: 13,
  fontWeight: 600,
  outline: 'none',
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
};
// 🧭 Explicación de cada etapa para guiar al responsable clínico sin que adivine.
const stageHelp: Record<OnboardingStage, { title: string; hint: string }> = {
  'clinic-setup': {
    title: 'Identifica tu operación',
    hint: 'Define cómo se llama tu clínica, su foco y dónde atiende. Esto personaliza el agente y el triaje.',
  },
  'plan-and-volume': {
    title: 'Plan y volumen',
    hint: 'Estima llamadas, elige plan honesto con minutos incluidos y deja intake listo para que Upway implemente.',
  },
  'specialty-and-care-model': {
    title: 'Modelo de atencion',
    hint: 'Explica como atiendes (triaje, prioridad) y en que horario. El agente lo usa para coordinar.',
  },
  'agent-profile': {
    title: 'Personalidad del agente',
    hint: 'Dale nombre y misión al asistente clínico que verán tus pacientes.',
  },
  'triage-rules': {
    title: 'Reglas de clasificación',
    hint: 'Define cuándo priorizar, redirigir o escalar a un humano según el riesgo.',
  },
  'tone-and-voice': {
    title: 'Tono y estilo',
    hint: 'Ajusta cómo habla el agente: empático, formal, breve o detallado.',
  },
  'policies-and-escalation': {
    title: 'Políticas y seguridad',
    hint: 'Establece cancelaciones y cuándo escalar ante riesgo clínico.',
  },
  'faq-content': {
    title: 'Preguntas frecuentes',
    hint: 'Carga las dudas que el agente responderá de forma automática.',
  },
  'channel-integration': {
    title: 'Canales e integraciones',
    hint: 'Voz dedicada 24/7 e integraciones con tu agenda. Por politica interna de Upway no usamos ni integramos WhatsApp ni Meta.',
  },
  'review-and-approve': {
    title: 'Revisión final',
    hint: 'Verifica el resumen y aprueba la configuración para lanzar.',
  },
  'go-live': {
    title: 'Activación',
    hint: 'Confirma el modo de lanzamiento y pasa a producción.',
  },
};

export default function HealthOnboardingPage() {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<OnboardingForm>(initialForm);
  const { clinicId, organizationId } = useBusinessContext();

  const updateField = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  // P1: estado del gate de identidad conforme (Res. 866/2021), leido del
  // checklist interno de activacion para mostrarlo en la etapa de revision.
  const [identityGate, setIdentityGate] = useState<{ loading: boolean; ok: boolean; detail: string } | null>(null);

  const validateRequiredFields = (): string[] => {
    const errors: string[] = [];
    if (!form.clinicName.trim()) errors.push('El nombre de la clínica es obligatorio');
    if (!form.nit.trim()) errors.push('El NIT es obligatorio');
    if (!form.contactName.trim()) errors.push('El nombre de contacto es obligatorio');
    if (!form.contactPhone.trim()) errors.push('El teléfono de contacto es obligatorio');
    if (!form.contactEmail.trim()) errors.push('El email de contacto es obligatorio');
    return errors;
  };


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clinicName = form.clinicName.trim() || 'Nueva Clínica';
      localStorage.setItem('upway-health-clinic-name', clinicName);
      // 🔥 Ahora guarda el ID real de la organización, no un nombre hardcodeado
      localStorage.setItem('upway-health-organization-name', organizationId || 'Upway Health');
    }
  }, [form.clinicName, organizationId]);

  useEffect(() => {
    async function loadExistingSession() {
      try {
        const response = await fetch(`/api/health/onboarding?clinicId=${encodeURIComponent(clinicId)}&organizationId=${encodeURIComponent(organizationId)}`, { credentials: 'include' });
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
        // P2: si el caso ya fue enviado a revision (o aprobado), bloquear el
        // reenvio para no duplicar correos ni approvals de Upway.
        if (['PENDING_REVIEW', 'APPROVED', 'ACTIVE'].includes(data.status)) {
          setSubmitted(true);
        }
      } catch (error) {
        console.warn('Unable to load onboarding session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadExistingSession();
  }, [clinicId, organizationId]);

  // P1: el diferenciador del producto es voz + dato conforme. Al llegar a la
  // revision, el cliente ve el estado real del gate de identidad (no lo adivina).
  useEffect(() => {
    const stage = onboardingStages[currentStageIndex];
    if (stage !== 'review-and-approve') return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gate de identidad al entrar a la etapa de revision (patron preexistente del panel)
    setIdentityGate({ loading: true, ok: false, detail: '' });
    fetch('/api/health/activate', { credentials: 'include' })
      .then((response) => response.json())
      .then((data: { checks?: Array<{ key: string; ok: boolean; detail: string }> }) => {
        if (cancelled) return;
        const check = Array.isArray(data.checks) ? data.checks.find((c) => c.key === 'identity') : null;
        setIdentityGate(
          check
            ? { loading: false, ok: Boolean(check.ok), detail: String(check.detail ?? '') }
            : { loading: false, ok: true, detail: 'Sin servicios que exijan documento todavia: no hay captura conforme pendiente.' }
        );
      })
      .catch(() => {
        if (!cancelled) {
          setIdentityGate({ loading: false, ok: true, detail: 'No se pudo verificar el estado de identidad ahora mismo (no bloquea el envio).' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentStageIndex]);

  const currentStage = onboardingStages[currentStageIndex];
  const stageMeta = useMemo(() => getOnboardingStageMeta(currentStage), [currentStage]);
  const progress = ((currentStageIndex + 1) / onboardingStages.length) * 100;

  const renderStage = stageContent[currentStage] ?? (() => null);

  const persistCurrentStage = async (nextIndex: number, nextForm = form) => {
    const step = onboardingStages[nextIndex] ?? onboardingStages[0];
    const status =
      nextIndex === onboardingStages.length - 1
        ? 'PENDING_REVIEW'
        : nextIndex === onboardingStages.length - 2 && !nextForm.approval
          ? 'NEEDS_CHANGES'
          : getHealthStatusForStage(step);

    try {
      await fetch('/api/health/onboarding', {
        method: 'POST',
        credentials: 'include',
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
    // P4: validar los obligatorios al salir del paso 1, no recien al final:
    // un NIT o contacto faltante no se descubre en el ultimo paso.
    if (currentStageIndex === 0) {
      const errors = validateRequiredFields();
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
    }
    setValidationErrors([]);
    const nextIndex = Math.min(currentStageIndex + 1, onboardingStages.length - 1);
    setCurrentStageIndex(nextIndex);
    await persistCurrentStage(nextIndex);
  };

  const goPrev = async () => {
    const nextIndex = Math.max(currentStageIndex - 1, 0);
    setCurrentStageIndex(nextIndex);
    await persistCurrentStage(nextIndex);
  };
  const goToStage = async (index: number) => {
    const clamped = Math.max(0, Math.min(index, onboardingStages.length - 1));
    setCurrentStageIndex(clamped);
    await persistCurrentStage(clamped);
  };

  const finalizeOnboarding = async () => {
    if (submitted) return; // P2: ya esta en revision de Upway; no reenviar.
    setValidationErrors([]);
    const errors = validateRequiredFields();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    const normalizedClinicName = form.clinicName.trim() || 'Nueva Clínica';

    if (typeof window !== 'undefined') {
      localStorage.setItem('upway-health-clinic-name', normalizedClinicName);
      localStorage.setItem('upway-health-organization-name', organizationId || 'Upway Health');
    }

    try {
      await persistCurrentStage(onboardingStages.length - 1, {
        ...form,
        clinicName: normalizedClinicName,
      });

      // Notificar al equipo de Upway por correo
      try {
        const notifyPayload = {
          formData: { ...form, clinicName: normalizedClinicName },
          clinicName: normalizedClinicName,
          nit: form.nit,
        };
        console.log('[onboarding] Enviando notificación:', notifyPayload);
        
        const notifyResponse = await fetch('/api/health/notify', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notifyPayload),
        });
        
        const notifyResult = await notifyResponse.json();
        console.log('[onboarding] Respuesta de notificación:', notifyResult);
        
        if (!notifyResult.ok) {
          console.warn('[onboarding] Notificación falló:', notifyResult.warning || notifyResult.error);
        }
      } catch (notifyError) {
        console.error('[onboarding] Error enviando notificación:', notifyError);
      }

      setSubmitted(true);
    } catch (error) {
      console.warn('No se pudo persistir el onboarding de health:', error);
      setValidationErrors(['Error al guardar el onboarding. Por favor intenta de nuevo.']);
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
    <div className="mx-auto w-full max-w-6xl">
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between gap-3">
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
            <section className="upway-surface rounded-[24px] p-4 md:p-5">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500">
                    Paso {currentStageIndex + 1} de {onboardingStages.length} · Onboarding
                  </div>
                  <h1 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900 md:text-[1.7rem]">{stageMeta.label}</h1>
                </div>
                <div className="rounded-full border border-[#dfeaff] bg-[#edf4ff] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1b5ed6]">
                  {stageMeta.subtitle}
                </div>
              </div>

              <div className="mb-5 rounded-[18px] border border-[#dfeaff] bg-[#f4f9ff] p-3 shadow-[0_8px_18px_rgba(27,94,214,0.03)]">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-base leading-none" aria-hidden="true">💡</span>
                  <p className="text-sm leading-6 text-slate-700">
                    <span className="font-bold text-[#1b5ed6]">{stageHelp[currentStage]?.hint ?? stageMeta.description}</span>
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{stageMeta.description}</p>
              </div>

              <div className="mb-5">
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

              {currentStage === 'review-and-approve' && identityGate && (
                <div
                  className={`mt-5 rounded-[18px] border p-4 ${
                    identityGate.loading
                      ? 'border-slate-200 bg-slate-50'
                      : identityGate.ok
                        ? 'border-emerald-200 bg-emerald-50/70'
                        : 'border-amber-300 bg-amber-50'
                  }`}
                >
                  <p className={`text-sm font-bold ${identityGate.ok ? 'text-emerald-800' : 'text-amber-800'}`}>
                    Identidad conforme (Res. 866/2021)
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {identityGate.loading ? 'Verificando estado del gate…' : identityGate.detail}
                  </p>
                  {!identityGate.loading && !identityGate.ok && (
                    <p className="mt-1 text-xs text-amber-700">
                      Configura los servicios que exigen documento en la agenda (con tipo del catalogo cerrado) para que el gate quede verde antes del go-live.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={goPrev}
                  disabled={currentStageIndex === 0}
                  className={`min-h-[48px] rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${
                    currentStageIndex === 0
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Anterior
                </button>

                <button
                  onClick={handlePrimaryAction}
                  disabled={isSubmitting || submitted}
                  className="min-h-[48px] rounded-full bg-[linear-gradient(135deg,_#1b5ed6_0%,_#4d8bff_100%)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_18px_40px_rgba(27,94,214,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(27,94,214,0.32)] disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {isSubmitting
                    ? 'Enviando…'
                    : currentStageIndex === onboardingStages.length - 1
                      ? submitted
                        ? 'Enviado'
                        : 'Enviar a revisión Upway'
                      : 'Siguiente'}
                </button>
              </div>

              {validationErrors.length > 0 && (
                <div className="mt-4 rounded-[20px] border border-rose-200 bg-rose-50/80 p-4">
                  <p className="text-sm font-semibold text-rose-700">⚠️ Faltan campos obligatorios:</p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-rose-600 space-y-1">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-rose-500">Completa estos campos en el paso 1 (Identifica tu operación) antes de enviar.</p>
                </div>
              )}

              {currentStageIndex === onboardingStages.length - 1 && !submitted && validationErrors.length === 0 && (
                <div className="mt-4 rounded-[20px] border border-[#d3e2ff] bg-[#edf5ff] p-4 text-sm text-[#36557c]">
                  Al enviar este checklist, tu caso pasa a revisión de Upway. El equipo validará el caso de uso y te
                  compartirá el costo de implementación y la recarga para iniciar operación.
                </div>
              )}

              {submitted && (
                <div className="mt-4 grid gap-3 rounded-[20px] border border-emerald-200/70 bg-emerald-50/60 p-4">
                  <p className="text-sm font-semibold text-emerald-800">
                    ✅ Checklist enviado a Upway. Tu caso está en revisión.
                  </p>
                  <p className="text-sm leading-6 text-emerald-700">
                    Una vez revisado, Upway te contactará con el costo de implementación y las opciones de recarga
                    para iniciar operación. Nada se activa sin tu aprobación y sin recarga fondeada.
                  </p>
                </div>
              )}
            </section>
          )}

          <aside className="upway-surface rounded-[30px] p-5 md:p-6">
            <div className="mb-4 text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500">Checklist</div>

            <div className="space-y-2.5">
              {onboardingStages.map((stage, index) => {
                const status = getOnboardingStageStatus(currentStage, stage);
                const isCurrent = stage === currentStage;
                return (
                  <Tooltip
                    key={stage}
                    side="left"
                    content={`${stageHelp[stage].hint} ${getOnboardingStageMeta(stage).description}`}
                    className="w-full"
                  >
                  <button
                    type="button"
                    onClick={() => goToStage(index)}
                    className={`flex w-full items-center justify-between gap-3 rounded-[18px] border p-3 text-left transition-all hover:-translate-y-0.5 ${
                      isCurrent
                        ? 'border-[#d3e2ff] bg-[#edf5ff] shadow-[0_10px_26px_rgba(27,94,214,0.10)]'
                        : status === 'done'
                          ? 'border-emerald-200/70 bg-emerald-50/40 hover:bg-emerald-50/70'
                          : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white'
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
                  </button>
                  </Tooltip>
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
    </div>
  );
}