"use client";

import React from 'react';
import { Bot, Sparkles, Store, Mic2 } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter } from 'next/navigation';

export default function Paso03Personalizacion() {
  const router = useRouter();
  const { 
    nombreAgente, setNombreAgente, 
    nicho, setNicho, 
    promptMaestro, setPromptMaestro,
    vozSeleccionada, setVozSeleccionada, // Usando tu variable real
    modulosSeleccionados
  } = useUpwayStore();

  return (
    <div className="min-h-screen bg-[#050508] text-white p-8 md:p-16 flex flex-col items-center">
      
      <header className="w-full max-w-3xl mb-12">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-white mb-6">← Volver</button>
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm font-semibold text-purple-400 mb-4">
          <Sparkles className="h-4 w-4"/> Identidad
        </div>
        <h1 className="text-3xl font-bold mb-2">Dale vida a tu IA</h1>
        <p className="text-slate-400">Bautiza a tu empleado digital y define sus reglas comerciales.</p>
      </header>

      <div className="w-full max-w-3xl space-y-6 bg-white/[0.02] border border-white/10 p-8 rounded-[32px] backdrop-blur-xl mb-24">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Nombre de tu Asistente</label>
            <input 
              type="text" 
              value={nombreAgente} 
              onChange={(e) => setNombreAgente(e.target.value)} 
              placeholder="Ej. Sofía de Ferretería XY" 
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-purple-500 focus:bg-slate-900" 
            />
          </div>
          
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Industria o Sector</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select 
                value={nicho} 
                onChange={(e) => setNicho(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-900/60 pl-10 pr-4 py-3 text-sm text-white outline-none transition focus:border-purple-500 focus:bg-slate-900 cursor-pointer"
              >
                <option value="general" className="bg-slate-900">Empresa General (Servicios)</option>
                <option value="restaurante" className="bg-slate-900">Restaurante / Comidas</option>
                <option value="ferreteria" className="bg-slate-900">Ferretería / Construcción</option>
              </select>
            </div>
          </div>
        </div>

        {/* SELECTOR DE GÉNERO DE VOZ (Solo aparece si compró el módulo telefónico) */}
        {modulosSeleccionados.includes('voz') && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300 flex items-center gap-2">
              <Mic2 size={16} className="text-cyan-400" /> Género de la Voz Telefónica
            </label>
            <div className="flex gap-4">
              <button 
                onClick={() => setVozSeleccionada('femenina')}
                className={`flex-1 py-3 rounded-2xl border transition-all ${vozSeleccionada === 'femenina' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold' : 'bg-slate-900/60 border-white/10 text-slate-400 hover:border-white/30'}`}
              >
                Mujer
              </button>
              <button 
                onClick={() => setVozSeleccionada('masculina')}
                className={`flex-1 py-3 rounded-2xl border transition-all ${vozSeleccionada === 'masculina' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold' : 'bg-slate-900/60 border-white/10 text-slate-400 hover:border-white/30'}`}
              >
                Hombre
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300 flex justify-between items-center">
            <span>Instrucciones Operativas (Prompt Maestro)</span>
            <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/25">IA Brain</span>
          </label>
          <textarea 
            value={promptMaestro} 
            onChange={(e) => setPromptMaestro(e.target.value)} 
            placeholder="Ej: Eres un vendedor experto. Tu objetivo es agendar citas y responder amablemente..." 
            className="h-40 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-purple-500 focus:bg-slate-900" 
          />
        </div>
      </div>

      <div className="fixed bottom-0 w-full bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-white/10 p-6 flex justify-center items-center z-50">
        <button 
          onClick={() => router.push('/dashboard/onboarding/conocimiento')}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-[0_0_30px_rgba(168,85,247,0.3)] flex items-center gap-2 cursor-pointer"
        >
          <Bot className="h-5 w-5" />
          Continuar a Base de Conocimiento
        </button>
      </div>
    </div>
  );
}