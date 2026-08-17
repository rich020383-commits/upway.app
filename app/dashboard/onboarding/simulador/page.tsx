"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Loader2, Mic, Square, Phone, PhoneOff, Activity, TerminalSquare, Rocket } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore'; // Ajusta la ruta si es necesario
import { useRouter } from 'next/navigation';
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
    } catch (error) {
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
      const payload: any = { promptMaestro: promptEnriquecido, historial: historialMapeado, tienda_id: '1172769935927318' };
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

        await vapi.start("e86eae54-3a05-4d31-938f-c8caf7522ee5", {
          firstMessage: `¡Hola! Soy ${nombreAgente || 'tu asistente'}, ¿en qué puedo ayudarte hoy?`,
          model: { provider: "openai", model: "gpt-4o", messages: [{ role: "system", content: systemPromptDinamico }] },
          voice: voiceConfig
        });
      } catch (error) {
        console.error("Error Vapi:", error);
        setLlamadaActiva(false);
        setEstadoLlamada('inactiva');
        alert("No se pudo establecer la llamada. Verifica el micrófono.");
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#07090C] text-[#F5F7FA] pb-32 font-sans selection:bg-[#19C8E8] selection:text-[#07090C] flex flex-col items-center">
      
      <div className="w-full max-w-4xl px-6 pt-12 md:pt-20">
        
        {/* Barra de progreso / Narrativa */}
        <div className="mb-12">
          <div className="flex items-center gap-3 text-[#8994A6] text-xs font-semibold tracking-widest uppercase mb-6">
            <span>Configuración de tu agente</span>
            <span className="w-1 h-1 rounded-full bg-[#8994A6]"></span>
            <span className="text-[#F5F7FA]">05 / 05</span>
          </div>
          
          <div className="flex gap-2 mb-10">
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full shadow-[0_0_15px_rgba(25,200,232,0.5)]"></div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <TerminalSquare className="text-[#19C8E8] h-8 w-8" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Simulador de Producción</h1>
          </div>
          <p className="text-[#8994A6] text-lg max-w-2xl">
            Prueba la lógica, respuestas y latencia de tu empleado digital antes de conectarlo a tus canales oficiales.
          </p>
        </div>

        {/* CONTENEDOR DEL SIMULADOR */}
        <div className="w-full flex flex-col lg:flex-row gap-8">
          
          {/* Controles y Status (Izquierda) */}
          <div className="lg:w-1/3 space-y-6">
            <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-6">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-[#8994A6] mb-6">Entorno de Pruebas</h3>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setTabActiva('whatsapp')}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${
                    tabActiva === 'whatsapp' 
                      ? 'bg-[#19C8E8]/10 text-[#19C8E8] border border-[#19C8E8]/30' 
                      : 'bg-[#07090C] text-[#8994A6] border border-[#1E293B] hover:border-[#8994A6]/50'
                  }`}
                >
                  <span className="flex items-center gap-2">📱 Motor de Texto</span>
                  {tabActiva === 'whatsapp' && <span className="h-2 w-2 rounded-full bg-[#19C8E8]"></span>}
                </button>
                
                <button 
                  onClick={() => setTabActiva('voz')}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${
                    tabActiva === 'voz' 
                      ? 'bg-[#19C8E8]/10 text-[#19C8E8] border border-[#19C8E8]/30' 
                      : 'bg-[#07090C] text-[#8994A6] border border-[#1E293B] hover:border-[#8994A6]/50'
                  }`}
                >
                  <span className="flex items-center gap-2">📞 Motor de Voz</span>
                  {tabActiva === 'voz' && <span className="h-2 w-2 rounded-full bg-[#19C8E8]"></span>}
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-[#1E293B]">
                <p className="text-xs text-[#8994A6] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Sistemas operativos locales
                </p>
              </div>
            </div>
          </div>

          {/* Área Interactiva (Derecha) */}
          <div className="lg:w-2/3 h-[550px] bg-[#0D1117] border border-[#1E293B] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            
            {tabActiva === 'whatsapp' ? (
              /* --- INTERFAZ TEXTO (Estilo Terminal Limpia) --- */
              <>
                <div className="bg-[#121821] p-4 flex items-center justify-between border-b border-[#1E293B]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#1E293B] border border-[#8994A6]/20 rounded-full flex items-center justify-center">
                      <Bot size={20} className="text-[#F5F7FA]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#F5F7FA] text-sm">{nombreAgente || 'Asistente IA'}</h3>
                      <p className="text-[11px] text-[#19C8E8] font-mono tracking-widest">EN LÍNEA</p>
                    </div>
                  </div>
                </div>

                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#07090C]">
                  {mensajes.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.rol === 'usuario' 
                          ? 'bg-[#1E293B] text-[#F5F7FA] rounded-tr-sm border border-[#8994A6]/20' 
                          : 'bg-[#121821] text-[#F5F7FA] rounded-tl-sm border border-[#1E293B]'
                      }`}>
                        <p className={`${msg.esAudio ? 'italic text-[#19C8E8]' : ''}`}>{msg.texto}</p>
                        {msg.provider && <p className="text-[10px] text-[#8994A6] mt-3 text-right font-mono uppercase">⚡ {msg.provider}</p>}
                      </div>
                    </div>
                  ))}
                  {escribiendo && (
                    <div className="flex justify-start">
                      <div className="bg-[#121821] border border-[#1E293B] p-4 rounded-2xl rounded-tl-sm flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin text-[#19C8E8]" />
                        <span className="text-xs text-[#8994A6] font-mono tracking-widest">PROCESANDO...</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-[#121821] p-4 border-t border-[#1E293B] flex items-center gap-3">
                  <input
                    type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviarMensajeBackend(input)}
                    placeholder="Envía un mensaje de prueba..." disabled={grabando}
                    className="flex-1 bg-[#07090C] text-[#F5F7FA] border border-[#1E293B] rounded-xl px-4 py-3 outline-none text-sm placeholder-[#8994A6]/50 focus:border-[#19C8E8] transition-all disabled:opacity-50"
                  />
                  {input.trim() ? (
                    <button onClick={() => enviarMensajeBackend(input)} className="h-11 w-11 shrink-0 bg-[#F5F7FA] rounded-xl flex items-center justify-center text-[#07090C] hover:bg-[#E2E8F0] transition-all">
                      <Send size={18} className="ml-1" />
                    </button>
                  ) : (
                    <button 
                      onMouseDown={iniciarGrabacion} onMouseUp={detenerGrabacion} onTouchStart={iniciarGrabacion} onTouchEnd={detenerGrabacion}
                      className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                        grabando 
                          ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse' 
                          : 'bg-[#1E293B] text-[#F5F7FA] hover:bg-[#19C8E8]/10 hover:text-[#19C8E8] border border-[#1E293B]'
                      }`}
                    >
                      {grabando ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* --- INTERFAZ VOZ (Estilo Clean Call) --- */
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#07090C] relative">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#F5F7FA 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                
                <div className="text-center z-10 mb-12">
                  <h3 className="text-2xl font-bold mb-2 text-[#F5F7FA]">{nombreAgente || 'Asistente IA'}</h3>
                  <p className={`text-xs font-mono uppercase tracking-widest ${estadoLlamada === 'hablando' ? 'text-[#19C8E8]' : 'text-[#8994A6]'}`}>
                    {estadoLlamada === 'inactiva' && 'Listo para conexión de voz'}
                    {estadoLlamada === 'conectando' && 'Enlazando motores...'}
                    {estadoLlamada === 'hablando' && 'Transmisión en curso'}
                  </p>
                </div>

                <div className="relative flex items-center justify-center mb-16 z-10">
                  <div className={`absolute w-40 h-40 rounded-full bg-[#19C8E8]/10 blur-xl transition-all duration-1000 ${estadoLlamada === 'hablando' ? 'animate-ping opacity-100' : 'opacity-0'}`}></div>
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center z-20 transition-all duration-500 ${
                    estadoLlamada === 'hablando' 
                      ? 'bg-[#19C8E8]/10 border border-[#19C8E8] shadow-[0_0_30px_rgba(25,200,232,0.2)]' 
                      : 'bg-[#121821] border border-[#1E293B]'
                  }`}>
                    {estadoLlamada === 'conectando' ? (
                      <Loader2 className="w-10 h-10 text-[#19C8E8] animate-spin" />
                    ) : (
                      <Activity className={`w-10 h-10 ${estadoLlamada === 'hablando' ? 'text-[#19C8E8] animate-pulse' : 'text-[#8994A6]'}`} />
                    )}
                  </div>
                </div>

                <div className="w-full max-w-xs z-10">
                  <button 
                    onClick={toggleLlamada}
                    className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all ${
                      llamadaActiva 
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30' 
                        : 'bg-[#F5F7FA] text-[#07090C] hover:bg-[#E2E8F0] shadow-lg'
                    }`}
                  >
                    {llamadaActiva ? (
                      <><PhoneOff size={18} /> Finalizar Transmisión</>
                    ) : (
                      <><Phone size={18} /> Iniciar Llamada</>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Barra Inferior Persistente (LAUNCH) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#07090C]/90 backdrop-blur-xl border-t border-[#1E293B] p-6 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-[#8994A6] text-xs font-semibold uppercase tracking-wider mb-1">
              Estado del sistema
            </p>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
              <p className="text-lg font-bold text-[#F5F7FA]">Listo para producción</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/dashboard/onboarding/pagos')} // Ajusta ruta según el siguiente paso o dashboard final
            className="bg-[#19C8E8] text-[#07090C] px-8 py-3.5 rounded-xl font-bold hover:bg-[#33DDFF] transition-all shadow-[0_0_20px_rgba(25,200,232,0.3)] flex items-center gap-2"
          >
            <Rocket size={18} /> Activar Agente
          </button>
        </div>
      </div>
    </main>
  );
}