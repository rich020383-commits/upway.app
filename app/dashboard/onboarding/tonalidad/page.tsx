"use client";

import React from 'react';
import { BrainCircuit, ArrowRight, Sparkles, MessageSquare } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Paso02Tonalidad() {
  const router = useRouter();
  const { tonoWhatsapp, setTonoWhatsapp } = useUpwayStore();

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

  return (
    <div className="relative flex h-full w-full flex-col bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#edf4ff_100%)] text-slate-900">
      
      <div className="absolute top-4 right-4 z-50 md:top-6 md:right-8">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#93c5fd] hover:text-[#1b5ed6] md:px-5 md:py-2.5 md:text-sm"
        >
          Ir al Panel
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
 
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center overflow-y-auto px-6 py-4 pt-12 md:mt-2 md:pt-10 no-scrollbar">
        
        <div className="mb-6 md:mb-8">
          <div className="mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 md:mb-6 md:text-xs">
            <span>Configuración de tu agente</span>
            <span className="h-1 w-1 rounded-full bg-slate-400"></span>
            <span className="text-slate-900">02 / 05</span>
          </div>
          
          <div className="mb-6 flex gap-2 md:mb-8">
            <div className="h-1 flex-1 rounded-full bg-[#1b5ed6]"></div>
            <div className="h-1 flex-1 rounded-full bg-[#1b5ed6]"></div>
            <div className="h-1 flex-1 rounded-full bg-slate-200"></div>
            <div className="h-1 flex-1 rounded-full bg-slate-200"></div>
            <div className="h-1 flex-1 rounded-full bg-slate-200"></div>
          </div>
 
          <div className="mb-2 flex items-center gap-3">
            <BrainCircuit className="h-6 w-6 text-[#1b5ed6] md:h-8 md:w-8" />
            <h1 className="text-2xl font-black tracking-[-0.05em] text-slate-900 md:text-4xl">Personalidad y Tono</h1>
          </div>
          <p className="max-w-2xl text-xs text-slate-600 md:text-base">
            Define la actitud exacta con la que tu asistente interactuará con tus clientes en cada conversación.
          </p>
        </div>

        <div className="grid gap-5 pb-4 lg:grid-cols-3 md:gap-6">
          
          <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.04)] md:p-6 md:space-y-6 lg:col-span-2">
            {sliders.map((slider) => {
              const valorActual = tonoWhatsapp[slider.key as keyof typeof tonoWhatsapp] ?? 50;
              return (
                <div key={slider.key} className="space-y-2 md:space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-800 md:text-sm">{slider.label}</label>
                    <span className="rounded-full border border-[#dfeaff] bg-[#edf4ff] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#1b5ed6] md:px-3 md:py-1 md:text-xs">
                      {valorActual}%
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={valorActual}
                    onChange={(e) => setTonoWhatsapp({ [slider.key]: parseInt(e.target.value) })}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-100 accent-[#1b5ed6]"
                  />
                  
                  <div className="flex justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500 md:text-[11px]">
                    <span>{slider.min}</span>
                    <span>{slider.max}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="flex h-full flex-col justify-between rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.04)] md:p-6">
              <div>
                <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 md:mb-4 md:pb-3">
                  <Sparkles className="h-4 w-4 text-[#1b5ed6]" />
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 md:text-xs">Preview de Tono</h3>
                </div>
                <p className="mb-3 text-[11px] text-slate-500 md:text-xs">Así responderá tu agente:</p>
                
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed italic text-slate-800 md:p-4 md:text-sm">
                  &ldquo;{getPreviewText()}&rdquo;
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-3 text-[10px] text-slate-500 md:mt-6 md:pt-4 md:text-xs">
                <MessageSquare size={14} className="text-[#1b5ed6]" /> Actualización en tiempo real
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="z-40 w-full shrink-0 border-t border-slate-200 bg-white/85 px-6 py-4 backdrop-blur-xl shadow-[0_-12px_35px_rgba(15,23,42,0.04)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 md:text-xs">
              Paso 2 completado
            </p>
            <p className="text-base font-black tracking-[-0.04em] text-slate-900 md:text-lg">
              Personalidad calibrada
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/onboarding/personalizacion')}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 md:px-8 md:py-3.5"
          >
            Continuar <ArrowRight size={18} />
          </button>
        </div>
      </div>

    </div>
  );
}