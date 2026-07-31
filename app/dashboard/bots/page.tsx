"use client";

import React, { useState } from 'react';
import { Bot, MessageCircleMore, Sparkles, ShieldCheck, ArrowRight, Send } from 'lucide-react';

export default function AgentesBotPage() {
  const [nombreAgente, setNombreAgente] = useState('');
  const [promptMaestro, setPromptMaestro] = useState('');
  const [guardando, setGuardando] = useState(false);
  
  // Estados para el Simulador
  const [mensajePrueba, setMensajePrueba] = useState('');
  const [historialChat, setHistorialChat] = useState<{rol: string, texto: string}[]>([]);
  const [cargandoPrueba, setCargandoPrueba] = useState(false);

  // Guardar en la Base de Datos
  const guardarConfiguracion = async () => {
    if (!nombreAgente || !promptMaestro) {
      alert('Completa el nombre del agente y las reglas antes de guardar.');
      return;
    }

    setGuardando(true);
    try {
      const datosParaBackend = {
        tienda_id: '1172769935927318', // O tu ID real
        nombre: nombreAgente,
        reglas: promptMaestro,
      };

      const respuesta = await fetch('/api/tienda/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaBackend),
      });

      if (respuesta.ok) {
        alert('El agente quedó configurado correctamente.');
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
        body: JSON.stringify({ promptMaestro, mensajeUsuario: mensajeEnviado })
      });

      const data = await res.json();
      setHistorialChat([...nuevoHistorial, { rol: 'ia', texto: data.respuesta }]);
    } catch (error) {
      console.error(error);
      setHistorialChat([...nuevoHistorial, { rol: 'ia', texto: '⚠️ Error de conexión con el simulador.' }]);
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
            <button className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              <MessageCircleMore className="h-4 w-4"/>
              Activar WhatsApp
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          
          {/* COLUMNA IZQUIERDA */}
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
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm font-semibold text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700">
                <ArrowRight className="h-4 w-4"/>
                Sincronizar inventario y documentos
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="flex flex-col gap-6">
            <div className="flex-1 rounded-[28px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-premium flex flex-col h-[500px]">
              
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300">
                  <MessageCircleMore className="h-5 w-5"/>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Simulador de pruebas</h2>
                  <p className="text-sm text-slate-400">Prueba tu bot antes de activarlo.</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                {historialChat.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <p className="text-sm font-medium text-slate-300">Modo de prueba activo 🧪</p>
                    <p className="mt-2 text-xs text-slate-500">Escribe en el cuadro de abajo para probar cómo responde tu agente usando el Prompt Maestro que definiste.</p>
                  </div>
                ) : (
                  historialChat.map((msg, index) => (
                    <div key={index} className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm max-w-[85%] ${msg.rol === 'usuario' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                        {msg.texto}
                      </div>
                    </div>
                  ))
                )}
                
                {cargandoPrueba && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl px-4 py-2.5 text-sm bg-slate-800 text-slate-400 animate-pulse">
                      Escribiendo...
                    </div>
                  </div>
                )}
              </div>

              <div className="relative mt-auto">
                <input 
                  type="text" 
                  value={mensajePrueba}
                  onChange={(e) => setMensajePrueba(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && enviarMensajePrueba()}
                  placeholder="Ej: Hola, ¿qué vendes?"
                  className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-4 pr-12 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:bg-white/10"
                />
                <button 
                  onClick={enviarMensajePrueba}
                  disabled={cargandoPrueba || !mensajePrueba.trim()}
                  className="absolute right-1 top-1 bottom-1 flex w-10 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  <Send className="h-4 w-4"/>
                </button>
              </div>
            </div>

            <button 
              onClick={guardarConfiguracion} 
              disabled={guardando} 
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-4 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70 shadow-lg shadow-blue-500/30"
            >
              {guardando ? 'Guardando en Base de Datos...' : 'Guardar y activar bot'}
              <ArrowRight className="h-5 w-5"/>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}