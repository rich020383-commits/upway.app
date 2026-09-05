"use client";

import React, { Suspense } from 'react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { resolveVertical } from '../../../../lib/verticals';
import { MODULO_LISTA } from '../../../../lib/modulos';
import { OnboardingProgress, SkipToPanelLink } from '../../../../components/onboarding/shared';

const paquetes = MODULO_LISTA;

function Paso01Infraestructura() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const segment = (searchParams.get('segment') ?? 'general').toLowerCase();
  const activeSegment = resolveVertical(segment);
  const { modulosSeleccionados, toggleModulo } = useUpwayStore();

  return (
    <main className="relative min-h-screen bg-[#F8FAFC] text-slate-900 pb-32 font-sans selection:bg-slate-900 selection:text-white">
      
      <SkipToPanelLink />

      <div className="mx-auto max-w-5xl px-6 pt-12 md:pt-20">
        <OnboardingProgress
          current={1}
          total={5}
          label="Configuración de Infraestructura"
          valueLabel={activeSegment.label}
          accentClass="bg-slate-900"
        />

        <h1 className="mb-4 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
          Infraestructura premium
        </h1>
        <p className="max-w-2xl text-lg text-slate-600 leading-relaxed">
          Diseña tu arquitectura operativa. Centraliza la atención, el agendamiento y los agentes inteligentes impulsados por <span className="font-bold text-slate-900 inline-flex items-center gap-1"><Sparkles size={16}/> Sophie v2</span>.
        </p>

        {/* Grid 2x2 Equilibrado */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {paquetes.map((p) => {
            const seleccionado = p.esBase || modulosSeleccionados.includes(p.id);
            
            return (
              <div
                key={p.id}
                onClick={() => !p.esBase && toggleModulo(p.id)}
                className={`group relative flex flex-col justify-between rounded-3xl border p-7 transition-all duration-300 ${p.esBase ? 'cursor-default' : 'cursor-pointer'} ${
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
                    </div>
                    <div className="mb-3">
                      {p.esBase ? (
                        <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          Base Incluida
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                          Modelo por Consumo
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">{p.descripcion}</p>
                  </div>
                </div>

                <ul className="mb-8 space-y-3 border-t border-slate-100 pt-6">
                  {p.capacidades.map((cap, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                      <Check size={18} strokeWidth={2.5} className="mt-0.5 shrink-0 text-slate-900" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5">
                  <div className="font-black text-slate-900 text-sm tracking-tight text-slate-500">
                    {p.esBase ? (
                      <span>Core OS Operativo</span>
                    ) : (
                      <span>Facturación flexible por uso</span>
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

      {/* Barra Inferior Persistente (Sin restricción de precios por ahora) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur-xl p-6 shadow-[0_-10px_40px_rgba(15,23,42,0.05)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Estado de arquitectura
            </p>
            <p className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
              Configuración modular lista
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/onboarding/tonalidad')}
            className="flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
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