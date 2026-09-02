"use client";

import React, { useState, useEffect } from 'react';
import { Store, Mic2, ArrowRight, Terminal, User, Sparkles, Phone, Bot } from 'lucide-react';
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

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const getMensajePrueba = () => {
    const nombre = nombreAgente.trim() || 'tu asistente virtual';
    let empresa = 'nuestra empresa';
    if (nicho === 'restaurante') empresa = 'nuestro restaurante';
    if (nicho === 'ferreteria') empresa = 'la ferretería';
    
    return `Hola, soy ${nombre} de ${empresa}. Estoy aquí para ayudarte a gestionar tus pedidos, agendar citas o resolver cualquier duda que tengas. ¿En qué te puedo colaborar hoy?`;
  };

  if (!isMounted) return null;

  return (
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

      <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-4 mt-8 md:mt-4 overflow-y-auto no-scrollbar">
        
        {/* Barra de progreso / Narrativa */}
        <div className="mb-8 md:mb-10">
          <div className="flex items-center gap-3 text-[#8994A6] text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-4 md:mb-6">
            <span>Configuración de tu agente</span>
            <span className="w-1 h-1 rounded-full bg-[#8994A6]"></span>
            <span className="text-[#F5F7FA]">03 / 05</span>
          </div>
          
          <div className="flex gap-2 mb-6 md:mb-8 max-w-4xl">
            <div className="h-1 flex-1 bg-[#9B5CFF] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#9B5CFF] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#9B5CFF] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#1E293B] rounded-full"></div>
          </div>

          <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-2 md:mb-3">Identidad del Agente</h1>
          <p className="text-[#8994A6] text-sm md:text-base max-w-2xl">
            Bautiza a tu empleado digital y define su marco operativo. Esta será la cara visible frente a tus clientes.
          </p>
        </div>

        {/* Layout de dos columnas */}
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-10 pb-6">
          
          {/* COLUMNA IZQUIERDA: Formulario */}
          <div className="lg:col-span-3 space-y-5 md:space-y-6">
            
            {/* Card: Perfil Básico */}
            <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-5 md:p-6">
              <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6 flex items-center gap-2">
                <User className="text-[#9B5CFF] h-5 w-5" /> Perfil Público
              </h3>
              
              <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                <div>
                  <label className="block font-medium text-[#8994A6] mb-2 uppercase tracking-wider text-[10px] md:text-xs">Nombre del Negocio</label>
                  <input 
                    type="text" 
                    value={nombreNegocio} 
                    onChange={(e) => setNombreNegocio(e.target.value)} 
                    placeholder="Ej. Clínica Selecta" 
                    className="w-full rounded-xl border border-[#1E293B] bg-[#07090C] px-4 py-3 text-sm text-[#F5F7FA] placeholder-[#8994A6]/50 outline-none transition-all focus:border-[#9B5CFF] focus:ring-1 focus:ring-[#9B5CFF]" 
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#8994A6] mb-2 uppercase tracking-wider text-[10px] md:text-xs">Nombre del Asistente</label>
                  <input 
                    type="text" 
                    value={nombreAgente} 
                    onChange={(e) => setNombreAgente(e.target.value)} 
                    placeholder="Ej. Sofía" 
                    className="w-full rounded-xl border border-[#1E293B] bg-[#07090C] px-4 py-3 text-sm text-[#F5F7FA] placeholder-[#8994A6]/50 outline-none transition-all focus:border-[#9B5CFF] focus:ring-1 focus:ring-[#9B5CFF]" 
                  />
                </div>
                
                <div>
                  <label className="block font-medium text-[#8994A6] mb-2 uppercase tracking-wider text-[10px] md:text-xs">Industria</label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8994A6]" />
                    <select 
                      value={nicho} 
                      onChange={(e) => setNicho(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#1E293B] bg-[#07090C] pl-10 pr-4 py-3 text-sm text-[#F5F7FA] outline-none transition-all focus:border-[#9B5CFF] focus:ring-1 focus:ring-[#9B5CFF] cursor-pointer"
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
            <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-5 md:p-6">
              <h3 className="text-base md:text-lg font-semibold mb-2 flex items-center gap-2">
                <Phone className="text-[#9B5CFF] h-5 w-5" /> Notificaciones de Humano (Handoff)
              </h3>
              <p className="text-[#8994A6] text-xs md:text-sm mb-4 md:mb-5">
                Ingresa tu número de WhatsApp para recibir alertas cuando un cliente requiera intervención humana.
              </p>
              
              <div>
                <label className="block font-medium text-[#8994A6] mb-2 uppercase tracking-wider text-[10px] md:text-xs">Celular del Admin (con código de país)</label>
                <input 
                  type="text" 
                  value={telefonoAdmin || ''} 
                  onChange={(e) => setTelefonoAdmin(e.target.value)} 
                  placeholder="Ej. +573001234567" 
                  className="w-full rounded-xl border border-[#1E293B] bg-[#07090C] px-4 py-3 text-sm text-[#F5F7FA] placeholder-[#8994A6]/50 outline-none transition-all focus:border-[#9B5CFF] focus:ring-1 focus:ring-[#9B5CFF]" 
                />
              </div>
            </div>

            {/* Card: Voz (Condicional) */}
            {modulosSeleccionados.includes('voz') && (
              <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-5 md:p-6">
                <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-5 flex items-center gap-2">
                  <Mic2 className="text-[#9B5CFF] h-5 w-5" /> Síntesis de Voz
                </h3>
                <label className="block font-medium text-[#8994A6] mb-3 uppercase tracking-wider text-[10px] md:text-xs">Género de la IA Telefónica</label>
                <div className="flex gap-3 md:gap-4">
                  <button 
                    onClick={() => setVozSeleccionada('femenina')}
                    className={`flex-1 py-3 rounded-xl border transition-all font-medium text-xs md:text-sm ${
                      vozSeleccionada === 'femenina' 
                        ? 'bg-[#9B5CFF]/10 border-[#9B5CFF] text-[#9B5CFF]' 
                        : 'bg-[#07090C] border-[#1E293B] text-[#8994A6] hover:border-[#8994A6]/50'
                    }`}
                  >
                    Femenina
                  </button>
                  <button 
                    onClick={() => setVozSeleccionada('masculina')}
                    className={`flex-1 py-3 rounded-xl border transition-all font-medium text-xs md:text-sm ${
                      vozSeleccionada === 'masculina' 
                        ? 'bg-[#9B5CFF]/10 border-[#9B5CFF] text-[#9B5CFF]' 
                        : 'bg-[#07090C] border-[#1E293B] text-[#8994A6] hover:border-[#8994A6]/50'
                    }`}
                  >
                    Masculina
                  </button>
                </div>
              </div>
            )}

            {/* Card: Instrucciones Maestro */}
            <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-5 md:p-6">
              <div className="flex justify-between items-center mb-4 md:mb-5">
                <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                  <Terminal className="text-[#9B5CFF] h-5 w-5" /> Core Operativo
                </h3>
                <span className="text-[9px] md:text-[10px] uppercase tracking-wider font-bold text-[#9B5CFF] bg-[#9B5CFF]/10 px-2 py-1 rounded-md border border-[#9B5CFF]/20">Prompt Maestro</span>
              </div>

              {/* 🔥 BANNER DE AYUDA SOPHIE */}
              <div className="mb-5 bg-gradient-to-r from-[#9B5CFF]/10 to-transparent border border-[#9B5CFF]/30 rounded-xl p-4 flex gap-3 items-start">
                <Bot className="text-[#9B5CFF] h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-xs md:text-sm text-[#8994A6] leading-relaxed">
                  <strong className="text-[#F5F7FA]">¿No sabes cómo estructurar tu prompt?</strong><br/>
                  Abre el chat con <strong>Sophie</strong> (en el botón flotante) y dile de qué trata tu negocio. Ella escribirá el código maestro optimizado por ti. También puedes preguntarle cualquier duda sobre estos pasos de activación.
                </div>
              </div>

              <label className="block font-medium text-[#8994A6] mb-2 uppercase tracking-wider text-[10px] md:text-xs">Instrucciones de comportamiento</label>
              <textarea 
                value={promptMaestro} 
                onChange={(e) => setPromptMaestro(e.target.value)} 
                placeholder="Ej: Eres un vendedor experto. Tu objetivo es agendar citas, responder amablemente y nunca ofrecer descuentos no autorizados..." 
                className="h-32 md:h-40 w-full resize-none rounded-xl border border-[#1E293B] bg-[#07090C] px-4 py-3 text-sm text-[#F5F7FA] placeholder-[#8994A6]/50 outline-none transition-all focus:border-[#9B5CFF] focus:ring-1 focus:ring-[#9B5CFF]" 
              />
            </div>

          </div>

          {/* COLUMNA DERECHA: Live Preview Sticky */}
          <div className="lg:col-span-2">
            <div className="sticky top-4 bg-[#0D1117] border border-[#1E293B] rounded-2xl p-5 md:p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-5 border-b border-[#1E293B] pb-3 md:pb-4">
                <Sparkles className="h-4 w-4 text-[#9B5CFF]" />
                <h3 className="text-xs md:text-sm font-semibold uppercase tracking-widest text-[#8994A6]">Vista Previa</h3>
              </div>
              
              <div className="bg-[#07090C] border border-[#1E293B]/50 rounded-xl p-4 min-h-[160px] md:min-h-[200px] flex flex-col justify-end">
                <div className="flex gap-3 items-end">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9B5CFF] to-[#19C8E8] flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-[#1E293B]/50 border border-[#1E293B] rounded-2xl rounded-bl-none p-3 md:p-4 text-xs md:text-sm text-[#F5F7FA] leading-relaxed shadow-sm">
                    {getMensajePrueba()}
                  </div>
                </div>
              </div>

              <div className="mt-4 md:mt-5 text-center">
                <p className="text-[10px] md:text-xs text-[#8994A6]">Así interactuará {nombreAgente || 'tu IA'} con tus clientes.</p>
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