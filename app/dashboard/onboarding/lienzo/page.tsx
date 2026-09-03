"use client";

import React, { Suspense, useMemo } from 'react';
import { MessageCircleMore, Headphones, Sparkles, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resolveVertical } from '../../../../lib/verticals';

const paquetes = [
  {
    id: 'workspace', // Base innegociable (siempre activo)
    titulo: 'Workspace Operativo Unificado',
    descripcion: 'El Command Center de tu negocio. La infraestructura base innegociable para dejar de perder oportunidades.',
    precio: 0,
    esBase: true,
    capacidades: [
      'Inbox unificado multicanal para todo el equipo.',
      'Pipeline visual de ventas por etapas reales.',
      'Gestión colaborativa con responsables asignados.',
      'Agenda comercial y estado de citas en vivo.',
      'Trazabilidad total de actividad y auditoría.'
    ],
    icon: <ShieldCheck size={28} className="text-slate-900" />
  },
  {
    id: 'whatsapp',
    titulo: 'Empleado Digital: WhatsApp IA',
    descripcion: 'Motor de captura, calificación y seguimiento automático 24/7. No dejes que ningún lead se enfríe.',
    precio: 399900,
    esBase: false,
    capacidades: [
      'Captura y perfilamiento de leads 24/7.',
      'Seguimiento y recordatorios automáticos de cierre.',
      'Contexto de CRM persistente en cada chat.',
      'Detección automática de intención de agendamiento.'
    ],
    icon: <MessageCircleMore size={28} />
  },
  {
    id: 'voz',
    titulo: 'Empleado Digital: Voz IA',
    descripcion: 'Recepcionista y agendadora telefónica autónoma. Escala tu atención sin aumentar la nómina.',
    precio: 599900,
    esBase: false,
    capacidades: [
      'Atención de llamadas entrantes con voz natural.',
      'Agendamiento y ventas por voz en tiempo real.',
      'Redirección inteligente a humanos (Casos críticos).',
      'Capacidad ilimitada de llamadas simultáneas.'
    ],
    icon: <Headphones size={28} />
  }
];

function Paso01Infraestructura() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const segment = (searchParams.get('segment') ?? 'general').toLowerCase();
  const activeSegment = resolveVertical(segment);
  const { modulosSeleccionados, toggleModulo } = useUpwayStore();

  const totalMensual = useMemo(() => {
    return paquetes.reduce((acc, curr) => {
      // El workspace es base (0), sumamos los premium seleccionados
      if (!curr.esBase && modulosSeleccionados.includes(curr.id)) {
        return acc + curr.precio;
      }
      return acc;
    }, 0);
  }, [modulosSeleccionados]);

  const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;

  return (
    <main className="relative min-h-screen bg-[#F8FAFC] text-slate-900 pb-32 font-sans selection:bg-slate-900 selection:text-white">
      
      {/* Botón Superior */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-10 z-10">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900"
        >
          Ir al Panel
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mx-auto max-w-5xl px-6 pt-12 md:pt-20">
        
        {/* Cabecera / Narrativa Corporativa */}
        <div className="mb-12">
          <div className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            <span>Configuración de Infraestructura</span>
            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
            <span className="text-slate-900">01 / 05</span>
            <span className="ml-auto rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
              {activeSegment.label}
            </span>
          </div>
          
          <div className="mb-10 flex gap-2">
            <div className="h-1 flex-1 rounded-full bg-slate-900"></div>
            <div className="h-1 flex-1 rounded-full bg-slate-200"></div>
            <div className="h-1 flex-1 rounded-full bg-slate-200"></div>
            <div className="h-1 flex-1 rounded-full bg-slate-200"></div>
            <div className="h-1 flex-1 rounded-full bg-slate-200"></div>
          </div>

          <h1 className="mb-4 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Infraestructura premium
          </h1>
          <p className="max-w-2xl text-lg text-slate-600 leading-relaxed">
            Diseña una operación comercial escalable. Centraliza tu atención, agenda y automatizaciones impulsadas por <span className="font-bold text-slate-900 flex items-center gap-1 inline-flex"><Sparkles size={16}/> Sophie v2</span>.
          </p>
        </div>

        {/* Grid de Infraestructura */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {paquetes.map((p) => {
            const seleccionado = p.esBase || modulosSeleccionados.includes(p.id);
            
            return (
              <div
                key={p.id}
                onClick={() => !p.esBase && toggleModulo(p.id)}
                className={`group relative flex flex-col justify-between rounded-3xl border p-7 transition-all duration-300 ${p.esBase ? 'md:col-span-2 cursor-default' : 'cursor-pointer'} ${
                  seleccionado
                    ? 'border-slate-900 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-900'
                    : 'border-slate-200 bg-white/50 hover:border-slate-400 hover:shadow-lg hover:bg-white'
                }`}
              >
                <div className="mb-6 flex items-start gap-5">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-colors ${
                    seleccionado
                      ? 'border-slate-100 bg-slate-50 text-slate-900'
                      : 'border-slate-100 bg-slate-50 text-slate-400 group-hover:text-slate-600'
                  }`}>
                    {p.icon}
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="text-xl font-bold tracking-tight text-slate-900">{p.titulo}</h3>
                      {p.esBase ? (
                        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          Base Incluida
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">{p.descripcion}</p>
                  </div>
                </div>

                {/* Lista de capacidades reales */}
                <ul className="mb-8 space-y-3 border-t border-slate-100 pt-6">
                  {p.capacidades.map((cap, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                      <Check size={18} strokeWidth={2.5} className="mt-0.5 shrink-0 text-slate-900" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5">
                  <div className="font-black text-slate-900 text-xl tracking-tight">
                    {p.esBase ? (
                      <span className="text-lg font-bold text-slate-400">Core OS</span>
                    ) : (
                      <span>
                        {fmt(p.precio)}
                        <span className="ml-1 text-sm font-medium text-slate-500">/ mes</span>
                      </span>
                    )}
                  </div>

                  <div className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                    seleccionado
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                  }`}>
                    {seleccionado ? (
                      <>
                        <Check size={16} strokeWidth={3} /> {p.esBase ? 'Instalado' : 'Activado'}
                      </>
                    ) : (
                      'Activar IA'
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Barra Inferior Persistente */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur-xl p-6 shadow-[0_-10px_40px_rgba(15,23,42,0.05)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Inversión operativa mensual
            </p>
            <p className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              {fmt(totalMensual)}
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/onboarding/tonalidad')}
            disabled={totalMensual === 0} // Mantiene la lógica: debe elegir al menos 1 agente premium para avanzar
            className="flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl disabled:opacity-30 disabled:hover:translate-y-0"
          >
            Continuar setup <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-900 font-bold">Cargando...</div>}>
      <Paso01Infraestructura />
    </Suspense>
  );
}