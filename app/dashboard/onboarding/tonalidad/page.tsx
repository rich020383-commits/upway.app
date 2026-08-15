"use client";

import React from 'react';
import { Bot, ArrowRight, BrainCircuit } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter } from 'next/navigation';

export default function Paso03Tonalidad() {
  const router = useRouter();
  const { tonoWhatsapp, setTonoWhatsapp } = useUpwayStore();

  const sliders = [
    { key: 'formalidad', label: 'Formalidad', min: 'Casual', max: 'Profesional' },
    { key: 'cercania', label: 'Cercanía', min: 'Distante', max: 'Amigable' },
    { key: 'persuasion', label: 'Persuasión', min: 'Informativo', max: 'Vendedor' },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white p-8 md:p-16 flex flex-col items-center">
      <header className="w-full max-w-2xl mb-12">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-white mb-6">← Volver</button>
        <div className="flex items-center gap-3 mb-4">
          <BrainCircuit className="text-purple-400" />
          <h1 className="text-3xl font-bold">Ajusta la personalidad</h1>
        </div>
        <p className="text-slate-400">Define cómo debe sonar tu asistente al hablar con tus clientes.</p>
      </header>

      <div className="w-full max-w-2xl space-y-12 bg-white/[0.02] border border-white/10 p-10 rounded-[32px] backdrop-blur-xl">
        {sliders.map((slider) => (
          <div key={slider.key} className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-lg font-medium">{slider.label}</label>
              <span className="text-purple-400 font-mono bg-purple-500/10 px-3 py-1 rounded-full text-sm">
                {tonoWhatsapp[slider.key as keyof typeof tonoWhatsapp]}%
              </span>
            </div>
            
            <input
              type="range"
              min="0"
              max="100"
              value={tonoWhatsapp[slider.key as keyof typeof tonoWhatsapp]}
              onChange={(e) => setTonoWhatsapp({ [slider.key]: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-xs text-slate-500 uppercase tracking-widest font-semibold">
              <span>{slider.min}</span>
              <span>{slider.max}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 w-full bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-white/10 p-6 flex justify-center items-center">
        <button 
          onClick={() => router.push('/dashboard/onboarding/personalizacion')}
          className="bg-white text-black px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
        >
          Guardar identidad <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}