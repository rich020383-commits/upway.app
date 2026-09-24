'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Pause, Play, Save, Sparkles, Upload, Waves, X } from 'lucide-react';

type VoiceOption = {
  value: string;
  label: string;
  kind: 'catalog' | 'clone';
  provider?: string;
  language?: string | null;
  gender?: string | null;
  cloneId?: string;
  status?: string | null;
};

type Msg = { tone: 'ok' | 'err' | 'info'; text: string } | null;

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1b5ed6] focus:outline-none';
const btnPrimary =
  'inline-flex items-center gap-2 rounded-xl bg-[#1b5ed6] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#164cae] disabled:cursor-not-allowed disabled:opacity-50';
const btnGhost =
  'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Selector de voz del agente para el panel final de activación
 * (/health/production): catálogo Telnyx + voces propias (clon por muestra o
 * Voice Design) con preview de audio y guardado vía PATCH /api/voice/agents.
 */
export default function VoiceSelector({
  tiendaId,
  initialVoice,
  initialVoiceLabel,
}: {
  tiendaId: string | null;
  initialVoice?: string | null;
  initialVoiceLabel?: string | null;
}) {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [clones, setClones] = useState<VoiceOption[]>([]);
  const [fallback, setFallback] = useState(false);
  const [selected, setSelected] = useState('');
  const [savedVoice, setSavedVoice] = useState(initialVoice ?? '');
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'none' | 'upload' | 'design'>('none');
  const [busyCreate, setBusyCreate] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [designName, setDesignName] = useState('');
  const [designPrompt, setDesignPrompt] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    // Sin tienda el render ya muestra el fallback: nada que cargar (evita
    // setState síncrono dentro del efecto — regla react-hooks/set-state-in-effect).
    if (!tiendaId) return;
    try {
      const res = await fetch(`/api/voice/voices?tiendaId=${encodeURIComponent(tiendaId)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo cargar el catálogo de voces.');
      const catalog: VoiceOption[] = data.voices ?? [];
      const cloneList: VoiceOption[] = data.clones ?? [];
      setClones(cloneList);
      setFallback(Boolean(data.fallback));
      const saved: string = data.current?.voice ?? initialVoice ?? '';
      const savedLabel: string = data.current?.label ?? initialVoiceLabel ?? '';
      // Si la voz guardada ya no está en el catálogo (p. ej. alias histórico),
      // se inyecta como opción para que el select la muestre.
      if (saved && ![...catalog, ...cloneList].some((option) => option.value === saved)) {
        catalog.unshift({
          value: saved,
          label: savedLabel || saved,
          kind: 'catalog',
          provider: 'telnyx',
        });
      }
      setVoices(catalog);
      setSelected(saved || catalog[0]?.value || cloneList[0]?.value || '');
      setSavedVoice(saved);
    } catch (error) {
      setMsg({ tone: 'err', text: error instanceof Error ? error.message : 'Error cargando voces.' });
    } finally {
      setLoading(false);
    }
  }, [tiendaId, initialVoice, initialVoiceLabel]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos vía fetch (mismo patrón asíncrono del resto del panel Health)
    void load();
  }, [load]);

  const all = [...voices, ...clones];
  const current = all.find((option) => option.value === selected) ?? null;
  const dirty = Boolean(selected) && selected !== savedVoice;
  const busy = previewing || saving || busyCreate;

  const playPreview = async () => {
    if (!selected) return;
    setPreviewing(true);
    setMsg(null);
    try {
      const res = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: selected, cloneId: current?.cloneId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'No se pudo generar la muestra.');
      }
      const url = URL.createObjectURL(await res.blob());
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current?.pause();
      audioRef.current = audio;
      audio.onended = () => setPreviewing(false);
      audio.onerror = () => setPreviewing(false);
      await audio.play();
    } catch (error) {
      setPreviewing(false);
      setMsg({
        tone: 'err',
        text: error instanceof Error ? error.message : 'No se pudo reproducir la muestra.',
      });
    }
  };

  const save = async () => {
    if (!tiendaId || !selected) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/voice/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiendaId, voz: selected, vozLabel: current?.label ?? selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo guardar la voz.');
      setSavedVoice(selected);
      setMsg({
        tone: data.appliedToTelnyx ? 'ok' : 'info',
        text:
          data.warning ??
          (data.appliedToTelnyx
            ? 'Voz guardada y aplicada al asistente Telnyx.'
            : 'Voz guardada.'),
      });
    } catch (error) {
      setMsg({ tone: 'err', text: error instanceof Error ? error.message : 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const addClone = (clone: VoiceOption) => {
    setClones((prev) => [clone, ...prev.filter((option) => option.value !== clone.value)]);
    setSelected(clone.value);
    setMode('none');
  };

  const createDesign = async () => {
    setBusyCreate(true);
    setMsg(null);
    try {
      const res = await fetch('/api/voice/clones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'design',
          name: designName.trim(),
          prompt: designPrompt.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.clone) throw new Error(data.error ?? 'No se pudo crear la voz.');
      addClone(data.clone as VoiceOption);
      setDesignName('');
      setDesignPrompt('');
      setMsg({ tone: 'ok', text: 'Voz propia creada. Escucha la muestra y guarda para aplicarla.' });
    } catch (error) {
      setMsg({ tone: 'err', text: error instanceof Error ? error.message : 'No se pudo crear la voz.' });
    } finally {
      setBusyCreate(false);
    }
  };

  const createUpload = async () => {
    setBusyCreate(true);
    setMsg(null);
    try {
      if (!uploadFile || uploadName.trim().length < 2) {
        throw new Error('Nombre (2–80 caracteres) y muestra de audio son obligatorios.');
      }
      const form = new FormData();
      form.append('audio_file', uploadFile);
      form.append('name', uploadName.trim());
      const res = await fetch('/api/voice/clones', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.clone) throw new Error(data.error ?? 'No se pudo crear la voz.');
      addClone(data.clone as VoiceOption);
      setUploadName('');
      setUploadFile(null);
      setMsg({ tone: 'ok', text: 'Voz clonada. Escucha la muestra y guarda para aplicarla.' });
    } catch (error) {
      setMsg({ tone: 'err', text: error instanceof Error ? error.message : 'No se pudo clonar la voz.' });
    } finally {
      setBusyCreate(false);
    }
  };

  if (!tiendaId) {
    return (
      <p className="text-sm text-slate-500">
        Sin tienda asociada: completa el onboarding para configurar la voz del agente.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[260px] flex-1">
          <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
            Voz del agente
          </span>
          <select
            className={inputCls}
            value={selected}
            disabled={loading || busy}
            onChange={(event) => {
              setSelected(event.target.value);
              setMsg(null);
            }}
          >
            {voices.length === 0 && clones.length === 0 && (
              <option value="">{loading ? 'Cargando voces…' : 'Sin voces disponibles'}</option>
            )}
            {voices.length > 0 && (
              <optgroup label="Catálogo Telnyx">
                {voices.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            )}
            {clones.length > 0 && (
              <optgroup label="Voces propias">
                {clones.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                    {option.status && option.status !== 'active' ? ` (${option.status})` : ''}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        <button
          type="button"
          className={btnGhost}
          onClick={() => void playPreview()}
          disabled={!selected || busy}
        >
          {previewing ? <Pause size={16} /> : <Play size={16} />}
          {previewing ? 'Reproduciendo…' : 'Escuchar muestra'}
        </button>
        <button
          type="button"
          className={btnPrimary}
          onClick={() => void save()}
          disabled={!selected || !dirty || busy}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {dirty ? 'Guardar voz' : 'Guardada'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={btnGhost}
          onClick={() => setMode(mode === 'upload' ? 'none' : 'upload')}
          disabled={busy}
        >
          <Upload size={15} /> Subir muestra (5–60 s)
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() => setMode(mode === 'design' ? 'none' : 'design')}
          disabled={busy}
        >
          <Sparkles size={15} /> Crear voz con prompt
        </button>
        {fallback && (
          <span className="text-xs font-semibold text-amber-600">
            Catálogo en modo respaldo (la API de voces no respondió).
          </span>
        )}
      </div>

      {mode === 'design' && (
        <div className="space-y-2 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Voz diseñada con IA
          </p>
          <input
            className={inputCls}
            placeholder="Nombre, ej. Voz Clínica Andes"
            value={designName}
            maxLength={80}
            onChange={(event) => setDesignName(event.target.value)}
          />
          <textarea
            className={inputCls}
            rows={3}
            maxLength={600}
            placeholder="Describe la voz: “voz femenina colombiana, cálida y serena, ritmo pausado para pacientes”."
            value={designPrompt}
            onChange={(event) => setDesignPrompt(event.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className={btnPrimary}
              onClick={() => void createDesign()}
              disabled={
                busyCreate || designName.trim().length < 2 || designPrompt.trim().length < 10
              }
            >
              {busyCreate ? <Loader2 size={16} className="animate-spin" /> : <Waves size={16} />}
              Crear voz
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => setMode('none')}
              disabled={busyCreate}
            >
              <X size={15} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {mode === 'upload' && (
        <div className="space-y-2 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Clonar desde muestra
          </p>
          <p className="text-xs leading-relaxed text-slate-500">
            Sube 5–60 s de voz clara en WAV, MP3, FLAC, OGG o M4A (máx. 5 MB). Telnyx crea una voz
            única con esa muestra.
          </p>
          <input
            className={inputCls}
            placeholder="Nombre, ej. Voz Fundadora"
            value={uploadName}
            maxLength={80}
            onChange={(event) => setUploadName(event.target.value)}
          />
          <input
            type="file"
            accept="audio/*"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-700 file:shadow-sm"
            onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className={btnPrimary}
              onClick={() => void createUpload()}
              disabled={busyCreate || !uploadFile || uploadName.trim().length < 2}
            >
              {busyCreate ? <Loader2 size={16} className="animate-spin" /> : <Waves size={16} />}
              Clonar voz
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => setMode('none')}
              disabled={busyCreate}
            >
              <X size={15} /> Cancelar
            </button>
          </div>
        </div>
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
