'use client';

import { useState } from 'react';
import { Loader2, PhoneCall } from 'lucide-react';

type Msg = { tone: 'ok' | 'err' | 'info'; text: string } | null;

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1b5ed6] focus:outline-none';
const btnPrimary =
  'inline-flex items-center gap-2 rounded-xl bg-[#1b5ed6] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#164cae] disabled:cursor-not-allowed disabled:opacity-50';

const E164 = /^\+\d{7,15}$/;

/**
 * Llamada de prueba de Operaciones: marca un número real desde la línea Telnyx
 * de la sede y el asistente contesta con la voz que ya guardaste.
 *
 * Dos condiciones no negociables antes de marcar:
 *  - `consent: true`. Marcar a alguien sin su autorización es riesgo directo de
 *    Ley 1581, así que la casilla no es decorativa: sin ella el endpoint
 *    responde 400 y no se marca (ver lib/telnyx/voice-consent.ts).
 *  - La línea: hasta que Upway compre y asigne el DID a la Call Control App, la
 *    ruta responde 503 nombrando la variable que falta. Se muestra tal cual,
 *    sin inventar un estado de "funcionando".
 */
export default function VoiceTestCall({ tiendaId }: { tiendaId: string | null }) {
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const phoneOk = E164.test(phone.trim());
  const canCall = Boolean(tiendaId) && phoneOk && consent && !busy;

  const call = async () => {
    if (!tiendaId || !canCall) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/voice/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiendaId, to: phone.trim(), consent: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({
          tone: 'err',
          text:
            res.status === 503
              ? `${data.error} Upway está terminando de configurar la línea de voz de la sede; en cuanto esté lista podrás marcar.`
              : (data.error ?? 'No se pudo iniciar la llamada.'),
        });
        return;
      }
      const id = data.call?.id ?? data.call?.call_control_id ?? data.call?.call_session_id;
      setMsg({
        tone: 'ok',
        text: `Llamada iniciada${id ? ` · referencia ${id}` : ''}. El asistente contesta con la voz guardada.`,
      });
    } catch (error) {
      setMsg({
        tone: 'err',
        text: error instanceof Error ? error.message : 'No se pudo iniciar la llamada.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        Llamada de prueba
      </p>
      <p className="text-xs leading-relaxed text-slate-500">
        Marca un número real desde la línea de voz de la sede para comprobar que el asistente
        levanta con la voz guardada. La llamada se graba y queda en el registro de la sede.
      </p>

      <label className="block">
        <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
          Destino en formato E.164
        </span>
        <input
          className={inputCls}
          inputMode="tel"
          placeholder="+573001234567"
          value={phone}
          maxLength={20}
          onChange={(event) => {
            setPhone(event.target.value);
            setMsg(null);
          }}
        />
        {phone.trim().length > 0 && !phoneOk && (
          <span className="mt-1 block text-xs text-rose-600">
            Escribe el número con código de país: +57 seguido del número, sin espacios.
          </span>
        )}
      </label>

      <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
          checked={consent}
          onChange={(event) => {
            setConsent(event.target.checked);
            setMsg(null);
          }}
        />
        <span>
          Confirmo que el destino autorizó ser llamado y el tratamiento de sus datos para esta
          llamada (Ley 1581 de 2012). Upway no marca números en frío ni listas de terceros.
        </span>
      </label>

      <button type="button" className={btnPrimary} onClick={() => void call()} disabled={!canCall}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <PhoneCall size={16} />}
        {busy ? 'Marcando…' : 'Llamar ahora'}
      </button>

      {msg && (
        <p
          className={
            msg.tone === 'err'
              ? 'text-sm font-semibold text-rose-600'
              : 'text-sm font-semibold text-emerald-600'
          }
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
