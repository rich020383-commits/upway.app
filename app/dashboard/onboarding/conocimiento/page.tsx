"use client";

import React, { useState, useEffect } from 'react';
import { Database, ArrowRight, CheckCircle2, Server, ScanLine } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Paso04Conocimiento() {
  const router = useRouter();
  const [sincronizando, setSincronizando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [productosEscaneados, setProductosEscaneados] = useState(0);

  // Efecto visual de escaneo de base de datos (CORREGIDO)
  useEffect(() => {
    if (!sincronizando) return;

    // Si ya llegó a 100, detenemos todo y mostramos el éxito
    if (progreso >= 100) {
      const timer = setTimeout(() => {
        setSincronizando(false);
        setCompletado(true);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Mientras no llegue a 100, seguimos sumando
    const intervalo = setInterval(() => {
      setProgreso(prev => {
        const nuevoAvance = prev + Math.floor(Math.random() * 15);
        return nuevoAvance > 100 ? 100 : nuevoAvance; // Topamos en 100 para que no se pase
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
    <div className="min-h-screen bg-[#050508] text-white p-8 md:p-16 flex flex-col items-center relative overflow-hidden">
      
      {/* Efecto de luz de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <header className="w-full max-w-2xl mb-12 relative z-10">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-white mb-6 transition-colors">← Volver</button>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
            <Database className="text-blue-400 h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Conecta tu Inventario</h1>
        </div>
        <p className="text-slate-400">Enlazaremos el cerebro de la IA directamente con tu base de datos actual para que ofrezca productos y precios reales (RAG).</p>
      </header>

      <div className="w-full max-w-2xl bg-[#0b1014]/80 border border-white/5 p-12 rounded-[32px] backdrop-blur-2xl text-center shadow-2xl relative z-10">
        
        <div className="flex justify-center mb-8">
          <div className={`relative p-8 rounded-full transition-all duration-700 ${completado ? 'bg-green-500/10 shadow-[0_0_50px_rgba(34,197,94,0.2)]' : 'bg-blue-500/5 border border-blue-500/20'}`}>
            {sincronizando ? (
              <ScanLine className="h-14 w-14 text-blue-400 animate-pulse" />
            ) : completado ? (
              <CheckCircle2 className="h-14 w-14 text-green-400" />
            ) : (
              <Server className="h-14 w-14 text-blue-400" />
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-3 text-white">
          {sincronizando ? 'Vectorizando catálogo...' : completado ? '¡Base de Datos Enlazada!' : 'Base de datos detectada'}
        </h2>
        
        <p className="text-slate-400 mb-8 h-6">
          {sincronizando ? (
            <span className="text-blue-400 font-mono text-sm tracking-wider">INDEXANDO {productosEscaneados} PRODUCTOS...</span>
          ) : completado ? (
            'Tu IA ya sabe qué vender y a qué precio exacto.'
          ) : (
            'El sistema está listo para importar tus catálogos activos.'
          )}
        </p>

        {/* BARRA DE PROGRESO */}
        {sincronizando && (
          <div className="w-full bg-slate-900 rounded-full h-2.5 mb-8 border border-white/5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 to-cyan-400 h-2.5 rounded-full transition-all duration-300 ease-out relative" 
              style={{ width: `${progreso}%` }}
            >
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 animate-pulse"></div>
            </div>
          </div>
        )}

        {!completado && !sincronizando && (
          <button 
            onClick={handleSincronizar}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-500 transition-all flex items-center justify-center gap-2 w-full max-w-sm mx-auto shadow-[0_0_30px_rgba(37,99,235,0.3)]"
          >
            Sincronizar Catálogo Ahora
          </button>
        )}
      </div>

      <div className="fixed bottom-0 w-full bg-[#050508]/90 backdrop-blur-xl border-t border-white/5 p-6 flex justify-center items-center z-50">
        <button 
          onClick={() => router.push('/dashboard/onboarding/simulador')}
          disabled={!completado}
          className="bg-white text-black px-12 py-4 rounded-full font-bold hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100 flex items-center gap-3"
        >
          Ir al Simulador de Prueba <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}