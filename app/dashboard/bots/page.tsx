"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageCircleMore, Sparkles, ShieldCheck, ArrowRight, Send, Signal, Wifi, Battery, Check, Store, Mic, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react'; 

export default function AgentesBotPage() {
  const router = useRouter();
  
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
  
  // Estados para el Simulador
  const [mensajePrueba, setMensajePrueba] = useState('');
  const [historialChat, setHistorialChat] = useState<{rol: string, texto: string}[]>([]);
  const [cargandoPrueba, setCargandoPrueba] = useState(false);
  
  // 🔥 ESTADOS PARA EL AUDIO (NUEVO)
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [historialChat, cargandoPrueba, isRecording]);

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
    if (userEmail === 'rich020383@gmail.com' || userEmail === 'revisor_meta@upway.business') {
      router.push('/dashboard/activacion'); 
    } else {
      setMostrarPlanes(true); 
    }
  };

  // ==========================================
  // 🔥 LÓGICA DE GRABACIÓN DE AUDIO (NUEVO)
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
        
        // Convertimos el audio a Base64 para enviarlo fácil al backend
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          enviarAudioPrueba(base64Audio as string);
        };

        // Apagamos el micrófono del navegador
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
          audioUsuario: base64Audio, // 🚀 ENVIAMOS EL AUDIO EN BASE64
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

  // ==========================================
  // LÓGICA DE TEXTO (EXISTENTE)
  // ==========================================
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_55%)] bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Cabecera Premium Oscura */}
        <div className="mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-blue-900/20 backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-400">
                <Bot className="h-4 w-4"/>
                Agente IA premium
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
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                  <Sparkles className="h-5 w-5"/>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Cerebro del Agente</h2>
                  <p className="text-sm text-slate-400">Instruye a la IA exactamente cómo debe vender y atender.</p>
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
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Industria o Sector</label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <select 
                        value={nicho} 
                        onChange={(e) => setNicho(e.target.value)}
                        className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-900/60 pl-10 pr-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500 focus:bg-slate-900 cursor-pointer"
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
                    <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">Secreto Comercial</span>
                  </label>
                  <textarea 
                    value={promptMaestro} 
                    onChange={(e) => setPromptMaestro(e.target.value)} 
                    placeholder="Ej: Eres un vendedor experto. Tu objetivo es agendar citas. Nunca digas no sé, si no tenemos algo, ofrece una alternativa similar..." 
                    className="h-40 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
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

          {/* ========================================== */}
          {/* COLUMNA DERECHA (Simulador Premium Celular) */}
          {/* ========================================== */}
          <div className="flex flex-col items-center gap-6 lg:items-end">
            
            <div className="relative flex h-[720px] w-full max-w-[340px] shrink-0 flex-col overflow-hidden rounded-[3.5rem] border-[14px] border-slate-950 bg-slate-950 shadow-[0_0_50px_rgba(37,99,235,0.15)] ring-1 ring-white/20">
              
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
                  <div className={`h-2 w-2 rounded-full transition-all duration-300 ${cargandoPrueba ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : isRecording ? 'bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-[#00D1FF]/40 shadow-[0_0_8px_rgba(0,209,255,0.4)]'}`}></div>
                </div>
              </div>

              <div className="relative z-40 flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 pb-3 pt-12 backdrop-blur-xl">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#00D1FF] to-blue-600 shadow-lg">
                  <Bot className="h-5 w-5 text-black" />
                  <span className="absolute bottom-0 right-0 z-20 h-3 w-3 rounded-full border-2 border-[#0A0E14] bg-green-500"></span>
                </div>
                <div>
                  <h3 className="flex items-center gap-1 font-display text-[14px] font-bold leading-tight text-white">
                    {nombreAgente || "Agente sin nombre"} <Sparkles className="h-3 w-3 text-cyan-400" />
                  </h3>
                  <p className="mt-0.5 font-mono text-[10px] tracking-wide text-[#00D1FF]">Simulador Interno IA</p>
                </div>
              </div>

              <div className="relative flex-1 space-y-4 overflow-y-auto bg-[#03050a] p-4 scroll-smooth scrollbar-hide">
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")' }}></div>
                
                <div className="relative z-10 space-y-4 pt-2">
                  {historialChat.length === 0 ? (
                    <div className="mt-16 flex h-full flex-col items-center justify-center px-4 text-center">
                      <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
                        <MessageCircleMore className="text-blue-400 w-8 h-8" />
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
                        <div className={`max-w-[85%] p-3.5 text-[13px] leading-relaxed shadow-md backdrop-blur-md ${m.rol === 'usuario' ? 'bg-gradient-to-br from-[#00D1FF] to-cyan-500 text-black font-medium rounded-[20px] rounded-tr-[4px]' : 'bg-white/[0.08] border border-white/10 text-slate-200 rounded-[20px] rounded-tl-[4px]'}`}>
                          {m.texto}
                        </div>
                      </motion.div>
                    ))
                  )}
                  
                  <AnimatePresence>
                    {cargandoPrueba && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex justify-start">
                        <div className="flex items-center gap-1.5 rounded-[20px] rounded-tl-[4px] border border-white/10 bg-white/[0.08] p-4 backdrop-blur-md">
                          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="h-1.5 w-1.5 rounded-full bg-[#00D1FF]" />
                          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-[#00D1FF]/70" />
                          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-[#00D1FF]/40" />
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
                <div className="relative flex items-center rounded-full border border-white/10 bg-white/[0.03] transition-all focus-within:border-[#00D1FF]/50 focus-within:bg-white/[0.06]">
                  <input 
                    value={mensajePrueba} 
                    onChange={(e) => setMensajePrueba(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && enviarMensajePrueba()}
                    placeholder={isRecording ? "Grabando..." : "Chatea o graba un audio..."}
                    disabled={cargandoPrueba || isRecording}
                    className="w-full bg-transparent py-3.5 pl-5 pr-14 text-[13px] text-white outline-none placeholder:text-white/30 disabled:opacity-50"
                  />
                  
                  {/* 🔥 BOTÓN DINÁMICO (ENVIAR vs MICRÓFONO vs DETENER) */}
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {mensajePrueba.trim() ? (
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={enviarMensajePrueba} 
                        disabled={cargandoPrueba}
                        className="flex items-center justify-center rounded-full bg-[#00D1FF] p-2.5 text-black transition-colors hover:bg-cyan-400"
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
                        className="flex items-center justify-center rounded-full bg-[#00D1FF]/20 p-2.5 text-[#00D1FF] transition-colors hover:bg-[#00D1FF] hover:text-black"
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

      {/* ========================================== */}
      {/* VENTANA FLOTANTE DE PAGOS (BOLD)           */}
      {/* ========================================== */}
      <AnimatePresence>
        {mostrarPlanes && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            
            <div className="absolute inset-0 cursor-pointer" onClick={() => setMostrarPlanes(false)} />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[32px] border border-[#00D1FF]/30 bg-[#0A0E14] p-8 text-white shadow-[0_0_50px_rgba(0,209,255,0.15)]"
            >
              <button onClick={() => setMostrarPlanes(false)} className="absolute right-6 top-6 rounded-full bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white">✕</button>

              <div className="mb-6 text-center md:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                  <Sparkles className="h-3.5 w-3.5"/> Activación de Producción
                </div>
                <h2 className="mt-3 text-3xl font-bold">Llegó el momento de automatizar</h2>
                <p className="mt-2 text-sm text-gray-400">Tu agente está listo en el simulador. Elige un plan para conectarlo a tu línea real de WhatsApp Business y empezar a vender 24/7.</p>
              </div>

              <div className="my-8 grid gap-6 md:grid-cols-2">
                <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:bg-white/[0.05]">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Plan Emprendedor</span>
                    <h3 className="mt-2 text-3xl font-bold">$149.900 <span className="font-normal text-gray-400 text-sm">COP/mes</span></h3>
                    <p className="mb-5 mt-3 border-b border-white/10 pb-5 text-sm text-gray-400">Ideal para negocios que inician con atención automatizada básica.</p>
                    
                    <ul className="mb-6 space-y-3">
                      <li className="flex items-center gap-3 text-sm text-gray-300"><Check className="h-5 w-5 shrink-0 text-cyan-400" /> Chatbot de texto 24/7</li>
                      <li className="flex items-center gap-3 text-sm text-gray-300"><Check className="h-5 w-5 shrink-0 text-cyan-400" /> Reglas de personalidad básicas</li>
                    </ul>
                  </div>
                  
                  <button onClick={() => iniciarPago('Plan Emprendedor', 149900)} disabled={procesandoPago} className="mt-4 w-full rounded-xl bg-white/10 py-3.5 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-50">
                    {procesandoPago ? 'Conectando con Bold...' : 'Seleccionar Emprendedor'}
                  </button>
                </div>

                <div className="relative flex flex-col justify-between rounded-3xl border-2 border-cyan-500/50 bg-gradient-to-b from-[#00D1FF]/10 to-[#0A0E14] p-6 shadow-[0_0_30px_rgba(0,209,255,0.15)]">
                  <span className="absolute -top-3 right-6 rounded-full bg-cyan-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black shadow-lg">El favorito ⭐️</span>
                  
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Plan Negocio</span>
                    <h3 className="mt-2 text-3xl font-bold">$299.900 <span className="font-normal text-gray-400 text-sm">COP/mes</span></h3>
                    <p className="mb-5 mt-3 border-b border-white/10 pb-5 text-sm text-gray-400">La experiencia completa con IA avanzada e integración de multimedia.</p>
                    
                    <ul className="mb-6 space-y-3">
                      <li className="flex items-center gap-3 text-sm font-medium text-white"><Check className="h-5 w-5 shrink-0 text-cyan-400" /> <b>Todo lo del Plan Emprendedor</b></li>
                      <li className="flex items-center gap-3 text-sm text-gray-200"><Check className="h-5 w-5 shrink-0 text-cyan-400" /> Entiende <b>notas de voz de clientes</b></li>
                      <li className="flex items-center gap-3 text-sm text-gray-200"><Check className="h-5 w-5 shrink-0 text-cyan-400" /> Toma de pedidos automática y RAG</li>
                    </ul>
                  </div>
                  
                  <button onClick={() => iniciarPago('Plan Negocio', 299900)} disabled={procesandoPago} className="mt-4 w-full rounded-xl bg-cyan-500 py-3.5 text-sm font-bold text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] transition hover:bg-cyan-400 disabled:opacity-50">
                    {procesandoPago ? 'Conectando seguro con Bold...' : '🔒 Activar Plan Negocio'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}