"use client";

import React, { useState } from 'react';
import { Bot, CheckCircle2, MessageSquare, ShieldCheck, Zap, RefreshCw, ExternalLink, Sparkles, Power, Download, Clock, BookOpen, AtSign, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function DashboardHomePage() {
  // Estado para controlar el "Botón de Pánico" de la IA
  const [iaActiva, setIaActiva] = useState(true);
  
  // 🚀 SIMULACIÓN DE DATOS TRAÍDOS DE PRISMA (Sustituye esto por tu fetch real)
  const [tiendaData] = useState({
    telefono: "573001234567",
    metaUsername: "upway_demo" // Si esto es null, el sistema vuelve a usar el teléfono
  });

  return (
    <div className="max-w-5xl mx-auto py-6">
      
      {/* Header del Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> Sistema Operativo
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Centro de Mando Upway</h1>
          <p className="text-slate-400 text-sm mt-1">Gestiona tu agente de inteligencia artificial y tu línea comercial.</p>
        </div>
        
        {/* 🚀 Botón superior secundario */}
        <Link 
          href="/dashboard/activacion"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600/20 border border-blue-500/30 px-4 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-600/30 transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reconfigurar WhatsApp
        </Link>
      </div>

      {/* 🚀 NUEVO BANNER DE ONBOARDING PARA LA REVISIÓN DE META */}
      <div className="mb-10 rounded-[32px] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-2xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white mb-4 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> Paso 1 de 1
          </div>
          <h2 className="text-3xl font-bold mb-3">¡Bienvenido a Upway Business!</h2>
          <p className="text-blue-100 mb-8 max-w-2xl text-sm md:text-base leading-relaxed">
            Tu centro de control está casi listo para empezar a operar. Para conectar tu línea de WhatsApp oficial y habilitar la inteligencia artificial, por favor completa el proceso de vinculación.
          </p>
          <Link 
            href="/dashboard/activacion" 
            className="inline-flex items-center gap-3 bg-white text-blue-700 px-7 py-3.5 rounded-2xl font-bold hover:bg-blue-50 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <Rocket className="h-5 w-5" />
            Conectar WhatsApp con Meta
          </Link>
        </div>
      </div>

      {/* Tarjetas de Estado */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        
        {/* Tarjeta 1: Estado del Bot (Interactivo) */}
        <div className={`rounded-3xl border transition-all duration-300 bg-[#0A0E14] p-6 relative overflow-hidden shadow-xl flex flex-col justify-between ${iaActiva ? 'border-white/10' : 'border-amber-500/30'}`}>
          <div className={`absolute top-0 left-0 right-0 h-1 ${iaActiva ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-400">Estado del Agente</span>
              <Bot className={`h-5 w-5 ${iaActiva ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className={`h-6 w-6 flex-shrink-0 ${iaActiva ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-xl font-bold text-white leading-tight">
                {iaActiva ? 'Activo y Operando' : 'Modo Humano'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {iaActiva ? 'La IA responde automáticamente 24/7 a tus clientes en WhatsApp.' : 'Bot pausado. Debes responder los mensajes de forma manual.'}
            </p>
          </div>

          <button
            onClick={() => setIaActiva(!iaActiva)}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all ${
              iaActiva
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            <Power className="h-4 w-4" /> {iaActiva ? 'Pausar Bot (Intervenir)' : 'Reactivar Bot'}
          </button>
        </div>

        {/* Tarjeta 2: Conexión Meta mostrando el BSUID */}
        <div className="rounded-3xl border border-white/10 bg-[#0A0E14] p-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-400">Canal Oficial</span>
              <ShieldCheck className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-lg font-bold text-white mb-1 truncate">WhatsApp Business</div>
            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Vinculación pendiente / inactiva
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex flex-col gap-2">
            {tiendaData.metaUsername && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                <AtSign className="h-3.5 w-3.5" />
                Pendiente de conexión
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Conecta para ver datos</span>
              <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors">
                <Download className="h-3 w-3" /> Datos
              </button>
            </div>
          </div>
        </div>

        {/* Tarjeta 3: Rendimiento (Con Historial) */}
        <div className="rounded-3xl border border-white/10 bg-[#0A0E14] p-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400"></div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-400">Conversaciones Atendidas</span>
              <Zap className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              0 <span className="text-xs font-normal text-slate-400">chats hoy</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full w-[0%]"></div>
              </div>
              <span className="text-[10px] text-cyan-400 whitespace-nowrap">0% Resueltos</span>
            </div>
          </div>

          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-all">
            <Clock className="h-4 w-4" /> Historial de Chats
          </button>
        </div>

      </div>

      {/* Sección Inferior: Base de Conocimiento y Pruebas */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Base de Conocimiento */}
        <div className="rounded-3xl border border-white/10 bg-[#0A0E14] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-4">
              <BookOpen className="h-3.5 w-3.5" /> Cerebro de la IA
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Base de Conocimiento</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Sube tu menú, inventario o las reglas del negocio. La IA utilizará esta información para generar respuestas más precisas y útiles.
            </p>
            
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/10 px-6 py-3.5 font-semibold text-white hover:bg-white/20 transition-all text-sm">
              <BookOpen className="h-4 w-4" />
              <span>Entrenar Agente</span>
            </button>
          </div>
        </div>

        {/* Zona de Pruebas */}
        <div className="rounded-3xl border border-white/10 bg-[#0A0E14] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Zona de Pruebas
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Pon a prueba tu asistente</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Una vez que conectes tu línea con Meta, podrás verificar aquí mismo el funcionamiento de las respuestas automáticas.
            </p>
            
            <button 
              disabled
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/5 px-6 py-3.5 font-semibold text-slate-500 cursor-not-allowed transition-all text-sm"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Requiere conexión previa</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}