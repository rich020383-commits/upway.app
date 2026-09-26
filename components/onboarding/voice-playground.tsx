'use client';

import { useEffect, useRef, useState } from 'react';
import { Headphones, Info, Loader2, Play, Search, Volume2 } from 'lucide-react';
import {
  VOICE_LANGUAGE_FILTERS,
  countByLanguage,
  searchVoices,
  type VoiceLanguageFilter,
} from '@/lib/telnyx/voices';

type VoiceOption = {
  value: string;
  label: string;
  kind: 'catalog' | 'clone';
  language?: string | null;
  gender?: string | null;
  cloneId?: string;
};

/** Texto por defecto: el mismo guion con el que se presenta el producto. */
const DEFAULT_LINE =
  'Hola, soy el asistente de Upway. Atiendo tus llamadas, califico a tus interesados y agendo la visita.';

/**
 * Probador de voz del caso (Center / Inmobiliaria).
 *
 * Existe por una razón de venta, no de adorno: el cliente tiene que poder
 * OÍR el producto antes de aprobar el plan. Y puede, porque la muestra de voz
 * es TTS (`/api/voice/preview`) y no necesita el número dedicado: ese solo hace
 * falta para recibir llamadas, que es un paso posterior.
 *
 * Solo muestra el CATÁLOGO. Clonar sigue bloqueado hasta aprobar el caso
 * (gate en /api/voice/clones) y aquí no se insinúa lo contrario.
 */
export default function VoicePlayground({ agentName }: { agentName?: string | null }) {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [langFilter, setLangFilter] = useState<VoiceLanguageFilter>('es');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<VoiceOption | null>(null);
  const [line, setLine] = useState(DEFAULT_LINE);
  const [playing, setPlaying] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    // Sin tiendaId a propósito: en esta etapa el caso todavía no tiene sede
    // operativa asignada, y el catálogo es público para cualquier sesión.
    fetch('/api/voice/voices')
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? 'No se pudo cargar el catálogo de voces.');
        if (!alive) return;
        const lista: VoiceOption[] = json.voices ?? [];
        setVoices(lista);
        setSelected(lista[0] ?? null);
      })
      .catch((e: unknown) => {
        if (alive) setLoadError(e instanceof Error ? e.message : 'No se pudo cargar el catálogo.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const visibles = searchVoices(voices, query).filter((v) => {
    const lang = (v.language ?? '').toLowerCase();
    if (langFilter === 'all') return true;
    if (!lang) return false;
    if (langFilter === 'es' || langFilter === 'en') return lang.startsWith(langFilter);
    return lang === langFilter;
  });

  const play = async () => {
    if (!selected || !line.trim()) return;
    setPlaying(true);
    setPlayError(null);
    try {
      const res = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice: selected.value,
          cloneId: selected.cloneId,
          text: line.trim().slice(0, 200),
          agentName: agentName ?? undefined,
        }),
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
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      await audio.play();
    } catch (error) {
      setPlaying(false);
      setPlayError(error instanceof Error ? error.message : 'No se pudo reproducir la muestra.');
    }
  };


  return (
    <div>
      <p className="text-[15px] text-slate-300 sm:text-sm">
        Escucha las voces de fábrica de Upway y prueba cómo sonaría tu asistente. Puedes
        cambiar el texto para oírlo con tus palabras.
      </p>

      {loadError ? (
        <p className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-[13px] font-semibold text-amber-200">
          {loadError}
        </p>
      ) : loading ? (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-slate-400">
          <Loader2 size={15} className="animate-spin" /> Cargando el catálogo…
        </p>
      ) : (
        <>
          {/* Con más de mil voces, el catálogo sin filtro es inusable. Reutiliza
              los mismos filtros por idioma del panel de Health. */}
          <div className="mt-4 flex flex-wrap gap-2">
            {VOICE_LANGUAGE_FILTERS.map((f) => {
              const n = countByLanguage(voices, f.id);
              if (n === 0) return null;
              const activo = langFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setLangFilter(f.id)}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-bold transition ${
                    activo
                      ? 'border-[#50e1d5] bg-[#0ba9a9]/20 text-[#50e1d5]'
                      : 'border-[#1E293B] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label} <span className="opacity-60">({n})</span>
                </button>
              );
            })}
          </div>

          <label className="mt-3 flex items-center gap-2 rounded-xl border border-[#1E293B] bg-[#0D1117] px-3">
            <Search size={15} className="shrink-0 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar voz…"
              className="w-full bg-transparent py-2.5 text-[13px] text-slate-200 outline-none placeholder:text-slate-600"
            />
          </label>

          {visibles.length === 0 ? (
            <p className="mt-3 text-[13px] text-slate-500">
              Ninguna voz de catálogo coincide con ese filtro.
            </p>
          ) : (
            <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {visibles.slice(0, 60).map((v) => {
                const activo = selected?.value === v.value;
                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setSelected(v)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                      activo
                        ? 'border-[#50e1d5]/60 bg-[#0ba9a9]/10'
                        : 'border-[#1E293B] hover:border-[#2a3a52]'
                    }`}
                  >
                    <Volume2 size={14} className={activo ? 'text-[#50e1d5]' : 'text-slate-500'} />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-slate-200">
                      {v.label}
                    </span>
                    {v.language && (
                      <span className="shrink-0 font-mono text-[10px] text-slate-500">
                        {v.language}
                      </span>
                    )}
                  </button>
                );
              })}
              {visibles.length > 60 && (
                <p className="px-1 pt-1 text-[11px] text-slate-500">
                  Mostrando 60 de {visibles.length}. Usa el buscador para afinar.
                </p>
              )}
            </div>
          )}

          <textarea
            value={line}
            onChange={(e) => setLine(e.target.value)}
            rows={2}
            maxLength={200}
            placeholder="Texto que debe decir la voz…"
            className="mt-3 w-full resize-none rounded-xl border border-[#1E293B] bg-[#0D1117] px-3 py-2.5 text-[13px] text-slate-200 outline-none placeholder:text-slate-600"
          />

          <button
            type="button"
            onClick={() => void play()}
            disabled={!selected || !line.trim() || playing}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#0ba9a9] px-5 py-2.5 text-[13px] font-bold text-white transition disabled:opacity-50"
          >
            {playing ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {playing ? 'Generando…' : 'Escuchar esta voz'}
          </button>

          {playError && (
            <p className="mt-2 text-[12px] font-semibold text-rose-300">{playError}</p>
          )}
        </>
      )}

      {/* Lo que todavía NO existe, dicho en claro. */}
      <p className="mt-4 flex items-start gap-2 border-t border-[#1E293B] pt-3 text-[12px] leading-relaxed text-slate-500">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          Esto es la muestra de voz: el agente todavía no recibe llamadas. El número dedicado
          se habilita al aprobar tu plan. Tu voz clonada se activa después, con tu
          autorización registrada.
        </span>
      </p>
      <p className="mt-2 flex items-start gap-2 text-[12px] leading-relaxed text-slate-500">
        <Headphones size={14} className="mt-0.5 shrink-0" />
        <span>
          Las muestras de voz tienen un límite de uso diario para que el servicio se mantenga.
        </span>
      </p>
    </div>
  );
}
