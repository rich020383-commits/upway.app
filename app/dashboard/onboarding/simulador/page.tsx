"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Mic, Square, Phone, PhoneOff, Activity, TerminalSquare, Rocket, ArrowRight } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Vapi from '@vapi-ai/web';

type Mensaje = { rol: 'usuario' | 'ia'; texto: string; provider?: string; esAudio?: boolean };
type Tab = 'whatsapp' | 'voz';
type VapiEngine = {
  removeAllListeners: () => void;
  stop: () => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  start: (assistantId: string, options: Record<string, unknown>) => Promise<void>;
};

let vapi: VapiEngine | null = null;

export default function Paso05Simulador() {
  const router = useRouter();
  const { promptMaestro, nicho, tonoWhatsapp, nombreAgente } = useUpwayStore();
  
  const [tabActiva, setTabActiva] = useState<Tab>('whatsapp');
  
  // Estados de WhatsApp
  const [input, setInput] = useState('');
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { rol: 'ia', texto: `¡Hola! Soy ${nombreAgente || 'tu asistente'}. Mis sistemas están en línea y listos para la simulación de pruebas. Puedes escribirme o enviarme un audio.` }
  ]);
  const [escribiendo, setEscribiendo] = useState(false);
  const [grabando, setGrabando] = useState(false);
  
  // Estados de Vapi (Voz)
  const [llamadaActiva, setLlamadaActiva] = useState(false);
  const [estadoLlamada, setEstadoLlamada] = useState<'inactiva' | 'conectando' | 'hablando'>('inactiva');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !vapi) {
      vapi = new Vapi('79cac89e-dc48-4951-aebf-16e0584d8030');
    }
    return () => {
      if (vapi) {
        vapi.removeAllListeners();
        vapi.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (tabActiva === 'whatsapp' && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [mensajes, escribiendo, tabActiva]);

  // --- LÓGICA DE WHATSAPP ---
  const iniciarGrabacion = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => enviarMensajeBackend('', reader.result as string);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setGrabando(true);
    } catch {
      alert("No se pudo acceder al micrófono.");
    }
  };

  const detenerGrabacion = () => {
    if (mediaRecorderRef.current && grabando) {
      mediaRecorderRef.current.stop();
      setGrabando(false);
    }
  };

  const enviarMensajeBackend = async (texto: string, audioBase64: string | null = null) => {
    if (!texto.trim() && !audioBase64) return;
    if (texto) {
      setMensajes(prev => [...prev, { rol: 'usuario', texto }]);
      setInput('');
    } else if (audioBase64) {
      setMensajes(prev => [...prev, { rol: 'usuario', texto: '🎙️ Transmisión de voz detectada', esAudio: true }]);
    }
    setEscribiendo(true);
    try {
      const promptEnriquecido = `[NOMBRE_AGENTE] ${nombreAgente || 'Asistente'}\n[TONO] Formalidad: ${tonoWhatsapp.formalidad}%, Cercanía: ${tonoWhatsapp.cercania}%, Persuasión: ${tonoWhatsapp.persuasion}%\n[NEGOCIO] Sector: ${nicho}\n[INSTRUCCIONES] ${promptMaestro}`.trim();
      const historialMapeado = mensajes.map(m => ({ rol: m.rol === 'ia' ? 'assistant' : 'user', texto: m.texto }));
      const payload: Record<string, unknown> = { promptMaestro: promptEnriquecido, historial: historialMapeado, tienda_id: '1172769935927318' };
      if (audioBase64) {
        payload.audioUsuario = audioBase64;
      } else {
        payload.mensajeUsuario = texto;
      }
      
      const res = await fetch('/api/simulador', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) setMensajes(prev => [...prev, { rol: 'ia', texto: data.respuesta, provider: data.provider }]);
      else setMensajes(prev => [...prev, { rol: 'ia', texto: 'Hubo un error de conexión.' }]);
    } catch {
      setMensajes(prev => [...prev, { rol: 'ia', texto: 'Error de red.' }]);
    } finally {
      setEscribiendo(false);
    }
  };

  // --- LÓGICA DE VOZ ---
  const toggleLlamada = async () => {
    if (!vapi) return;

    if (llamadaActiva) {
      vapi.stop();
      setLlamadaActiva(false);
      setEstadoLlamada('inactiva');
    } else {
      setLlamadaActiva(true);
      setEstadoLlamada('conectando');
      
      try {
        vapi.removeAllListeners();

        vapi.on('call-start', () => setEstadoLlamada('hablando'));
        vapi.on('call-end', () => {
          setLlamadaActiva(false);
          setEstadoLlamada('inactiva');
        });
        vapi.on('error', (error: unknown) => {
          console.error("Vapi Error:", error);
          setLlamadaActiva(false);
          setEstadoLlamada('inactiva');
        });

        const systemPromptDinamico = `Eres ${nombreAgente || 'un asistente virtual experto'}, operando para un negocio del sector ${nicho || 'general'}. ${promptMaestro}. Tu nombre es exactamente ${nombreAgente || 'Asistente'}.`;
        const isHombre = (nombreAgente || '').toLowerCase().includes('mauricio') || (nicho || '').toLowerCase().includes('hombre');
        const voiceConfig = isHombre ? { provider: "deepgram", voiceId: "nestor" } : { provider: "deepgram", voiceId: "celeste" };

        await vapi.start("e86eae54-3a05-4d31-938f-c8caf7522ee5", {
          firstMessage: `¡Hola! Soy ${nombreAgente || 'tu asistente'}, ¿en qué puedo ayudarte hoy?`,
          model: { provider: "openai", model: "gpt-4o", messages: [{ role: "system", content: systemPromptDinamico }] },
          voice: voiceConfig
        });
      } catch {
        setLlamadaActiva(false);
        setEstadoLlamada('inactiva');
        alert("No se pudo establecer la llamada. Verifica el micrófono.");
      }
    }
  };

  return (
    <main className="relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(27,94,214,0.12),_transparent_28%),linear-gradient(180deg,_#f7faff_0%,_#eef5ff_100%)] pb-28 text-slate-900 selection:bg-[#1b5ed6]/25">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-10 md:px-10">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <TerminalSquare className="h-5 w-5 text-[#1b5ed6]" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Upway</div>
              <div className="text-lg font-black tracking-[-0.05em] text-slate-900">Business</div>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            Ir al panel
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8">
          <div className="mb-8 flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-slate-500">
            <span>Configuración de tu agente</span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span className="font-semibold text-slate-900">05 / 05</span>
          </div>

          <div className="mb-8 flex gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-[#1b5ed6]" />
            <div className="h-1.5 flex-1 rounded-full bg-[#1b5ed6]" />
            <div className="h-1.5 flex-1 rounded-full bg-[#1b5ed6]" />
            <div className="h-1.5 flex-1 rounded-full bg-[#1b5ed6]" />
            <div className="h-1.5 flex-1 rounded-full bg-[#1b5ed6]" />
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl font-black leading-[0.96] tracking-[-0.06em] text-slate-900 md:text-5xl">Simulador de producción</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Prueba la lógica, respuestas y latencia de tu empleado digital antes de conectarlo a tus canales oficiales.
            </p>
          </div>
        </section>

        <section className="mt-8 flex min-h-[440px] flex-col gap-5 lg:flex-row">
          <aside className="w-full lg:w-[280px]">
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
              <h3 className="mb-5 text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Entorno de pruebas</h3>

              <div className="space-y-3">
                <button
                  onClick={() => setTabActiva('whatsapp')}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    tabActiva === 'whatsapp'
                      ? 'border-[#bfd8ff] bg-[#edf4ff] text-[#1b5ed6]'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">📱 Motor de texto</span>
                  {tabActiva === 'whatsapp' && <span className="h-2 w-2 rounded-full bg-[#1b5ed6]" />}
                </button>

                <button
                  onClick={() => setTabActiva('voz')}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    tabActiva === 'voz'
                      ? 'border-[#bfd8ff] bg-[#edf4ff] text-[#1b5ed6]'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">📞 Motor de voz</span>
                  {tabActiva === 'voz' && <span className="h-2 w-2 rounded-full bg-[#1b5ed6]" />}
                </button>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#1ea76d] animate-pulse" />
                  Sistemas operativos locales
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-h-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
            {tabActiva === 'whatsapp' ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 md:px-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{nombreAgente || 'Asistente IA'}</h3>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#1b5ed6]">En línea</p>
                    </div>
                  </div>
                </div>

                <div ref={chatContainerRef} className="flex h-[390px] flex-col gap-4 overflow-y-auto bg-slate-50/70 p-4 md:p-6">
                  {mensajes.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-[20px] p-3 text-sm leading-6 md:p-4 ${
                        msg.rol === 'usuario'
                          ? 'rounded-br-sm border border-slate-200 bg-slate-900 text-white'
                          : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'
                      }`}>
                        <p className={msg.esAudio ? 'italic text-[#1b5ed6]' : ''}>{msg.texto}</p>
                        {msg.provider && (
                          <p className="mt-2 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">
                            ⚡ {msg.provider}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {escribiendo && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-3 rounded-[20px] rounded-bl-sm border border-slate-200 bg-white p-3 text-xs font-mono uppercase tracking-[0.2em] text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin text-[#1b5ed6]" />
                        Procesando...
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 border-t border-slate-200 bg-white p-3 md:p-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && enviarMensajeBackend(input)}
                    placeholder="Envía un mensaje de prueba..."
                    disabled={grabando}
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1b5ed6] focus:ring-2 focus:ring-[#1b5ed6]/10 disabled:opacity-60"
                  />

                  {input.trim() ? (
                    <button
                      onClick={() => enviarMensajeBackend(input)}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white transition hover:bg-slate-700"
                    >
                      <Send size={16} />
                    </button>
                  ) : (
                    <button
                      onMouseDown={iniciarGrabacion}
                      onMouseUp={detenerGrabacion}
                      onTouchStart={iniciarGrabacion}
                      onTouchEnd={detenerGrabacion}
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                        grabando
                          ? 'border-red-200 bg-red-50 text-red-500 animate-pulse'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {grabando ? <Square size={14} fill="currentColor" /> : <Mic size={16} />}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center bg-slate-50/70 p-6 text-center md:p-8">
                <div className="mb-8 flex items-center justify-center">
                  <div className={`relative flex h-24 w-24 items-center justify-center rounded-full border ${
                    estadoLlamada === 'hablando'
                      ? 'border-[#bfd8ff] bg-[#edf4ff] shadow-[0_0_35px_rgba(27,94,214,0.18)]'
                      : 'border-slate-200 bg-white'
                  }`}>
                    <div className={`absolute h-32 w-32 rounded-full bg-[#1b5ed6]/10 blur-xl ${estadoLlamada === 'hablando' ? 'animate-ping opacity-100' : 'opacity-0'}`} />
                    {estadoLlamada === 'conectando' ? (
                      <Loader2 className="h-8 w-8 animate-spin text-[#1b5ed6]" />
                    ) : (
                      <Activity className={`h-8 w-8 ${estadoLlamada === 'hablando' ? 'text-[#1b5ed6] animate-pulse' : 'text-slate-500'}`} />
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-black tracking-[-0.05em] text-slate-900">{nombreAgente || 'Asistente IA'}</h3>
                <p className={`mt-3 text-[11px] font-mono uppercase tracking-[0.2em] ${estadoLlamada === 'hablando' ? 'text-[#1b5ed6]' : 'text-slate-500'}`}>
                  {estadoLlamada === 'inactiva' && 'Listo para conexión de voz'}
                  {estadoLlamada === 'conectando' && 'Enlazando motores...'}
                  {estadoLlamada === 'hablando' && 'Transmisión en curso'}
                </p>

                <button
                  onClick={toggleLlamada}
                  className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${
                    llamadaActiva
                      ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-slate-950 text-white shadow-[0_16px_35px_rgba(15,23,42,0.12)] hover:-translate-y-0.5'
                  }`}
                >
                  {llamadaActiva ? <PhoneOff size={16} /> : <Phone size={16} />}
                  {llamadaActiva ? 'Finalizar transmisión' : 'Iniciar llamada'}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 md:px-10">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Estado del sistema</div>
            <div className="mt-1 flex items-center gap-2 text-lg font-black tracking-[-0.05em] text-slate-900 md:text-xl">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1ea76d] animate-pulse" />
              Listo para producción
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard/onboarding/pagos')}
            className="inline-flex items-center gap-2 rounded-full bg-[#1b5ed6] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(27,94,214,0.2)] transition hover:-translate-y-0.5"
          >
            <Rocket size={16} />
            Activar agente
          </button>
        </div>
      </div>
    </main>
  );
}