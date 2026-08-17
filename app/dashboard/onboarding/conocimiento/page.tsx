"use client";

import React, { useState, useEffect } from 'react';
import { Database, ArrowRight, CheckCircle2, Server, ScanLine, FileText, Cpu } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Paso04Conocimiento() {
  const router = useRouter();
  const [sincronizando, setSincronizando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [productosEscaneados, setProductosEscaneados] = useState(0);

  // Efecto visual de escaneo (Mantenemos tu excelente lógica matemática)
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
    <main className="min-h-screen bg-[#07090C] text-[#F5F7FA] pb-32 font-sans selection:bg-[#19C8E8] selection:text-[#07090C]">
      
      <div className="max-w-4xl mx-auto px-6 pt-12 md:pt-20">
        
        {/* Barra de progreso / Narrativa */}
        <div className="mb-12">
          <div className="flex items-center gap-3 text-[#8994A6] text-xs font-semibold tracking-widest uppercase mb-6">
            <span>Configuración de tu agente</span>
            <span className="w-1 h-1 rounded-full bg-[#8994A6]"></span>
            <span className="text-[#F5F7FA]">04 / 05</span>
          </div>
          
          <div className="flex gap-2 mb-10">
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#19C8E8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <Database className="text-[#19C8E8] h-8 w-8" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Cerebro de Datos (RAG)</h1>
          </div>
          <p className="text-[#8994A6] text-lg max-w-2xl">
            Conectaremos tu inventario y reglas de negocio para que tu asistente ofrezca respuestas basadas en datos reales y actualizados.
          </p>
        </div>

        {/* Tarjeta Principal de Sincronización */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-10 relative overflow-hidden">
            
            {/* Background pattern sutil */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#F5F7FA 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              
              {/* Icono de estado */}
              <div className="mb-8">
                <div className={`p-5 rounded-2xl transition-all duration-500 border ${
                  completado 
                    ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' 
                    : sincronizando 
                      ? 'bg-[#19C8E8]/10 border-[#19C8E8]/30 text-[#19C8E8]' 
                      : 'bg-[#1E293B]/50 border-[#1E293B] text-[#8994A6]'
                }`}>
                  {sincronizando ? (
                    <ScanLine className="h-10 w-10 animate-pulse" />
                  ) : completado ? (
                    <CheckCircle2 className="h-10 w-10" />
                  ) : (
                    <Server className="h-10 w-10" />
                  )}
                </div>
              </div>

              {/* Textos de estado */}
              <h2 className="text-2xl font-bold mb-3 text-[#F5F7FA]">
                {sincronizando ? 'Vectorizando catálogo...' : completado ? 'Base de Datos Enlazada' : 'Sistema de Archivos Listo'}
              </h2>
              
              <div className="h-6 mb-10">
                {sincronizando ? (
                  <div className="flex items-center justify-center gap-2 text-[#19C8E8] font-mono text-xs uppercase tracking-widest">
                    <Cpu size={14} className="animate-spin" />
                    <span>Indexando {productosEscaneados} registros...</span>
                  </div>
                ) : completado ? (
                  <p className="text-[#8994A6] text-sm">Tu IA ya cuenta con memoria institucional activa.</p>
                ) : (
                  <p className="text-[#8994A6] text-sm">Inicia la ingesta de datos para entrenar a tu asistente.</p>
                )}
              </div>

              {/* UI de Progreso (Sleek) */}
              {sincronizando && (
                <div className="w-full max-w-md mx-auto mb-8">
                  <div className="flex justify-between text-xs font-mono text-[#8994A6] mb-2">
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
                  className="bg-[#F5F7FA] text-[#07090C] px-8 py-3.5 rounded-xl font-bold hover:bg-[#E2E8F0] transition-all flex items-center justify-center gap-2 w-full max-w-sm mx-auto shadow-lg"
                >
                  <FileText size={18} /> Iniciar Ingesta de Datos
                </button>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* Barra Inferior Persistente */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#07090C]/80 backdrop-blur-xl border-t border-[#1E293B] p-6 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-[#8994A6] text-xs font-semibold uppercase tracking-wider mb-1">
              Paso 4 completado
            </p>
            <p className="text-lg font-bold text-[#F5F7FA]">
              Memoria conectada
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/onboarding/simulador')}
            disabled={!completado}
            className="bg-[#F5F7FA] text-[#07090C] px-8 py-3.5 rounded-xl font-bold hover:bg-[#E2E8F0] transition-colors disabled:opacity-20 flex items-center gap-2"
          >
            Continuar al Simulador <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </main>
  );
}