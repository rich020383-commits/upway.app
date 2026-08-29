"use client";

import React, { useState, useEffect } from 'react';
import { BrainCircuit, ArrowRight, Sparkles, MessageSquare } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    // 🔥 EL CASCARÓN: h-full y flex-col congelan la pantalla general
    <div className="flex flex-col h-full w-full relative bg-transparent text-[#F5F7FA]">
      
      {/* Botón de Saltar */}
      <div className="absolute top-4 right-4 md:top-6 md:right-8 z-50">
        <Link 
          href="/dashboard" 
          className="text-xs md:text-sm font-semibold text-[#8994A6] hover:text-[#19C8E8] flex items-center gap-2 bg-[#1E293B]/30 hover:bg-[#1E293B] px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all duration-300 border border-[#1E293B]/50 hover:border-[#19C8E8]/30"
        >
          Ir al Panel
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* 🔥 EL RESORTE CENTRAL: Distribuye el espacio verticalmente */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-4 mt-8 md:mt-2 flex flex-col justify-center overflow-y-auto no-scrollbar">
        
        {/* Barra de progreso / Narrativa */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 text-[#8994A6] text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-4 md:mb-6">
            <span>Configuración de tu agente</span>
            <span className="w-1 h-1 rounded-full bg-[#8994A6]"></span>
            <span className="text-[#F5F7FA]">02 / 05</span>
          </div>
          
          <div className="flex gap-2 mb-6 md:mb-8">
            <div className="h-1 flex-1 bg-[#9B5CFF] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#9B5CFF] rounded-full shadow-[0_0_15px_rgba(155,92,255,0.5)]"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <BrainCircuit className="text-[#9B5CFF] h-6 w-6 md:h-8 md:w-8" />
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Personalidad y Tono</h1>
          </div>
          <p className="text-[#8994A6] text-xs md:text-base max-w-2xl">
            Define la actitud exacta con la que tu asistente interactuará con tus clientes en cada conversación.
          </p>
        </div>

        {/* Layout Principal: Sliders + Live Preview */}
        <div className="grid lg:grid-cols-3 gap-5 md:gap-6 pb-4">
          
          {/* Contenedor de Sliders */}
          <div className="lg:col-span-2 bg-[#0D1117] border border-[#1E293B] rounded-2xl p-5 md:p-6 space-y-5 md:space-y-6">
            {sliders.map((slider) => {
              const valorActual = tonoWhatsapp[slider.key as keyof typeof tonoWhatsapp] ?? 50;
              return (
                <div key={slider.key} className="space-y-2 md:space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs md:text-sm font-semibold text-[#F5F7FA]">{slider.label}</label>
                    <span className="text-[#9B5CFF] font-mono bg-[#9B5CFF]/10 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold border border-[#9B5CFF]/20">
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
                  
                  <div className="flex justify-between text-[10px] md:text-[11px] text-[#8994A6] uppercase tracking-widest font-medium">
                    <span>{slider.min}</span>
                    <span>{slider.max}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tarjeta de Previsualización en Vivo */}
          <div className="lg:col-span-1">
            <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-5 md:p-6 shadow-xl flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 md:mb-4 md:pb-3 border-b border-[#1E293B]">
                  <Sparkles className="h-4 w-4 text-[#9B5CFF]" />
                  <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-[#8994A6]">Preview de Tono</h3>
                </div>
                <p className="text-[11px] md:text-xs text-[#8994A6] mb-3">Así responderá tu agente:</p>
                
                <div className="bg-[#07090C] border border-[#1E293B] rounded-xl p-3.5 md:p-4 text-xs md:text-sm text-[#F5F7FA] leading-relaxed italic">
                  "{getPreviewText()}"
                </div>
              </div>

              <div className="mt-4 pt-3 md:mt-6 md:pt-4 border-t border-[#1E293B] flex items-center gap-2 text-[10px] md:text-xs text-[#8994A6]">
                <MessageSquare size={14} className="text-[#9B5CFF]" /> Actualización en tiempo real
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 🔥 BARRA INFERIOR: Anclada (shrink-0) */}
      <div className="shrink-0 w-full bg-[#07090C]/90 backdrop-blur-xl border-t border-[#1E293B] px-6 py-4 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-[#8994A6] text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-1">
              Paso 2 completado
            </p>
            <p className="text-base md:text-lg font-bold text-[#F5F7FA]">
              Personalidad calibrada
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/onboarding/personalizacion')}
            className="bg-[#F5F7FA] text-[#07090C] px-6 py-2.5 md:px-8 md:py-3.5 rounded-xl font-bold hover:bg-[#E2E8F0] transition-colors flex items-center gap-2 text-sm md:text-base"
          >
            Continuar <ArrowRight size={18} />
          </button>
        </div>
      </div>

    </div>
  );
}