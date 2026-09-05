"use client";

import { useEffect, useRef, useState } from 'react';
import { Rocket, TerminalSquare } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter } from 'next/navigation';
import Vapi from '@vapi-ai/web';
import { useHydrated } from '../../../../hooks/useHydrated';
import { OnboardingProgress, SkipToPanelLink } from '../../../../components/onboarding/shared';
import { VoiceSimulator } from '../../../../components/onboarding/simulator/VoiceSimulator';
import { WhatsappSimulator, type Mensaje } from '../../../../components/onboarding/simulator/WhatsappSimulator';

type Tab = 'whatsapp' | 'voz';

let vapi: any = null;

export default function Paso05Simulador() {
  const router = useRouter();
  const hydrated = useHydrated();
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
    if (hydrated && typeof window !== 'undefined' && !vapi) {
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
  }, [hydrated]);

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
    <div className="flex flex-col h-full w-full relative bg-transparent text-[#F5F7FA]">
      <SkipToPanelLink className="bg-[#1E293B]/30 text-[#8994A6] hover:text-[#19C8E8] border-[#1E293B]/50 hover:border-[#19C8E8]/30" />

      <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-4 mt-8 md:mt-2 flex flex-col min-h-0 overflow-hidden">
        <div className="shrink-0 mb-4 md:mb-6">
          <OnboardingProgress
            current={5}
            total={5}
            label="Configuración de tu agente"
            accentClass="bg-[#19C8E8]"
            theme="dark"
          />

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

        <div className="flex-1 min-h-0 w-full flex flex-col lg:flex-row gap-4 md:gap-6 pb-2">
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
                  {tabActiva === 'whatsapp' && <span className="h-1.5 w-1.5 rounded-full bg-[#19C8E8]" />}
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
                  {tabActiva === 'voz' && <span className="h-1.5 w-1.5 rounded-full bg-[#19C8E8]" />}
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-[#1E293B]">
                <p className="text-[10px] md:text-xs text-[#8994A6] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Sistemas operativos locales
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 bg-[#0D1117] border border-[#1E293B] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            {tabActiva === 'whatsapp' ? (
              <WhatsappSimulator
                nombreAgente={nombreAgente || 'Asistente IA'}
                mensajes={mensajes}
                input={input}
                setInput={setInput}
                escribiendo={escribiendo}
                grabando={grabando}
                chatContainerRef={chatContainerRef}
                enviarMensajeBackend={enviarMensajeBackend}
                iniciarGrabacion={iniciarGrabacion}
                detenerGrabacion={detenerGrabacion}
              />
            ) : (
              <VoiceSimulator
                nombreAgente={nombreAgente || 'Asistente IA'}
                estadoLlamada={estadoLlamada}
                llamadaActiva={llamadaActiva}
                toggleLlamada={toggleLlamada}
              />
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 w-full bg-[#07090C]/90 backdrop-blur-xl border-t border-[#1E293B] px-6 py-4 z-40">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-[#8994A6] text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-1">
              Estado del sistema
            </p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-[#10B981] animate-pulse" />
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