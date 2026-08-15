"use client";

import React, { useMemo } from 'react';
import { MessageCircleMore, Headphones, CalendarDays, BarChart3, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Paso02Lienzo() {
  const router = useRouter();
  const { modulosSeleccionados, toggleModulo } = useUpwayStore();

  // Definición de precios reales (Estrategia High-Ticket)
  const modulos = [
    { id: 'whatsapp', titulo: 'WhatsApp IA (Texto)', precio: 399900, icon: <MessageCircleMore size={28} />, color: 'emerald' },
    { id: 'voz', titulo: 'Central Telefónica (Voz)', precio: 599900, icon: <Headphones size={28} />, color: 'cyan' },
    { id: 'calendario', titulo: 'Agenda Inteligente', precio: 39000, icon: <CalendarDays size={28} />, color: 'purple' },
    { id: 'analitica', titulo: 'Analítica Avanzada', precio: 19000, icon: <BarChart3 size={28} />, color: 'blue' },
    { id: 'rag', titulo: 'Cerebro RAG (Omnicanal)', precio: 0, icon: <Sparkles size={28} />, color: 'amber' },
  ];

  // 🔥 CÁLCULO DINÁMICO: Sumamos los precios de los módulos seleccionados aquí mismo
  const totalMensual = useMemo(() => {
    return modulos.reduce((acc, curr) => {
      if (modulosSeleccionados.includes(curr.id)) {
        return acc + curr.precio;
      }
      return acc;
    }, 0);
  }, [modulosSeleccionados]);

  const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;

  return (
    <main className="min-h-screen bg-[#050508] text-white p-8 md:p-16 flex flex-col items-center pb-32">
      
      <header className="w-full max-w-5xl mb-12">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-white mb-6 transition-colors">← Volver</button>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Arquitectura de tu Infraestructura</h1>
        <p className="text-slate-400">Selecciona los módulos corporativos para automatizar tu organización.</p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mb-12">
        {modulos.map((m) => {
          const seleccionado = modulosSeleccionados.includes(m.id);
          const esGratis = m.precio === 0;

          return (
            <motion.button
              key={m.id}
              onClick={() => toggleModulo(m.id)}
              whileTap={{ scale: 0.98 }}
              className={`p-6 rounded-[28px] border transition-all duration-300 text-left relative overflow-hidden flex flex-col justify-between ${
                seleccionado 
                  ? 'border-cyan-500/50 bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.15)]' 
                  : 'border-white/5 bg-white/[0.02] hover:border-white/10'
              }`}
            >
              <div>
                <div className="text-cyan-400 mb-4 bg-white/5 w-fit p-3 rounded-2xl border border-white/5">{m.icon}</div>
                <h3 className="text-xl font-bold mb-1 text-white">{m.titulo}</h3>
              </div>

              <div>
                <div className="text-2xl font-bold text-white mt-4">
                  {esGratis ? <span className="text-emerald-400 text-lg font-mono">INCLUIDO (GRATIS)</span> : fmt(m.precio)}
                  {!esGratis && <span className="text-xs font-normal text-slate-500">/mes</span>}
                </div>
              </div>
              
              {seleccionado && (
                <div className="absolute top-4 right-4 bg-cyan-400 text-black p-1.5 rounded-full shadow-lg">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0E14]/90 backdrop-blur-2xl border-t border-white/10 p-6 flex justify-center items-center gap-10 z-50">
        <div className="text-left">
          <p className="text-slate-400 text-xs uppercase tracking-wider font-mono">Inversión mensual estimada</p>
          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
            {fmt(totalMensual)}
          </p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/onboarding/tonalidad')}
          disabled={totalMensual === 0}
          className="bg-[#00D1FF] text-black px-8 py-4 rounded-2xl font-bold hover:bg-[#33DDFF] transition-all flex items-center gap-2 shadow-[0_0_25px_rgba(0,209,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Continuar configuración</span> 
          <ArrowRight size={20} />
        </button>
      </div>
    </main>
  );
}