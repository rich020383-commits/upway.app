'use client';

import { useState } from 'react';
import { Loader2, Rocket, ShieldCheck } from 'lucide-react';

type Msg = { tone: 'ok' | 'err' | 'info'; text: string } | null;

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1b5ed6] focus:outline-none';
const btnPrimary =
  'inline-flex items-center gap-2 rounded-xl bg-[#0d1727] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#16233a] disabled:cursor-not-allowed disabled:opacity-50';

const E164 = /^\+\d{7,15}$/;
const NICHOS = ['salud', 'inmobiliaria', 'center', 'general'];

/**
 * Aprovisionamiento del AI Assistant (modelo white-glove).
 *
 * Este es el ÚNICO paso que enciende la voz de la sede: crea el asistente en
 * Telnyx, guarda su id, deja `isTelnyxActive = true` y (opcionalmente) fija el
 * número dedicado que Upway entrega a la IPS. El selector de voz solo hace
 * PATCH, o sea que sin esta pantalla el check `Voz Telnyx dedicada` del
 * checklist nunca iba a poder ponerse en verde desde la interfaz.
 *
 * El `greeting` lo arma el endpoint con `buildVoiceGreeting`, que encabeza el
 * aviso de grabación y tratamiento de datos (Ley 1581). Aquí no se redacta a
 * mano para que ese aviso no se pueda saltar por descuido.
 */
export default function VoiceProvisioning({
  tiendaId,
  clinicName,
  assistantId,
  phoneNumber,
  isActive,
  onProvisioned,
}: {
  tiendaId: string | null;
  clinicName: string | null;
  assistantId: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  onProvisioned: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [reglas, setReglas] = useState('');
  const [nicho, setNicho] = useState('salud');
  const [telefono, setTelefono] = useState(phoneNumber ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const nombreOk = nombre.trim().length >= 2;
  const reglasOk = reglas.trim().length >= 10;
  const telefonoOk = telefono.trim().length === 0 || E164.test(telefono.trim());
  const canSubmit = Boolean(tiendaId) && nombreOk && reglasOk && telefonoOk && !busy;

  const provision = async () => {
    if (!tiendaId || !canSubmit) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/voice/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiendaId,
          nombre: nombre.trim(),
          reglas: reglas.trim(),
          nicho,
          ...(telefono.trim() ? { telnyxPhoneNumber: telefono.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ tone: 'err', text: data.error ?? 'No se pudo aprovisionar el asistente.' });
        return;
      }
      setMsg({
        tone: data.voicePhoneNumber ? 'ok' : 'info',
        text: data.voicePhoneNumber
          ? `Asistente ${data.assistantId ?? ''} creado y línea ${data.voicePhoneNumber} asignada.`
          : `Asistente ${data.assistantId ?? ''} creado y voz encendida. Falta el número dedicado para completar el check de voz.`,
      });
      onProvisioned();
    } catch (error) {
      setMsg({
        tone: 'err',
        text: error instanceof Error ? error.message : 'No se pudo aprovisionar el asistente.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
          Aprovisionar asistente
        </p>
        <span
          className={
            isActive
              ? 'rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700'
              : 'rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700'
          }
        >
          {isActive ? 'Voz encendida' : 'Voz apagada'}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        {isActive
          ? 'El asistente ya está creado en Upway. Reaprovisiona si cambian el guion o la línea.'
          : 'Crea el asistente de voz con el guion de la sede. El saludo incluye automáticamente el aviso de grabación y tratamiento de datos.'}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
            Nombre del agente
          </span>
          <input
            className={inputCls}
            placeholder={clinicName ? `Ej. ${clinicName}` : 'Ej. Asistente Andes'}
            value={nombre}
            maxLength={80}
            onChange={(event) => {
              setNombre(event.target.value);
              setMsg(null);
            }}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
            Nicho
          </span>
          <select
            className={inputCls}
            value={nicho}
            onChange={(event) => setNicho(event.target.value)}
          >
            {NICHOS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
          Instrucciones del agente
        </span>
        <textarea
          className={inputCls}
          rows={5}
          maxLength={8000}
          placeholder="Qué debe resolver, con qué guion, cuándo escalar a una persona y qué datos confirmar."
          value={reglas}
          onChange={(event) => {
            setReglas(event.target.value);
            setMsg(null);
          }}
        />
        {reglas.trim().length > 0 && !reglasOk && (
          <span className="mt-1 block text-xs text-rose-600">Mínimo 10 caracteres.</span>
        )}
      </label>

      <label className="block">
        <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
          Número dedicado de la sede (opcional)
        </span>
        <input
          className={inputCls}
          inputMode="tel"
          placeholder="+573001112233"
          value={telefono}
          maxLength={20}
          onChange={(event) => {
            setTelefono(event.target.value);
            setMsg(null);
          }}
        />
        {telefono.trim().length > 0 && !telefonoOk && (
          <span className="mt-1 block text-xs text-rose-600">
            Debe ser E.164: +57 seguido del número, sin espacios.
          </span>
        )}
      </label>

      <button
        type="button"
        className={btnPrimary}
        onClick={() => void provision()}
        disabled={!canSubmit}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
        {busy ? 'Aprovisionando…' : isActive ? 'Reaprovisionar' : 'Aprovisionar asistente'}
      </button>

      {assistantId && (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck size={14} className="text-emerald-600" />
          Assistant {assistantId}
          {phoneNumber ? ` · línea ${phoneNumber}` : ' · sin línea dedicada asignada'}
        </p>
      )}

      {msg && (
        <p
          className={
            msg.tone === 'err'
              ? 'text-sm font-semibold text-rose-600'
              : msg.tone === 'ok'
                ? 'text-sm font-semibold text-emerald-600'
                : 'text-sm font-semibold text-slate-600'
          }
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
