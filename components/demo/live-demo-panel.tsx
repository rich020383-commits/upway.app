'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Phone, User, CheckCircle, Clock, Sparkles, Building2, RotateCcw } from 'lucide-react';
import { extractLeadData } from '@/lib/demo/extract';
import type { DemoMessage } from '@/lib/demo/store';

type DemoPanelProps = {
  sessionId: string;
};

export default function LiveDemoPanel({ sessionId }: DemoPanelProps) {
  const [status, setStatus] = useState<'waiting' | 'live' | 'ended'>('waiting');
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  // Teléfono enmascarado de la SESIÓN (el visitante lo registró en el
  // formulario): el transcript solo lo tendría si el usuario lo dice en voz.
  const [phoneSesion, setPhoneSesion] = useState<string | null>(null);
  // Nombre del visitante desde el formulario de /demo (no del transcript).
  const [nombreSesion, setNombreSesion] = useState<string | null>(null);
  const [lead, setLead] = useState<ReturnType<typeof extractLeadData> | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  // Auto-scroll: un transcript en vivo que no baja solo obliga al usuario a
  // hacer scroll con cada turno nuevo de Sophie.
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
          setConversationId(data.conversationId ?? null);
          if (data.phone) setPhoneSesion(data.phone);
          if (data.nombre) setNombreSesion(data.nombre);
        }
      } catch {
        // Ignorar mensajes malformados.
      }
    };
    es.onerror = () => {
      es.close();
    };
    setEventSource(es);
    return () => {
      es.close();
    };
  }, [sessionId, eventSource]);

  useEffect(() => {
    conectar();
  }, [conectar]);

  return (
    <section className="px-4 py-8 flex flex-col items-center">
      <div className="max-w-5xl w-full mb-8 rounded-[24px] border border-[#e0edf6] bg-white p-6 md:p-8 shadow-[0_10px_30px_rgba(15,31,54,0.10)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-[#e7fbfa] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#0ba9a9]" />
          </div>
          <div>
            <h2 className="font-display text-[20px] font-extrabold leading-[1.1] tracking-[-1px] text-[#0d3168] md:text-[24px]">
              Demo en vivo con Sophie
            </h2>
            <p className="text-[#55718f] text-sm mt-1">
              Esta llamada es atendida por Sophie, asistente comercial de Upway.{' '}
              <span className="font-semibold text-[#0d3168]">Lo que ves aquí es exactamente lo que tus clientes vivirán.</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#7b93ab]">
          <div className="flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-[#0ba9a9]" />
            <span className="font-mono text-[#0ba9a9] font-bold">+57 601 9177737</span>
          </div>
          <span className="w-px h-3 bg-[#e0edf6] mx-1" />
          {status === 'live' ? (
            <span id="demo-status" className="flex items-center gap-1.5 text-[#0ba9a9] font-semibold">
              <span className="upway-live-dot inline-block h-2 w-2 rounded-full bg-[#11b4b0]" aria-hidden="true" />
              En vivo
            </span>
          ) : (
            <span id="demo-status" className={status === 'ended' ? 'text-[#7b93ab]' : 'text-[#7b93ab]'}>
              {status === 'waiting' ? 'Esperando tu llamada…' : 'Llamada finalizada'}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 w-full max-w-5xl">
        {/* Columna transcript */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0d3168] uppercase tracking-wider">
              Transcripción en vivo
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-[#e7fbfa] border border-[#0ba9a9]/20 text-[#0ba9a9] font-semibold">
              {messages.length} turnos
            </span>
          </div>
          <div
            ref={transcriptRef}
            className="h-[400px] overflow-y-auto rounded-[20px] border border-[#e0edf6] bg-[#f9fcff] p-4 md:p-6 text-sm leading-relaxed shadow-[0_4px_12px_rgba(15,31,54,0.05)]"
          >
            {messages.length === 0 ? (
              <p className="text-[#7b93ab] text-center mt-10 italic">
                La transcripción aparecerá aquí cuando llames al <span className="font-mono text-[#0ba9a9]">601 9177737</span>.
              </p>
            ) : (
              messages.map((m, i) => {
                const esUsuario = m.role === 'user';
                const esTool = m.role === 'tool';
                return (
                  <div key={i} className={`flex gap-2 mb-1 ${esUsuario ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-2.5 text-sm break-words ${
                        esUsuario
                          ? 'bg-[#0ba9a9] text-white border border-[#0ba9a9]/60 ml-2 rounded-tr-none'
                          : esTool
                            ? 'bg-white text-[#55718f] border border-[#e0edf6] rounded-bl-none text-[11px] uppercase tracking-wider'
                            : 'bg-white text-[#49698f] border border-[#e0edf6] rounded-tl-none'
                      }`}
                    >
                      {esTool ? <span className="text-[#7b93ab]">⚡ {m.text}</span> : m.text}
                      {m.at && (
                        <span className={`block mt-0.5 text-[10px] ${esUsuario ? 'text-white/70' : 'text-[#7b93ab]'}`}>
                          {new Date(m.at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columna datos BOOM */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#0d3168] uppercase tracking-wider">
            Datos que Sophie captura
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-[#e0edf6]">
              <User className="w-5 h-5 text-[#0ba9a9]" />
              <div>
                <div className="text-xs text-[#7b93ab] uppercase tracking-wider">Cliente</div>
                <div className="text-sm font-medium text-[#0d3168]">{nombreSesion ?? lead?.nombre ?? '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-[#e0edf6]">
              <Phone className="w-5 h-5 text-[#0ba9a9]" />
              <div>
                <div className="text-xs text-[#7b93ab] uppercase tracking-wider">Teléfono</div>
                <div className="text-sm font-bold text-[#0d3168]">{phoneSesion ?? lead?.telefono ?? '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-[#e0edf6]">
              <Building2 className="w-5 h-5 text-[#0d3168]" />
              <div>
                <div className="text-xs text-[#7b93ab] uppercase tracking-wider">Sector detectado</div>
                <div className="text-sm font-bold text-[#0d3168] capitalize">{lead?.sector ?? '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-[#e0edf6]">
              <Clock className="w-5 h-5 text-[#0d3168]" />
              <div>
                <div className="text-xs text-[#7b93ab] uppercase tracking-wider">Dolor operativo</div>
                <div className="text-sm font-medium text-[#55718f] capitalize">{lead?.dolor ?? '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-[#e0edf6]">
              <Sparkles className="w-5 h-5 text-[#0ba9a9]" />
              <div>
                <div className="text-xs text-[#7b93ab] uppercase tracking-wider">Interés</div>
                <div className="text-sm font-bold text-[#0d3168] capitalize">{lead?.interes ?? '—'}</div>
              </div>
            </div>
            {durationSec !== null && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-[#e0edf6]">
                <Clock className="w-5 h-5 text-[#0d3168]" />
                <div>
                  <div className="text-xs text-[#7b93ab] uppercase tracking-wider">Duración</div>
                  <div className="text-sm font-bold text-[#0d3168]">
                    {Math.floor(durationSec / 60)}:{String(durationSec % 60).padStart(2, '0')}
                  </div>
                </div>
              </div>
            )}
            {lead?.mensajesCapturados.length && (
              <div className="px-3 pt-2">
                <div className="text-xs text-[#7b93ab] uppercase tracking-wider mb-1">
                  Últimos mensajes del asistente
                </div>
                <ul className="text-xs text-[#55718f] space-y-1">
                  {lead.mensajesCapturados.slice(-3).map((m, i) => (
                    <li key={i} className="italic">
                      “{m}”
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {status === 'ended' && (
            <div className="rounded-[20px] border border-[#0ba9a9]/30 bg-[#e7fbfa] p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-[#0ba9a9]" />
                <h4 className="text-sm font-bold text-[#0d3168]">Demo completada</h4>
              </div>
              <p className="text-sm text-[#55718f]">
                Sophie capturó los datos de la llamada. En una implementación real,{' '}
                <span className="font-semibold text-[#0d3168]">estos datos se envían automáticamente a tu equipo comercial</span> para que lo contacten.
              </p>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/demo';
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0ba9a9] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0c3775]"
              >
                <RotateCcw className="w-4 h-4" />
                Nueva demo
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}