'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { stageErrors, stageMeta, type OnboardingConfig, type WizardField } from '@/lib/onboarding/types';

const cop = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const inputCls =
  'w-full rounded-xl border border-[#d5e3f0] bg-white px-4 py-3 text-[13px] text-[#0d3168] outline-none transition focus:border-[#0ba9a9] focus:ring-2 focus:ring-[#0ba9a9]/20';

const metaCls: Record<string, string> = {
  COMPLETED: 'bg-[#d9f6ec] text-[#0d7a58]',
  'IN PROGRESS': 'bg-[#fff1d6] text-[#92600a]',
  PENDING_REVIEW: 'bg-[#dfeeff] text-[#1257a6]',
  DRAFT: 'bg-[#eef3f8] text-[#7b93ab]',
};

type Props = { config: OnboardingConfig };

/**
 * Resultado del envío a revisión: `ok` es la respuesta HTTP del guardado;
 * `delivered` distingue "el equipo de Upway recibió el correo" de
 * "guardamos el caso pero el correo no salió".
 */
type PersistResult = {
  ok: boolean;
  caseRef?: string;
  delivered?: boolean;
  warning?: string;
};

/**
 * Wizard de onboarding vertical (Inmobiliaria / Center) sobre el patrón de
 * Health: una sola página, etapas modeladas en lib/onboarding/*, validación
 * por etapa y cierre honesto "Enviar a revisión Upway" (no autoactiva).
 */
export function VerticalWizard({ config }: Props) {
  const stages = config.stages;
  const total = stages.length;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  /** Datos del envío a revisión que se muestran al cerrar el wizard. */
  const [submission, setSubmission] = useState<{
    caseRef?: string;
    delivered: boolean;
    warning?: string;
  } | null>(null);

  const stage = stages[step];
  const isLast = step === total - 1;

  // Restaura el avance guardado (si hay sesión); best-effort.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/onboarding?segment=${config.segment}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data || typeof data !== 'object') return;
        if (data.answers && typeof data.answers === 'object') {
          setAnswers((prev) => ({ ...data.answers, ...prev }));
        }
        if (typeof data.step === 'number' && data.step >= 0 && data.step < total) {
          setStep(data.step);
        }
      } catch {
        // Sin sesión o sin guardado previo: empezamos en blanco.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.segment, total]);

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors([]);
  };

  const persist = async (currentStep: number, submit: boolean): Promise<PersistResult> => {
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segment: config.segment,
          answers,
          step: currentStep,
          stageId: stages[currentStep].id,
          submit,
        }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = await res.json().catch(() => null);
      setSaveFailed(false);
      return {
        ok: true,
        caseRef: typeof data?.caseRef === 'string' ? data.caseRef : undefined,
        // El servidor responde ok:false cuando el correo interno no salió
        // (SMTP sin configurar). El caso queda en revisión, pero el cliente
        // merece saber que el equipo aún no lo recibió.
        delivered: data?.ok !== false,
        warning: typeof data?.warning === 'string' ? data.warning : undefined,
      };
    } catch {
      setSaveFailed(true);
      return { ok: false };
    }
  };

  const goNext = async () => {
    const errs = stageErrors(stage, answers);
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    if (isLast) {
      setSending(true);
      const result = await persist(step, true);
      setSending(false);
      if (result.ok) {
        setSubmission({
          caseRef: result.caseRef,
          delivered: result.delivered !== false,
          warning: result.warning,
        });
        setDone(true);
      }
      return;
    }
    // Guardado best-effort: no bloqueamos el avance si falla la red.
    await persist(step, false);
    setStep(step + 1);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setErrors([]);
    setStep((s) => Math.max(0, s - 1));
  };

  const renderField = (field: WizardField) => {
    const value = answers[field.id] ?? '';
    return (
      <div key={field.id} className={field.kind === 'textarea' ? 'sm:col-span-2' : ''}>
        <label className="mb-1.5 block text-[12px] font-semibold text-[#0d3168]">{field.label}</label>
        {field.kind === 'select' ? (
          <select value={value} onChange={(e) => setAnswer(field.id, e.target.value)} className={inputCls}>
            <option value="">Selecciona…</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : field.kind === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => setAnswer(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={5}
            className={inputCls}
          />
        ) : (
          <input
            type={field.kind === 'email' ? 'email' : field.kind === 'tel' ? 'tel' : 'text'}
            value={value}
            onChange={(e) => setAnswer(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={inputCls}
          />
        )}
        {field.help && <p className="mt-1 text-[11px] text-[#7b93ab]">{field.help}</p>}
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-[#0D1117] font-sans text-[#F5F7FA]">
      <header className="border-b border-[#1E293B]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-[12px] font-bold tracking-[0.2em] text-[#50e1d5]">UPWAY · ONBOARDING</span>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:gap-10">
        {/* Barra lateral de etapas */}
        <aside className="lg:w-72 lg:shrink-0">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8994A6]">
            {config.label} · {total} etapas
          </p>
          {/* En celular la lista completa empujaba el formulario fuera de la
              pantalla: solo se muestra la etapa actual con barra de avance. */}
          <div className="lg:hidden">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[12px] font-semibold text-[#F5F7FA]">
                {stages[step]?.titulo}
              </span>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-[#50e1d5]">
                {step + 1}/{total}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1E293B]">
              <div
                className="h-full rounded-full bg-[#0ba9a9] transition-[width] duration-300"
                style={{ width: `${Math.round(((step + 1) / total) * 100)}%` }}
              />
            </div>
          </div>

          <ol className="mt-4 hidden space-y-2 lg:block">
            {stages.map((s, i) => {
              const meta = stageMeta(i, step, total);
              return (
                <li
                  key={s.id}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition ${
                    i === step ? 'border-teal-500/40 bg-teal-500/5' : 'border-[#1E293B]'
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      i < step
                        ? 'bg-teal-500/20 text-[#50e1d5]'
                        : i === step
                          ? 'bg-[#0ba9a9] text-white'
                          : 'bg-[#1E293B] text-[#8994A6]'
                    }`}
                  >
                    {i < step ? <Check size={12} /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-semibold text-[#F5F7FA]">{s.titulo}</span>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider ${metaCls[meta]}`}>
                      {meta}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Tarjeta principal */}
        <main className="min-w-0 flex-1 rounded-2xl border border-[#1E293B] bg-[#0D1117] p-5 sm:p-8">
          {done ? (
            <div className="py-6">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/15 text-[#50e1d5]">
                <ShieldCheck size={24} />
              </div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#50e1d5]">Solicitud enviada</p>
              <h2 className="font-display text-[24px] font-extrabold tracking-[-0.5px] sm:text-[28px]">
                Tu operación pasa a revisión del equipo Upway
              </h2>
              <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-[#8994A6]">
                Revisamos tu configuración y te contactamos para validar el plan y el arranque. No hay activación automática:
                nada entra en producción sin tu visto bueno.
              </p>

              {submission?.caseRef && (
                <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#1E293B] bg-[#121821] px-4 py-2 font-mono text-[12px] font-semibold text-[#50e1d5]">
                  Ref {submission.caseRef}
                </p>
              )}

              {submission?.delivered ? (
                <p className="mt-4 max-w-xl text-[12px] leading-relaxed text-[#8994A6]">
                  El equipo de Upway ya recibió tu caso y te enviamos la confirmación al correo que registraste.
                </p>
              ) : submission ? (
                <p className="mt-4 max-w-xl rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-[12px] font-semibold leading-relaxed text-amber-200">
                  {submission.warning ?? 'Guardamos tu caso, pero no pudimos avisar al equipo de Upway. Escríbenos por WhatsApp para no perder el turno.'}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={config.segment === 'center' ? '/center' : '/inmobiliarias'}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0ba9a9] px-5 py-3 text-[13px] font-bold text-white transition hover:-translate-y-0.5"
                >
                  Volver a la página de {config.label} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 border-b border-[#1E293B] pb-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#50e1d5]">{stage.eyebrow}</p>
                <h2 className="font-display text-[22px] font-extrabold leading-tight tracking-[-0.5px] sm:text-[26px]">
                  {stage.titulo}
                </h2>
                {stage.intro && <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#8994A6]">{stage.intro}</p>}
                <p className="mt-3 text-[11px] font-semibold text-[#8994A6]">
                  Paso {step + 1} de {total}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {(stage.fields ?? []).map(renderField)}
                {stage.plans && (
                  <div className="grid gap-3 sm:col-span-2 md:grid-cols-2">
                    {stage.plans.map((plan) => {
                      const selected = answers.planId === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setAnswer('planId', plan.id)}
                          className={`rounded-xl border p-4 text-left transition ${
                            selected
                              ? 'border-[#0ba9a9] bg-[#0ba9a9]/10 ring-2 ring-[#0ba9a9]/30'
                              : 'border-[#1E293B] hover:border-teal-500/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-bold text-[#F5F7FA]">{plan.name}</span>
                            {selected && <Check size={14} className="text-[#50e1d5]" />}
                          </div>
                          {plan.tagline && <p className="mt-0.5 text-[11px] text-[#8994A6]">{plan.tagline}</p>}
                          <p className="mt-2 font-display text-[18px] font-extrabold text-[#50e1d5]">
                            {cop(plan.monthlyCOP)}
                            <span className="text-[11px] font-semibold text-[#8994A6]"> /mes</span>
                          </p>
                          <p className="mt-0.5 text-[10px] text-[#8994A6]">
                            {plan.includedMinutes ? `${plan.includedMinutes.toLocaleString('es-CO')} min` : 'A medida'}
                            {plan.setupCOP ? ` · implementación ${cop(plan.setupCOP)}` : ''}
                          </p>
                          {plan.features && plan.features.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {plan.features.slice(0, 4).map((f) => (
                                <li key={f} className="flex gap-1.5 text-[11px] text-[#8994A6]">
                                  <Check size={11} className="mt-0.5 shrink-0 text-[#0ba9a9]" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {errors.length > 0 && (
                <div className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
                  <p className="text-[12px] font-bold text-red-300">Revisa lo siguiente:</p>
                  <ul className="mt-1 list-inside list-disc text-[12px] text-red-200">
                    {errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {saveFailed && (
                <p className="mt-4 text-[11px] text-[#8994A6]">
                  No pudimos guardar tu avance (sin conexión). Puedes seguir: lo reintentaremos al avanzar.
                </p>
              )}

              <div className="mt-7 flex items-center justify-between gap-3 border-t border-[#1E293B] pt-5">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 0}
                  className="inline-flex items-center gap-2 rounded-full border border-[#1E293B] px-4 py-2.5 text-[12px] font-semibold text-[#8994A6] transition hover:text-[#F5F7FA] disabled:opacity-40"
                >
                  <ArrowLeft size={14} /> Anterior
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0ba9a9] px-5 py-2.5 text-[12px] font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {sending ? 'Enviando…' : isLast ? 'Enviar a revisión Upway' : 'Siguiente'}
                  {!sending && (isLast ? <ShieldCheck size={14} /> : <ArrowRight size={14} />)}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}