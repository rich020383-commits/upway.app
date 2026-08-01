"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageCircleMore, Sparkles, ShieldCheck, ArrowRight, Send, Signal, Wifi, Battery } from 'lucide-react';

export default function AgentesBotPage() {
  const [nombreAgente, setNombreAgente] = useState('');
  const [promptMaestro, setPromptMaestro] = useState('');
  const [guardando, setGuardando] = useState(false);
  
  // Estado simulado para el modal de pagos (SaaS)
  const [mostrarPlanes, setMostrarPlanes] = useState(false);
  
  // Estados para el Simulador
  const [mensajePrueba, setMensajePrueba] = useState('');
  const [historialChat, setHistorialChat] = useState<{rol: string, texto: string}[]>([]);
  const [cargandoPrueba, setCargandoPrueba] = useState(false);
  
  // Auto-scroll para el celular
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [historialChat, cargandoPrueba]);

  // Guardar en la Base de Datos (Botón Blanco)
  const guardarConfiguracion = async () => {
    if (!nombreAgente || !promptMaestro) {
      alert('Completa el nombre del agente y las reglas antes de guardar.');
      return;
    }

    setGuardando(true);
    try {
      const datosParaBackend = {
        tienda_id: '1172769935927318', // O tu ID real dinámico
        nombre: nombreAgente,
        reglas: promptMaestro,
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

  // Simulador Interno
  const enviarMensajePrueba = async () => {
    if (!mensajePrueba.trim()) return;

    const mensajeEnviado = mensajePrueba;
    const nuevoHistorial = [...historialChat, { rol: 'usuario', texto: mensajeEnviado }];
    
    setHistorialChat(nuevoHistorial);
    setMensajePrueba('');
    setCargandoPrueba(true);

    try {
      const res = await fetch('/api/simulador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          promptMaestro, 
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
      setHistorialChat([...nuevoHistorial, { 
        rol: 'ia', 
        texto: `⚠️ Fallo exacto: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      }]);
    } finally {
      setCargandoPrueba(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.13),_transparent_50%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Cabecera */}
        <div className="mb-8 overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/80 p-8 shadow-premium backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                <Bot className="h-4 w-4"/>
                Agente IA premium
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Construye la voz de tu bot de WhatsApp</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">Define la personalidad de tu asistente, sus reglas operativas y su conexión con el negocio para ofrecer respuestas más inteligentes.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          
          {/* ========================================== */}
          {/* COLUMNA IZQUIERDA (Configuración)          */}
          {/* ========================================== */}
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-premium">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Sparkles className="h-5 w-5"/>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Personalidad y reglas</h2>
                  <p className="text-sm text-slate-500">Da instrucciones claras para que la IA responda como tu marca.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nombre del agente</label>
                  <input type="text" value={nombreAgente} onChange={(e) => setNombreAgente(e.target.value)} placeholder="Ej. Asistente Upway" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-0 transition focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Prompt maestro</label>
                  <textarea value={promptMaestro} onChange={(e) => setPromptMaestro(e.target.value)} placeholder="Escribe las reglas, tono, prohibiciones y estilo de respuesta..." className="h-40 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500" />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-premium">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-5 w-5"/>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Base de conocimiento</h2>
                  <p className="text-sm text-slate-500">Conecta inventario, políticas y documentos para que el bot resuelva mejor.</p>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/dashboard/inventario'}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm font-semibold text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
              >
                <ArrowRight className="h-4 w-4"/>
                Sincronizar inventario y documentos
              </button>
            </div>
          </div>

          {/* ========================================== */}
          {/* COLUMNA DERECHA (Simulador y Botones)      */}
          {/* ========================================== */}
          <div className="flex flex-col gap-6 items-center lg:items-end">
            
            {/* CELULAR PREMIUM SIMULADOR */}
            <div className="relative w-full max-w-[340px] h-[650px] bg-[#0A0E14] rounded-[48px] border-[8px] border-[#161b26] shadow-[0_20px_50px_rgba(37,99,235,0.2)] overflow-hidden flex flex-col ring-1 ring-white/10 shrink-0">
              
              {/* Barra de Estado Superior */}
              <div className="absolute top-0 inset-x-0 h-7 flex justify-between items-center px-6 z-50 text-white/70 text-[10px] font-medium pointer-events-none">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <Signal className="w-3 h-3" />
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-4 h-4" />
                </div>
              </div>

              {/* Notch / Cámara del celular */}
              <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-50 pointer-events-none">
                <div className="w-32 h-7 bg-[#161b26] rounded-b-3xl flex items-center justify-center gap-3 px-3 shadow-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${cargandoPrueba ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-[#00D1FF]/40 shadow-[0_0_8px_rgba(0,209,255,0.4)]'}`}></div>
                </div>
              </div>

              {/* Cabecera estilo WhatsApp Oscuro Premium */}
              <div className="bg-white/[0.03] backdrop-blur-xl border-b border-white/10 px-4 pt-12 pb-3 flex items-center gap-3 relative z-40">
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-[#00D1FF] to-blue-600 flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 text-black" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0A0E14] rounded-full z-20"></span>
                </div>
                <div>
                  <h3 className="text-white font-display text-[14px] font-bold leading-tight flex items-center gap-1">
                    {nombreAgente || "Asistente Upway"} <Sparkles className="w-3 h-3 text-cyan-400" />
                  </h3>
                  <p className="text-[#00D1FF] font-mono text-[10px] tracking-wide mt-0.5">Modo de prueba activo</p>
                </div>
              </div>

              {/* Área de Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#03050a] relative scroll-smooth scrollbar-hide">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")' }}></div>
                
                <div className="relative z-10 space-y-4 pt-2">
                  {historialChat.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 mt-20">
                      <p className="text-sm font-medium text-white/80">Modo de prueba activo 🧪</p>
                      <p className="mt-2 text-xs text-white/40">Escribe abajo para probar cómo responde tu agente con las reglas que definiste.</p>
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
                        <div className="bg-white/[0.08] border border-white/10 p-4 rounded-[20px] rounded-tl-[4px] flex items-center gap-1.5 backdrop-blur-md">
                          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-[#00D1FF] rounded-full" />
                          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#00D1FF]/70 rounded-full" />
                          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#00D1FF]/40 rounded-full" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input de Texto */}
              <div className="p-4 bg-white/[0.02] border-t border-white/5 backdrop-blur-xl shrink-0 pb-8">
                <div className="relative flex items-center rounded-full bg-white/[0.05] border border-white/10 focus-within:border-[#00D1FF]/50 transition-all">
                  <input 
                    value={mensajePrueba} 
                    onChange={(e) => setMensajePrueba(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && enviarMensajePrueba()}
                    placeholder="Prueba tu bot aquí..."
                    disabled={cargandoPrueba}
                    className="w-full bg-transparent pl-5 pr-12 py-3.5 text-[13px] text-white placeholder-white/30 outline-none disabled:opacity-50"
                  />
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={enviarMensajePrueba} 
                    disabled={cargandoPrueba || !mensajePrueba.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#00D1FF] hover:bg-cyan-400 disabled:bg-white/10 disabled:text-white/30 text-black p-2.5 rounded-full transition-colors flex items-center justify-center"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* ========================================== */}
            {/* NUEVA BOTONERA (SaaS STRATEGY)             */}
            {/* ========================================== */}
            <div className="w-full max-w-[340px] flex flex-col gap-3">
              
              {/* BOTÓN 1: GUARDAR (GRATIS - Actualiza el simulador) */}
              <button 
                onClick={guardarConfiguracion} 
                disabled={guardando}
                className="w-full px-6 py-3.5 rounded-[16px] bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {guardando ? "Guardando..." : "💾 Guardar cambios"}
              </button>

              {/* BOTÓN 2: ACTIVAR (PREMIUM - Abre la pantalla de pagos) */}
              <button 
                onClick={() => setMostrarPlanes(true)} 
                className="w-full px-6 py-3.5 rounded-[16px] bg-slate-900 text-white font-bold shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                🚀 Activar en WhatsApp
              </button>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}