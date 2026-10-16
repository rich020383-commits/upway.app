'use client';

import { useEffect, useState, useCallback } from 'react';
import { Mic, Phone, User, CheckCircle, Clock, Sparkles } from 'lucide-react';
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
      <div className="mb-6 rounded-xl bg-gradient-to-br from-blue-900/20 to-indigo-900/30 border border-blue-500/30 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-blue-100">Demo en vivo con Sophie</h2>
            <p className="text-blue-200 text-sm">
              Esta llamada es atendida por Sophie, asistente comercial de Upway.{' '}
              <span className="font-semibold">Lo que ves aquí es exactamente lo que tus clientes vivirán.</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-blue-300">
          <div className="flex items-center gap-1.5">
            <Phone className="w-4 h-4" />
            <span>+57 601 9177737</span>
          </div>
          <span className="w-px h-3 bg-blue-500/50 mx-1" />
          <span id="demo-status" className={status === 'live' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
            {status === 'waiting' ? 'Esperando tu llamada…' : status === 'live' ? '🔴 En vivo' : 'Llamada finalizada'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Columna transcript */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Transcripción en vivo
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800/50 text-slate-400 border border-slate-700/50">
              {messages.length} turnos
            </span>
          </div>
          <div className="h-[400px] overflow-y-auto bg-slate-900/40 rounded-xl border border-slate-700/50 p-4 font-mono text-sm leading-relaxed space-y-2">
            {messages.length === 0 ? (
              <p className="text-slate-500 text-center mt-10 italic">
                La transcripción aparecerá aquí cuando llames al 601 9177737.
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
                          ? 'bg-blue-600/30 text-blue-100 border border-blue-500/30 ml-2 rounded-tr-none'
                          : esTool
                            ? 'bg-slate-800/50 text-slate-300 border border-slate-700 rounded-bl-none text-[11px] uppercase tracking-wider mb-0.5'
                            : 'bg-slate-800/60 text-slate-200 border border-slate-700/60 rounded-tl-none'
                      }`}
                    >
                      {esTool && (
                        <span className="block text-[10px] text-slate-500 mb-0.5">⚡ {m.text}</span>
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
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            🎯 Datos que Sophie captura
          </h3>
          <div className="bg-slate-900/40 rounded-xl border border-slate-700/50 p-5 space-y-4">
            <div className="flex items-center gap-3 px-3 py-2 rounded bg-slate-800/30 border border-slate-700/30">
              <User className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Cliente</div>
                <div className="text-sm font-medium text-slate-200">{lead?.nombre ?? '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded bg-slate-800/30 border border-slate-700/30">
              <Phone className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Teléfono</div>
                <div className="text-sm font-medium text-slate-200">{lead?.telefono ?? '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded bg-slate-800/30 border border-slate-700/30">
              <CheckCircle className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Sector detectado</div>
                <div className="text-sm font-medium text-slate-200 capitalize">{lead?.sector ?? '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded bg-slate-800/30 border border-slate-700/30">
              <Clock className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Dolor operativo</div>
                <div className="text-sm font-medium text-slate-200 capitalize">{lead?.dolor ?? '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded bg-slate-800/30 border border-slate-700/30">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Interés</div>
                <div className="text-sm font-medium text-slate-200 capitalize">{lead?.interes ?? '—'}</div>
              </div>
            </div>
            {durationSec !== null && (
              <div className="flex items-center gap-3 px-3 py-2 rounded bg-slate-800/30 border border-slate-700/30">
                <Clock className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Duración</div>
                  <div className="text-sm font-medium text-slate-200">
                    {Math.floor(durationSec / 60)}:{String(durationSec % 60).padStart(2, '0')}
                  </div>
                </div>
              </div>
            )}
            {lead?.mensajesCapturados.length && (
              <div className="px-3 pt-2">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Últimos mensajes del asistente
                </div>
                <ul className="text-xs text-slate-300 space-y-1">
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
            <div className="rounded-xl bg-emerald-900/20 border border-emerald-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-emerald-100">Demo completada</h4>
              </div>
              <p className="text-sm text-emerald-200">
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