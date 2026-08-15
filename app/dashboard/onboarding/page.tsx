"use client";

import React from 'react';
import { TrendingUp, MessageSquare, CalendarCheck, Wallet, Sparkles, ArrowRight } from 'lucide-react';
import { useUpwayStore } from '../../store/upwayStore';
import { useRouter } from 'next/navigation';

export default function Paso01Descubrimiento() {
  const router = useRouter();
  
  // Conectamos con nuestro Cerebro Temporal (Zustand)
  const objetivoSeleccionado = useUpwayStore((state) => state.objetivoPrincipal);
  const setObjetivo = useUpwayStore((state) => state.setObjetivoPrincipal);

  const metas = [
    {
      id: 'ventas',
      titulo: 'Multiplicar mis ventas y captar leads.',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-indigo-400',
      glow: 'group-hover:shadow-[0_0_40px_rgba(99,102,241,0.2)]'
    },
    {
      id: 'atencion',
      titulo: 'Automatizar mi atención al cliente 24/7.',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'text-purple-400',
      glow: 'group-hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]'
    },
    {
      id: 'agenda',
      titulo: 'Agendar citas, reservas o reuniones.',
      icon: <CalendarCheck className="w-6 h-6" />,
      color: 'text-fuchsia-400',
      glow: 'group-hover:shadow-[0_0_40px_rgba(217,70,239,0.2)]'
    },
    {
      id: 'cobros',
      titulo: 'Cobrar carteras o hacer recordatorios.',
      icon: <Wallet className="w-6 h-6" />,
      color: 'text-violet-400',
      glow: 'group-hover:shadow-[0_0_40px_rgba(139,92,246,0.2)]'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col relative overflow-hidden font-sans">
      
      {/* =========================================
          EL SPARK: NÚCLEO ENERGÉTICO (Dark + Spark)
          ========================================= */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className={`transition-all duration-1000 ease-out ${
          objetivoSeleccionado 
            ? 'w-[800px] h-[800px] bg-purple-600/20 blur-[150px]' 
            : 'w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] animate-pulse'
        } rounded-full`} />
      </div>

      {/* HEADER MINIMALISTA */}
      <header className="w-full p-8 flex justify-between items-center relative z-10">
        <div className="text-2xl font-bold tracking-widest text-white/90">UPWAY</div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span>01 Descubrimiento</span>
        </div>
      </header>

      {/* CONTENIDO CENTRAL */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 -mt-20">
        
        <div className="text-center max-w-2xl mb-16">
          <p className="text-lg text-purple-300/80 mb-4 font-light tracking-wide">
            Sea cual sea tu negocio,
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-white mb-6">
            ¿Qué quieres que la <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Inteligencia Artificial</span> resuelva por ti hoy?
          </h1>
        </div>

        {/* GRID DE UNIVERSOS VISUALES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-6xl">
          {metas.map((meta) => (
            <button
              key={meta.id}
              onClick={() => setObjetivo(meta.id)}
              className={`group text-left relative p-8 h-64 rounded-[32px] border transition-all duration-500 overflow-hidden backdrop-blur-md flex flex-col justify-between
                ${objetivoSeleccionado === meta.id 
                  ? 'border-purple-500/50 bg-purple-900/20 scale-[1.02] shadow-[0_0_50px_rgba(168,85,247,0.15)]' 
                  : 'border-white/5 bg-[#0A0A0F]/80 hover:bg-[#12121A] hover:border-white/10'
                } ${meta.glow}`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ${meta.color}`}>
                {meta.icon}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-slate-200 leading-snug group-hover:text-white transition-colors">
                  {meta.titulo}
                </h3>
                
                {/* Micro-interacción: Flecha que aparece/se mueve */}
                <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all duration-300 ${
                  objetivoSeleccionado === meta.id ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'text-slate-500 group-hover:text-white group-hover:border-white/30'
                }`}>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* BOTÓN DE AVANCE (Mágico) */}
        <div className={`absolute bottom-12 transition-all duration-700 ease-in-out ${
          objetivoSeleccionado ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}>
          <button 
            onClick={() => router.push('/dashboard/onboarding/lienzo')}
            className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-slate-200 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] cursor-pointer"
          >
            <Sparkles className="h-5 w-5 text-purple-600" />
            Construir mi Sistema
          </button>
        </div>

      </main>
    </div>
  );
}