"use client";

import React from 'react';
import { Bot, CheckCircle2, MessageSquare, ShieldCheck, Zap, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function DashboardHomePage() {
  return (
    <div className="max-w-5xl mx-auto py-6">
      
      {/* Header del Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> Sistema Operativo
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Centro de Mando Upway</h1>
          <p className="text-slate-400 text-sm mt-1">Gestiona tu agente de inteligencia artificial y tu línea comercial.</p>
        </div>
        
        <Link 
          href="/dashboard/activacion"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600/20 border border-blue-500/30 px-4 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-600/30 transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reconfigurar WhatsApp
        </Link>
      </div>

      {/* Tarjetas de Estado */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        
        {/* Tarjeta 1: Estado del Bot */}
        <div className="rounded-3xl border border-white/10 bg-[#0A0E14] p-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-slate-400">Estado del Agente</span>
            <Bot className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <span className="text-xl font-bold text-white">Activo y Operando</span>
          </div>
          <p className="text-xs text-slate-400">La IA responde automáticamente 24/7 a tus clientes en WhatsApp.</p>
        </div>

        {/* Tarjeta 2: Conexión Meta */}
        <div className="rounded-3xl border border-white/10 bg-[#0A0E14] p-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-slate-400">Canal Oficial</span>
            <ShieldCheck className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-white mb-1 truncate">WhatsApp Business</div>
          <p className="text-xs text-emerald-400 font-medium">Vinculación oficial aprobada por Meta</p>
        </div>

        {/* Tarjeta 3: Rendimiento */}
        <div className="rounded-3xl border border-white/10 bg-[#0A0E14] p-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-slate-400">Conversaciones Atendidas</span>
            <Zap className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">0 <span className="text-xs font-normal text-slate-400">chats hoy</span></div>
          <p className="text-xs text-slate-400">Listo para recibir tráfico comercial.</p>
        </div>

      </div>

      {/* Sección de Pruebas / Acciones rápidas */}
      <div className="rounded-3xl border border-white/10 bg-[#0A0E14] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Zona de Pruebas
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Pon a prueba tu asistente virtual</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Tu canal ya está enlazado a la base de datos. Puedes verificar el funcionamiento de las respuestas automáticas o simular interacciones de prueba.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <a 
              href="https://wa.me/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 font-semibold text-white shadow-lg hover:bg-[#20ba5a] transition-all text-sm"
            >
              <MessageSquare className="h-4 w-4 fill-white" />
              <span>Abrir chat de prueba</span>
              <ExternalLink className="h-4 w-4 ml-1 opacity-70" />
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}