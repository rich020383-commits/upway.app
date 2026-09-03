"use client";

import React, { Suspense, useMemo } from 'react';
import { MessageCircleMore, Headphones, CalendarDays, BarChart3, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore'; // Ajusta la ruta si es necesario
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link'; // 🚀 IMPORTACIÓN NUEVA
import { resolveVertical } from '../../../../lib/verticals';

const modulos = [
    {
      id: 'whatsapp',
      titulo: 'WhatsApp IA + CRM',
      descripcion: 'Captura, califica y responde leads con contexto de negocio.',
      precio: 399900,
      icon: <MessageCircleMore size={24} />
    },
    {
      id: 'voz',
      titulo: 'Agenda inteligente',
      descripcion: 'Coordina disponibilidad, citas y atención sin fricción.',
      precio: 599900,
      icon: <Headphones size={24} />
    },
    {
      id: 'calendario',
      titulo: 'Pipeline de leads',
      descripcion: 'Visualiza etapas, responsables y oportunidades por negocio.',
      precio: 39000,
      icon: <CalendarDays size={24} />
    },
    {
      id: 'analitica',
      titulo: 'Recordatorios automáticos',
      descripcion: 'Follow-up oportuno para cerrar más oportunidades sin perder tiempo.',
      precio: 19000,
      icon: <BarChart3 size={24} />
    },
    {
      id: 'rag',
      titulo: 'Inbox + citas + asignaciones',
      descripcion: 'Gestiona conversaciones, agenda y equipo en un flujo único.',
      precio: 0,
      icon: <Sparkles size={24} />
    },
  ];

function Paso01Infraestructura() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const segment = (searchParams.get('segment') ?? 'general').toLowerCase();
  const activeSegment = resolveVertical(segment);
  const { modulosSeleccionados, toggleModulo } = useUpwayStore();

  const totalMensual = useMemo(() => {
    return modulos.reduce((acc, curr) => {
      if (modulosSeleccionados.includes(curr.id)) {
        return acc + curr.precio;
      }
      return acc;
    }, 0);
  }, [modulosSeleccionados]);

  const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;

  return (
    // 🚀 OJO AQUÍ: Le agregué "relative" al inicio de las clases
    <main className="relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#edf4ff_100%)] text-slate-900 pb-32 font-sans selection:bg-[#1b5ed6] selection:text-white">
      
      <div className="absolute top-6 right-6 sm:top-8 sm:right-10 z-10">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#93c5fd] hover:text-[#1b5ed6]"
        >
          Ir al Panel
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="mx-auto max-w-5xl px-6 pt-12 md:pt-20">
        
        {/* Barra de progreso / Narrativa */}
        <div className="mb-12">
          <div className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span>Configuración de tu agente</span>
            <span className="h-1 w-1 rounded-full bg-slate-400"></span>
            <span className="text-slate-900">01 / 05</span>
            <span className="ml-auto rounded-full border border-[#dfeaff] bg-[#edf4ff] px-2 py-1 text-[10px] font-semibold text-[#1b5ed6]">
              {activeSegment.label}
            </span>
          </div>
          
          <div className="mb-10 flex gap-2">
            <div className="h-1 flex-1 rounded-full bg-[#1b5ed6]"></div>
            <div className="h-1 flex-1 rounded-full bg-slate-200"></div>
            <div className="h-1 flex-1 rounded-full bg-slate-200"></div>
            <div className="h-1 flex-1 rounded-full bg-slate-200"></div>
            <div className="h-1 flex-1 rounded-full bg-slate-200"></div>
          </div>
 
          <h1 className="mb-3 text-3xl font-black tracking-[-0.06em] text-slate-900 md:text-4xl">Infraestructura premium</h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Diseña una operación comercial con WhatsApp, agenda, pipeline y automatización conectados desde el inicio.
          </p>
        </div>

        {/* Grid de módulos premium */}
        <div className="grid gap-5 md:grid-cols-2">
          {modulos.map((m) => {
            const seleccionado = modulosSeleccionados.includes(m.id);
            const esGratis = m.precio === 0;

            return (
              <div
                key={m.id}
                onClick={() => toggleModulo(m.id)}
                className={`group flex cursor-pointer flex-col justify-between rounded-[26px] border p-5 transition-all duration-200 ${
                  seleccionado
                    ? 'border-[#bfd6ff] bg-[linear-gradient(180deg,#edf4ff_0%,#f8fbff_100%)] shadow-[0_18px_42px_rgba(27,94,214,0.08)]'
                    : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:shadow-[0_18px_42px_rgba(15,23,42,0.04)]'
                }`}
              >
                <div className="mb-5 flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                    seleccionado
                      ? 'bg-[#dfeaff] text-[#1b5ed6]'
                      : 'bg-slate-100 text-slate-500 group-hover:text-slate-700'
                  }`}>
                    {m.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <h3 className="text-[1.05rem] font-black tracking-[-0.04em] text-slate-900">{m.titulo}</h3>
                      {!esGratis && (
                        <span className="rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">{m.descripcion}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <div className="font-bold text-slate-900">
                    {esGratis ? (
                      <span className="text-sm font-semibold text-slate-500">Incluido</span>
                    ) : (
                      <span>
                        {fmt(m.precio)}
                        <span className="ml-1 text-xs font-medium text-slate-500">/ mes</span>
                      </span>
                    )}
                  </div>

                  <div className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-all ${
                    seleccionado
                      ? 'bg-[#dfeaff] text-[#1b5ed6]'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}>
                    {seleccionado ? (
                      <>
                        <Check size={14} strokeWidth={3} /> Activado
                      </>
                    ) : (
                      'Activar'
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Barra Inferior Persistente (Clear CTA) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/85 backdrop-blur-xl p-6 shadow-[0_-12px_35px_rgba(15,23,42,0.04)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Inversión mensual
            </p>
            <p className="text-3xl font-black tracking-[-0.06em] text-slate-900 md:text-4xl">
              {fmt(totalMensual)}
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/onboarding/tonalidad')}
            disabled={totalMensual === 0}
            className="flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 disabled:opacity-20"
          >
            Continuar <ArrowRight size={18} />
          </button>
        </div>
      </div>

    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07090C] text-white">Cargando...</div>}>
      <Paso01Infraestructura />
    </Suspense>
  );
}