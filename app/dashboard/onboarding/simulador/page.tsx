"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Loader2, Mic, Square, Phone, PhoneOff, Activity, TerminalSquare, Rocket } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Vapi from '@vapi-ai/web';

type Mensaje = { rol: 'usuario' | 'ia'; texto: string; provider?: string; esAudio?: boolean };
type Tab = 'whatsapp' | 'voz';

let vapi: any = null;

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
  const [tiendaId, setTiendaId] = useState<string | null>(null);
  const [simulatorError, setSimulatorError] = useState<string | null>(null);
  
  // Estados de Vapi (Voz)
  const [llamadaActiva, setLlamadaActiva] = useState(false);
  const [estadoLlamada, setEstadoLlamada] = useState<'inactiva' | 'conectando' | 'hablando'>('inactiva');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !vapi) {
      const vapiPublicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
      if (vapiPublicKey) {
        vapi = new Vapi(vapiPublicKey);
      }
    }
    return () => {
      if (vapi) {
        vapi.removeAllListeners();
        vapi.stop();
      }
    };
  }, []);

  useEffect(() => {
    const cargarTienda = async () => {
      try {
        const res = await fetch('/api/tienda/me');
        const data = await res.json();
        if (res.ok && data.tiendaId) setTiendaId(data.tiendaId);
      } catch (error) {
        console.error('Error obteniendo la tienda para el simulador:', error);
      }
    };
    cargarTienda();
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
    } catch (error) {
      setSimulatorError('No se pudo acceder al micrófono. Verifica los permisos del navegador.');
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
      const payload: any = { promptMaestro: promptEnriquecido, historial: historialMapeado, tienda_id: tiendaId };
      if (audioBase64) payload.audioUsuario = audioBase64; else payload.mensajeUsuario = texto;
      
      const res = await fetch('/api/simulador', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) setMensajes(prev => [...prev, { rol: 'ia', texto: data.respuesta, provider: data.provider }]);
      else setMensajes(prev => [...prev, { rol: 'ia', texto: 'Hubo un error de conexión.' }]);
    } catch (error) {
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
        vapi.on('error', (e: any) => {
          console.error("Vapi Error:", e);
          setLlamadaActiva(false);
          setEstadoLlamada('inactiva');
        });

        const systemPromptDinamico = `Eres ${nombreAgente || 'un asistente virtual experto'}, operando para un negocio del sector ${nicho || 'general'}. ${promptMaestro}. Tu nombre es exactamente ${nombreAgente || 'Asistente'}.`;
        const isHombre = (nombreAgente || '').toLowerCase().includes('mauricio') || (nicho || '').toLowerCase().includes('hombre');
        const voiceConfig = isHombre ? { provider: "deepgram", voiceId: "nestor" } : { provider: "deepgram", voiceId: "celeste" };

        const vapiAssistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
        if (!vapiAssistantId) {
          throw new Error('Falta configurar el asistente de voz.');
        }

        await vapi.start(vapiAssistantId, {
          firstMessage: `¡Hola! Soy ${nombreAgente || 'tu asistente'}, ¿en qué puedo ayudarte hoy?`,
          model: { provider: "openai", model: "gpt-4o", messages: [{ role: "system", content: systemPromptDinamico }] },
          voice: voiceConfig
        });
      } catch (error) {
        console.error("Error Vapi:", error);
        setLlamadaActiva(false);
        setEstadoLlamada('inactiva');
        setSimulatorError('No se pudo establecer la llamada. Verifica el micrófono y vuelve a intentarlo.');
      }
    }
  };

  return (
    // 🔥 EL CASCARÓN: h-full y flex-col congelan la pantalla general
    <div className="flex flex-col h-full w-full relative bg-transparent text-[#F5F7FA]">
      
      {/* Botón de Saltar */}
      <div className="absolute top-4 right-4 md:top-6 md:right-8 z-50">
        <Link 
          href="/dashboard" 
          className="text-xs md:text-sm font-semibold text-[#8994A6] hover:text-[#19C8E8] flex items-center gap-2 bg-[#1E293B]/30 hover:bg-[#1E293B] px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all duration-300 border border-[#1E293B]/50 hover:border-[#19C8E8]/30"
        >
          Ir al Panel
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* 🔥 EL RESORTE CENTRAL: Controla el alto interno dinámicamente */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-4 mt-8 md:mt-2 flex flex-col min-h-0 overflow-hidden">
        
        {/* Cabecera compactada (shrink-0 para que no se aplaste) */}
        <div className="shrink-0 mb-4 md:mb-6">
          <div className="flex items-center gap-3 text-[#8994A6] text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-4">
            <span>Configuración de tu agente</span>
            <span className="w-1 h-1 rounded-full bg-[#8994A6]"></span>
            <span className="text-[#F5F7FA]">05 / 05</span>
          </div>
          
          <div className="flex gap-2 mb-4 md:mb-6">
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full shadow-[0_0_15px_rgba(25,200,232,0.5)]"></div>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <TerminalSquare className="text-[#19C8E8] h-6 w-6 md:h-8 md:w-8" />
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Simulador de Producción</h1>
          </div>
          <p className="text-[#8994A6] text-xs md:text-sm max-w-2xl">
            Prueba la lógica, respuestas y latencia de tu empleado digital antes de conectarlo a tus canales oficiales.
          </p>
          {simulatorError && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-[#FCA5A5]">
              {simulatorError}
            </div>
          )}
        </div>

        {/* CONTENEDOR DEL SIMULADOR: Toma el espacio restante con flex-1 min-h-0 */}
        <div className="flex-1 min-h-0 w-full flex flex-col lg:flex-row gap-4 md:gap-6 pb-2">
          
          {/* Controles y Status (Izquierda) */}
          <div className="shrink-0 lg:w-1/3 flex flex-col justify-start">
            <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-5 md:p-6">
              <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-[#8994A6] mb-5">Entorno de Pruebas</h3>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setTabActiva('whatsapp')}
                  className={`py-2.5 px-4 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center justify-between ${
                    tabActiva === 'whatsapp' 
                      ? 'bg-[#19C8E8]/10 text-[#19C8E8] border border-[#19C8E8]/30' 
                      : 'bg-[#07090C] text-[#8994A6] border border-[#1E293B] hover:border-[#8994A6]/50'
                  }`}
                >
                  <span className="flex items-center gap-2">📱 Motor de Texto</span>
                  {tabActiva === 'whatsapp' && <span className="h-1.5 w-1.5 rounded-full bg-[#19C8E8]"></span>}
                </button>
                
                <button 
                  onClick={() => setTabActiva('voz')}
                  className={`py-2.5 px-4 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center justify-between ${
                    tabActiva === 'voz' 
                      ? 'bg-[#19C8E8]/10 text-[#19C8E8] border border-[#19C8E8]/30' 
                      : 'bg-[#07090C] text-[#8994A6] border border-[#1E293B] hover:border-[#8994A6]/50'
                  }`}
                >
                  <span className="flex items-center gap-2">📞 Motor de Voz</span>
                  {tabActiva === 'voz' && <span className="h-1.5 w-1.5 rounded-full bg-[#19C8E8]"></span>}
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-[#1E293B]">
                <p className="text-[10px] md:text-xs text-[#8994A6] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Sistemas operativos locales
                </p>
              </div>
            </div>
          </div>

          {/* Área Interactiva (Derecha): flex-1 asegura que se estire al fondo sin empujar la pantalla */}
          <div className="flex-1 min-h-0 bg-[#0D1117] border border-[#1E293B] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            
            {tabActiva === 'whatsapp' ? (
              /* --- INTERFAZ TEXTO --- */
              <>
                <div className="shrink-0 bg-[#121821] p-3 md:p-4 flex items-center justify-between border-b border-[#1E293B]">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 md:h-10 md:w-10 bg-[#1E293B] border border-[#8994A6]/20 rounded-full flex items-center justify-center">
                      <Bot size={18} className="text-[#F5F7FA]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#F5F7FA] text-xs md:text-sm">{nombreAgente || 'Asistente IA'}</h3>
                      <p className="text-[9px] md:text-[10px] text-[#19C8E8] font-mono tracking-widest mt-0.5">EN LÍNEA</p>
                    </div>
                  </div>
                </div>

                {/* El historial de chat: flex-1 y overflow-y-auto mantiene el scroll por dentro */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-[#07090C] no-scrollbar">
                  {mensajes.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[80%] p-3 md:p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
                        msg.rol === 'usuario' 
                          ? 'bg-[#1E293B] text-[#F5F7FA] rounded-tr-sm border border-[#8994A6]/20' 
                          : 'bg-[#121821] text-[#F5F7FA] rounded-tl-sm border border-[#1E293B]'
                      }`}>
                        <p className={`${msg.esAudio ? 'italic text-[#19C8E8]' : ''}`}>{msg.texto}</p>
                        {msg.provider && <p className="text-[9px] md:text-[10px] text-[#8994A6] mt-2 text-right font-mono uppercase">⚡ {msg.provider}</p>}
                      </div>
                    </div>
                  ))}
                  {escribiendo && (
                    <div className="flex justify-start">
                      <div className="bg-[#121821] border border-[#1E293B] p-3 md:p-4 rounded-2xl rounded-tl-sm flex items-center gap-3">
                        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin text-[#19C8E8]" />
                        <span className="text-[10px] md:text-xs text-[#8994A6] font-mono tracking-widest">PROCESANDO...</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="shrink-0 bg-[#121821] p-3 md:p-4 border-t border-[#1E293B] flex items-center gap-2 md:gap-3">
                  <input
                    type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviarMensajeBackend(input)}
                    placeholder="Envía un mensaje de prueba..." disabled={grabando}
                    className="flex-1 bg-[#07090C] text-[#F5F7FA] border border-[#1E293B] rounded-xl px-3 md:px-4 py-2.5 md:py-3 outline-none text-xs md:text-sm placeholder-[#8994A6]/50 focus:border-[#19C8E8] transition-all disabled:opacity-50"
                  />
                  {input.trim() ? (
                    <button onClick={() => enviarMensajeBackend(input)} className="h-10 w-10 md:h-11 md:w-11 shrink-0 bg-[#F5F7FA] rounded-xl flex items-center justify-center text-[#07090C] hover:bg-[#E2E8F0] transition-all">
                      <Send size={16} className="ml-1 md:ml-0 md:size-[18px]" />
                    </button>
                  ) : (
                    <button 
                      onMouseDown={iniciarGrabacion} onMouseUp={detenerGrabacion} onTouchStart={iniciarGrabacion} onTouchEnd={detenerGrabacion}
                      className={`h-10 w-10 md:h-11 md:w-11 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                        grabando 
                          ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse' 
                          : 'bg-[#1E293B] text-[#F5F7FA] hover:bg-[#19C8E8]/10 hover:text-[#19C8E8] border border-[#1E293B]'
                      }`}
                    >
                      {grabando ? <Square size={14} fill="currentColor" /> : <Mic size={16} className="md:size-[18px]" />}
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* --- INTERFAZ VOZ --- */
              <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 bg-[#07090C] relative">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#F5F7FA 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                
                <div className="text-center z-10 mb-8 md:mb-12">
                  <h3 className="text-xl md:text-2xl font-bold mb-2 text-[#F5F7FA]">{nombreAgente || 'Asistente IA'}</h3>
                  <p className={`text-[10px] md:text-xs font-mono uppercase tracking-widest ${estadoLlamada === 'hablando' ? 'text-[#19C8E8]' : 'text-[#8994A6]'}`}>
                    {estadoLlamada === 'inactiva' && 'Listo para conexión de voz'}
                    {estadoLlamada === 'conectando' && 'Enlazando motores...'}
                    {estadoLlamada === 'hablando' && 'Transmisión en curso'}
                  </p>
                </div>

                <div className="relative flex items-center justify-center mb-10 md:mb-16 z-10">
                  <div className={`absolute w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#19C8E8]/10 blur-xl transition-all duration-1000 ${estadoLlamada === 'hablando' ? 'animate-ping opacity-100' : 'opacity-0'}`}></div>
                  <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center z-20 transition-all duration-500 ${
                    estadoLlamada === 'hablando' 
                      ? 'bg-[#19C8E8]/10 border border-[#19C8E8] shadow-[0_0_30px_rgba(25,200,232,0.2)]' 
                      : 'bg-[#121821] border border-[#1E293B]'
                  }`}>
                    {estadoLlamada === 'conectando' ? (
                      <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-[#19C8E8] animate-spin" />
                    ) : (
                      <Activity className={`w-8 h-8 md:w-10 md:h-10 ${estadoLlamada === 'hablando' ? 'text-[#19C8E8] animate-pulse' : 'text-[#8994A6]'}`} />
                    )}
                  </div>
                </div>

                <div className="w-full max-w-[250px] md:max-w-xs z-10">
                  <button 
                    onClick={toggleLlamada}
                    className={`w-full py-3 md:py-4 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 md:gap-3 transition-all ${
                      llamadaActiva 
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30' 
                        : 'bg-[#F5F7FA] text-[#07090C] hover:bg-[#E2E8F0] shadow-lg'
                    }`}
                  >
                    {llamadaActiva ? (
                      <><PhoneOff size={16} /> Finalizar Transmisión</>
                    ) : (
                      <><Phone size={16} /> Iniciar Llamada</>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 🔥 BARRA INFERIOR: Anclada (shrink-0) para no sobreponerse */}
      <div className="shrink-0 w-full bg-[#07090C]/90 backdrop-blur-xl border-t border-[#1E293B] px-6 py-4 z-40">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-[#8994A6] text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-1">
              Estado del sistema
            </p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
              <p className="text-base md:text-lg font-bold text-[#F5F7FA]">Listo para producción</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/dashboard/onboarding/pagos')} 
            className="bg-[#19C8E8] text-[#07090C] px-5 py-2.5 md:px-8 md:py-3.5 rounded-xl font-bold hover:bg-[#33DDFF] transition-all shadow-[0_0_20px_rgba(25,200,232,0.3)] flex items-center gap-2 text-xs md:text-base"
          >
            <Rocket size={16} className="md:size-[18px]" /> Activar Agente
          </button>
        </div>
      </div>
      
    </div>
  );
}