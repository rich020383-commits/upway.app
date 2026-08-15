"use client";

import React, { useState } from 'react';
import { Bot, CheckCircle2, MessageSquare, ShieldCheck, Zap, RefreshCw, Sparkles, Power, Download, Clock, BookOpen, AtSign, Rocket, Activity } from 'lucide-react';
import Link from 'next/link';
import { useUpwayStore } from '../store/upwayStore'; // Asegúrate de que la ruta sea correcta según tu estructura

export default function DashboardHomePage() {
  // Traemos el nombre del agente para personalizar el dashboard
  const { nombreAgente } = useUpwayStore();

  // Estado para controlar el "Botón de Pánico" de la IA
  const [iaActiva, setIaActiva] = useState(true);
  
  // SIMULACIÓN DE DATOS
  const [tiendaData] = useState({
    telefono: "573001234567",
    metaUsername: "upway_demo" 
  });

  return (
    <div className="min-h-screen bg-[#050508] text-white relative overflow-hidden font-sans pb-20">
      
      {/* Luces de ambiente (Efecto Nave Espacial) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none z-0"></div>

      <div className="max-w-6xl mx-auto px-6 pt-12 relative z-10">
        
        {/* HEADER DEL DASHBOARD */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-white/5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> Sistema Operativo
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              Centro de Mando {nombreAgente ? `de ${nombreAgente}` : 'Upway'}
            </h1>
            <p className="text-slate-400 text-sm mt-2">Supervisa la telemetría de tu inteligencia artificial en tiempo real.</p>
          </div>
          
          <Link 
            href="/dashboard/activacion"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900/50 border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md"
          >
            <RefreshCw className="h-4 w-4" /> Reconfigurar Canales
          </Link>
        </div>

        {/* 🚀 BANNER DE ONBOARDING (Ideal para que el Revisor de Meta sepa qué hacer) */}
        <div className="mb-10 rounded-[32px] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-10 text-white shadow-[0_0_50px_rgba(79,70,229,0.2)] relative overflow-hidden border border-white/20 group">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wider text-white mb-4 backdrop-blur-md border border-white/30">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" /> ACCIÓN REQUERIDA
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Enciende tu IA Oficial</h2>
              <p className="text-blue-100 max-w-xl text-sm md:text-base leading-relaxed">
                Tu agente está configurado, pero necesita una línea de comunicación. Conecta tu cuenta oficial de WhatsApp Business para empezar a automatizar tus ventas.
              </p>
            </div>
            
            <Link 
              href="/dashboard/activacion" 
              className="inline-flex items-center gap-3 bg-white text-blue-700 px-8 py-4 rounded-2xl font-bold hover:bg-slate-100 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)] whitespace-nowrap"
            >
              <Rocket className="h-5 w-5" />
              Conectar WhatsApp con Meta
            </Link>
          </div>
        </div>

        {/* TARJETAS DE TELEMETRÍA */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          
          {/* Tarjeta 1: Estado del Bot (Botón de Pánico) */}
          <div className={`rounded-[32px] border transition-all duration-500 bg-white/[0.02] backdrop-blur-xl p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between ${iaActiva ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-amber-500/20 hover:border-amber-500/40'}`}>
            <div className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-500 ${iaActiva ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]'}`}></div>
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Motor de Inferencia</span>
                <Activity className={`h-5 w-5 ${iaActiva ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              </div>
              <div className="flex items-center gap-3 mb-2">
                <Bot className={`h-8 w-8 flex-shrink-0 ${iaActiva ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="text-2xl font-bold text-white leading-tight">
                  {iaActiva ? 'Autónomo' : 'Pausado'}
                </span>
              </div>
              <p className="text-sm text-slate-400 h-10">
                {iaActiva ? 'La IA está respondiendo conversaciones en tiempo real.' : 'Estás en control manual. La IA no enviará mensajes.'}
              </p>
            </div>

            <button
              onClick={() => setIaActiva(!iaActiva)}
              className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-bold transition-all ${
                iaActiva
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
              }`}
            >
              <Power className="h-4 w-4" /> {iaActiva ? 'Tomar Control Manual' : 'Activar Piloto Automático'}
            </button>
          </div>

          {/* Tarjeta 2: Conexión Meta */}
          <div className="rounded-[32px] border border-white/5 hover:border-white/10 transition-all bg-white/[0.02] backdrop-blur-xl p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600/50 group-hover:bg-blue-500 transition-colors"></div>
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Canal Principal</span>
                <MessageSquare className="h-5 w-5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-2">WhatsApp API</div>
              <p className="text-sm text-amber-400 font-medium flex items-center gap-1.5 bg-amber-400/10 w-fit px-3 py-1 rounded-full border border-amber-400/20">
                <ShieldCheck className="h-4 w-4" /> Desconectado
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><AtSign className="h-4 w-4"/> ID Business</span>
                <span className="font-mono text-slate-400">---</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Requiere activación previa</span>
                <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Configurar <Rocket className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Rendimiento */}
          <div className="rounded-[32px] border border-white/5 hover:border-white/10 transition-all bg-white/[0.02] backdrop-blur-xl p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400/50 group-hover:bg-cyan-400 transition-colors"></div>
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Impacto Hoy</span>
                <Zap className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-white">0</span>
                <span className="text-sm font-medium text-slate-400">mensajes</span>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full w-[0%]"></div>
                </div>
                <span className="text-xs font-bold text-cyan-400">0%</span>
              </div>
            </div>

            <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all border border-white/5">
              <Clock className="h-4 w-4" /> Ver Historial
            </button>
          </div>

        </div>

        {/* ZONA INFERIOR: Conocimiento y Pruebas */}
        <div className="grid md:grid-cols-2 gap-6">
          
          <div className="rounded-[32px] border border-white/5 hover:border-white/10 transition-all bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-500/20 transition-colors"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-5">
                <BookOpen className="h-3.5 w-3.5" /> Cerebro RAG
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Base de Conocimiento</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
                Sube catálogos, PDFs o reglas de negocio. La IA consumirá esta información para generar respuestas milimétricas a tus clientes.
              </p>
              
              <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-8 py-4 font-semibold text-white hover:bg-white/10 transition-all text-sm group-hover:border-purple-500/50">
                <BookOpen className="h-4 w-4 text-purple-400" />
                <span>Gestionar Memoria</span>
              </button>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/5 bg-slate-900/40 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-72 h-72 bg-slate-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="relative z-10 opacity-60">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-500/30 bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-400 mb-5">
                <MessageSquare className="h-3.5 w-3.5" /> Pruebas Locales
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Simulador de Chat</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
                Esta herramienta se desbloqueará automáticamente una vez que vincules tu número de Meta.
              </p>
              
              <button disabled className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 border border-white/5 px-8 py-4 font-semibold text-slate-500 cursor-not-allowed text-sm">
                <span>Requiere Conexión</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}