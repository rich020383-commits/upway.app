'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Phone,
  User,
  CheckCircle,
  Clock,
  Sparkles,
  Building2,
  RotateCcw,
  Square,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { extractLeadData } from '@/lib/demo/extract';
import type { DemoMessage } from '@/lib/demo/store';

type DemoPanelProps = {
  sessionId: string;
};

export default function LiveDemoPanel({ sessionId }: DemoPanelProps) {
  const [status, setStatus] = useState<'waiting' | 'live' | 'ended'>('waiting');
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [phoneSesion, setPhoneSesion] = useState<string | null>(null);
  const [nombreSesion, setNombreSesion] = useState<string | null>(null);
  const [institucionSesion, setInstitucionSesion] = useState<string | null>(null);
  const [lead, setLead] = useState<ReturnType<typeof extractLeadData> | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [colgando, setColgando] = useState(false);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLead(extractLeadData(messages));
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const conectar = useCallback(() => {
    if (eventSource) eventSource.close();
    const es = new EventSource(`/api/demo/sessions/${sessionId}/stream`);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'session') {
          setStatus(data.status);
          setMessages(data.messages ?? []);
          setDurationSec(data.durationSec ?? null);
          if (data.phone) setPhoneSesion(data.phone);
          if (data.nombre) setNombreSesion(data.nombre);
          if (data.institucion) setInstitucionSesion(data.institucion);
        }
      } catch { /* mensaje malformado */ }
    };
    es.onerror = () => { es.close(); };
    setEventSource(es);
    return () => { es.close(); };
  }, [sessionId, eventSource]);

  useEffect(() => { conectar(); }, [conectar]);

  /** Cierre manual: fetch al servidor + fallback local 'ended'. */
  const colgar = async () => {
    if (colgando) return;
    setColgando(true);
    try {
      await fetch(`/api/demo/sessions/${sessionId}/end`, { method: 'POST' });
    } catch { /* el servidor la cierra por inactividad */ }
    finally { setStatus('ended'); setColgando(false); }
  };

  const mensajesVisibles = messages.filter(
    (m) => m.role === 'user' || m.role === 'assistant',
  );

  return (
    <section className="px-4 py-8 flex flex-col items-center w-full">
      <style>{`
        @keyframes upway-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .4; transform: scale(1.6); }
        }
        @keyframes upway-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-5xl w-full rounded-[28px] border border-[#e0edf6] bg-white overflow-hidden shadow-[0_20px_60px_rgba(13,49,104,0.08)]">
        {/* Header premium con gradiente azul → teal */}
        <div className="relative bg-gradient-to-br from-[#0d3168] via-[#0c4a8a] to-[#0ba9a9] px-6 py-6 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-[22px] font-extrabold text-white tracking-tight leading-tight">
                  Demo en vivo con Sophie
                </h2>
                <p className="text-white/60 text-[13px] mt-0.5">
                  Asistente comercial de Upway · Transcripción en tiempo real
                </p>
              </div>
            </div>
            {status === 'live' && (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-4 py-2 text-[13px] font-bold text-emerald-100 backdrop-blur">
                <span className="relative flex w-2.5 h-2.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400" style={{ animation: 'upway-pulse-dot 1.5s infinite' }} />
                  <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-300" />
                </span>
                EN VIVO
              </span>
            )}
            {status === 'waiting' && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-4 py-2 text-[13px] font-bold text-white/80 backdrop-blur">
                <Clock className="w-4 h-4" /> Esperando llamada
              </span>
            )}
            {status === 'ended' && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-4 py-2 text-[13px] font-bold text-white/80 backdrop-blur">
                <CheckCircle className="w-4 h-4" /> Finalizada
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-5 text-[13px] text-white/50">
            {nombreSesion && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span className="text-white/90 font-medium">{nombreSesion}</span>
              </span>
            )}
            {phoneSesion && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span className="font-mono text-white/90">{phoneSesion}</span>
              </span>
            )}
            {durationSec !== null && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono text-white/90">
                  {Math.floor(durationSec / 60)}:{String(durationSec % 60).padStart(2, '0')}
                </span>
              </span>
            )}
          </div>
        </div>


        {/* Contenido: transcript (3/5) + datos (2/5) */}
        <div className="grid grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-[#e0edf6] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-bold text-[#0d3168] uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#0ba9a9]" /> Transcripción en vivo
              </h3>
              <span className="text-[12px] text-[#7b93ab] font-medium">
                {mensajesVisibles.length} mensaje{mensajesVisibles.length === 1 ? '' : 's'}
              </span>
            </div>
            <div ref={transcriptRef} className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
              {mensajesVisibles.map((m, i) => {
                const esS = m.role === 'assistant';
                return (
                  <div key={i} className={`flex ${esS ? 'justify-start' : 'justify-end'}`} style={{ animation: 'upway-fade-in .3s ease' }}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${esS ? 'bg-gradient-to-br from-[#e7fbfa] to-[#f2fdfd] border border-[#c8f0ee] text-[#0d3168] rounded-bl-md' : 'bg-gradient-to-br from-[#0d3168] to-[#1a4a8a] text-white rounded-br-md shadow-[0_4px_12px_rgba(13,49,104,0.25)]'}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${esS ? 'text-[#0ba9a9]' : 'text-white/45'}`}>
                        {esS ? 'Sophie' : 'Visitante'}
                      </div>
                      {m.text}
                    </div>
                  </div>
                );
              })}
              {mensajesVisibles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-[#e7fbfa] flex items-center justify-center mb-4">
                    <Phone className="w-10 h-10 text-[#0ba9a9]" style={{ animation: 'upway-pulse-dot 2s infinite' }} />
                  </div>
                  <p className="text-[#55718f] font-semibold text-[15px] mb-1">Esperando que Sophie atienda…</p>
                  <p className="text-[#7b93ab] text-[13px]">La transcripción aparecerá aquí en tiempo real</p>
                </div>
              )}
            </div>
            {status === 'live' && (
              <button
                type="button"
                onClick={colgar}
                disabled={colgando}
                className="mt-5 w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#e2555f] to-[#c0392b] px-6 py-3.5 text-sm font-bold text-white transition-all hover:shadow-[0_8px_24px_rgba(226,85,95,0.4)] hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
              >
                {colgando ? (<><Loader2 className="w-4 h-4 animate-spin" /> Finalizando…</>) : (<><Square className="w-4 h-4 fill-current" /> Colgar / Finalizar llamada</>)}
              </button>
            )}
          </div>


          {/* Datos capturados */}
          <div className="lg:col-span-2 p-6 bg-gradient-to-b from-[#f8fcff] to-[#f0f7ff]">
            <h3 className="text-[13px] font-bold text-[#0d3168] uppercase tracking-wider flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-[#0ba9a9]" /> Datos capturados
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#e0edf6] shadow-[0_2px_8px_rgba(13,49,104,0.04)]">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-[#0d3168] to-[#1a5abf] flex items-center justify-center shadow-lg shadow-blue-500/20"><User className="w-5 h-5 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#7b93ab] uppercase tracking-wider font-bold">Cliente</div>
                  <div className="text-[15px] font-bold text-[#0d3168] truncate">{nombreSesion ?? lead?.nombre ?? '—'}</div>
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#e0edf6] shadow-[0_2px_8px_rgba(13,49,104,0.04)]">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-[#0ba9a9] to-[#0dd9d0] flex items-center justify-center shadow-lg shadow-teal-500/20"><Building2 className="w-5 h-5 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#7b93ab] uppercase tracking-wider font-bold">Institución</div>
                  <div className="text-[15px] font-bold text-[#0d3168] truncate">{institucionSesion ?? '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#e0edf6] shadow-[0_2px_8px_rgba(13,49,104,0.04)]">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-500/20"><Building2 className="w-5 h-5 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#7b93ab] uppercase tracking-wider font-bold">Sector</div>
                  <div className="text-[14px] font-bold text-[#0d3168] truncate capitalize">{lead?.sector ?? '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#e0edf6] shadow-[0_2px_8px_rgba(13,49,104,0.04)]">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#fbbf24] flex items-center justify-center shadow-lg shadow-amber-500/20"><Clock className="w-5 h-5 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#7b93ab] uppercase tracking-wider font-bold">Dolor</div>
                  <div className="text-[14px] font-bold text-[#0d3168] truncate capitalize">{lead?.dolor ?? '—'}</div>
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#e0edf6] shadow-[0_2px_8px_rgba(13,49,104,0.04)]">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-[#0ba9a9] to-[#0d3168] flex items-center justify-center shadow-lg shadow-teal-500/20"><Sparkles className="w-5 h-5 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#7b93ab] uppercase tracking-wider font-bold">Interés detectado</div>
                  <div className="text-[14px] font-bold text-[#0d3168] truncate capitalize">{lead?.interes ?? '—'}</div>
                </div>
              </div>
              {durationSec !== null && (
                <div className="col-span-2 flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#e0edf6] shadow-[0_2px_8px_rgba(13,49,104,0.04)]">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-[#64748b] to-[#94a3b8] flex items-center justify-center shadow-lg"><Clock className="w-5 h-5 text-white" /></div>
                  <div className="flex-1">
                    <div className="text-[10px] text-[#7b93ab] uppercase tracking-wider font-bold">Duración</div>
                    <div className="text-[14px] font-bold text-[#0d3168] font-mono">
                      {Math.floor(durationSec / 60)}:{String(durationSec % 60).padStart(2, '0')}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {lead?.mensajesCapturados.length ? (
              <div className="mt-5">
                <div className="text-[10px] text-[#7b93ab] uppercase tracking-wider font-bold mb-2">Frases clave de Sophie</div>
                <div className="space-y-2">
                  {lead.mensajesCapturados.slice(-3).map((m, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/70 border border-[#e0edf6] text-[12.5px] text-[#55718f] italic leading-relaxed">&ldquo;{m}&rdquo;</div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>


        {/* Demo completada */}
        {status === 'ended' && (
          <div className="border-t border-[#e0edf6] bg-gradient-to-br from-[#e7fbfa] to-[#f0fdfd] px-6 py-10 text-center" style={{ animation: 'upway-fade-in .4s ease' }}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0ba9a9] to-[#0dd9d0] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/30">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-extrabold text-[#0d3168] mb-2">¡Demo completada!</h3>
            <p className="text-[#55718f] text-[15px] max-w-md mx-auto mb-6 leading-relaxed">
              Sophie capturó los datos de la llamada. En una implementación real,{' '}
              <span className="font-bold text-[#0d3168]">estos datos se envían automáticamente a tu equipo comercial</span> para que lo contacten.
            </p>
            <button
              type="button"
              onClick={() => { window.location.href = '/demo'; }}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#0ba9a9] to-[#0c3775] px-8 py-3.5 text-[15px] font-bold text-white transition-all hover:shadow-[0_8px_24px_rgba(11,169,169,0.4)] hover:scale-[1.03] active:scale-[0.97]"
            >
              <RotateCcw className="w-5 h-5" /> Nueva demo
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

