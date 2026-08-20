"use client";

import React, { useState, useEffect } from 'react';
import { 
  Bot, CheckCircle2, MessageSquare, ShieldCheck, Zap, RefreshCw, 
  Sparkles, Power, BookOpen, AtSign, Rocket, Activity, Calendar, 
  Mic, Users, CalendarCheck, Timer, TrendingUp, PhoneCall
} from 'lucide-react';
import Link from 'next/link';
import { useUpwayStore } from '../store/upwayStore'; 

export default function DashboardHomePage() {
  const { nombreAgente } = useUpwayStore();
  const [iaActiva, setIaActiva] = useState(true);
  
  // ESTADOS DE INTEGRACIÓN
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [calendarConectado, setCalendarConectado] = useState(false); 
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [vapiAgentId, setVapiAgentId] = useState<string | null>(null);
  
  // 📊 ESTADOS PARA LAS MÉTRICAS REALES (Inician en Cero)
  const [metricas, setMetricas] = useState({
    leads: 0,
    citas: 0,
    horasAhorradas: 0,
    resolucion: 0
  });
  const [loadingMetricas, setLoadingMetricas] = useState(true);

  // SIMULACIÓN DE DATOS (Deberás pasar el ID real de la tienda que inició sesión)
  const [tiendaData] = useState({
    id: "tienda_123_demo", // ⚠️ Asegúrate de que este ID coincida con una tienda en tu DB para probar
    nombreClinica: "Clínica Demo"
  });

  // 🚀 BUSCAR MÉTRICAS EN TIEMPO REAL AL CARGAR
  useEffect(() => {
    const fetchMetricas = async () => {
      try {
        const res = await fetch(`/api/dashboard/metricas?tiendaId=${tiendaData.id}`);
        const data = await res.json();
        if (res.ok) {
          setMetricas({
            leads: data.leads || 0,
            citas: data.citas || 0,
            horasAhorradas: data.horasAhorradas || 0,
            resolucion: data.resolucion || 0
          });
        }
      } catch (error) {
        console.error("Error cargando métricas reales:", error);
      } finally {
        setLoadingMetricas(false);
      }
    };

    fetchMetricas();
  }, [tiendaData.id]);

  const handleConnectCalendar = () => {
    setIsConnectingCalendar(true);
    window.location.href = `/api/integraciones/google/auth?tiendaId=${tiendaData.id}`;
  };

  const handleCreateAgent = async () => {
    setIsCreatingAgent(true);
    try {
      const response = await fetch('/api/vapi/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tienda_id: tiendaData.id,
          nombre: nombreAgente || tiendaData.nombreClinica,
          promptMaestro: `Eres la recepcionista virtual de ${tiendaData.nombreClinica}. Tu objetivo es agendar citas amablemente.`,
          vozSeleccionada: "femenina_estrella"
        })
      });
      const data = await response.json();
      if (response.ok && data.success) setVapiAgentId(data.assistantId);
    } catch (error) {
      console.error("Fallo de red:", error);
    } finally {
      setIsCreatingAgent(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white relative overflow-hidden font-sans pb-20">
      {/* Luces de ambiente */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
      
      <div className="max-w-7xl mx-auto px-6 pt-12 relative z-10">
        
        {/* HEADER DEL DASHBOARD */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-white/5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> Sistema Operativo Activo
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              Centro de Mando {nombreAgente ? `de ${nombreAgente}` : 'Upway'}
            </h1>
            <p className="text-slate-400 text-sm mt-2">Métricas de impacto y telemetría de tu inteligencia artificial en tiempo real.</p>
          </div>
        </div>

        {/* 📊 KPI'S DE IMPACTO EN EL NEGOCIO (DATOS REALES) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          
          {/* KPI 1: Tiempo Ahorrado */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md transition-all hover:bg-white/[0.04]">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20"><Timer className="h-5 w-5 text-blue-400" /></div>
            </div>
            <p className="text-slate-400 text-sm font-medium">Tiempo Humano Ahorrado</p>
            <h3 className="text-3xl font-bold text-white mt-1">
              {loadingMetricas ? "..." : metricas.horasAhorradas} <span className="text-lg text-slate-500 font-normal">Horas</span>
            </h3>
            <p className="text-xs text-slate-500 mt-2">Calculado por volumen de gestión</p>
          </div>

          {/* KPI 2: Citas Agendadas */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md transition-all hover:bg-white/[0.04]">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20"><CalendarCheck className="h-5 w-5 text-emerald-400" /></div>
            </div>
            <p className="text-slate-400 text-sm font-medium">Citas Agendadas (Auto)</p>
            <h3 className="text-3xl font-bold text-white mt-1">
              {loadingMetricas ? "..." : metricas.citas}
            </h3>
            <p className="text-xs text-slate-500 mt-2">Registradas en el calendario</p>
          </div>

          {/* KPI 3: Leads Capturados */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md transition-all hover:bg-white/[0.04]">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20"><Users className="h-5 w-5 text-purple-400" /></div>
            </div>
            <p className="text-slate-400 text-sm font-medium">Pacientes Perfilados</p>
            <h3 className="text-3xl font-bold text-white mt-1">
              {loadingMetricas ? "..." : metricas.leads}
            </h3>
            <p className="text-xs text-slate-500 mt-2">Guardados en tu base de datos</p>
          </div>

          {/* KPI 4: Resolución Autónoma */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md transition-all hover:bg-white/[0.04]">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20"><PhoneCall className="h-5 w-5 text-rose-400" /></div>
            </div>
            <p className="text-slate-400 text-sm font-medium">Resolución Autónoma</p>
            <h3 className="text-3xl font-bold text-white mt-1">
              {loadingMetricas ? "..." : metricas.resolucion}<span className="text-lg text-slate-500 font-normal">%</span>
            </h3>
            <p className="text-xs text-slate-500 mt-2">Sin intervención humana</p>
          </div>
        </div>

        {/* ⚙️ CONTROLES Y CANALES */}
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-400" /> Estado Operativo y Canales
        </h2>
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          
          {/* Botón de Pánico */}
          <div className={`rounded-[32px] border transition-all duration-500 bg-white/[0.02] backdrop-blur-xl p-8 relative shadow-2xl flex flex-col justify-between ${iaActiva ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
            <div className={`absolute top-0 left-0 right-0 h-1 ${iaActiva ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Motor de Inferencia</span>
                <Bot className={`h-6 w-6 ${iaActiva ? 'text-emerald-400' : 'text-amber-400'}`} />
              </div>
              <div className="text-2xl font-bold text-white mb-2">{iaActiva ? 'Piloto Automático' : 'Control Manual'}</div>
              <p className="text-sm text-slate-400">
                {iaActiva ? 'La IA está respondiendo y agendando en tiempo real.' : 'IA en pausa. Estás respondiendo manualmente.'}
              </p>
            </div>
            <button onClick={() => setIaActiva(!iaActiva)} className={`mt-6 flex w-full justify-center gap-2 rounded-xl border px-4 py-3 font-bold transition-all ${iaActiva ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'}`}>
              <Power className="h-4 w-4" /> {iaActiva ? 'Pausar Inteligencia' : 'Reactivar Inteligencia'}
            </button>
          </div>

          {/* Conexión Meta / WhatsApp */}
          <div className="rounded-[32px] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 relative shadow-2xl flex flex-col justify-between group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600/50"></div>
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Canal de Texto</span>
                <MessageSquare className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-2">WhatsApp API</div>
              <p className="text-sm text-amber-400 bg-amber-400/10 w-fit px-3 py-1 rounded-full border border-amber-400/20 inline-flex items-center gap-1.5 mb-2">
                <ShieldCheck className="h-4 w-4" /> Desconectado
              </p>
            </div>
            <Link href="/dashboard/activacion" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 border border-white/5">
              <Rocket className="h-4 w-4" /> Configurar WhatsApp
            </Link>
          </div>
        </div>

        {/* 🔌 PLUG AND PLAY: INTEGRACIONES CRM Y VAPI */}
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-400" /> Integraciones Plug & Play
        </h2>
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* CEREBRO RAG */}
          <div className="rounded-[32px] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-5"><BookOpen className="h-3.5 w-3.5" /> Memoria</div>
              <h2 className="text-xl font-bold text-white mb-2">Cerebro Institucional</h2>
              <p className="text-slate-400 text-sm mb-6">Sube PDFs con los precios y servicios de tu clínica para que la IA responda con precisión.</p>
            </div>
            <button className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 font-semibold text-white hover:bg-white/10 text-sm">Gestionar Documentos</button>
          </div>

          {/* GOOGLE CALENDAR */}
          <div className="rounded-[32px] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-5"><Calendar className="h-3.5 w-3.5" /> Calendario</div>
              <h2 className="text-xl font-bold text-white mb-2">Google Calendar</h2>
              <p className="text-slate-400 text-sm mb-6">Conecta tu agenda para que la IA asigne los turnos validando tu disponibilidad.</p>
            </div>
            {calendarConectado ? (
              <div className="w-full flex justify-center items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 py-3 font-semibold text-emerald-400 text-sm">
                <CheckCircle2 className="h-5 w-5" /> Sincronizado
              </div>
            ) : (
              <button onClick={handleConnectCalendar} disabled={isConnectingCalendar} className="w-full rounded-2xl bg-white text-blue-700 py-3 font-bold hover:bg-slate-100 text-sm">
                {isConnectingCalendar ? "Conectando..." : "Sincronizar Agenda"}
              </button>
            )}
          </div>

          {/* VAPI - AGENTE DE VOZ */}
          <div className="rounded-[32px] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 mb-5"><Mic className="h-3.5 w-3.5" /> Recepcionista Telefónica</div>
              <h2 className="text-xl font-bold text-white mb-2">Activar Línea de Voz</h2>
              <p className="text-slate-400 text-sm mb-6">Despliega tu IA en una línea telefónica real conectada a tu CRM y Calendario.</p>
            </div>
            {vapiAgentId ? (
              <div className="w-full flex justify-center items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 py-3 font-semibold text-emerald-400 text-sm">
                <CheckCircle2 className="h-5 w-5" /> Activo (ID: {vapiAgentId.slice(0,6)}...)
              </div>
            ) : (
              <button onClick={handleCreateAgent} disabled={isCreatingAgent} className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white py-3 font-bold hover:opacity-90 text-sm">
                {isCreatingAgent ? "Fabricando..." : "Crear Agente de Voz"}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}