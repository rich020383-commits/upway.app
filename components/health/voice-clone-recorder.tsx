'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Square, Upload } from 'lucide-react';
import {
  CLONE_IDEAL_SECONDS,
  buildConsentScript,
  buildSampleScript,
  defaultPurpose,
} from '@/lib/voice-clone-consent';

type Msg = { tone: 'ok' | 'err' | 'info'; text: string } | null;

export type CloneResult = {
  value: string;
  label: string;
  kind: 'clone';
  provider: string;
  language?: string | null;
  gender?: string | null;
  cloneId?: string;
  status?: string | null;
};

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1b5ed6] focus:outline-none';
const btnPrimary =
  'inline-flex items-center gap-2 rounded-xl bg-[#1b5ed6] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#164cae] disabled:cursor-not-allowed disabled:opacity-50';
const btnGhost =
  'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Formatos que el servicio de voz acepta para clonar. NO incluye webm a
 * propósito: el grabador de Chrome produce `audio/webm` y el servicio lo
 * rechaza, así que hay que probar cuál de estos soporta el navegador en vez de
 * asumirlo. Safari da m4a, Firefox da ogg.
 */
const MIME_CANDIDATES = [
  { mime: 'audio/mp4', ext: 'm4a' },
  { mime: 'audio/ogg;codecs=opus', ext: 'ogg' },
  { mime: 'audio/ogg', ext: 'ogg' },
  { mime: 'audio/mpeg', ext: 'mp3' },
];

function pickRecordingFormat(): { mime: string; ext: string } | null {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return null;
  for (const candidate of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported?.(candidate.mime)) return candidate;
  }
  return null;
}

/**
 * Grabación con MediaRecorder aislada del componente.
 *
 * Vive en un hook y no en el cuerpo del componente por dos razones: mezclar
 * `new MediaRecorder(...)` con el render es lo que dispara la regla de
 * "función impura durante el render", y además el flujo de grabar/parar/
 * liberar el micrófono es estado con vida propia, no estado de vista.
 */
function useAudioRecorder(mime: string | null) {
  const [grabando, setGrabando] = useState<string | null>(null);
  const [segundos, setSegundos] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  const liberar = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => liberar, [liberar]);

  const parar = useCallback(() => {
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop();
    setGrabando(null);
  }, []);

  const grabar = useCallback(
    async (etiqueta: string, alTerminar: (blob: Blob, seconds: number) => void) => {
      if (!mime) return false;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const rec = new MediaRecorder(stream, { mimeType: mime });
        chunksRef.current = [];
        rec.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        rec.onstop = () => {
          const secs = Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));
          liberar();
          alTerminar(new Blob(chunksRef.current, { type: mime }), secs);
        };
        rec.start();
        recRef.current = rec;
        startedAtRef.current = Date.now();
        setGrabando(etiqueta);
        setSegundos(0);
        timerRef.current = setInterval(
          () => setSegundos(Math.round((Date.now() - startedAtRef.current) / 1000)),
          250
        );
        return true;
      } catch {
        liberar();
        setGrabando(null);
        return false;
      }
    },
    [liberar, mime]
  );

  return { grabando, segundos, grabar, parar };
}

export default function VoiceCloneRecorder({
  tiendaId,
  businessName,
  onCloned,
}: {
  tiendaId: string | null;
  businessName: string | null;
  onCloned: (clone: CloneResult) => void;
}) {
  const [how, setHow] = useState<'grabar' | 'archivo'>('grabar');
  // El formato se resuelve UNA vez: el navegador no cambia en caliente y evitar
  // un setState en un efecto evita la cascada de renders.
  const [format] = useState(() => pickRecordingFormat());
  const supported = Boolean(format);
  const { grabando, segundos, grabar, parar } = useAudioRecorder(format?.mime ?? null);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'neutral'>('neutral');
  const [personName, setPersonName] = useState('');
  const [personDoc, setPersonDoc] = useState('');

  const [consentAudio, setConsentAudio] = useState<Blob | null>(null);
  const [sampleAudio, setSampleAudio] = useState<Blob | null>(null);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [sampleSeconds, setSampleSeconds] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [consentUrl, setConsentUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (consentUrl) URL.revokeObjectURL(consentUrl);
    };
  }, [consentUrl]);

  const guardarConsent = (blob: Blob) => {
    setConsentAudio(blob);
    setConsentUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
  };

  const start = async (cual: 'consent' | 'sample') => {
    setMsg(null);
    const ok = await grabar(cual, (blob, secs) => {
      if (cual === 'consent') guardarConsent(blob);
      else {
        setSampleAudio(blob);
        setSampleSeconds(secs);
      }
    });
    if (!ok) {
      setMsg({
        tone: 'err',
        text: 'No pudimos acceder al micrófono. Revisa el permiso del navegador o sube un archivo.'
      });
    }
  };

  const consentScript = buildConsentScript({
    consentingName: personName.trim() || 'mi nombre',
    businessName: businessName ?? '',
    document: personDoc.trim() || null,
  });
  const sampleScript = buildSampleScript({ name: personName.trim() || null, businessName });

  const listoParaEnviar =
    Boolean(tiendaId) && name.trim().length >= 2 && personName.trim().length >= 2 &&
    Boolean(consentAudio) && Boolean(sampleAudio ?? sampleFile) && !busy;

  const enviar = async () => {
    if (!tiendaId || !listoParaEnviar) return;
    const muestra = sampleFile ?? new File([sampleAudio as Blob], `muestra.${format?.ext ?? 'ogg'}`, { type: format?.mime ?? 'audio/ogg' });
    const form = new FormData();
    form.append('tiendaId', tiendaId);
    form.append('name', name.trim());
    form.append('gender', gender);
    form.append('audio_file', muestra);
    form.append('consent_name', personName.trim());
    if (personDoc.trim()) form.append('consent_document', personDoc.trim());
    form.append('consent_purpose', defaultPurpose(businessName));
    if (sampleSeconds !== null) form.append('sample_seconds', String(sampleSeconds));
    if (consentAudio) {
      form.append('consent_audio', new File([consentAudio], `autorizacion.${format?.ext ?? 'ogg'}`, { type: format?.mime ?? 'audio/ogg' }));
    }

    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/voice/clones', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.clone) throw new Error(data.error ?? 'No se pudo crear la voz.');
      onCloned(data.clone as CloneResult);
      setMsg({
        tone: 'ok',
        text: data.authorizationRecorded
          ? 'Voz creada y autorización registrada. Escucha la muestra y guarda.'
          : 'Voz creada. La autorización no se pudo registrar: escálale a Upway antes de usarla.',
      });
      setConsentAudio(null);
      setSampleAudio(null);
      setSampleFile(null);
    } catch (error) {
      setMsg({ tone: 'err', text: error instanceof Error ? error.message : 'No se pudo crear la voz.' });
    } finally {
      setBusy(false);
    }
  };

  const grabador = (cual: 'consent' | 'sample', titulo: string, guion: string) => (
    <div className="space-y-2 rounded-[14px] border border-slate-200 bg-white p-3">
      <p className="text-xs font-bold text-slate-700">{titulo}</p>
      <p className="rounded-lg bg-slate-50 p-2 text-xs leading-relaxed text-slate-600">{guion}</p>
      {grabando !== cual ? (
        <button type="button" className={btnGhost} onClick={() => void start(cual)} disabled={!supported}>
          <Mic size={15} /> Grabar
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btnPrimary} onClick={parar}>
            <Square size={15} /> Detener · {segundos}s
          </button>
          <span className="text-xs font-semibold text-rose-600">Grabando…</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {!supported && (
        <p className="rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          Este navegador no puede grabar en un formato que el servicio de voz acepte. Sube un archivo
          (WAV, MP3, OGG o M4A) o usa Safari o Firefox para grabar.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
            Nombre de la voz
          </span>
          <input
            className={inputCls}
            placeholder="Ej. Voz Sede Norte"
            value={name}
            maxLength={80}
            onChange={(e) => {
              setName(e.target.value);
              setMsg(null);
            }}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
            Género
          </span>
          <select
            className={inputCls}
            value={gender}
            onChange={(e) => setGender(e.target.value as 'female' | 'male' | 'neutral')}
          >
            <option value="female">Femenina</option>
            <option value="male">Masculina</option>
            <option value="neutral">Neutra</option>
          </select>
        </label>
      </div>

      <div className="rounded-[18px] border-2 border-[#1b5ed6]/25 bg-[#1b5ed6]/[0.04] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1b5ed6]">1 · Quién autoriza</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          La voz es un dato sensible. Solo la persona cuya voz es puede autorizarla: la sede aparece
          como usuaria, no como titular.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            className={inputCls}
            placeholder="Nombre de quien autoriza"
            value={personName}
            maxLength={120}
            onChange={(e) => {
              setPersonName(e.target.value);
              setMsg(null);
            }}
          />
          <input
            className={inputCls}
            placeholder="Documento (opcional)"
            value={personDoc}
            maxLength={40}
            onChange={(e) => setPersonDoc(e.target.value)}
          />
        </div>
        {how === 'grabar' && grabador('consent', 'Graba la autorización leyendo esto', consentScript)}
        {consentAudio && consentUrl && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-700">
            ✓ Autorización grabada
            <audio controls src={consentUrl} className="h-8" />
          </div>
        )}
        {how === 'archivo' && (
          <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
            Subiendo un archivo no hay audio de autorización: la persona debe leer y grabar el
            párrafo aunque elijas subir la muestra.
          </p>
        )}
      </div>

      <div className="rounded-[18px] border border-slate-200 bg-white p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">2 · La muestra</p>
          <div className="flex gap-1">
            <button type="button" className={btnGhost} onClick={() => setHow('grabar')} disabled={!supported}>
              <Mic size={14} /> Grabar
            </button>
            <button type="button" className={btnGhost} onClick={() => setHow('archivo')}>
              <Upload size={14} /> Archivo
            </button>
          </div>
        </div>

        {how === 'grabar' ? (
          <>
            {grabador('sample', `Graba ${CLONE_IDEAL_SECONDS.min}–${CLONE_IDEAL_SECONDS.max} s leyendo esto`, sampleScript)}
            <p className="text-xs leading-relaxed text-slate-500">
              Ideal entre {CLONE_IDEAL_SECONDS.min} y {CLONE_IDEAL_SECONDS.max} segundos: el modelo
              recorta solo a 10 s y leer más no mejora nada. Habla claro, en un sitio sin ruido.
            </p>
          </>
        ) : (
          <input
            type="file"
            accept="audio/*"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-700 file:shadow-sm"
            onChange={(e) => {
              setSampleFile(e.target.files?.[0] ?? null);
              setMsg(null);
            }}
          />
        )}
      </div>

      <button type="button" className={btnPrimary} onClick={() => void enviar()} disabled={!listoParaEnviar}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
        {busy ? 'Creando la voz…' : 'Crear la voz'}
      </button>

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