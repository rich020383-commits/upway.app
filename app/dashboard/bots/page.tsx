"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, MessageCircleMore, MessageSquare, Sparkles, ShieldCheck, ArrowRight, Signal, 
  Wifi, Battery, Store, Mic, Square, Phone, ArrowLeft, Headphones, UploadCloud, 
  Loader2, Zap, RefreshCw, Power, Clock, BookOpen, AtSign, Rocket, Activity, Send, 
  TerminalSquare, Server, CheckCircle2, Database, Timer, CalendarCheck, Users, TrendingUp, PhoneCall, Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react'; 
import { useUpwayStore } from '../../store/upwayStore'; 
import Link from 'next/link';

export default function AgentesBotPage() {
  const router = useRouter();
  
  // 🔥 BLINDAJE Y EXTRACCIÓN SEGURA (USAMOS EMAIL)
  const sessionContext = useSession() || {};
  const session = sessionContext.data;
  const userEmail = session?.user?.email; // <-- El email NUNCA falla
  
  // 🚀 ESTADO MAESTRO
  const [servicioActivo, setServicioActivo] = useState<'dashboard' | 'hub' | 'whatsapp' | 'voz'>('dashboard');

  const { nombreAgente: nombreStore } = useUpwayStore();
  const [iaActiva, setIaActiva] = useState(true); 
  const [loadingToggle, setLoadingToggle] = useState(false); // Estado para el botón de pausa
  const [calendarConnected, setCalendarConnected] = useState(false);

  // 📊 ESTADOS DINÁMICOS
  const [tiendaIdActual, setTiendaIdActual] = useState<string | null>(null);
  const [metricas, setMetricas] = useState({ leads: 0, citas: 0, horasAhorradas: 0, resolucion: 0 });
  const [whatsappStatus, setWhatsappStatus] = useState<'active' | 'pending' | 'disconnected'>('disconnected');
  const [telefonoConectado, setTelefonoConectado] = useState<string | null>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(true);
  
  useEffect(() => {
    if ((session as any)?.accessToken) setCalendarConnected(true);
  }, [session]);

  // 🔥 EFECTO DINÁMICO: Buscar usando tu EMAIL
  useEffect(() => {
    if (servicioActivo === 'dashboard' && userEmail) {
      const fetchMetricas = async () => {
        try {
          const res = await fetch(`/dashboard/metricas?email=${userEmail}`);
          const data = await res.json();
          if (res.ok) {
            setTiendaIdActual(data.tiendaId); 
            setMetricas({
              leads: data.leads || 0,
              citas: data.citas || 0,
              horasAhorradas: data.horasAhorradas || 0,
              resolucion: data.resolucion || 0
            });
            setTelefonoConectado(data.telefono || null);
            
            // Sincronizamos el estado de la IA con la BD
            if (data.isAiActive !== undefined) {
              setIaActiva(data.isAiActive);
            }

            if (data.isWhatsAppActive) {
              setWhatsappStatus('active');
            } else if (data.metaPhoneNumberId) {
              setWhatsappStatus('pending'); 
            } else {
              setWhatsappStatus('disconnected'); 
            }
          }
        } catch (error) {
          console.error("Error cargando métricas reales:", error);
        } finally {
          setLoadingMetricas(false);
        }
      };
      fetchMetricas();
    }
  }, [servicioActivo, userEmail]);

  // 🔥 NUEVA FUNCIÓN: PAUSA INTELIGENTE
  const handleToggleAI = async () => {
    if (!tiendaIdActual) return;
    setLoadingToggle(true);
    const nuevoEstado = !iaActiva;
    
    try {
      const res = await fetch('/api/tienda/toggle-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tiendaId: tiendaIdActual, 
          isAiActive: nuevoEstado 
        })
      });

      if (res.ok) {
        setIaActiva(nuevoEstado);
      }
    } catch (error) {
      console.error("Error cambiando estado de la IA:", error);
    } finally {
      setLoadingToggle(false);
    }
  };

  // ESTADOS DE FORMULARIOS Y LÓGICA
  const [nombreAgente, setNombreAgente] = useState('');
  const [nicho, setNicho] = useState('general'); 
  const [promptMaestro, setPromptMaestro] = useState('');
  const [guardando, setGuardando] = useState(false);
  
  // Estados Simulador WhatsApp
  const [mensajePrueba, setMensajePrueba] = useState('');
  const [historialChat, setHistorialChat] = useState<{rol: string, texto: string}[]>([]);
  const [cargandoPrueba, setCargandoPrueba] = useState(false);
  
  // Estados Audio
  const [isRecording, setIsRecording] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Estados Simulador Voz (VAPI)
  const [vozSeleccionada, setVozSeleccionada] = useState('femenina_estrella'); 
  const [creandoVoz, setCreandoVoz] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    if(servicioActivo === 'whatsapp') scrollToBottom();
  }, [historialChat, cargandoPrueba, isRecording, servicioActivo]);

  const guardarConfiguracion = async () => {
    if (!tiendaIdActual) {
      alert('Cargando tu tienda, por favor espera un momento.');
      return;
    }
    if (!nombreAgente || !promptMaestro) {
      alert('Completa el nombre del agente y las reglas antes de guardar.');
      return;
    }
    setGuardando(true);
    try {
      const datosParaBackend = {
        tienda_id: tiendaIdActual,
        nombre: nombreAgente,
        reglas: `(Contexto de negocio: ${nicho}) - ${promptMaestro}`,
      };
      const respuesta = await fetch('/api/tienda/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaBackend),
      });
      if (respuesta.ok) alert('✅ ¡El agente quedó guardado y actualizado en el simulador!');
      else alert('Hubo un problema al guardar la configuración.');
    } catch (error) {
      console.error('Error conectando con el backend:', error);
      alert('No fue posible contactar con el servicio.');
    } finally {
      setGuardando(false);
    }
  };

  const crearAgenteVoz = async () => {
    if (!tiendaIdActual) {
      alert('Cargando tu tienda, por favor espera un momento.');
      return;
    }
    if (!nombreAgente || !promptMaestro) {
      alert('Completa el nombre y el guion antes de activar el agente.');
      return;
    }
    setCreandoVoz(true);
    try {
      const res = await fetch('/api/vapi/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tienda_id: tiendaIdActual,
          nombre: nombreAgente,
          promptMaestro: promptMaestro,
          vozSeleccionada: vozSeleccionada
        }),
      });
      
      const data = await res.json();
      if (res.ok) alert('🎉 ¡Central Telefónica conectada! Tu agente ya existe en Vapi con el ID: ' + data.assistantId);
      else alert('Error: ' + data.error);
    } catch (error) {
      console.error(error);
      alert('Error de conexión con el servidor.');
    } finally {
      setCreandoVoz(false);
    }
  };

  const handleActivarWhatsApp = () => router.push('/dashboard/onboarding/activacion'); 

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => enviarAudioPrueba(reader.result as string);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert("No se pudo acceder al micrófono. Verifica los permisos de tu navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const enviarAudioPrueba = async (base64Audio: string) => {
    const nuevoHistorial = [...historialChat, { rol: 'usuario', texto: '🎤 Nota de voz enviada' }];
    setHistorialChat(nuevoHistorial);
    setCargandoPrueba(true);
    try {
      const promptContextualizado = `Eres un experto en el sector de ${nicho}. ${promptMaestro}`;
      const res = await fetch('/api/simulador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptMaestro: promptContextualizado, audioUsuario: base64Audio, historial: historialChat })
      });
      const textResponse = await res.text();
      if (!res.ok) throw new Error(`Fallo del servidor: ${textResponse}`);
      const data = JSON.parse(textResponse);
      if (data.error) throw new Error(data.error);
      setHistorialChat([...nuevoHistorial, { rol: 'ia', texto: data.respuesta }]);
    } catch (error) {
      setHistorialChat([...nuevoHistorial, { rol: 'ia', texto: `⚠️ Fallo de conexión de audio.` }]);
    } finally {
      setCargandoPrueba(false);
    }
  };

  const enviarMensajePrueba = async () => {
    if (!mensajePrueba.trim()) return;
    const mensajeEnviado = mensajePrueba;
    const nuevoHistorial = [...historialChat, { rol: 'usuario', texto: mensajeEnviado }];
    setHistorialChat(nuevoHistorial);
    setMensajePrueba('');
    setCargandoPrueba(true);
    try {
      const promptContextualizado = `Eres un experto en el sector de ${nicho}. ${promptMaestro}`;
      const res = await fetch('/api/simulador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptMaestro: promptContextualizado, mensajeUsuario: mensajeEnviado, historial: historialChat })
      });
      const textResponse = await res.text();
      if (!res.ok) throw new Error(`Fallo del servidor: ${textResponse}`);
      const data = JSON.parse(textResponse);
      if (data.error) throw new Error(data.error);
      setHistorialChat([...nuevoHistorial, { rol: 'ia', texto: data.respuesta }]);
    } catch (error) {
      setHistorialChat([...nuevoHistorial, { rol: 'ia', texto: `⚠️ Fallo exacto: ${error instanceof Error ? error.message : 'Error desconocido'}` }]);
    } finally {
      setCargandoPrueba(false);
    }
  };

  // ==========================================
  // RENDER 1: PANTALLA HUB
  // ==========================================
  if (servicioActivo === 'hub') {
    return (
      <div className="min-h-screen bg-[#07090C] px-4 py-16 text-[#F5F7FA] sm:px-6 lg:px-8 flex flex-col items-center justify-center relative font-sans">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#F5F7FA 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <button onClick={() => setServicioActivo('dashboard')} className="absolute top-8 left-8 flex items-center gap-2 text-sm text-[#8994A6] hover:text-[#F5F7FA] transition-colors z-50">
          <ArrowLeft className="w-4 h-4" /> Volver al Centro de Mando
        </button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto mb-16 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#19C8E8]/30 bg-[#19C8E8]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#19C8E8] mb-6">
            <Bot className="h-4 w-4"/> Ecosistema Upway
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#F5F7FA] mb-4">Arquitectura de Canales</h1>
          <p className="text-lg text-[#8994A6]">Selecciona el módulo operativo que deseas configurar o auditar.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto relative z-10">
          <motion.div 
            whileHover={{ scale: 1.01, y: -2 }}
            onClick={() => setServicioActivo('whatsapp')}
            className="group cursor-pointer rounded-2xl border border-[#1E293B] bg-[#0D1117] p-8 shadow-xl transition-all hover:border-[#19C8E8]/50 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#19C8E8]/10 text-[#19C8E8] mb-6 border border-[#19C8E8]/20">
                <MessageSquare className="h-6 w-6"/>
              </div>
              <h2 className="text-2xl font-bold text-[#F5F7FA] mb-3">Motor de Texto (Chat)</h2>
              <p className="text-[#8994A6] mb-8 leading-relaxed text-sm">Gestiona la lógica, el tono y prueba el comportamiento de tu agente de WhatsApp en el entorno de pruebas.</p>
            </div>
            <div className="flex items-center text-[#19C8E8] font-semibold gap-2 text-sm">
              Ingresar al Sandbox <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.01, y: -2 }}
            onClick={() => setServicioActivo('voz')}
            className="group cursor-pointer rounded-2xl border border-[#1E293B] bg-[#0D1117] p-8 shadow-xl transition-all hover:border-[#9B5CFF]/50 flex flex-col justify-between relative"
          >
            <span className="absolute top-8 right-8 rounded-md bg-[#9B5CFF]/10 text-[#9B5CFF] border border-[#9B5CFF]/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest">Enrutador SIP</span>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#9B5CFF]/10 text-[#9B5CFF] mb-6 border border-[#9B5CFF]/20">
                <Phone className="h-6 w-6"/>
              </div>
              <h2 className="text-2xl font-bold text-[#F5F7FA] mb-3">Motor de Voz (PBX)</h2>
              <p className="text-[#8994A6] mb-8 leading-relaxed text-sm">Configura la síntesis de voz, sube tus bases de datos y lanza campañas de llamadas salientes automatizadas.</p>
            </div>
            <div className="flex items-center text-[#9B5CFF] font-semibold gap-2 text-sm">
              Configurar Central <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 2: PANTALLA AGENTE DE VOZ (VAPI)
  // ==========================================
  if (servicioActivo === 'voz') {
    return (
      <div className="min-h-screen bg-[#07090C] px-4 py-8 text-[#F5F7FA] font-sans">
        <div className="mx-auto max-w-6xl">
          <button onClick={() => setServicioActivo('hub')} className="mb-8 flex items-center gap-2 text-sm text-[#8994A6] hover:text-[#F5F7FA] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver a Canales
          </button>
          <div className="mb-8 flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#9B5CFF]/30 bg-[#9B5CFF]/10 px-3 py-1 w-fit text-xs font-bold uppercase tracking-widest text-[#9B5CFF]">
              <Headphones className="h-4 w-4"/> Central Telefónica IA
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#F5F7FA] md:text-4xl">Infraestructura de Voz</h1>
            <p className="max-w-2xl text-sm text-[#8994A6]">Configura los parámetros acústicos y las campañas de llamadas salientes.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#1E293B] bg-[#0D1117] p-8 shadow-xl">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#8994A6]">Identidad en Llamada</label>
                      <input 
                        type="text" value={nombreAgente} onChange={(e) => setNombreAgente(e.target.value)} placeholder="Ej. Celeste" 
                        className="w-full rounded-xl border border-[#1E293B] bg-[#07090C] px-4 py-3.5 text-sm text-[#F5F7FA] placeholder-[#8994A6]/50 outline-none transition focus:border-[#9B5CFF]" 
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#8994A6]">Motor de Síntesis (TTS)</label>
                      <select 
                        value={vozSeleccionada} onChange={(e) => setVozSeleccionada(e.target.value)}
                        className="w-full rounded-xl border border-[#1E293B] bg-[#07090C] px-4 py-3.5 text-sm text-[#F5F7FA] outline-none transition focus:border-[#9B5CFF] cursor-pointer"
                      >
                        <optgroup label="Voces Femeninas">
                          <option value="femenina_estrella">Celeste (Latencia Ultra Baja)</option>
                          <option value="femenina_calida">Matilda (Empática)</option>
                          <option value="femenina_nativa">Aila (Rápida)</option>
                        </optgroup>
                        <optgroup label="Voces Masculinas">
                          <option value="masculino_serio">Antoni (Confiable)</option>
                          <option value="masculino_joven">Fin (Casual)</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-[#8994A6]">
                      <span>Prompt Operativo Telefónico</span>
                    </label>
                    <textarea 
                      value={promptMaestro} onChange={(e) => setPromptMaestro(e.target.value)} placeholder="Ej: Llama para confirmar la cita médica..." 
                      className="h-40 w-full resize-none rounded-xl border border-[#1E293B] bg-[#07090C] px-4 py-3.5 text-sm text-[#F5F7FA] placeholder-[#8994A6]/50 outline-none transition focus:border-[#9B5CFF]" 
                    />
                  </div>
                  <button 
                    onClick={crearAgenteVoz} disabled={creandoVoz} 
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#9B5CFF] px-6 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-[#8B4CFF] disabled:opacity-50"
                  >
                    {creandoVoz ? <Loader2 className="h-5 w-5 animate-spin" /> : <Server className="h-5 w-5" />}
                    {creandoVoz ? 'Aprovisionando SIP...' : 'Guardar y Aprovisionar'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-[#1E293B] bg-[#0D1117] p-8 shadow-xl">
                <div className="mb-6 flex flex-col items-center text-center border-b border-[#1E293B] pb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981]/10 text-[#10B981] mb-4 border border-[#10B981]/20">
                    <UploadCloud className="h-6 w-6"/>
                  </div>
                  <h3 className="text-lg font-bold text-[#F5F7FA]">Campañas Outbound</h3>
                  <p className="text-xs text-[#8994A6] mt-2">Carga tu lista en CSV para llamadas salientes masivas.</p>
                </div>
                <div className="flex flex-col gap-4">
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#8994A6]/50 bg-[#07090C] px-6 py-8 font-semibold text-[#8994A6] transition-all hover:border-[#F5F7FA] hover:text-[#F5F7FA]">
                    <UploadCloud className="h-5 w-5" /> Seleccionar archivo .csv
                  </button>
                  <button disabled className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5F7FA] px-6 py-3.5 font-bold text-[#07090C] transition-all disabled:opacity-20">
                    <Phone className="h-4 w-4" /> Lanzar Campaña
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 3: PANTALLA WHATSAPP (SIMULADOR)
  // ==========================================
  if (servicioActivo === 'whatsapp') {
    return (
      <div className="min-h-screen bg-[#07090C] px-4 py-8 text-[#F5F7FA] font-sans">
        <div className="mx-auto max-w-6xl">
          <button onClick={() => setServicioActivo('hub')} className="mb-8 flex items-center gap-2 text-sm text-[#8994A6] hover:text-[#F5F7FA] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver a Canales
          </button>
          <div className="mb-8 flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#19C8E8]/30 bg-[#19C8E8]/10 px-3 py-1 w-fit text-xs font-bold uppercase tracking-widest text-[#19C8E8]">
              <TerminalSquare className="h-4 w-4"/> Entorno Sandbox
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#F5F7FA] md:text-4xl">Motor de Inferencia (Texto)</h1>
            <p className="max-w-2xl text-sm text-[#8994A6]">Ajusta las reglas de negocio y audita las respuestas de la IA.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#1E293B] bg-[#0D1117] p-8 shadow-xl">
                <div className="mb-6 flex items-center gap-3 border-b border-[#1E293B] pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E293B] text-[#F5F7FA]">
                    <Sparkles className="h-4 w-4"/>
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-[#8994A6]">Core del Agente</h2>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#8994A6]">Nombre Interno</label>
                    <input 
                      type="text" value={nombreAgente} onChange={(e) => setNombreAgente(e.target.value)} placeholder="Ej. Sofía" 
                      className="w-full rounded-xl border border-[#1E293B] bg-[#07090C] px-4 py-3.5 text-sm text-[#F5F7FA] outline-none transition focus:border-[#19C8E8]" 
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#8994A6]">Industria Comercial</label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8994A6]" />
                      <select 
                        value={nicho} onChange={(e) => setNicho(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-[#1E293B] bg-[#07090C] pl-10 pr-4 py-3.5 text-sm text-[#F5F7FA] outline-none transition focus:border-[#19C8E8] cursor-pointer"
                      >
                        <option value="general">Empresa General</option>
                        <option value="clinica">Clínica / Salud</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#8994A6]">Prompt Base (Instrucciones)</label>
                    <textarea 
                      value={promptMaestro} onChange={(e) => setPromptMaestro(e.target.value)} placeholder="Instrucciones operativas..." 
                      className="h-40 w-full resize-none rounded-xl border border-[#1E293B] bg-[#07090C] px-4 py-3.5 text-sm text-[#F5F7FA] outline-none transition focus:border-[#19C8E8]" 
                    />
                  </div>
                  <button 
                    onClick={guardarConfiguracion} disabled={guardando}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1E293B] px-6 py-3.5 font-bold text-[#F5F7FA] transition-all hover:bg-[#2A3B4C]"
                  >
                    {guardando ? "Aplicando memoria..." : "Guardar Configuración"}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col h-[750px] rounded-2xl border border-[#1E293B] bg-[#0D1117] shadow-2xl overflow-hidden">
              <div className="bg-[#121821] p-4 flex items-center justify-between border-b border-[#1E293B]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#1E293B] border border-[#8994A6]/20 rounded-full flex items-center justify-center">
                    <Bot size={20} className="text-[#F5F7FA]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#F5F7FA] text-sm">{nombreAgente || 'Asistente IA'}</h3>
                    <p className="text-[11px] text-[#19C8E8] font-mono tracking-widest">ENTORNO AISLADO (SANDBOX)</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${cargandoPrueba ? 'bg-[#19C8E8] animate-pulse' : 'bg-[#10B981]'}`}></div>
                </div>
              </div>
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#07090C]">
                {historialChat.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center opacity-50">
                    <MessageSquare className="h-12 w-12 text-[#8994A6] mb-4" />
                    <p className="text-sm font-semibold text-[#F5F7FA]">Consola de Pruebas</p>
                  </div>
                ) : (
                  historialChat.map((m, i) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${m.rol === 'usuario' ? 'bg-[#1E293B] text-[#F5F7FA] rounded-tr-sm border border-[#8994A6]/20' : 'bg-[#121821] text-[#F5F7FA] rounded-tl-sm border border-[#1E293B]'}`}>
                        {m.texto}
                      </div>
                    </motion.div>
                  ))
                )}
                {cargandoPrueba && (
                  <div className="flex justify-start">
                    <div className="bg-[#121821] border border-[#1E293B] p-4 rounded-2xl rounded-tl-sm flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-[#19C8E8]" />
                      <span className="text-xs text-[#8994A6] font-mono tracking-widest">PROCESANDO...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="bg-[#121821] p-4 border-t border-[#1E293B] flex items-center gap-3">
                <input
                  type="text" value={mensajePrueba} onChange={(e) => setMensajePrueba(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviarMensajePrueba()}
                  placeholder={isRecording ? "Grabando audio..." : "Ingresa un input de prueba..."} disabled={cargandoPrueba || isRecording}
                  className="flex-1 bg-[#07090C] text-[#F5F7FA] border border-[#1E293B] rounded-xl px-4 py-3.5 outline-none text-sm focus:border-[#19C8E8] transition-all disabled:opacity-50"
                />
                {mensajePrueba.trim() ? (
                  <button onClick={enviarMensajePrueba} disabled={cargandoPrueba} className="h-12 w-12 shrink-0 bg-[#F5F7FA] rounded-xl flex items-center justify-center text-[#07090C] hover:bg-[#E2E8F0] transition-all">
                    <Send size={18} className="ml-1" />
                  </button>
                ) : isRecording ? (
                  <button onClick={stopRecording} className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse">
                    <Square size={16} fill="currentColor" />
                  </button>
                ) : (
                  <button onClick={startRecording} disabled={cargandoPrueba} className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center bg-[#1E293B] text-[#F5F7FA] hover:bg-[#19C8E8]/10 hover:text-[#19C8E8] border border-[#1E293B] transition-all">
                    <Mic size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 4: DASHBOARD TELEMETRÍA (CON 3 ESTADOS + TELÉFONO)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#07090C] text-[#F5F7FA] font-sans pb-20 selection:bg-[#19C8E8] selection:text-[#07090C]">
      <div className="max-w-7xl mx-auto px-6 pt-12 md:pt-16">
        
        {/* Header Enterprise */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-[#1E293B]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-[#10B981]/30 bg-[#10B981]/10 px-2 py-1 text-[10px] font-mono tracking-widest text-[#10B981] mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse"></span> SISTEMA OPERATIVO ACTIVO
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#F5F7FA]">
              Centro de Mando {nombreStore ? `- ${nombreStore}` : ''}
            </h1>
            <p className="text-[#8994A6] text-sm mt-2">Métricas de impacto y telemetría de tu IA en tiempo real.</p>
          </div>
          
          <button 
            onClick={() => setServicioActivo('hub')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1E293B] border border-[#1E293B] hover:border-[#8994A6]/50 px-5 py-2.5 text-sm font-semibold text-[#F5F7FA] transition-all"
          >
            <RefreshCw className="h-4 w-4" /> Administrar Canales
          </button>
        </div>

        {/* 📊 KPI'S DE IMPACTO EN EL NEGOCIO */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-6 transition-all hover:border-[#19C8E8]/30">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#19C8E8]/10 rounded-xl border border-[#19C8E8]/20"><Timer className="h-5 w-5 text-[#19C8E8]" /></div>
            </div>
            <p className="text-[#8994A6] text-sm font-medium">Tiempo Humano Ahorrado</p>
            <h3 className="text-3xl font-bold text-[#F5F7FA] mt-1">
              {loadingMetricas ? "..." : metricas.horasAhorradas} <span className="text-lg text-[#8994A6] font-normal">Hrs</span>
            </h3>
            <p className="text-xs text-[#8994A6] mt-2">Calculado por volumen</p>
          </div>

          <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-6 transition-all hover:border-[#10B981]/30">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#10B981]/10 rounded-xl border border-[#10B981]/20"><CalendarCheck className="h-5 w-5 text-[#10B981]" /></div>
            </div>
            <p className="text-[#8994A6] text-sm font-medium">Citas Agendadas (Auto)</p>
            <h3 className="text-3xl font-bold text-[#F5F7FA] mt-1">{loadingMetricas ? "..." : metricas.citas}</h3>
            <p className="text-xs text-[#8994A6] mt-2">Registradas en el calendario</p>
          </div>

          <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-6 transition-all hover:border-[#9B5CFF]/30">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#9B5CFF]/10 rounded-xl border border-[#9B5CFF]/20"><Users className="h-5 w-5 text-[#9B5CFF]" /></div>
            </div>
            <p className="text-[#8994A6] text-sm font-medium">Pacientes Perfilados</p>
            <h3 className="text-3xl font-bold text-[#F5F7FA] mt-1">{loadingMetricas ? "..." : metricas.leads}</h3>
            <p className="text-xs text-[#8994A6] mt-2">Guardados en tu base de datos</p>
          </div>

          <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-6 transition-all hover:border-[#F43F5E]/30">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#F43F5E]/10 rounded-xl border border-[#F43F5E]/20"><PhoneCall className="h-5 w-5 text-[#F43F5E]" /></div>
            </div>
            <p className="text-[#8994A6] text-sm font-medium">Resolución Autónoma</p>
            <h3 className="text-3xl font-bold text-[#F5F7FA] mt-1">
              {loadingMetricas ? "..." : metricas.resolucion}<span className="text-lg text-[#8994A6] font-normal">%</span>
            </h3>
            <p className="text-xs text-[#8994A6] mt-2">Sin intervención humana</p>
          </div>
        </div>

        {/* ⚙️ CONTROLES Y ESTADOS */}
        <h2 className="text-xl font-bold text-[#F5F7FA] mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#19C8E8]" /> Control de Operaciones
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className={`rounded-2xl border transition-all duration-500 bg-[#0D1117] p-8 flex flex-col justify-between relative overflow-hidden ${iaActiva ? 'border-[#10B981]/30' : 'border-[#F59E0B]/30'}`}>
            <div className={`absolute top-0 left-0 right-0 h-1 ${iaActiva ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`}></div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold tracking-widest text-[#8994A6] uppercase">Motor de Inferencia</span>
                <Bot className={`h-6 w-6 ${iaActiva ? 'text-[#10B981]' : 'text-[#F59E0B]'}`} />
              </div>
              <div className="text-2xl font-bold text-[#F5F7FA] mb-2">{iaActiva ? 'Piloto Automático' : 'Control Manual'}</div>
              <p className="text-sm text-[#8994A6]">
                {iaActiva ? 'La IA está respondiendo y agendando en tiempo real.' : 'IA en pausa. Estás respondiendo manualmente.'}
              </p>
            </div>
            
            {/* 🔥 BOTÓN CONECTADO AL BACKEND CON ESTADO DE CARGA */}
            <button 
              onClick={handleToggleAI} 
              disabled={loadingToggle}
              className={`mt-6 flex w-full justify-center items-center gap-2 rounded-xl border px-4 py-3 font-bold transition-all ${
                iaActiva 
                  ? 'border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20' 
                  : 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20'
              } disabled:opacity-50`}
            >
              {loadingToggle ? <Loader2 className="h-5 w-5 animate-spin" /> : <Power className="h-5 w-5" />}
              {loadingToggle ? 'Procesando...' : (iaActiva ? 'Pausar Inteligencia' : 'Reactivar Inteligencia')}
            </button>
          </div>

          <div className="rounded-2xl border border-[#1E293B] bg-[#0D1117] p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold tracking-widest text-[#8994A6] uppercase">Canal de Texto</span>
                <MessageSquare className="h-6 w-6 text-[#19C8E8]" />
              </div>
              <div className="text-2xl font-bold text-[#F5F7FA] mb-2">WhatsApp API</div>
              
              {/* 🔥 BADGE DINÁMICO DE LOS 3 ESTADOS (Verde, Naranja, Rojo) */}
              <p className={`text-[10px] font-mono font-medium flex items-center w-fit gap-1.5 px-2.5 py-1 rounded-md border mb-2 ${
                whatsappStatus === 'active' 
                  ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' 
                  : whatsappStatus === 'pending'
                  ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
                  : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
              }`}>
                <ShieldCheck className="h-3 w-3" /> 
                {whatsappStatus === 'active' 
                  ? 'WHATSAPP CONECTADO' 
                  : whatsappStatus === 'pending' 
                  ? 'PENDIENTE REVISIÓN META (24-48H)' 
                  : 'DESCONECTADO'}
              </p>

              {/* 🔥 MUESTRA EL TELÉFONO VINCULADO SI EXISTE */}
              {telefonoConectado && (
                <p className="text-xs text-[#8994A6] font-mono mt-2">
                  Línea activa: <span className="text-[#F5F7FA] font-semibold">{telefonoConectado}</span>
                </p>
              )}
            </div>

            {/* 🔥 BOTONES DIVIDIDOS: CONFIGURAR Y BUZÓN OMNICANAL */}
            <div className="flex gap-4 mt-6">
              <button 
                onClick={handleActivarWhatsApp} 
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1E293B] border border-[#1E293B] px-4 py-3 text-sm font-semibold text-[#F5F7FA] hover:bg-[#2A3B4C] hover:border-[#8994A6]/30 transition-all"
              >
                <Rocket className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Configurar</span>
              </button>
              
              {/* ESTE ES EL BOTÓN AL NUEVO CHAT EN VIVO */}
              <button 
                onClick={() => router.push('/dashboard/inbox')} 
                className="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-[#19C8E8] px-4 py-3 text-sm font-bold text-[#07090C] hover:bg-[#33DDFF] transition-all shadow-[0_0_15px_rgba(25,200,232,0.3)] hover:shadow-[0_0_25px_rgba(25,200,232,0.5)]"
              >
                <MessageCircleMore className="h-5 w-5 shrink-0" /> Chat en Vivo
              </button>
            </div>
          </div>
        </div>

        {/* 🔌 PLUG AND PLAY: INTEGRACIONES */}
        <h2 className="text-xl font-bold text-[#F5F7FA] mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-[#9B5CFF]" /> Integraciones Plug & Play
        </h2>
        
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-[#1E293B] bg-[#0D1117] p-8 hover:border-[#8994A6]/30 transition-all flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-[#9B5CFF]/30 bg-[#9B5CFF]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#9B5CFF] mb-4">
                <BookOpen className="h-3 w-3" /> Memoria
              </div>
              <h2 className="text-xl font-bold text-[#F5F7FA] mb-2">Base de Conocimiento (RAG)</h2>
              <p className="text-[#8994A6] text-sm mb-6">Sube PDFs con los precios y políticas para expandir la mente del agente.</p>
            </div>
            <Link href="/dashboard/inventario" className="w-full flex items-center justify-center rounded-xl border border-[#1E293B] bg-[#1E293B] px-6 py-3 font-semibold text-[#F5F7FA] hover:bg-[#2A3B4C] transition-all text-sm">
              Gestionar Documentos
            </Link>
          </div>

          {/* TARJETA: AGENDA NATIVA UPWAY */}
          <div className="rounded-2xl border border-[#1E293B] bg-[#0D1117] p-8 hover:border-[#19C8E8]/30 transition-all flex flex-col justify-between shadow-xl">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-[#19C8E8]/30 bg-[#19C8E8]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#19C8E8] mb-4">
                <Calendar className="h-3 w-3" /> Motor Propietario
              </div>
              <h2 className="text-xl font-bold text-[#F5F7FA] mb-2">Agenda Nativa Upway</h2>
              <p className="text-[#8994A6] text-sm mb-6">
                Sistema de agendamiento inteligente integrado directamente con el CRM, llamadas de voz y base de datos interna.
              </p>
            </div>
            
            <div className="w-full flex items-center justify-between pt-4 border-t border-[#1E293B]/60">
              <span className="text-xs text-[#8994A6] font-medium flex items-center gap-1">
                Motor interno conectado
              </span>
              <span className="text-xs font-semibold text-[#10B981] flex items-center gap-1.5 bg-[#10B981]/10 px-2.5 py-1 rounded-md border border-[#10B981]/20">
                <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse"></span>
                Activa y Operando
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1E293B] bg-[#0D1117] p-8 hover:border-[#19C8E8]/30 transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-[#19C8E8] opacity-[0.05] rounded-full blur-2xl pointer-events-none"></div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-[#19C8E8]/30 bg-[#19C8E8]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#19C8E8] mb-4">
                <Mic className="h-3 w-3" /> Recepcionista Telefónica
              </div>
              <h2 className="text-xl font-bold text-[#F5F7FA] mb-2">Activar Línea de Voz</h2>
              <p className="text-[#8994A6] text-sm mb-6">Despliega tu IA en una línea SIP conectada a tu CRM (Vapi).</p>
            </div>
            <button 
              onClick={() => setServicioActivo('voz')} 
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#19C8E8] text-[#07090C] py-3 font-bold hover:bg-[#33DDFF] transition-all text-sm"
            >
              Configurar Agente de Voz <ArrowRight className="h-4 w-4"/>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}