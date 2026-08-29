"use client";

import React, { useState, useEffect } from 'react';
import { Database, ArrowRight, CheckCircle2, Server, ScanLine, FileText, Cpu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Paso04Conocimiento() {
  const router = useRouter();
  const [sincronizando, setSincronizando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [productosEscaneados, setProductosEscaneados] = useState(0);

  useEffect(() => {
    if (!sincronizando) return;

    if (progreso >= 100) {
      const timer = setTimeout(() => {
        setSincronizando(false);
        setCompletado(true);
      }, 500);
      return () => clearTimeout(timer);
    }

    const intervalo = setInterval(() => {
      setProgreso(prev => {
        const nuevoAvance = prev + Math.floor(Math.random() * 15);
        return nuevoAvance > 100 ? 100 : nuevoAvance; 
      });
      setProductosEscaneados(prev => prev + Math.floor(Math.random() * 5));
    }, 300);

    return () => clearInterval(intervalo);
  }, [sincronizando, progreso]);

  const handleSincronizar = () => {
    setSincronizando(true);
    setProgreso(0);
    setProductosEscaneados(0);
    setCompletado(false);
  };

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

      {/* 🔥 EL RESORTE CENTRAL: Distribuye el contenido perfectamente al centro */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-4 mt-8 md:mt-2 flex flex-col justify-center overflow-y-auto no-scrollbar">
        
        {/* Barra de progreso / Narrativa */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 text-[#8994A6] text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-4 md:mb-6">
            <span>Configuración de tu agente</span>
            <span className="w-1 h-1 rounded-full bg-[#8994A6]"></span>
            <span className="text-[#F5F7FA]">04 / 05</span>
          </div>
          
          <div className="flex gap-2 mb-6 md:mb-8">
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full shadow-[0_0_15px_rgba(25,200,232,0.5)]"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <Database className="text-[#19C8E8] h-6 w-6 md:h-8 md:w-8" />
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Cerebro de Datos (RAG)</h1>
          </div>
          <p className="text-[#8994A6] text-xs md:text-base max-w-2xl">
            Conectaremos tu inventario y reglas de negocio para que tu asistente ofrezca respuestas basadas en datos reales y actualizados.
          </p>
        </div>

        {/* Tarjeta Principal de Sincronización */}
        <div className="max-w-2xl mx-auto w-full pb-4">
          <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-6 md:p-10 relative overflow-hidden shadow-2xl">
            
            {/* Background pattern sutil */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#F5F7FA 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              
              {/* Icono de estado */}
              <div className="mb-6 md:mb-8">
                <div className={`p-4 md:p-5 rounded-2xl transition-all duration-500 border ${
                  completado 
                    ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' 
                    : sincronizando 
                      ? 'bg-[#19C8E8]/10 border-[#19C8E8]/30 text-[#19C8E8]' 
                      : 'bg-[#1E293B]/50 border-[#1E293B] text-[#8994A6]'
                }`}>
                  {sincronizando ? (
                    <ScanLine className="h-8 w-8 md:h-10 md:w-10 animate-pulse" />
                  ) : completado ? (
                    <CheckCircle2 className="h-8 w-8 md:h-10 md:w-10" />
                  ) : (
                    <Server className="h-8 w-8 md:h-10 md:w-10" />
                  )}
                </div>
              </div>

              {/* Textos de estado */}
              <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-[#F5F7FA]">
                {sincronizando ? 'Vectorizando catálogo...' : completado ? 'Base de Datos Enlazada' : 'Sistema de Archivos Listo'}
              </h2>
              
              <div className="h-6 mb-6 md:mb-8">
                {sincronizando ? (
                  <div className="flex items-center justify-center gap-2 text-[#19C8E8] font-mono text-[10px] md:text-xs uppercase tracking-widest">
                    <Cpu size={14} className="animate-spin" />
                    <span>Indexando {productosEscaneados} registros...</span>
                  </div>
                ) : completado ? (
                  <p className="text-[#8994A6] text-xs md:text-sm">Tu IA ya cuenta con memoria institucional activa.</p>
                ) : (
                  <p className="text-[#8994A6] text-xs md:text-sm">Inicia la ingesta de datos para entrenar a tu asistente.</p>
                )}
              </div>

              {/* UI de Progreso (Sleek) */}
              {sincronizando && (
                <div className="w-full max-w-md mx-auto mb-6 md:mb-8">
                  <div className="flex justify-between text-[10px] md:text-xs font-mono text-[#8994A6] mb-2">
                    <span>Sincronizando</span>
                    <span className="text-[#19C8E8]">{progreso}%</span>
                  </div>
                  <div className="w-full bg-[#07090C] rounded-full h-1.5 border border-[#1E293B] overflow-hidden">
                    <div 
                      className="bg-[#19C8E8] h-1.5 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(25,200,232,0.5)]" 
                      style={{ width: `${progreso}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Botón de Acción Inicial */}
              {!completado && !sincronizando && (
                <button 
                  onClick={handleSincronizar}
                  className="bg-[#F5F7FA] text-[#07090C] px-6 py-3 md:px-8 md:py-3.5 rounded-xl font-bold hover:bg-[#E2E8F0] transition-all flex items-center justify-center gap-2 w-full max-w-sm mx-auto shadow-lg text-sm md:text-base"
                >
                  <FileText size={18} /> Iniciar Ingesta de Datos
                </button>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* 🔥 BARRA INFERIOR: Anclada (shrink-0) */}
      <div className="shrink-0 w-full bg-[#07090C]/90 backdrop-blur-xl border-t border-[#1E293B] px-6 py-4 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-[#8994A6] text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-1">
              Paso 4 completado
            </p>
            <p className="text-base md:text-lg font-bold text-[#F5F7FA]">
              Memoria conectada
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/onboarding/simulador')}
            disabled={!completado}
            className="bg-[#F5F7FA] text-[#07090C] px-6 py-2.5 md:px-8 md:py-3.5 rounded-xl font-bold hover:bg-[#E2E8F0] transition-colors disabled:opacity-20 flex items-center gap-2 text-sm md:text-base"
          >
            Continuar al Simulador <ArrowRight size={18} />
          </button>
        </div>
      </div>
      
    </div>
  );
}