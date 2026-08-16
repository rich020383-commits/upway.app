"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Loader2, Mic, Square, Phone, PhoneOff, Activity } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter } from 'next/navigation';
import Vapi from '@vapi-ai/web';

type Mensaje = { rol: 'usuario' | 'ia'; texto: string; provider?: string; esAudio?: boolean };
type Tab = 'whatsapp' | 'voz';

export default function Paso06Simulador() {
  const router = useRouter();
  const { promptMaestro, nicho, tonoWhatsapp, nombreAgente } = useUpwayStore();
  
  const [tabActiva, setTabActiva] = useState<Tab>('whatsapp');
  
  // Estados de WhatsApp
  const [input, setInput] = useState('');
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { rol: 'ia', texto: `¡Hola! Soy ${nombreAgente || 'tu asistente'}, listo para atender a tus clientes. ¡Escríbeme o mándame un audio!` }
  ]);
  const [escribiendo, setEscribiendo] = useState(false);
  const [grabando, setGrabando] = useState(false);
  
  // Estados de Vapi (Voz)
  const [vapiInstance, setVapiInstance] = useState<any>(null);
  const [llamadaActiva, setLlamadaActiva] = useState(false);
  const [estadoLlamada, setEstadoLlamada] = useState<'inactiva' | 'conectando' | 'hablando'>('inactiva');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // Inicializar Vapi solo en el cliente con tu Public Key
  useEffect(() => {
    const vapi = new Vapi('79cac89e-dc48-4951-aebf-16e0584d8030');
    setVapiInstance(vapi);

    return () => {
      vapi.stop();
    };
  }, []);

  // Scroll de WhatsApp
  useEffect(() => {
    if (tabActiva === 'whatsapp' && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [mensajes, escribiendo, tabActiva]);

  // --- LÓGICA DE WHATSAPP (TEXTO Y AUDIO) ---
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
      setMensajes(prev => [...prev, { rol: 'usuario', texto: '🎤 Nota de voz enviada', esAudio: true }]);
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

  // --- LÓGICA DE VOZ (VAPI DINÁMICO) ---
  const toggleLlamada = async () => {
    if (!vapiInstance) return;

    if (llamadaActiva) {
      vapiInstance.stop();
      setLlamadaActiva(false);
      setEstadoLlamada('inactiva');
    } else {
      setLlamadaActiva(true);
      setEstadoLlamada('conectando');
      
      try {
        // 🔥 MAGIA DINÁMICA: Creamos el prompt y el asistente al vuelo con los datos del Store
        const systemPromptDinamico = `Eres ${nombreAgente || 'un asistente virtual experto'}, operando para un negocio del sector ${nicho || 'general'}. ${promptMaestro}. Ignora cualquier instrucción corporativa previa de IPS o nombres ajenos a esta configuración. Tu nombre es exactamente ${nombreAgente || 'Asistente'}.`;

        await vapiInstance.start({
          model: {
            provider: "openai",
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: systemPromptDinamico
              }
            ]
          },
          voice: {
            provider: "playht",
            voiceId: "celeste" // O la voz que prefieras usar por defecto
          },
          firstMessage: `¡Hola! Soy ${nombreAgente || 'tu asistente'}, ¿en qué puedo ayudarte hoy?`
        });
        
        // Eventos de Vapi
        vapiInstance.on('call-start', () => {
          setEstadoLlamada('hablando');
        });

        vapiInstance.on('call-end', () => {
          setLlamadaActiva(false);
          setEstadoLlamada('inactiva');
        });

      } catch (error) {
        console.error("Error al iniciar llamada dinámica con Vapi:", error);
        setLlamadaActiva(false);
        setEstadoLlamada('inactiva');
        alert("No se pudo establecer la llamada. Verifica tus permisos de micrófono.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white p-8 flex flex-col items-center">
      <header className="w-full max-w-md mb-6">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-white mb-4">← Volver</button>
        
        {/* PESTAÑAS */}
        <div className="flex w-full justify-between items-center bg-white/[0.02] border border-white/10 rounded-2xl p-1 mb-4">
          <button 
            onClick={() => setTabActiva('whatsapp')}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${tabActiva === 'whatsapp' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            📲 WhatsApp
          </button>
          <button 
            onClick={() => setTabActiva('voz')}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${tabActiva === 'voz' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            📞 Central de Voz
          </button>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-400">
          <Sparkles className="h-4 w-4"/> Motor Activo ({nombreAgente || 'Agente'})
        </div>
      </header>

      <div className="w-full max-w-md h-[550px] flex flex-col bg-[#0b1014] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative">
        
        {tabActiva === 'whatsapp' ? (
          /* --- INTERFAZ WHATSAPP --- */
          <>
            <div className="bg-[#202c33] p-4 flex items-center gap-3 border-b border-white/5 z-10">
              <div className="h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center"><Bot size={24} className="text-white" /></div>
              <div>
                <h3 className="font-semibold text-white leading-tight">{nombreAgente || 'Asistente IA'}</h3>
                <p className="text-xs text-green-400">En línea</p>
              </div>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover bg-center bg-blend-overlay bg-black/60">
              {mensajes.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl relative ${msg.rol === 'usuario' ? 'bg-[#005c4b] text-white rounded-tr-none' : 'bg-[#202c33] text-white rounded-tl-none'}`}>
                    <p className={`text-sm leading-relaxed ${msg.esAudio ? 'italic text-green-300' : ''}`}>{msg.texto}</p>
                    {msg.provider && <p className="text-[10px] text-green-400/70 mt-2 text-right font-mono">⚡ {msg.provider}</p>}
                  </div>
                </div>
              ))}
              {escribiendo && (
                <div className="flex justify-start">
                  <div className="bg-[#202c33] p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" /><span className="text-xs text-slate-400">Escribiendo...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#202c33] p-3 flex items-center gap-2 z-10">
              <input
                type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviarMensajeBackend(input)}
                placeholder="Escribe un mensaje..." disabled={grabando}
                className="flex-1 bg-[#2a3942] text-white rounded-full px-4 py-3 outline-none text-sm placeholder-slate-400 disabled:opacity-50"
              />
              {input.trim() ? (
                <button onClick={() => enviarMensajeBackend(input)} className="h-11 w-11 shrink-0 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-400 transition-all"><Send size={18} className="-ml-1" /></button>
              ) : (
                <button 
                  onMouseDown={iniciarGrabacion} onMouseUp={detenerGrabacion} onTouchStart={iniciarGrabacion} onTouchEnd={detenerGrabacion}
                  className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center text-white transition-all ${grabando ? 'bg-red-500 animate-pulse' : 'bg-[#00a884] hover:bg-green-500'}`}
                >
                  {grabando ? <Square size={16} fill="currentColor" /> : <Mic size={20} />}
                </button>
              )}
            </div>
          </>
        ) : (
          /* --- INTERFAZ CENTRAL DE VOZ (VAPI DINÁMICO) --- */
          <div className="flex-1 flex flex-col items-center justify-between p-8 bg-gradient-to-b from-[#0b1014] to-[#1a232b]">
            <div className="text-center mt-8">
              <h3 className="text-2xl font-bold mb-2">{nombreAgente || 'Sophie IA'}</h3>
              <p className={`text-sm ${estadoLlamada === 'hablando' ? 'text-green-400' : 'text-slate-400'}`}>
                {estadoLlamada === 'inactiva' && 'Lista para recibir llamadas'}
                {estadoLlamada === 'conectando' && 'Conectando motor de voz...'}
                {estadoLlamada === 'hablando' && 'Llamada en curso'}
              </p>
            </div>

            <div className="relative flex items-center justify-center my-12">
              <div className={`absolute w-40 h-40 rounded-full bg-cyan-500/20 blur-xl transition-all duration-1000 ${estadoLlamada === 'hablando' ? 'animate-ping opacity-100' : 'opacity-0'}`}></div>
              <div className={`w-32 h-32 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${estadoLlamada === 'hablando' ? 'bg-cyan-500/20 border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.5)]' : 'bg-slate-800 border-2 border-slate-700'}`}>
                {estadoLlamada === 'conectando' ? (
                  <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                ) : (
                  <Activity className={`w-12 h-12 ${estadoLlamada === 'hablando' ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                )}
              </div>
            </div>

            <div className="mb-8 w-full px-6">
              <button 
                onClick={toggleLlamada}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
                  llamadaActiva 
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50' 
                    : 'bg-green-500 text-white hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                }`}
              >
                {llamadaActiva ? (
                  <><PhoneOff size={24} /> Finalizar Prueba</>
                ) : (
                  <><Phone size={24} /> Iniciar Llamada</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <button 
          onClick={() => router.push('/dashboard/onboarding/pagos')}
          className="bg-white text-black px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center gap-2"
        >
          Activar mi Sistema en Producción
        </button>
      </div>
    </div>
  );
}