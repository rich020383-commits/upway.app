"use client";

import React, { useState, useEffect } from 'react';
import { BrainCircuit, ArrowRight, Sparkles, MessageSquare } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore'; // Ajusta la ruta si es necesario
import { useRouter } from 'next/navigation';

export default function Paso02Tonalidad() {
  const router = useRouter();
  const { tonoWhatsapp, setTonoWhatsapp } = useUpwayStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const sliders = [
    { key: 'formalidad', label: 'Formalidad', min: 'Casual', max: 'Profesional' },
    { key: 'cercania', label: 'Cercanía', min: 'Distante', max: 'Amigable' },
    { key: 'persuasion', label: 'Persuasión', min: 'Informativo', max: 'Vendedor' },
  ];

  // Generador dinámico del preview de texto según los sliders
  const getPreviewText = () => {
    const formal = tonoWhatsapp.formalidad ?? 50;
    const cercano = tonoWhatsapp.cercania ?? 50;
    const vendedor = tonoWhatsapp.persuasion ?? 50;

    if (formal > 70 && vendedor > 70) {
      return "Estimado cliente, es un placer saludarle. Contamos con disponibilidad inmediata para su proyecto con las mejores condiciones. ¿Desea que agendemos una asesoría?";
    } else if (cercano > 70 && vendedor > 70) {
      return "¡Hola! Qué gusto saludarte 😊. Tenemos unas opciones increíbles listas para ti hoy. ¿Te ayudo a asegurar tu cupo de una vez?";
    } else if (formal < 40) {
      return "¡Buenas! Claro que sí, por aquí te ayudo con eso de una. ¿Qué necesitas saber exactamente?";
    }
    return "Hola. Claro que sí, puedo ayudarte con eso. Tenemos disponibilidad para mañana a las 3:00 p. m. ¿Quieres que reservemos el espacio?";
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-[#07090C] text-[#F5F7FA] pb-32 font-sans selection:bg-[#9B5CFF] selection:text-[#07090C]">
      
      <div className="max-w-4xl mx-auto px-6 pt-12 md:pt-20">
        
        {/* Barra de progreso / Narrativa */}
        <div className="mb-12">
          <div className="flex items-center gap-3 text-[#8994A6] text-xs font-semibold tracking-widest uppercase mb-6">
            <span>Configuración de tu agente</span>
            <span className="w-1 h-1 rounded-full bg-[#8994A6]"></span>
            <span className="text-[#F5F7FA]">02 / 05</span>
          </div>
          
          <div className="flex gap-2 mb-10">
            <div className="h-1 flex-1 bg-[#9B5CFF] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#9B5CFF] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <BrainCircuit className="text-[#9B5CFF] h-8 w-8" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Personalidad y Tono</h1>
          </div>
          <p className="text-[#8994A6] text-lg max-w-2xl">
            Define la actitud exacta con la que tu asistente interactuará con tus clientes en cada conversación.
          </p>
        </div>

        {/* Layout Principal: Sliders + Live Preview */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Contenedor de Sliders */}
          <div className="lg:col-span-2 bg-[#0D1117] border border-[#1E293B] rounded-2xl p-8 space-y-8">
            {sliders.map((slider) => {
              const valorActual = tonoWhatsapp[slider.key as keyof typeof tonoWhatsapp] ?? 50;
              return (
                <div key={slider.key} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-[#F5F7FA]">{slider.label}</label>
                    <span className="text-[#9B5CFF] font-mono bg-[#9B5CFF]/10 px-3 py-1 rounded-full text-xs font-bold border border-[#9B5CFF]/20">
                      {valorActual}%
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={valorActual}
                    onChange={(e) => setTonoWhatsapp({ [slider.key]: parseInt(e.target.value) })}
                    className="w-full h-2 bg-[#07090C] rounded-lg appearance-none cursor-pointer accent-[#9B5CFF] border border-[#1E293B]"
                  />
                  
                  <div className="flex justify-between text-[11px] text-[#8994A6] uppercase tracking-widest font-medium">
                    <span>{slider.min}</span>
                    <span>{slider.max}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tarjeta de Previsualización en Vivo */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-[#0D1117] border border-[#1E293B] rounded-2xl p-6 shadow-xl flex flex-col justify-between h-full min-h-[300px]">
              <div>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1E293B]">
                  <Sparkles className="h-4 w-4 text-[#9B5CFF]" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[#8994A6]">Preview de Tono</h3>
                </div>
                <p className="text-xs text-[#8994A6] mb-4">Así responderá tu agente:</p>
                
                <div className="bg-[#07090C] border border-[#1E293B] rounded-xl p-4 text-sm text-[#F5F7FA] leading-relaxed italic">
                  "{getPreviewText()}"
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1E293B] flex items-center gap-2 text-xs text-[#8994A6]">
                <MessageSquare size={14} className="text-[#9B5CFF]" /> Actualización en tiempo real
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Barra Inferior Persistente */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#07090C]/80 backdrop-blur-xl border-t border-[#1E293B] p-6 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-[#8994A6] text-xs font-semibold uppercase tracking-wider mb-1">
              Paso 2 completado
            </p>
            <p className="text-lg font-bold text-[#F5F7FA]">
              Personalidad calibrada
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/onboarding/personalizacion')}
            className="bg-[#F5F7FA] text-[#07090C] px-8 py-3.5 rounded-xl font-bold hover:bg-[#E2E8F0] transition-colors flex items-center gap-2"
          >
            Continuar <ArrowRight size={18} />
          </button>
        </div>
      </div>

    </main>
  );
}