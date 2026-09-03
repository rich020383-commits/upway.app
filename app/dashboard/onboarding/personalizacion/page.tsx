"use client";

import React from 'react';
import { Mic2, ArrowRight, Terminal, User, Sparkles, Phone, Bot, Store } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Paso03Personalizacion() {
  const router = useRouter();
  const { 
    nombreNegocio, setNombreNegocio,
    nombreAgente, setNombreAgente, 
    nicho, setNicho, 
    promptMaestro, setPromptMaestro,
    vozSeleccionada, setVozSeleccionada,
    modulosSeleccionados,
    telefonoAdmin, setTelefonoAdmin 
  } = useUpwayStore();

  const getMensajePrueba = () => {
    const nombre = nombreAgente.trim() || 'tu asistente virtual';
    let empresa = 'nuestra empresa';
    if (nicho === 'restaurante') empresa = 'nuestro restaurante';
    if (nicho === 'ferreteria') empresa = 'la ferretería';
    
    return `Hola, soy ${nombre} de ${empresa}. Estoy aquí para ayudarte a gestionar tus pedidos, agendar citas o resolver cualquier duda que tengas. ¿En qué te puedo colaborar hoy?`;
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#edf4ff_100%)] text-slate-900">
      
      <div className="absolute top-4 right-4 z-50 md:top-6 md:right-8">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#93c5fd] hover:text-[#1b5ed6] md:px-5 md:py-2.5 md:text-sm"
        >
          Ir al Panel
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
 
      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-y-auto px-6 py-4 pt-12 md:mt-4 md:pt-10 no-scrollbar">
        
        <div className="mb-8 w-full md:mb-10">
          <div className="mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 md:mb-6 md:text-xs">
            <span>Configuración de tu agente</span>
            <span className="h-1 w-1 rounded-full bg-slate-400"></span>
            <span className="text-slate-900">03 / 05</span>
          </div>
          
          <div className="mb-6 flex max-w-4xl gap-2 md:mb-8">
            <div className="h-1 flex-1 rounded-full bg-[#1b5ed6]"></div>
            <div className="h-1 flex-1 rounded-full bg-[#1b5ed6]"></div>
            <div className="h-1 flex-1 rounded-full bg-[#1b5ed6]"></div>
            <div className="h-1 flex-1 rounded-full bg-slate-200"></div>
            <div className="h-1 flex-1 rounded-full bg-slate-200"></div>
          </div>
 
          <h1 className="mb-2 text-2xl font-black tracking-[-0.05em] text-slate-900 md:mb-3 md:text-4xl">Identidad del Agente</h1>
          <p className="max-w-2xl text-sm text-slate-600 md:text-base">
            Bautiza a tu empleado digital y define su marco operativo. Esta será la cara visible frente a tus clientes.
          </p>
        </div>

        <div className="grid gap-6 pb-6 lg:grid-cols-5 lg:gap-10">
          
          {/* COLUMNA IZQUIERDA: Formulario */}
          <div className="lg:col-span-3 space-y-5 md:space-y-6">
            
            {/* Card: Perfil Básico */}
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.04)] md:p-6">
              <h3 className="mb-4 flex items-center gap-2 text-base font-bold tracking-[-0.04em] text-slate-900 md:mb-6 md:text-lg">
                <User className="h-5 w-5 text-[#1b5ed6]" /> Perfil Público
              </h3>
              
              <div className="grid gap-5 md:grid-cols-2 md:gap-6">
                <div>
                  <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 md:text-xs">Nombre del Negocio</label>
                  <input 
                    type="text" 
                    value={nombreNegocio} 
                    onChange={(e) => setNombreNegocio(e.target.value)} 
                    placeholder="Ej. Clínica Selecta" 
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#93c5fd] focus:ring-4 focus:ring-[#dfeaff]" 
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 md:text-xs">Nombre del Asistente</label>
                  <input 
                    type="text" 
                    value={nombreAgente} 
                    onChange={(e) => setNombreAgente(e.target.value)} 
                    placeholder="Ej. Sofía" 
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#93c5fd] focus:ring-4 focus:ring-[#dfeaff]" 
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 md:text-xs">Industria</label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select 
                      value={nicho} 
                      onChange={(e) => setNicho(e.target.value)}
                      className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-[#93c5fd] focus:ring-4 focus:ring-[#dfeaff]"
                    >
                      <option value="general">Empresa General (Servicios)</option>
                      <option value="restaurante">Restaurante / Comidas</option>
                      <option value="ferreteria">Ferretería / Construcción</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Notificación Handoff */}
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.04)] md:p-6">
              <h3 className="mb-2 flex items-center gap-2 text-base font-bold tracking-[-0.04em] text-slate-900 md:text-lg">
                <Phone className="h-5 w-5 text-[#1b5ed6]" /> Notificaciones de Humano (Handoff)
              </h3>
              <p className="mb-4 text-xs text-slate-600 md:mb-5 md:text-sm">
                Ingresa tu número de WhatsApp para recibir alertas cuando un cliente requiera intervención humana.
              </p>
              
              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 md:text-xs">Celular del Admin (con código de país)</label>
                <input 
                  type="text" 
                  value={telefonoAdmin || ''} 
                  onChange={(e) => setTelefonoAdmin(e.target.value)} 
                  placeholder="Ej. +573001234567" 
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#93c5fd] focus:ring-4 focus:ring-[#dfeaff]" 
                />
              </div>
            </div>

            {/* Card: Voz (Condicional) */}
            {modulosSeleccionados.includes('voz') && (
              <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.04)] md:p-6">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold tracking-[-0.04em] text-slate-900 md:mb-5 md:text-lg">
                  <Mic2 className="h-5 w-5 text-[#1b5ed6]" /> Síntesis de Voz
                </h3>
                <label className="mb-3 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 md:text-xs">Género de la IA Telefónica</label>
                <div className="flex gap-3 md:gap-4">
                  <button 
                    onClick={() => setVozSeleccionada('femenina')}
                    className={`flex-1 rounded-2xl border py-3 text-xs font-semibold transition-all md:text-sm ${
                      vozSeleccionada === 'femenina' 
                        ? 'border-[#93c5fd] bg-[#edf4ff] text-[#1b5ed6]' 
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Femenina
                  </button>
                  <button 
                    onClick={() => setVozSeleccionada('masculina')}
                    className={`flex-1 rounded-2xl border py-3 text-xs font-semibold transition-all md:text-sm ${
                      vozSeleccionada === 'masculina' 
                        ? 'border-[#93c5fd] bg-[#edf4ff] text-[#1b5ed6]' 
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Masculina
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.04)] md:p-6">
              <div className="mb-4 flex items-center justify-between md:mb-5">
                <h3 className="flex items-center gap-2 text-base font-bold tracking-[-0.04em] text-slate-900 md:text-lg">
                  <Terminal className="h-5 w-5 text-[#1b5ed6]" /> Core Operativo
                </h3>
                <span className="rounded-md border border-[#dfeaff] bg-[#edf4ff] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#1b5ed6] md:text-[10px]">Prompt Maestro</span>
              </div>

              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#dfeaff] bg-gradient-to-r from-[#edf4ff] to-transparent p-4">
                <Bot className="mt-0.5 h-5 w-5 shrink-0 text-[#1b5ed6]" />
                <div className="text-xs leading-relaxed text-slate-600 md:text-sm">
                  <strong className="text-slate-900">¿No sabes cómo estructurar tu prompt?</strong><br/>
                  Abre el chat con <strong>Sophie</strong> (en el botón flotante) y dile de qué trata tu negocio. Ella escribirá el código maestro optimizado por ti. También puedes preguntarle cualquier duda sobre estos pasos de activación.
                </div>
              </div>

              <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 md:text-xs">Instrucciones de comportamiento</label>
              <textarea 
                value={promptMaestro} 
                onChange={(e) => setPromptMaestro(e.target.value)} 
                placeholder="Ej: Eres un vendedor experto. Tu objetivo es agendar citas, responder amablemente y nunca ofrecer descuentos no autorizados..." 
                className="h-32 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#93c5fd] focus:ring-4 focus:ring-[#dfeaff] md:h-40" 
              />
            </div>

          </div>

          {/* COLUMNA DERECHA: Live Preview Sticky */}
          <div className="lg:col-span-2">
            <div className="sticky top-4 rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-6">
              <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-3 md:pb-4">
                <Sparkles className="h-4 w-4 text-[#1b5ed6]" />
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:text-sm">Vista Previa</h3>
              </div>
               
              <div className="flex min-h-[160px] flex-col justify-end rounded-[20px] border border-slate-200 bg-slate-50 p-4 md:min-h-[200px]">
                <div className="flex items-end gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1b5ed6] to-[#60a5fa] shadow-lg">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-2xl rounded-bl-none border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-800 shadow-sm md:p-4 md:text-sm">
                    {getMensajePrueba()}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center md:mt-5">
                <p className="text-[10px] text-slate-500 md:text-xs">Así interactuará {nombreAgente || 'tu IA'} con tus clientes.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 🔥 BARRA INFERIOR */}
      <div className="shrink-0 w-full bg-[#07090C]/90 backdrop-blur-xl border-t border-[#1E293B] px-6 py-4 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-[#8994A6] text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-1">
              Paso 3 completado
            </p>
            <p className="text-lg md:text-xl font-bold text-[#F5F7FA]">
              Identidad configurada
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/onboarding/conocimiento')}
            disabled={!nombreAgente.trim() || !nombreNegocio.trim()}
            className="bg-[#F5F7FA] text-[#07090C] px-6 py-2.5 md:px-8 md:py-3.5 rounded-xl font-bold hover:bg-[#E2E8F0] transition-colors disabled:opacity-20 flex items-center gap-2 text-sm md:text-base"
          >
            Continuar <ArrowRight size={18} />
          </button>
        </div>
      </div>
      
    </div>
  );
}