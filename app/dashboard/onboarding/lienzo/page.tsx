"use client";

import React from 'react';
import { MessageCircleMore, Headphones, CalendarDays, ArrowRight, Check } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Paso02Lienzo() {
  const router = useRouter();
  const { modulosSeleccionados, totalMensual, toggleModulo } = useUpwayStore();

  const modulos = [
    { id: 'whatsapp', titulo: 'WhatsApp IA', desc: 'Atención y ventas 24/7', precio: 49, icon: <MessageCircleMore />, color: 'emerald' },
    { id: 'voz', titulo: 'Central Telefónica', desc: 'Llamadas salientes y entrantes', precio: 59, icon: <Headphones />, color: 'cyan' },
    { id: 'calendario', titulo: 'Agenda Inteligente', desc: 'Gestión de citas automática', precio: 29, icon: <CalendarDays />, color: 'purple' },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white p-8 md:p-16 flex flex-col items-center">
      
      <header className="w-full max-w-4xl mb-12">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-white mb-6">← Volver</button>
        <h1 className="text-3xl font-bold mb-2">Construye tu sistema</h1>
        <p className="text-slate-400">Selecciona los módulos que quieres encender para tu negocio.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-6 w-full max-w-4xl mb-12">
        {modulos.map((m) => {
          const seleccionado = modulosSeleccionados.includes(m.id);
          return (
            <motion.button
              key={m.id}
              onClick={() => toggleModulo(m.id)}
              whileTap={{ scale: 0.98 }}
              className={`p-6 rounded-3xl border transition-all duration-300 text-left relative overflow-hidden ${
                seleccionado 
                  ? `border-${m.color}-500 bg-${m.color}-900/20` 
                  : 'border-white/5 bg-white/[0.02] hover:border-white/10'
              }`}
            >
              <div className={`text-${m.color}-400 mb-4`}>{m.icon}</div>
              <h3 className="text-xl font-bold mb-1">{m.titulo}</h3>
              <p className="text-sm text-slate-400 mb-6">{m.desc}</p>
              <div className="text-2xl font-bold">${m.precio}<span className="text-sm font-normal text-slate-500">/mes</span></div>
              
              {seleccionado && (
                <div className="absolute top-4 right-4 bg-white text-black p-1 rounded-full">
                  <Check size={16} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="fixed bottom-0 w-full bg-[#0A0A0F]/80 backdrop-blur-xl border-t border-white/10 p-6 flex justify-center items-center gap-8">
        <div className="text-center">
          <p className="text-slate-400 text-sm">Inversión mensual</p>
          <p className="text-3xl font-bold">${totalMensual}</p>
        </div>
        <button 
  onClick={() => router.push('/dashboard/onboarding/tonalidad')}
  disabled={totalMensual === 0}
  className="..."
>
          Continuar configuración <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}