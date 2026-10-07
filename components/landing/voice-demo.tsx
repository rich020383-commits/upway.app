'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Play, Square, Volume2 } from 'lucide-react';

type VoiceOption = { value: string; label: string; language?: string | null };

/** Frase por defecto: la promesa del producto, en la voz que el visitante elige. */
const FRASE =
  'Hola, te llama Upway. Contestamos tu línea las veinticuatro horas y agendamos la cita en el momento.';

/**
 * Demo de voz PÚBLICA de la landing.
 *
 * El visitante elige voz, escribe su frase y la escucha: es el producto
 * demostrándose solo, sin teléfono ni registro. Habla con
 * `POST /api/voice/demo` (sin sesión, frenado por IP).
 *
 * El waveform es real: `AnalyserNode` lee la frecuencia del audio que ya está
 * sonando y dibuja las barras con RAF. Solo se anima mientras hay audio, y con
 * `prefers-reduced-motion` se pinta plano. `createMediaElementSource` se hace
 * UNA sola vez por elemento (regla de Web Audio: no admite dos fuentes por
 * elemento); si el navegador lo rechaza, el audio igual suena — el waveform es
 * adorno, nunca condición.
 */
export default function VoiceDemo() {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VoiceOption | null>(null);
  const [frase, setFrase] = useState(FRASE);
  const [playing, setPlaying] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const conectadoRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    let alive = true;
    fetch('/api/voice/demo', { headers: { Accept: 'application/json' } })
      .then(async (res) => {
        if (!res.ok) throw new Error('catalogo');
        const data = (await res.json()) as { voices?: VoiceOption[] };
        const lista = data.voices ?? [];
        if (!alive) return;
        setVoices(lista);
        setSelected(lista[0] ?? null);
      })
      .catch(() => {
        // Sin catálogo la demo se degrada con honestidad: se explica y se
        // apunta al asesor. Nunca se muestra una lista vacía como si estuviera.
        if (alive) setError('La demo de voz no está disponible en este momento.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => undefined);
    },
    []
  );

  /** Barras del waveform leídas del audio real (solo mientras suena). */
  const dibujar = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const datos = new Uint8Array(analyser.frequencyBinCount);
    const ancho = canvas.width;
    const alto = canvas.height;
    const barras = 44;
    const paso = Math.max(1, Math.floor(datos.length / barras));

    const frame = () => {
      analyser.getByteFrequencyData(datos);
      ctx.clearRect(0, 0, ancho, alto);
      const w = ancho / barras;
      for (let i = 0; i < barras; i++) {
        const bruto = datos[i * paso] / 255;
        const h = reduce ? alto * 0.25 : Math.max(3, bruto * alto);
        ctx.fillStyle = i % 3 === 0 ? '#0ba9a9' : '#9fe0dc';
        ctx.fillRect(i * w + 1, alto - h, w - 2, h);
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    cancelAnimationFrame(rafRef.current);
    frame();
  };

  const limpiarCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const escuchar = async () => {
    if (!selected || !frase.trim() || generando || playing) return;
    setGenerando(true);
    setError(null);
    try {
      const res = await fetch('/api/voice/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: selected.value, text: frase.trim().slice(0, 140) }),
      });
      if (!res.ok) {
        let detalle = 'No pudimos generar la muestra ahora. Intenta de nuevo.';
        try {
          const data = (await res.json()) as { error?: unknown };
          if (typeof data.error === 'string') detalle = data.error;
        } catch {
          // Respuesta sin JSON: se queda el mensaje genérico honesto.
        }
        if (res.status === 429) {
          const espera = res.headers.get('Retry-After');
          detalle = espera
            ? `Se agotaron las muestras de esta hora. Quedan ${espera} s para volver a intentar.`
            : 'Se agotaron las muestras de voz de esta hora. Vuelve más tarde o pide la demo completa.';
        }
        throw new Error(detalle);
      }


      const url = URL.createObjectURL(await res.blob());
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;

      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.src = url;
      audio.onended = () => {
        setPlaying(false);
        cancelAnimationFrame(rafRef.current);
        limpiarCanvas();
      };

      // Web Audio solo por click (gesto de usuario): así el AudioContext se
      // crea con la política de autoplay satisfecha.
      try {
        if (!audioCtxRef.current) {
          const Ctx =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (Ctx) audioCtxRef.current = new Ctx();
        }
        const ctx = audioCtxRef.current;
        if (ctx && !conectadoRef.current) {
          const fuente = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          fuente.connect(analyser);
          analyser.connect(ctx.destination);
          analyserRef.current = analyser;
          conectadoRef.current = true;
        }
        if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume();
      } catch {
        // Si el navegador no permite la fuente, el audio igual suena:
        // el waveform es adorno, nunca condición.
      }

      await audio.play();
      setPlaying(true);
      if (analyserRef.current) dibujar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos generar la muestra ahora.');
    } finally {
      setGenerando(false);
    }
  };

  const detener = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);
    cancelAnimationFrame(rafRef.current);
    limpiarCanvas();
  };

  const ocupado = generando || playing;


  return (
    <div className="w-full">
      {/* Voces: chips con la etiqueta real del catálogo. */}
      <div className="mb-4 flex flex-wrap gap-2">
        {loading && (
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e0edf6] bg-white px-4 py-2 text-[13px] font-medium text-[#55718f]">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando voces…
          </span>
        )}
        {voices.map((v) => {
          const activa = selected?.value === v.value;
          const lang = (v.language ?? '').split('-')[0] ?? '';
          return (
            <button
              key={v.value}
              type="button"
              onClick={() => !ocupado && setSelected(v)}
              aria-pressed={activa}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[14px] font-bold transition ${
                activa
                  ? 'border-[#0ba9a9] bg-gradient-to-b from-[#11b4b0] to-[#0d8a88] text-white shadow-[0_8px_20px_-6px_rgba(11,169,169,0.55)] scale-[1.04]'
                  : 'border-[#e0edf6] bg-white text-[#49698f] shadow-sm hover:-translate-y-0.5 hover:border-[#9fe0dc] hover:bg-[#f7fdff] hover:shadow-[0_8px_18px_-10px_rgba(15,31,54,0.35)]'
              }`}
            >
              {activa && <Volume2 className="h-4 w-4" />}
              {v.label}
              {lang && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    activa ? 'bg-white/25 text-white' : 'bg-[#eef5ff] text-[#7b93ab]'
                  }`}
                >
                  {lang}
                </span>
              )}
            </button>
          );
        })}
      </div>


      {/* La frase del visitante. text-base (16px) sin excepción: menos que eso
          iOS hace zoom automático al enfocar y el teclado tapa el formulario. */}
      <div className="flex flex-col gap-3 rounded-[20px] border border-[#e0edf6] bg-white p-4 shadow-[0_10px_30px_rgba(15,31,54,0.06)] sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1.5 block text-[13px] font-bold text-[#0d3168]">
            Escribe lo que quieras escuchar
          </span>
          <textarea
            value={frase}
            onChange={(e) => setFrase(e.target.value.slice(0, 140))}
            rows={2}
            maxLength={140}
            className="w-full resize-none rounded-xl border border-[#e0edf6] bg-[#f9fcff] p-3 text-[16px] leading-relaxed text-[#0d3168] outline-none focus:border-[#9fe0dc] focus:ring-2 focus:ring-[#9fe0dc]/40"
          />
          <span className="mt-1 block text-[11px] font-medium text-[#7b93ab]">
            {frase.length}/140
          </span>
        </label>
        <button
          type="button"
          onClick={playing ? detener : escuchar}
          disabled={loading || !selected || generando}
          className="btn-glow-primary inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : playing ? (
            <Square className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {generando ? 'Generando…' : playing ? 'Detener' : 'Escuchar mi frase'}
        </button>
      </div>

      {/* Waveform: barras del audio real mientras suena. Con audio activo el
          marco se enciende (aro estático + fondo degradado): es la señal de
          que está pasando algo, sin animar bordes en lazo. */}
      <div
        className={`mt-3 flex h-14 items-center justify-center rounded-[14px] border px-3 transition ${
          playing
            ? 'border-[#0ba9a9]/50 bg-gradient-to-b from-[#f7fdff] to-[#e7fbfa] shadow-[0_0_0_4px_rgba(11,169,169,0.16)]'
            : 'border-[#e0edf6] bg-[#f9fcff]'
        }`}
      >
        <canvas ref={canvasRef} width={720} height={44} className="h-11 w-full max-w-[560px]" />
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[14px] font-medium text-amber-800">
          {error}
        </p>
      )}

      <p className="mt-3 text-[13px] leading-relaxed text-[#55718f]">
        La misma voz con la que el agente atiende en producción. Sin registro y sin
        llamada: escúchalo antes de pedir la demo completa.
      </p>
    </div>
  );
}
