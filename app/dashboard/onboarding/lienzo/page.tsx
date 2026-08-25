"use client";

import React, { useMemo } from 'react';
import { MessageCircleMore, Headphones, CalendarDays, BarChart3, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore'; // Ajusta la ruta si es necesario
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // 🚀 IMPORTACIÓN NUEVA

export default function Paso01Infraestructura() {
  const router = useRouter();
  const { modulosSeleccionados, toggleModulo } = useUpwayStore();

  // Módulos con descripciones enfocadas en el valor corporativo
  const modulos = [
    { 
      id: 'whatsapp', 
      titulo: 'WhatsApp IA', 
      descripcion: 'Atiende conversaciones, califica leads y vende automáticamente 24/7.',
      precio: 399900, 
      icon: <MessageCircleMore size={24} /> 
    },
    { 
      id: 'voz', 
      titulo: 'Central Telefónica', 
      descripcion: 'Recibe y gestiona llamadas entrantes con voz hiperrealista.',
      precio: 599900, 
      icon: <Headphones size={24} /> 
    },
    { 
      id: 'calendario', 
      titulo: 'Agenda Inteligente', 
      descripcion: 'Sincroniza tu disponibilidad y agenda citas en tiempo real.',
      precio: 39000, 
      icon: <CalendarDays size={24} /> 
    },
    { 
      id: 'analitica', 
      titulo: 'Analítica Avanzada', 
      descripcion: 'Métricas de rendimiento, transcripciones e insights de clientes.',
      precio: 19000, 
      icon: <BarChart3 size={24} /> 
    },
    { 
      id: 'rag', 
      titulo: 'Cerebro Omnicanal', 
      descripcion: 'Memoria compartida para respuestas precisas basadas en tus documentos.',
      precio: 0, 
      icon: <Sparkles size={24} /> 
    },
  ];

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
    // 🚀 OJO AQUÍ: Le agregué "relative" al inicio de las clases
    <main className="relative min-h-screen bg-[#07090C] text-[#F5F7FA] pb-32 font-sans selection:bg-[#19C8E8] selection:text-[#07090C]">
      
      {/* 🚀 NUEVO BOTÓN DE SALTAR (Esquina superior derecha) */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-10 z-10">
        <Link 
          href="/dashboard" 
          className="text-sm font-semibold text-[#8994A6] hover:text-[#19C8E8] flex items-center gap-2 bg-[#1E293B]/30 hover:bg-[#1E293B] px-5 py-2.5 rounded-xl transition-all duration-300 border border-[#1E293B]/50 hover:border-[#19C8E8]/30"
        >
          Ir al Panel
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Contenedor centralizado */}
      <div className="max-w-4xl mx-auto px-6 pt-12 md:pt-20">
        
        {/* Barra de progreso / Narrativa */}
        <div className="mb-12">
          <div className="flex items-center gap-3 text-[#8994A6] text-xs font-semibold tracking-widest uppercase mb-6">
            <span>Configuración de tu agente</span>
            <span className="w-1 h-1 rounded-full bg-[#8994A6]"></span>
            <span className="text-[#F5F7FA]">01 / 05</span>
          </div>
          
          <div className="flex gap-2 mb-10">
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Infraestructura</h1>
          <p className="text-[#8994A6] text-lg max-w-2xl">
            Selecciona los canales donde operará tu asistente y las capacidades cognitivas que tendrá activas desde el primer día.
          </p>
        </div>

        {/* Grid de Módulos (Diseño Compacto y Elegante) */}
        <div className="grid md:grid-cols-2 gap-5">
          {modulos.map((m) => {
            const seleccionado = modulosSeleccionados.includes(m.id);
            const esGratis = m.precio === 0;

            return (
              <div
                key={m.id}
                onClick={() => toggleModulo(m.id)}
                className={`group cursor-pointer rounded-2xl p-6 border transition-all duration-200 flex flex-col justify-between ${
                  seleccionado 
                    ? 'bg-[#121821] border-[#19C8E8]' 
                    : 'bg-[#0D1117] border-[#1E293B] hover:border-[#8994A6]/50'
                }`}
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start gap-4 mb-6">
                  <div className={`p-3 rounded-xl transition-colors ${
                    seleccionado 
                      ? 'bg-[#19C8E8]/10 text-[#19C8E8]' 
                      : 'bg-[#1E293B]/50 text-[#8994A6] group-hover:text-[#F5F7FA]'
                  }`}>
                    {m.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#F5F7FA] mb-1">{m.titulo}</h3>
                    <p className="text-[#8994A6] text-sm leading-relaxed">{m.descripcion}</p>
                  </div>
                </div>

                {/* Footer de la tarjeta (Precio y Acción) */}
                <div className="flex items-center justify-between pt-4 border-t border-[#1E293B]/50">
                  <div className="text-[#F5F7FA] font-medium">
                    {esGratis ? (
                      <span className="text-[#8994A6] text-sm">Incluido</span>
                    ) : (
                      <span>{fmt(m.precio)} <span className="text-[#8994A6] text-sm font-normal">/ mes</span></span>
                    )}
                  </div>
                  
                  <div className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    seleccionado 
                      ? 'text-[#19C8E8]' 
                      : 'text-[#8994A6] bg-[#1E293B]/30 group-hover:bg-[#1E293B]'
                  }`}>
                    {seleccionado ? (
                      <><Check size={16} strokeWidth={3} /> Activado</>
                    ) : (
                      'Activar'
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Barra Inferior Persistente (Clear CTA) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#07090C]/80 backdrop-blur-xl border-t border-[#1E293B] p-6 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-[#8994A6] text-xs font-semibold uppercase tracking-wider mb-1">
              Inversión mensual
            </p>
            <p className="text-3xl md:text-4xl font-bold text-[#F5F7FA]">
              {fmt(totalMensual)}
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/onboarding/tonalidad')} // Ajusta la ruta al Paso 02 si es diferente
            disabled={totalMensual === 0}
            className="bg-[#F5F7FA] text-[#07090C] px-8 py-3.5 rounded-xl font-bold hover:bg-[#E2E8F0] transition-colors disabled:opacity-20 flex items-center gap-2"
          >
            Continuar <ArrowRight size={18} />
          </button>
        </div>
      </div>

    </main>
  );
}