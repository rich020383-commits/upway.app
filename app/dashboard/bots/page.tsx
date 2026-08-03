"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageCircleMore, Sparkles, ShieldCheck, ArrowRight, Send, Signal, Wifi, Battery, Check } from 'lucide-react';

export default function AgentesBotPage() {
  const [nombreAgente, setNombreAgente] = useState('');
  const [promptMaestro, setPromptMaestro] = useState('');
  const [guardando, setGuardando] = useState(false);
  
  // Estado para el modal de pagos (SaaS)
  const [mostrarPlanes, setMostrarPlanes] = useState(false);
  
  // 🔥 NUEVO: Estado para procesar el pago con Bold
  const [procesandoPago, setProcesandoPago] = useState(false);
  
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
        tienda_id: '1172769935927318',
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

  // 🔥 NUEVO: Función para iniciar el pago con la API de Bold
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
        // Redirigir al cliente a la pasarela de Bold
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
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Construye la voz de tu bot de WhatsApp</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">Define la personalidad de tu asistente, sus reglas operativas y su conexión con el negocio para ofrecer respuestas más inteligentes.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          
          {/* ========================================== */}
          {/* COLUMNA IZQUIERDA (Configuración Glassmorphism) */}
          {/* ========================================== */}
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                  <Sparkles className="h-5 w-5"/>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Personalidad y reglas</h2>
                  <p className="text-sm text-slate-400">Da instrucciones claras para que la IA responda como tu marca.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Nombre del agente</label>
                  <input type="text" value={nombreAgente} onChange={(e) => setNombreAgente(e.target.value)} placeholder="Ej. Asistente Upway" className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none ring-0 transition focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Prompt maestro</label>
                  <textarea value={promptMaestro} onChange={(e) => setPromptMaestro(e.target.value)} placeholder="Escribe las reglas, tono, prohibiciones y estilo de respuesta..." className="h-40 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500" />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="h-5 w-5"/>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Base de conocimiento</h2>
                  <p className="text-sm text-slate-400">Conecta inventario, políticas y documentos para que el bot resuelva mejor.</p>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/dashboard/inventario'}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-10 text-sm font-semibold text-slate-400 transition hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
              >
                <ArrowRight className="h-4 w-4"/>
                Sincronizar inventario y documentos
              </button>
            </div>
          </div>

          {/* ========================================== */}
          {/* COLUMNA DERECHA (Simulador Premium Celular) */}
          {/* ========================================== */}
          <div className="flex flex-col items-center gap-6 lg:items-end">
            
            {/* CELULAR PREMIUM SIMULADOR */}
            <div className="relative flex h-[720px] w-full max-w-[340px] shrink-0 flex-col overflow-hidden rounded-[3.5rem] border-[14px] border-slate-950 bg-slate-950 shadow-[0_0_50px_rgba(37,99,235,0.15)] ring-1 ring-white/20">
              
              {/* Barra de Estado Superior */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex h-7 items-center justify-between px-6 text-[10px] font-medium text-white/70">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <Signal className="h-3 w-3" />
                  <Wifi className="h-3 w-3" />
                  <Battery className="h-4 w-4" />
                </div>
              </div>

              {/* Notch / Cámara del celular (Estilo iPhone) */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex h-7 justify-center">
                <div className="flex h-7 w-32 items-center justify-center gap-3 rounded-b-3xl bg-slate-950 px-3 shadow-md">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/10"></div>
                  <div className={`h-2 w-2 rounded-full transition-all duration-300 ${cargandoPrueba ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-[#00D1FF]/40 shadow-[0_0_8px_rgba(0,209,255,0.4)]'}`}></div>
                </div>
              </div>

              {/* Cabecera estilo WhatsApp Oscuro Premium */}
              <div className="relative z-40 flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 pb-3 pt-12 backdrop-blur-xl">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#00D1FF] to-blue-600 shadow-lg">
                  <Bot className="h-5 w-5 text-black" />
                  <span className="absolute bottom-0 right-0 z-20 h-3 w-3 rounded-full border-2 border-[#0A0E14] bg-green-500"></span>
                </div>
                <div>
                  <h3 className="flex items-center gap-1 font-display text-[14px] font-bold leading-tight text-white">
                    {nombreAgente || "Asistente Upway"} <Sparkles className="h-3 w-3 text-cyan-400" />
                  </h3>
                  <p className="mt-0.5 font-mono text-[10px] tracking-wide text-[#00D1FF]">Modo de prueba activo</p>
                </div>
              </div>

              {/* Área de Mensajes */}
              <div className="relative flex-1 space-y-4 overflow-y-auto bg-[#03050a] p-4 scroll-smooth scrollbar-hide">
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")' }}></div>
                
                <div className="relative z-10 space-y-4 pt-2">
                  {historialChat.length === 0 ? (
                    <div className="mt-20 flex h-full flex-col items-center justify-center px-4 text-center">
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
                        <div className="flex items-center gap-1.5 rounded-[20px] rounded-tl-[4px] border border-white/10 bg-white/[0.08] p-4 backdrop-blur-md">
                          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="h-1.5 w-1.5 rounded-full bg-[#00D1FF]" />
                          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-[#00D1FF]/70" />
                          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-[#00D1FF]/40" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input de Texto */}
              <div className="shrink-0 border-t border-white/5 bg-white/[0.02] p-4 pb-8 backdrop-blur-xl">
                <div className="relative flex items-center rounded-full border border-white/10 bg-white/[0.05] transition-all focus-within:border-[#00D1FF]/50">
                  <input 
                    value={mensajePrueba} 
                    onChange={(e) => setMensajePrueba(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && enviarMensajePrueba()}
                    placeholder="Prueba tu bot aquí..."
                    disabled={cargandoPrueba}
                    className="w-full bg-transparent py-3.5 pl-5 pr-12 text-[13px] text-white outline-none placeholder:text-white/30 disabled:opacity-50"
                  />
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={enviarMensajePrueba} 
                    disabled={cargandoPrueba || !mensajePrueba.trim()}
                    className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-[#00D1FF] p-2.5 text-black transition-colors hover:bg-cyan-400 disabled:bg-white/10 disabled:text-white/30"
                  >
                    <Send className="ml-0.5 h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* ========================================== */}
            {/* NUEVA BOTONERA PREMIUM                     */}
            {/* ========================================== */}
            <div className="flex w-full max-w-[340px] flex-col gap-3">
              
              {/* BOTÓN 1: GUARDAR */}
              <button 
                onClick={guardarConfiguracion} 
                disabled={guardando}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-800 px-6 py-3.5 font-bold text-white shadow-sm transition-all hover:bg-slate-700"
              >
                {guardando ? "Guardando..." : "💾 Guardar cambios"}
              </button>

              {/* BOTÓN 2: ACTIVAR */}
              <button 
                onClick={() => setMostrarPlanes(true)} 
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-blue-500"
              >
                🚀 Activar en WhatsApp
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            
            <div 
              className="absolute inset-0 cursor-pointer" 
              onClick={() => setMostrarPlanes(false)} 
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0E14] p-8 text-white shadow-2xl"
            >
              <button 
                onClick={() => setMostrarPlanes(false)}
                className="absolute right-6 top-6 rounded-full bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>

              <div className="mb-6 text-center md:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                  <Sparkles className="h-3.5 w-3.5"/>
                  Planes de Activación Oficial
                </div>
                <h2 className="mt-3 text-3xl font-bold">Escoge tu plan para conectar WhatsApp</h2>
                <p className="mt-2 text-sm text-gray-400">Despliega tu Empleado Digital 24/7 con pagos seguros vía Bold, Nequi o Bancolombia.</p>
              </div>

              <div className="my-8 grid gap-6 md:grid-cols-2">
                
                {/* TARJETA EMPRENDEDOR */}
                <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:bg-white/[0.05]">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Plan Emprendedor</span>
                    <h3 className="mt-2 text-3xl font-bold">$149.900 <span className="font-normal text-gray-400 text-sm">COP/mes</span></h3>
                    <p className="mb-5 mt-3 border-b border-white/10 pb-5 text-sm text-gray-400">Ideal para negocios que inician con atención automatizada básica.</p>
                    
                    <ul className="mb-6 space-y-3">
                      <li className="flex items-center gap-3 text-sm text-gray-300">
                        <Check className="h-5 w-5 shrink-0 text-cyan-400" /> Chatbot de texto 24/7
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-300">
                        <Check className="h-5 w-5 shrink-0 text-cyan-400" /> Reglas de personalidad básicas
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-300">
                        <Check className="h-5 w-5 shrink-0 text-cyan-400" /> Soporte por correo
                      </li>
                    </ul>
                  </div>
                  
                  <button 
                    onClick={() => iniciarPago('Plan Emprendedor', 149900)}
                    disabled={procesandoPago}
                    className="mt-4 w-full rounded-xl bg-white/10 py-3.5 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
                  >
                    {procesandoPago ? 'Conectando con Bold...' : 'Seleccionar Emprendedor'}
                  </button>
                </div>

                {/* TARJETA NEGOCIO (Upselling) */}
                <div className="relative flex flex-col justify-between rounded-3xl border-2 border-cyan-500/50 bg-gradient-to-b from-blue-900/40 to-[#0A0E14] p-6 shadow-[0_0_30px_rgba(0,209,255,0.15)]">
                  <span className="absolute -top-3 right-6 rounded-full bg-cyan-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black shadow-lg">Más popular</span>
                  
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Plan Negocio</span>
                    <h3 className="mt-2 text-3xl font-bold">$299.900 <span className="font-normal text-gray-400 text-sm">COP/mes</span></h3>
                    <p className="mb-5 mt-3 border-b border-white/10 pb-5 text-sm text-gray-400">La experiencia completa con IA avanzada e integración de multimedia.</p>
                    
                    <ul className="mb-6 space-y-3">
                      <li className="flex items-center gap-3 text-sm font-medium text-white">
                        <Check className="h-5 w-5 shrink-0 text-cyan-400" /> <b>Todo lo del Plan Emprendedor</b>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-200">
                        <Check className="h-5 w-5 shrink-0 text-cyan-400" /> Procesamiento de <b>notas de voz</b>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-200">
                        <Check className="h-5 w-5 shrink-0 text-cyan-400" /> Lectura de <b>imágenes y recibos</b>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-200">
                        <Check className="h-5 w-5 shrink-0 text-cyan-400" /> Toma de pedidos 100% automática
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-200">
                        <Check className="h-5 w-5 shrink-0 text-cyan-400" /> Conexión con base de inventario
                      </li>
                    </ul>
                  </div>
                  
                  <button 
                    onClick={() => iniciarPago('Plan Negocio', 299900)}
                    disabled={procesandoPago}
                    className="mt-4 w-full rounded-xl bg-cyan-500 py-3.5 text-sm font-bold text-black shadow-lg transition hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {procesandoPago ? 'Conectando con Bold...' : 'Seleccionar Negocio'}
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