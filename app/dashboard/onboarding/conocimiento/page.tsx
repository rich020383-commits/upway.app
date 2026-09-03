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
    <main className="relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(27,94,214,0.12),_transparent_28%),linear-gradient(180deg,_#f7faff_0%,_#eef5ff_100%)] pb-28 text-slate-900 selection:bg-[#1b5ed6]/25">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-10 md:px-10">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Database className="h-5 w-5 text-[#1b5ed6]" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Upway</div>
              <div className="text-lg font-black tracking-[-0.05em] text-slate-900">Business</div>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            Ir al panel
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8">
          <div className="mb-8 flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-slate-500">
            <span>Configuración de tu agente</span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span className="font-semibold text-slate-900">04 / 05</span>
          </div>

          <div className="mb-8 flex gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-[#1b5ed6]" />
            <div className="h-1.5 flex-1 rounded-full bg-[#1b5ed6]" />
            <div className="h-1.5 flex-1 rounded-full bg-[#1b5ed6]" />
            <div className="h-1.5 flex-1 rounded-full bg-[#1b5ed6]" />
            <div className="h-1.5 flex-1 rounded-full bg-slate-200" />
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl font-black leading-[0.96] tracking-[-0.06em] text-slate-900 md:text-5xl">Cerebro de datos</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Conectaremos tu inventario y reglas de negocio para que tu asistente ofrezca respuestas basadas en datos reales y actualizados.
            </p>
          </div>
        </section>

        <section className="mt-8 mx-auto max-w-2xl rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] md:p-10">
          <div className="flex flex-col items-center text-center">
            <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] border ${
              completado
                ? 'border-[#c7f0d6] bg-[#ebfff3] text-[#1ea76d]'
                : sincronizando
                  ? 'border-[#cfe2ff] bg-[#edf4ff] text-[#1b5ed6]'
                  : 'border-slate-200 bg-slate-100 text-slate-500'
            }`}>
              {sincronizando ? (
                <ScanLine className="h-8 w-8 animate-pulse" />
              ) : completado ? (
                <CheckCircle2 className="h-8 w-8" />
              ) : (
                <Server className="h-8 w-8" />
              )}
            </div>

            <h2 className="text-2xl font-black tracking-[-0.05em] text-slate-900 md:text-3xl">
              {sincronizando ? 'Vectorizando catálogo...' : completado ? 'Base de datos enlazada' : 'Sistema de archivos listo'}
            </h2>

            <div className="mt-4 min-h-[32px]">
              {sincronizando ? (
                <div className="flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#1b5ed6]">
                  <Cpu size={14} className="animate-spin" />
                  <span>Indexando {productosEscaneados} registros...</span>
                </div>
              ) : completado ? (
                <p className="text-sm text-slate-600">Tu IA ya cuenta con memoria institucional activa.</p>
              ) : (
                <p className="text-sm text-slate-600">Inicia la ingesta de datos para entrenar a tu asistente.</p>
              )}
            </div>

            {sincronizando && (
              <div className="mt-6 w-full max-w-md">
                <div className="mb-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
                  <span>Sincronizando</span>
                  <span className="text-[#1b5ed6]">{progreso}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#1b5ed6] transition-all duration-300 ease-out"
                    style={{ width: `${progreso}%` }}
                  />
                </div>
              </div>
            )}

            {!completado && !sincronizando && (
              <button
                onClick={handleSincronizar}
                className="mt-8 inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5"
              >
                <FileText size={18} />
                Iniciar ingesta de datos
              </button>
            )}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 md:px-10">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Paso 4 completado</div>
            <div className="mt-1 text-lg font-black tracking-[-0.05em] text-slate-900 md:text-xl">Memoria conectada</div>
          </div>

          <button
            onClick={() => router.push('/dashboard/onboarding/simulador')}
            disabled={!completado}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continuar al simulador
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
}