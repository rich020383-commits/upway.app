"use client";

import React, { useState, useEffect } from 'react';
import { Store, Mic2, ArrowRight, Terminal, User, Sparkles } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore'; // Ajusta la ruta si es necesario
import { useRouter } from 'next/navigation';

export default function Paso03Personalizacion() {
  const router = useRouter();
  const { 
    nombreAgente, setNombreAgente, 
    nicho, setNicho, 
    promptMaestro, setPromptMaestro,
    vozSeleccionada, setVozSeleccionada,
    modulosSeleccionados
  } = useUpwayStore();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // Generador dinámico del mensaje de prueba
  const getMensajePrueba = () => {
    const nombre = nombreAgente.trim() || 'tu asistente virtual';
    let empresa = 'nuestra empresa';
    if (nicho === 'restaurante') empresa = 'nuestro restaurante';
    if (nicho === 'ferreteria') empresa = 'la ferretería';
    
    return `Hola, soy ${nombre} de ${empresa}. Estoy aquí para ayudarte a gestionar tus pedidos, agendar citas o resolver cualquier duda que tengas. ¿En qué te puedo colaborar hoy?`;
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-[#07090C] text-[#F5F7FA] pb-32 font-sans selection:bg-[#9B5CFF] selection:text-[#07090C]">
      
      <div className="max-w-6xl mx-auto px-6 pt-12 md:pt-20">
        
        {/* Barra de progreso / Narrativa */}
        <div className="mb-12">
          <div className="flex items-center gap-3 text-[#8994A6] text-xs font-semibold tracking-widest uppercase mb-6">
            <span>Configuración de tu agente</span>
            <span className="w-1 h-1 rounded-full bg-[#8994A6]"></span>
            <span className="text-[#F5F7FA]">03 / 05</span>
          </div>
          
          <div className="flex gap-2 mb-10 max-w-4xl">
            <div className="h-1 flex-1 bg-[#9B5CFF] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#9B5CFF] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#9B5CFF] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Identidad del Agente</h1>
          <p className="text-[#8994A6] text-lg max-w-2xl">
            Bautiza a tu empleado digital y define su marco operativo. Esta será la cara visible frente a tus clientes.
          </p>
        </div>

        {/* Layout de dos columnas: Configuración + Preview */}
        <div className="grid lg:grid-cols-5 gap-10">
          
          {/* COLUMNA IZQUIERDA: Formulario */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Card: Perfil Básico */}
            <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-8">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <User className="text-[#9B5CFF] h-5 w-5" /> Perfil Público
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#8994A6] mb-2 uppercase tracking-wider text-xs">Nombre del Asistente</label>
                  <input 
                    type="text" 
                    value={nombreAgente} 
                    onChange={(e) => setNombreAgente(e.target.value)} 
                    placeholder="Ej. Sofía" 
                    className="w-full rounded-xl border border-[#1E293B] bg-[#07090C] px-4 py-3.5 text-sm text-[#F5F7FA] placeholder-[#8994A6]/50 outline-none transition-all focus:border-[#9B5CFF] focus:ring-1 focus:ring-[#9B5CFF]" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#8994A6] mb-2 uppercase tracking-wider text-xs">Industria</label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8994A6]" />
                    <select 
                      value={nicho} 
                      onChange={(e) => setNicho(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#1E293B] bg-[#07090C] pl-10 pr-4 py-3.5 text-sm text-[#F5F7FA] outline-none transition-all focus:border-[#9B5CFF] focus:ring-1 focus:ring-[#9B5CFF] cursor-pointer"
                    >
                      <option value="general">Empresa General (Servicios)</option>
                      <option value="restaurante">Restaurante / Comidas</option>
                      <option value="ferreteria">Ferretería / Construcción</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Voz (Condicional) */}
            {modulosSeleccionados.includes('voz') && (
              <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-8">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Mic2 className="text-[#9B5CFF] h-5 w-5" /> Síntesis de Voz
                </h3>
                <label className="block text-sm font-medium text-[#8994A6] mb-3 uppercase tracking-wider text-xs">Género de la IA Telefónica</label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setVozSeleccionada('femenina')}
                    className={`flex-1 py-3.5 rounded-xl border transition-all font-medium text-sm ${
                      vozSeleccionada === 'femenina' 
                        ? 'bg-[#9B5CFF]/10 border-[#9B5CFF] text-[#9B5CFF]' 
                        : 'bg-[#07090C] border-[#1E293B] text-[#8994A6] hover:border-[#8994A6]/50'
                    }`}
                  >
                    Femenina
                  </button>
                  <button 
                    onClick={() => setVozSeleccionada('masculina')}
                    className={`flex-1 py-3.5 rounded-xl border transition-all font-medium text-sm ${
                      vozSeleccionada === 'masculina' 
                        ? 'bg-[#9B5CFF]/10 border-[#9B5CFF] text-[#9B5CFF]' 
                        : 'bg-[#07090C] border-[#1E293B] text-[#8994A6] hover:border-[#8994A6]/50'
                    }`}
                  >
                    Masculina
                  </button>
                </div>
              </div>
            )}

            {/* Card: Instrucciones Maestro */}
            <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Terminal className="text-[#9B5CFF] h-5 w-5" /> Core Operativo
                </h3>
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#9B5CFF] bg-[#9B5CFF]/10 px-2 py-1 rounded-md border border-[#9B5CFF]/20">Prompt Maestro</span>
              </div>
              <label className="block text-sm font-medium text-[#8994A6] mb-2 uppercase tracking-wider text-xs">Instrucciones de comportamiento</label>
              <textarea 
                value={promptMaestro} 
                onChange={(e) => setPromptMaestro(e.target.value)} 
                placeholder="Ej: Eres un vendedor experto. Tu objetivo es agendar citas, responder amablemente y nunca ofrecer descuentos no autorizados..." 
                className="h-40 w-full resize-none rounded-xl border border-[#1E293B] bg-[#07090C] px-4 py-3.5 text-sm text-[#F5F7FA] placeholder-[#8994A6]/50 outline-none transition-all focus:border-[#9B5CFF] focus:ring-1 focus:ring-[#9B5CFF]" 
              />
            </div>

          </div>

          {/* COLUMNA DERECHA: Live Preview (El toque Premium) */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 bg-[#0D1117] border border-[#1E293B] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-6 border-b border-[#1E293B] pb-4">
                <Sparkles className="h-4 w-4 text-[#9B5CFF]" />
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[#8994A6]">Vista Previa</h3>
              </div>
              
              {/* Mockup de Chat */}
              <div className="bg-[#07090C] border border-[#1E293B]/50 rounded-xl p-4 min-h-[200px] flex flex-col justify-end">
                <div className="flex gap-3 items-end">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9B5CFF] to-[#19C8E8] flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-[#1E293B]/50 border border-[#1E293B] rounded-2xl rounded-bl-none p-4 text-sm text-[#F5F7FA] leading-relaxed shadow-sm">
                    {getMensajePrueba()}
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-[#8994A6]">Así interactuará {nombreAgente || 'tu IA'} con tus clientes.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Barra Inferior Persistente */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#07090C]/80 backdrop-blur-xl border-t border-[#1E293B] p-6 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-[#8994A6] text-xs font-semibold uppercase tracking-wider mb-1">
              Paso 3 completado
            </p>
            <p className="text-lg font-bold text-[#F5F7FA]">
              Identidad configurada
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/onboarding/conocimiento')}
            disabled={!nombreAgente.trim()}
            className="bg-[#F5F7FA] text-[#07090C] px-8 py-3.5 rounded-xl font-bold hover:bg-[#E2E8F0] transition-colors disabled:opacity-20 flex items-center gap-2"
          >
            Continuar <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </main>
  );
}