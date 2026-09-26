'use client';

import { useState } from 'react';
import { Info, Loader2, Save } from 'lucide-react';

/**
 * Editor de las instrucciones del agente, para el panel final de Center e
 * Inmobiliaria.
 *
 * El prompt es el producto del cliente: entra con algo escrito en el wizard, pero
 * tiene que poder tomarlo con calma y refinarlo acá. Por eso el textarea es
 * grande y el guardado es explícito, sin sobrescribir nada solo al cargar.
 *
 * Importante: lo que el cliente escribe NO es el prompt final. Upway lo envuelve
 * con las reglas que el agente no puede dejar de cumplir (usar la herramienta de
 * agenda, tener la fecha actual, contexto del negocio). El aviso de abajo lo dice
 * para que no Gaste tiempo escribiendo lo que el sistema ya pone.
 */
export default function AgentPromptEditor({
  tiendaId,
  initialPrompt,
  initialName,
  currentVoice,
  canSave = true,
}: {
  tiendaId: string;
  initialPrompt?: string | null;
  initialName?: string | null;
  /** Voz vigente: el endpoint la exige siempre para poder aplicarla en vivo. */
  currentVoice?: string | null;
  canSave?: boolean;
}) {
  const [nombre, setNombre] = useState(initialName ?? '');
  const [prompt, setPrompt] = useState(initialPrompt ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err' | 'info'; text: string } | null>(null);

  const guardable = canSave && nombre.trim().length >= 2 && prompt.trim().length >= 10 && !busy;

  const guardar = async () => {
    if (!guardable) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/voice/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiendaId,
          // Si la sede todavía no tiene voz, se manda la predeterminada: el
          // endpoint la exige siempre y así también queda una voz asignada.
          voz: currentVoice || 'Telnyx.Ultra.162e0f37-8504-474c-bb33-c606c01890dc',
          agentName: nombre.trim(),
          systemPrompt: prompt.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'No se pudieron guardar las instrucciones.');
      setMsg({
        tone: data.appliedToTelnyx ? 'ok' : 'info',
        text: data.appliedToTelnyx
          ? 'Instrucciones guardadas y aplicadas a tu asistente.'
          : 'Instrucciones guardadas. Se aplicarán a tu asistente en el próximo provisionamiento.',
      });
    } catch (error) {
      setMsg({
        tone: 'err',
        text: error instanceof Error ? error.message : 'No se pudieron guardar las instrucciones.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="block">
        <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
          Nombre de tu asistente
        </span>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={80}
          placeholder="Ej. Ana · Inmobiliaria Norte"
          disabled={!canSave}
          className="mt-1.5 w-full rounded-xl border border-[#1E293B] bg-[#0D1117] px-3 py-2.5 text-[14px] text-slate-200 outline-none placeholder:text-slate-600 disabled:opacity-60"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
          Qué debe resolver y qué nunca debe prometer
        </span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={10}
          maxLength={8000}
          disabled={!canSave}
          placeholder="Ej: Califica al interesado por zona, presupuesto y si tiene crédito aprobado. Agenda visita solo en zona norte. Nunca prometas descuentos ni finance: eso lo define el asesor."
          className="mt-1.5 w-full resize-y rounded-xl border border-[#1E293B] bg-[#0D1117] px-3 py-2.5 text-[14px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600 disabled:opacity-60"
        />
        <span className="mt-1 block text-[11px] text-slate-600">{prompt.length}/8000</span>
      </label>

      {canSave && (
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={!guardable}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#0ba9a9] px-5 py-2.5 text-[13px] font-bold text-white transition disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {busy ? 'Guardando…' : 'Guardar instrucciones'}
        </button>
      )}

      {msg && (
        <p
          className={`mt-2 text-[13px] font-semibold ${
            msg.tone === 'ok'
              ? 'text-emerald-300'
              : msg.tone === 'err'
                ? 'text-rose-300'
                : 'text-slate-300'
          }`}
        >
          {msg.text}
        </p>
      )}

      <p className="mt-4 flex items-start gap-2 border-t border-[#1E293B] pt-3 text-[12px] leading-relaxed text-slate-500">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          Upway le añade encima las reglas obligatorias del agente (usar la herramienta de
          agenda, tener la fecha al día y el contexto de tu negocio). No hace falta que las
          escribas tú.
        </span>
      </p>
    </div>
  );
}
