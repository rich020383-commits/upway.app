'use client';

import { useEffect, useState, useCallback } from 'react';
import { Phone, User, CheckCircle, Clock, Sparkles, ArrowRight } from 'lucide-react';
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
  const [lead, setLead] = useState<ReturnType<typeof extractLeadData> | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  useEffect(() => {
    setLead(extractLeadData(messages));
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
    <section className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 rounded-[24px] border border-[#0d3168]/40 bg-gradient-to-br from-[#0d3168]/10 to-[#132642]/20 p-6 md:p-8 shadow-[0_10px_30px_rgba(13,49,104,0.35)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-[#0d3168] flex items-center justify-center shadow-[0_0_0_8px_rgba(13,49,104,0.25)]">
            <Sparkles className="w-6 h-6 text-[#11b4b0]" />
          </div>
          <div>
            <h2 className="font-display text-[20px] font-extrabold leading-[1.1] tracking-[-1px] text-white md:text-[24px]">
              Demo en vivo con Sophie
            </h2>
            <p className="text-[#a8c4d9] text-sm mt-1">
              Esta llamada es atendida por Sophie, asistente comercial de Upway.{' '}
              <span className="font-semibold text-white">Lo que ves aquí es exactamente lo que tus clientes vivirán.</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#7b93ab]">
          <div className="flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-[#11b4b0]" />
            <span className="font-mono text-[#11b4b0] font-semibold">+57 601 9177737</span>
          </div>
          <span className="w-px h-3 bg-[#0d3168]/30 mx-1" />
          <span id="demo-status" className={status === 'live' ? 'text-[#11b4b0] font-semibold' : 'text-[#7b93ab]'}>
            {status === 'waiting' ? 'Esperando tu llamada…' : status === 'live' ? '🔴 En vivo' : 'Llamada finalizada'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Columna transcript */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0d3168] uppercase tracking-wider">
              Transcripción en vivo
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-[#11b4b0]/10 border border-[#11b4b0]/30 text-[#11b4b0] font-semibold">
              {messages.length} turnos
            </span>
          </div>
          <div className="h-[400px] overflow-y-auto rounded-[20px] border border-[#0d3168]/20 bg-[#0f172a]/50 p-4 md:p-6 text-[#a8c4d9] text-sm leading-relaxed shadow-[0_4px_12px_rgba(13,49,104,0.2)]">
            {messages.length === 0 ? (
              <p className="text-[#7b93ab] text-center mt-10 italic">
                La transcripción aparecerá aquí cuando llames al <span className="font-mono text-[#11b4b0]">601 9177737</span>.
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
                          ? 'bg-[#11b4b0]/30 text-white border border-[#11b4b0]/30 ml-2 rounded-tr-none'
                          : esTool
                            ? 'bg-[#0d3168]/10 text-[#a8c4d9] border border-[#0d3168]/30 rounded-bl-none text-[11px] uppercase tracking-wider mb-0.5'
                            : 'bg-[#0d3168]/20 text-[#a8c4d9] border border-[#0d3168]/30/60 rounded-tl-none'
                      }`}
                    >
                      {esTool && (
                        <span className="block text-[10px] text-[#7b93ab] mb-0.5">⚡ {m.text}</span>
                      )}
                      {m.text}
                      {m.at && (
                        <span className="block mt-0.5 text-[10px] opacity-50">
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
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0f172a]/30 border border-[#0d3168]/30">
              <User className="w-5 h-5 text-[#11b4b0]" />
              <div>
                <div className="text-xs text-[#7b93ab] uppercase tracking-wider">Cliente</div>
                <div className="text-sm font-medium text-[#a8c4d9]">{lead?.nombre ?? '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0f172a]/30 border border-[#0d3168]/30">
              <Phone className="w-5 h-5 text-[#11b4b0]" />
              <div>
                <div className="text-xs text-[#7b93ab] uppercase tracking-wider">Teléfono</div>
                <div className="text-sm font-bold text-white">{lead?.telefono ?? '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0f172a]/30 border border-[#0d3168]/30">
              <CheckCircle className="w-5 h-5 text-[#e2555f]" />
              <div>
                <div className="text-xs text-[#7b93ab] uppercase tracking-wider">Sector detectado</div>
                <div className="text-sm font-bold text-white capitalize">{lead?.sector ?? '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0f172a]/30 border border-[#0d3168]/30">
              <Clock className="w-5 h-5 text-[#0d3168]" />
              <div>
                <div className="text-xs text-[#7b93ab] uppercase tracking-wider">Dolor operativo</div>
                <div className="text-sm font-medium text-[#a8c4d9] capitalize">{lead?.dolor ?? '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0f172a]/30 border border-[#0d3168]/30">
              <Sparkles className="w-5 h-5 text-[#b388ff]" />
              <div>
                <div className="text-xs text-[#7b93ab] uppercase tracking-wider">Interés</div>
                <div className="text-sm font-bold text-white capitalize">{lead?.interes ?? '—'}</div>
              </div>
            </div>
            {durationSec !== null && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0f172a]/30 border border-[#0d3168]/30">
                <Clock className="w-5 h-5 text-[#0d3168]" />
                <div>
                  <div className="text-xs text-[#7b93ab] uppercase tracking-wider">Duración</div>
                  <div className="text-sm font-bold text-white">
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
                <ul className="text-xs text-[#a8c4d9] space-y-1">
                  {lead.mensajesCapturados.slice(-3).map((m, i) => (
                    <li key={i} className="italic text-[#a8c4d9]">
                      “{m}”
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {status === 'ended' && (
            <div className="rounded-[20px] border border-[#11b4b0]/40 bg-[#11b4b0]/10 p-6 shadow-[0_0_0_4px_rgba(17,180,176,0.15)]">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-[#11b4b0]" />
                <h4 className="text-sm font-bold text-white">Demo completada</h4>
              </div>
              <p className="text-sm text-[#a8c4d9]">
                Sophie capturó los datos de la llamada. En una implementación real,{' '}
                <span className="font-semibold">estos datos se envían automáticamente a tu equipo comercial</span>
                para que lo contacten.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}