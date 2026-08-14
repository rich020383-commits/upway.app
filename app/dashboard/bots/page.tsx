"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageCircleMore, Sparkles, ShieldCheck, ArrowRight, Send, Signal, Wifi, Battery, Check, Store, Mic, Square, Phone, ArrowLeft, Headphones, UploadCloud, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react'; 

export default function AgentesBotPage() {
  const router = useRouter();
  
  // 🚀 ESTADO MAESTRO DEL MULTI-TENANT (EL HUB)
  const [servicioActivo, setServicioActivo] = useState<'hub' | 'whatsapp' | 'voz'>('hub');

  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    getSession().then((session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });
  }, []);

  const [nombreAgente, setNombreAgente] = useState('');
  const [nicho, setNicho] = useState('general'); 
  const [promptMaestro, setPromptMaestro] = useState('');
  const [guardando, setGuardando] = useState(false);
  
  const [mostrarPlanes, setMostrarPlanes] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);
  
  // Estados para el Simulador WhatsApp
  const [mensajePrueba, setMensajePrueba] = useState('');
  const [historialChat, setHistorialChat] = useState<{rol: string, texto: string}[]>([]);
  const [cargandoPrueba, setCargandoPrueba] = useState(false);
  
  // Estados para el Audio
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Estados para el Simulador de Voz (VAPI)
  const [vozSeleccionada, setVozSeleccionada] = useState('femenina_estrella'); // Celeste por defecto
  const [creandoVoz, setCreandoVoz] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if(servicioActivo === 'whatsapp') scrollToBottom();
  }, [historialChat, cargandoPrueba, isRecording, servicioActivo]);

  const guardarConfiguracion = async () => {
    if (!nombreAgente || !promptMaestro) {
      alert('Completa el nombre del agente y las reglas antes de guardar.');
      return;
    }

    setGuardando(true);
    try {
      const datosParaBackend = {
        tienda_id: '1172769935927318',
        nombre: nombreAgente,
        reglas: `(Contexto de negocio: ${nicho}) - ${promptMaestro}`,
      };

      const respuesta = await fetch('/api/tienda/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaBackend),
      });

      if (respuesta.ok) {
        alert('✅ ¡El agente quedó guardado y actualizado en el simulador!');
      } else {
        alert('Hubo un problema al guardar la configuración.');
      }
    } catch (error) {
      console.error('Error conectando con el backend:', error);
      alert('No fue posible contactar con el servicio.');
    } finally {
      setGuardando(false);
    }
  };

  // 🚀 NUEVA FUNCIÓN: CREAR AGENTE EN VAPI
  const crearAgenteVoz = async () => {
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
          tienda_id: '1172769935927318', // Usando tu ID de prueba fijo
          nombre: nombreAgente,
          promptMaestro: promptMaestro,
          vozSeleccionada: vozSeleccionada
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        alert('🎉 ¡Central Telefónica conectada! Tu agente ya existe en Vapi con el ID: ' + data.assistantId);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión con el servidor.');
    } finally {
      setCreandoVoz(false);
    }
  };

  const iniciarPago = async (plan: string, precio: number) => {
    setProcesandoPago(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan,
          precio: precio,
          descripcion: `Suscripción Upway - ${plan}`
        })
      });

      const data = await res.json();
      
      if (data.payment_url) {
        window.location.href = data.payment_url; 
      } else {
        alert("Hubo un error al generar el link de pago. Revisa tu backend de Bold.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión con la pasarela de pagos.");
    } finally {
      setProcesandoPago(false);
    }
  };

  const handleActivarWhatsApp = () => {
    router.push('/dashboard/activacion'); 
  };

  // ==========================================
  // 🔥 LÓGICA DE GRABACIÓN DE AUDIO (EXISTENTE)
  // ==========================================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          enviarAudioPrueba(base64Audio as string);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error al acceder al micrófono:", error);
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
        body: JSON.stringify({ 
          promptMaestro: promptContextualizado, 
          audioUsuario: base64Audio,
          historial: historialChat 
        })
      });

      const textResponse = await res.text();
      if (!res.ok) throw new Error(`Fallo del servidor: ${textResponse}`);
      
      const data = JSON.parse(textResponse);
      if (data.error) throw new Error(data.error);

      setHistorialChat([...nuevoHistorial, { rol: 'ia', texto: data.respuesta }]);
    } catch (error) {
      console.error('Error detallado del simulador de audio:', error);
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
        body: JSON.stringify({ 
          promptMaestro: promptContextualizado, 
          mensajeUsuario: mensajeEnviado,
          historial: historialChat 
        })
      });

      const textResponse = await res.text();
      if (!res.ok) throw new Error(`Fallo del servidor (${res.status}): ${textResponse}`);
      
      const data = JSON.parse(textResponse);
      if (data.error) throw new Error(data.error);

      setHistorialChat([...nuevoHistorial, { rol: 'ia', texto: data.respuesta }]);
    } catch (error) {
      console.error('Error detallado del simulador:', error);
      setHistorialChat([...nuevoHistorial, { rol: 'ia', texto: `⚠️ Fallo exacto: ${error instanceof Error ? error.message : 'Error desconocido'}` }]);
    } finally {
      setCargandoPrueba(false);
    }
  };


  // ==========================================
  // RENDER: PANTALLA HUB (SELECCIÓN DE SERVICIO)
  // ==========================================
  if (servicioActivo === 'hub') {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_55%)] bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-semibold text-blue-400 mb-6">
            <Bot className="h-4 w-4"/> Upway Multi-Canal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">¿Qué canal deseas potenciar hoy?</h1>
          <p className="text-lg text-slate-400">Selecciona el tipo de agente digital que quieres configurar o monitorear para tu negocio.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
          {/* Tarjeta WhatsApp */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -5 }}
            onClick={() => setServicioActivo('whatsapp')}
            className="group relative cursor-pointer overflow-hidden rounded-[32px] border border-emerald-500/30 bg-white/[0.02] p-8 shadow-[0_0_40px_rgba(16,185,129,0.05)] transition-all hover:bg-emerald-950/20 hover:border-emerald-500/60"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <MessageCircleMore className="w-40 h-40 text-emerald-500" />
            </div>
            <div className="relative z-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-6 border border-emerald-500/30">
                <MessageCircleMore className="h-8 w-8"/>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Agente de Texto</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">Conecta un vendedor digital a tu WhatsApp. Responde mensajes, lee notas de voz, revisa catálogo y cierra ventas 24/7.</p>
              <div className="flex items-center text-emerald-400 font-semibold gap-2">
                Configurar WhatsApp <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>

          {/* Tarjeta Voz (Vapi) */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -5 }}
            onClick={() => setServicioActivo('voz')}
            className="group relative cursor-pointer overflow-hidden rounded-[32px] border border-cyan-500/30 bg-white/[0.02] p-8 shadow-[0_0_40px_rgba(6,182,212,0.05)] transition-all hover:bg-cyan-950/20 hover:border-cyan-500/60"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Phone className="w-40 h-40 text-cyan-500" />
            </div>
            <div className="relative z-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 mb-6 border border-cyan-500/30">
                <Headphones className="h-8 w-8"/>
              </div>
              <span className="absolute top-8 right-8 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider">Nuevo</span>
              <h2 className="text-3xl font-bold text-white mb-3">Agente Telefónico</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">Una IA que hace y recibe llamadas reales. Ideal para confirmar citas médicas, recordar cobros o atención al cliente.</p>
              <div className="flex items-center text-cyan-400 font-semibold gap-2">
                Configurar Central de Voz <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: PANTALLA AGENTE DE VOZ (VAPI)
  // ==========================================
  if (servicioActivo === 'voz') {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.15),_transparent_55%)] bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          
          <button onClick={() => setServicioActivo('hub')} className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al panel central
          </button>

          <div className="mb-8 overflow-hidden rounded-[32px] border border-cyan-500/20 bg-white/5 p-8 shadow-2xl shadow-cyan-900/20 backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-400">
                  <Headphones className="h-4 w-4"/> Central Telefónica IA
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Configura tu Recepcionista de Voz</h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">Define cómo hablará por teléfono, elige su acento y sube el listado de clientes a los que debe llamar hoy.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            {/* Columna Configuración VAPI */}
            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md">
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Nombre de la Recepcionista</label>
                      <input 
                        type="text" 
                        value={nombreAgente} 
                        onChange={(e) => setNombreAgente(e.target.value)} 
                        placeholder="Ej. Celeste de Clínica San Juan" 
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:bg-slate-900" 
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Catálogo de Voces (Español)</label>
                      <select 
                        value={vozSeleccionada} 
                        onChange={(e) => setVozSeleccionada(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500 focus:bg-slate-900 cursor-pointer"
                      >
                        <optgroup label="Voces Femeninas">
                          <option value="femenina_estrella">Celeste (Recomendada - Latencia Ultra Baja)</option>
                          <option value="femenina_calida">Matilda (Tono Cálido y Empático)</option>
                          <option value="femenina_nativa">Aila (Asistente Rápida)</option>
                        </optgroup>
                        <optgroup label="Voces Masculinas">
                          <option value="masculino_serio">Antoni (Voz Grave y Confiable)</option>
                          <option value="masculino_joven">Fin (Tono Joven y Casual)</option>
                          <option value="masculino_nativo">Elliot (Asistente Rápido)</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300 flex justify-between items-center">
                      <span>Guion de Llamada (Prompt Telefónico)</span>
                      <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">Modo Voz</span>
                    </label>
                    <textarea 
                      value={promptMaestro} 
                      onChange={(e) => setPromptMaestro(e.target.value)} 
                      placeholder="Ej: Eres recepcionista de la clínica. Llama para confirmar la cita de mañana. Si te dicen que no pueden, ofrece reprogramar. Sé breve, no hagas preguntas abiertas..." 
                      className="h-40 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:bg-slate-900" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha VAPI: Campañas */}
            <div className="flex flex-col gap-6">
              <div className="rounded-[28px] border border-cyan-500/20 bg-[#0A0E14] p-6 shadow-[0_0_30px_rgba(6,182,212,0.1)] ring-1 ring-white/10">
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 mb-4">
                    <UploadCloud className="h-8 w-8"/>
                  </div>
                  <h3 className="text-xl font-bold text-white">Lanzar Campaña de Llamadas</h3>
                  <p className="text-sm text-slate-400 mt-2">Sube tu Excel con Nombre, Teléfono y Fecha de Cita. La IA los llamará a todos automáticamente.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <button className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-cyan-500/50 bg-cyan-500/5 px-6 py-4 font-bold text-cyan-400 transition-all hover:bg-cyan-500/10">
                    <UploadCloud className="h-5 w-5" /> Subir archivo CSV
                  </button>

                  <button 
                    onClick={crearAgenteVoz} 
                    disabled={creandoVoz} 
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-6 py-4 font-bold text-black shadow-lg shadow-cyan-500/30 transition-all hover:bg-cyan-400 hover:scale-[1.02] mt-4 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {creandoVoz ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : <Phone className="h-5 w-5 fill-current" />}
                    {creandoVoz ? 'Activando Central...' : 'Activar Agente de Voz'}
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
  // RENDER ORIGINAL: PANTALLA WHATSAPP (TEXTO)
  // ==========================================
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_55%)] bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        <button onClick={() => setServicioActivo('hub')} className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al panel central
        </button>

        {/* Cabecera Premium Oscura */}
        <div className="mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-emerald-900/20 backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-400">
                <Bot className="h-4 w-4"/> Agente IA WhatsApp
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Construye la voz de tu Empleado Digital</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">Define su personalidad, establece las reglas de tu negocio y ponlo a prueba en tiempo real antes de conectarlo a WhatsApp.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <Sparkles className="h-5 w-5"/>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Cerebro del Agente</h2>
                  <p className="text-sm text-slate-400">Instruye a la IA exactamente cómo debe vender y atender por chat.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Nombre de tu Asistente</label>
                    <input 
                      type="text" 
                      value={nombreAgente} 
                      onChange={(e) => setNombreAgente(e.target.value)} 
                      placeholder="Ej. Sofía de Ferretería XY" 
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Industria o Sector</label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <select 
                        value={nicho} 
                        onChange={(e) => setNicho(e.target.value)}
                        className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-900/60 pl-10 pr-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500 focus:bg-slate-900 cursor-pointer"
                      >
                        <option value="general">Empresa General (Servicios)</option>
                        <option value="restaurante">Restaurante / Comidas</option>
                        <option value="ferreteria">Ferretería / Construcción</option>
                        <option value="clinica">Clínica / Estética / Salud</option>
                        <option value="ropa">Tienda de Ropa / Moda</option>
                        <option value="inmobiliaria">Inmobiliaria / Bienes Raíces</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300 flex justify-between items-center">
                    <span>Instrucciones Operativas (El Prompt)</span>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Secreto Comercial</span>
                  </label>
                  <textarea 
                    value={promptMaestro} 
                    onChange={(e) => setPromptMaestro(e.target.value)} 
                    placeholder="Ej: Eres un vendedor experto. Tu objetivo es agendar citas..." 
                    className="h-40 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="h-5 w-5"/>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Memoria y Catálogo (RAG)</h2>
                  <p className="text-sm text-slate-400">Alimenta a tu agente con el stock real de tu negocio.</p>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/dashboard/inventario'}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-10 text-sm font-semibold text-slate-400 transition hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
              >
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/>
                Sincronizar base de datos de productos
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA (Simulador Premium Celular) */}
          <div className="flex flex-col items-center gap-6 lg:items-end">
            
            <div className="relative flex h-[720px] w-full max-w-[340px] shrink-0 flex-col overflow-hidden rounded-[3.5rem] border-[14px] border-slate-950 bg-slate-950 shadow-[0_0_50px_rgba(16,185,129,0.15)] ring-1 ring-white/20">
              
              <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex h-7 items-center justify-between px-6 text-[10px] font-medium text-white/70">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <Signal className="h-3 w-3" />
                  <Wifi className="h-3 w-3" />
                  <Battery className="h-4 w-4" />
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex h-7 justify-center">
                <div className="flex h-7 w-32 items-center justify-center gap-3 rounded-b-3xl bg-slate-950 px-3 shadow-md">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/10"></div>
                  <div className={`h-2 w-2 rounded-full transition-all duration-300 ${cargandoPrueba ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : isRecording ? 'bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-[#10b981]/40 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`}></div>
                </div>
              </div>

              <div className="relative z-40 flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 pb-3 pt-12 backdrop-blur-xl">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#10b981] to-emerald-600 shadow-lg">
                  <Bot className="h-5 w-5 text-white" />
                  <span className="absolute bottom-0 right-0 z-20 h-3 w-3 rounded-full border-2 border-[#0A0E14] bg-green-500"></span>
                </div>
                <div>
                  <h3 className="flex items-center gap-1 font-display text-[14px] font-bold leading-tight text-white">
                    {nombreAgente || "Agente sin nombre"} <Sparkles className="h-3 w-3 text-emerald-400" />
                  </h3>
                  <p className="mt-0.5 font-mono text-[10px] tracking-wide text-[#10b981]">Simulador WhatsApp</p>
                </div>
              </div>

              <div className="relative flex-1 space-y-4 overflow-y-auto bg-[#03050a] p-4 scroll-smooth scrollbar-hide">
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")' }}></div>
                
                <div className="relative z-10 space-y-4 pt-2">
                  {historialChat.length === 0 ? (
                    <div className="mt-16 flex h-full flex-col items-center justify-center px-4 text-center">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                        <MessageCircleMore className="text-emerald-400 w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-white mb-2">Pon a prueba tu Agente</p>
                      <p className="text-xs text-white/50 leading-relaxed mb-4">
                        Desafíalo. Pídele un producto difícil, simula que eres un cliente enojado o envíale un texto mal escrito.
                      </p>
                      <span className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/40">El chat se limpiará al recargar</span>
                    </div>
                  ) : (
                    historialChat.map((m, i) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} key={i} 
                        className={`flex ${m.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] p-3.5 text-[13px] leading-relaxed shadow-md backdrop-blur-md ${m.rol === 'usuario' ? 'bg-gradient-to-br from-[#10b981] to-emerald-500 text-white font-medium rounded-[20px] rounded-tr-[4px]' : 'bg-white/[0.08] border border-white/10 text-slate-200 rounded-[20px] rounded-tl-[4px]'}`}>
                          {m.texto}
                        </div>
                      </motion.div>
                    ))
                  )}
                  
                  <AnimatePresence>
                    {cargandoPrueba && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex justify-start">
                        <div className="flex items-center gap-1.5 rounded-[20px] rounded-tl-[4px] border border-white/10 bg-white/[0.08] p-4 backdrop-blur-md">
                          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-[#10b981]/70" />
                          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-[#10b981]/40" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence>
                    {isRecording && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex justify-end">
                         <div className="flex items-center gap-2 rounded-[20px] rounded-tr-[4px] border border-red-500/20 bg-red-500/10 p-3 backdrop-blur-md text-red-400 text-xs font-bold">
                            <span className="animate-pulse h-2 w-2 rounded-full bg-red-500 block"></span> Grabando audio...
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input de Texto y Audio */}
              <div className="shrink-0 border-t border-white/5 bg-[#0A0E14] p-4 pb-8 backdrop-blur-xl relative z-20">
                <div className="relative flex items-center rounded-full border border-white/10 bg-white/[0.03] transition-all focus-within:border-[#10b981]/50 focus-within:bg-white/[0.06]">
                  <input 
                    value={mensajePrueba} 
                    onChange={(e) => setMensajePrueba(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && enviarMensajePrueba()}
                    placeholder={isRecording ? "Grabando..." : "Chatea o graba un audio..."}
                    disabled={cargandoPrueba || isRecording}
                    className="w-full bg-transparent py-3.5 pl-5 pr-14 text-[13px] text-white outline-none placeholder:text-white/30 disabled:opacity-50"
                  />
                  
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {mensajePrueba.trim() ? (
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={enviarMensajePrueba} 
                        disabled={cargandoPrueba}
                        className="flex items-center justify-center rounded-full bg-[#10b981] p-2.5 text-white transition-colors hover:bg-emerald-400"
                      >
                        <Send className="ml-0.5 h-4 w-4" />
                      </motion.button>
                    ) : isRecording ? (
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={stopRecording} 
                        className="flex items-center justify-center rounded-full bg-red-500 p-2.5 text-white transition-colors hover:bg-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                      >
                        <Square className="h-4 w-4 fill-current" />
                      </motion.button>
                    ) : (
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={startRecording} 
                        disabled={cargandoPrueba}
                        className="flex items-center justify-center rounded-full bg-[#10b981]/20 p-2.5 text-[#10b981] transition-colors hover:bg-[#10b981] hover:text-white"
                      >
                        <Mic className="h-4 w-4" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full max-w-[340px] flex-col gap-3">
              <button 
                onClick={guardarConfiguracion} 
                disabled={guardando}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-white shadow-sm transition-all hover:bg-white/10"
              >
                {guardando ? "Aplicando memoria..." : "💾 Guardar instrucciones"}
              </button>

              <button 
                onClick={handleActivarWhatsApp} 
                className="group relative flex w-full overflow-hidden items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 font-bold text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></div>
                <div className="relative z-10 flex items-center gap-2">
                  <span className="animate-pulse">🟢</span> Conectar a mi WhatsApp
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}