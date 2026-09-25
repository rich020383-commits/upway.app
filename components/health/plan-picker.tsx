'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { FACILITY_TYPE_OPTIONS, INTEGRATION_MODE_OPTIONS, IVA_RATE, type FacilityType, withIVA } from '@/lib/health/plans';
import { ALL_HEALTH_PLANS, estimateMinutesFromVolume, formatCOP, getHealthPlan, planCommercialSummary, recommendPlan } from '@/lib/health/plans-enterprise';

export type PlanFormSlice = {
  facilityType: FacilityType | '';
  dailyCalls: string;
  avgCallMinutes: string;
  planId: string;
  preferredAreaCode: string;
  existingPhone: string;
  crmOrAgenda: string;
  integrationMode: string;
  hisSystem: string;
};

const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#4c6686', letterSpacing: '0.04em', textTransform: 'uppercase' };
const inp: React.CSSProperties = { border: '1px solid #dfeaf7', borderRadius: 10, background: '#f8fbff', color: '#17314a', padding: '9px 12px', fontSize: 13, fontWeight: 600, outline: 'none', width: '100%', minWidth: 0, boxSizing: 'border-box' };

function FacilityGrid(props: { form: PlanFormSlice; onChange: (k: keyof PlanFormSlice, v: string) => void; estimated: number }) {
  const { form, onChange, estimated } = props;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <label style={lbl}>Tipo de sede <span style={{ color: '#dc2626' }}>*</span></label>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
        {FACILITY_TYPE_OPTIONS.map((opt) => {
          const active = form.facilityType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange('facilityType', opt.id);
                onChange('planId', recommendPlan(opt.id, estimated).id);
              }}
              style={{ ...inp, cursor: 'pointer', textAlign: 'left', border: active ? '2px solid #1b5ed6' : inp.border, background: active ? '#edf5ff' : inp.background }}
            >
              <div style={{ fontWeight: 800, color: '#163557' }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{opt.hint}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VolumeBox(props: { form: PlanFormSlice; onChange: (k: keyof PlanFormSlice, v: string) => void; estimated: number; recName: string; approval: boolean }) {
  const { form, onChange, estimated, recName, approval } = props;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))' }}>
        <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
          <label style={lbl}>Llamadas / dia (est.) <span style={{ color: '#dc2626' }}>*</span></label>
          <input type="number" min={0} placeholder="Ej. 40" value={form.dailyCalls} onChange={(e) => onChange('dailyCalls', e.target.value)} style={inp} />
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={lbl}>Duracion media (min) <span style={{ color: '#dc2626' }}>*</span></label>
          <input type="number" min={0} step="0.5" placeholder="Ej. 3" value={form.avgCallMinutes} onChange={(e) => onChange('avgCallMinutes', e.target.value)} style={inp} />
        </div>
      </div>
      <div style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: 12, padding: 12, display: 'grid', gap: 6 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8' }}>Estimacion honesta</div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>~{estimated.toLocaleString('es-CO')} min/mes</div>
        <div style={{ fontSize: 13, color: '#cbd5e1' }}>Recomendado: <strong style={{ color: '#fff' }}>{recName}</strong>{approval ? ' · capacidad ampliada (Upway la tramita)' : ''}</div>
      </div>
    </div>
  );
}
function PlanList(props: { visible: typeof ALL_HEALTH_PLANS; form: PlanFormSlice; onChange: (k: keyof PlanFormSlice, v: string) => void; hint: (t?: string) => React.ReactNode; recId: string }) {
  const { visible, form, onChange, hint, recId } = props;
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <label style={lbl}>Elige tu plan</label>
      {visible.map((plan) => {
        const active = form.planId === plan.id;
        const isRec = plan.id === recId;
        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => onChange('planId', plan.id)}
            style={{ textAlign: 'left', borderRadius: 16, border: active ? '2px solid #1b5ed6' : '1px solid #dfeaf7', background: active ? '#edf5ff' : '#fff', padding: 14, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 16 }}>{plan.name}{isRec ? <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, color: '#1b5ed6', textTransform: 'uppercase' }}>recomendado</span> : null}</div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>{plan.tagline}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 900, color: '#0f172a' }}>{formatCOP(plan.monthlyCOP)}/mes</div>
                {plan.monthlyCOP > 0 && (<div style={{ fontSize: 11, color: '#64748b' }}>+{IVA_RATE * 100}% IVA → total {formatCOP(withIVA((plan.monthlyCOP)))}</div>)}
                <div style={{ fontSize: 12, color: '#64748b' }}>Setup {formatCOP(plan.setupCOP)}</div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: '#334155', display: 'grid', gap: 4 }}>
              <div>{plan.includedMinutes.toLocaleString('es-CO')} min · {plan.includedNumbers} numero(s) · hasta {plan.concurrentCalls} simultaneas</div>
              <div>Overage: {plan.overageCOP > 0 ? `$${plan.overageCOP.toLocaleString('es-CO')} COP/min` : 'A cotizar'}{!plan.autoActivatable ? ' · No auto-activar (deal desk)' : ''}</div>
            </div>
            <Link href={`/precios#${plan.id}`} style={{ marginTop: 8, fontSize: 12, color: '#1b5ed6', fontWeight: 600 }} onClick={(e) => e.stopPropagation()}>Ver detalles →</Link>
          </button>
        );
      })}
      {hint('Plan comercial con minutos incluidos y overage transparente.')}
    </div>
  );
}

function ExtraInputs(props: { form: PlanFormSlice; onChange: (k: keyof PlanFormSlice, v: string) => void }) {
  const { form, onChange } = props;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))' }}>
        <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
          <label style={lbl}>Indicativo preferido</label>
          <input placeholder="Ej. 601" value={form.preferredAreaCode} onChange={(e) => onChange('preferredAreaCode', e.target.value)} style={inp} />
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={lbl}>Numero a portar (opc.)</label>
          <input placeholder="Ej. +57 601 555 0100" value={form.existingPhone} onChange={(e) => onChange('existingPhone', e.target.value)} style={inp} />
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={lbl}>Agenda / CRM actual</label>
        <input placeholder="Ej. Google Calendar + Softmedical" value={form.crmOrAgenda} onChange={(e) => onChange('crmOrAgenda', e.target.value)} style={inp} />
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={lbl}>Como consumira su sistema el dato del paciente</label>
          <select value={form.integrationMode} onChange={(e) => onChange('integrationMode', e.target.value)} style={inp}>
            <option value="">Sin definir</option>
            {INTEGRATION_MODE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={lbl}>HIS / HCE actual (si aplica)</label>
          <input placeholder="Ej. Saludtools, Softmedical, historia propia" value={form.hisSystem} onChange={(e) => onChange('hisSystem', e.target.value)} style={inp} />
        </div>
      </div>
    </div>
  );
}

export function PlanPicker(props: {
  form: PlanFormSlice;
  onChange: (k: keyof PlanFormSlice, v: string) => void;
  hint: (t?: string) => React.ReactNode;
}) {
  const { form, onChange, hint } = props;
  const daily = Number(form.dailyCalls) || 0;
  const avg = Number(form.avgCallMinutes) || 0;
  const estimated = estimateMinutesFromVolume(daily, avg);
  const recommended = form.facilityType ? recommendPlan(form.facilityType, estimated) : recommendPlan('consultorio', estimated);
  const visible = ALL_HEALTH_PLANS.filter((p) => {
    if (!form.facilityType) return p.monthlyCOP > 0;
    if (form.facilityType === 'eps') return true;
    return p.target.includes(form.facilityType) || p.id === recommended.id;
  });
  useEffect(() => {
    if (!form.planId && recommended?.id) onChange('planId', recommended.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommended.id]);
  const selected = getHealthPlan(form.planId);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <FacilityGrid form={form} onChange={onChange} estimated={estimated} />
      <VolumeBox form={form} onChange={onChange} estimated={estimated} recName={recommended.name} approval={recommended.requiresTelnyxApproval} />
      <PlanList visible={visible} form={form} onChange={onChange} hint={hint} recId={recommended.id} />
      {selected ? (
        <div style={{ background: '#f4f8ff', border: '1px solid #dfe9ff', borderRadius: 12, padding: 12, fontSize: 13, color: '#334155' }}>
          <strong style={{ color: '#163557' }}>{selected.name}</strong>: {selected.bestFor}
          {(() => {
            const s = planCommercialSummary(selected);
            if (!s.quoteWithoutIdentity || !s.quoteWithIdentity) return null;
            return (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #dfe9ff', display: 'grid', gap: 4 }}>
                <div>Plan con voz: <strong>{formatCOP(s.quoteWithoutIdentity.totalCOP)}</strong>/mes</div>
                <div>
                  + {s.identityModuleLabel}: <strong>{formatCOP(s.identityModuleCOP)}</strong>
                  {' → '}<strong>{formatCOP(s.quoteWithIdentity.totalCOP)}</strong>/mes + IVA
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{s.identityModuleDescription}</div>
              </div>
            );
          })()}
        </div>
      ) : null}
      <ExtraInputs form={form} onChange={onChange} />
    </div>
  );
}
