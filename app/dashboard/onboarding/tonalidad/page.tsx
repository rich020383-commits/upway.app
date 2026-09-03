"use client";

import React from 'react';
import { BrainCircuit, ArrowRight, Sparkles, MessageSquare } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Paso02Tonalidad() {
  const router = useRouter();
  const { tonoWhatsapp, setTonoWhatsapp } = useUpwayStore();

  const sliders = [
    { key: 'formalidad', label: 'Formalidad', min: 'Casual', max: 'Profesional' },
    { key: 'cercania', label: 'Cercanía', min: 'Distante', max: 'Amigable' },
    { key: 'persuasion', label: 'Persuasión', min: 'Informativo', max: 'Vendedor' },
  ];

  const getPreviewText = () => {
    const formal = tonoWhatsapp.formalidad ?? 50;
    const cercano = tonoWhatsapp.cercania ?? 50;
    const vendedor = tonoWhatsapp.persuasion ?? 50;

    if (formal > 70 && vendedor > 70) {
      return "Estimado cliente, es un placer saludarle. Contamos con disponibilidad inmediata para su proyecto con las mejores condiciones. ¿Desea que agendemos una asesoría?";
    } else if (cercano > 70 && vendedor > 70) {
      return "¡Hola! Qué gusto saludarte 😊. Tenemos unas opciones increíbles listas para ti hoy. ¿Te ayudo a asegurar tu cupo de una vez?";
    } else if (formal < 40) {
      return "¡Buenas! Claro que sí, por aquí te ayudo con eso de una. ¿Qué necesitas saber exactamente?";
    }
    return "Hola. Claro que sí, puedo ayudarte con eso. Tenemos disponibilidad para mañana a las 3:00 p. m. ¿Quieres que reservemos el espacio?";
  };

  return (
    <main className="relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(27,94,214,0.12),_transparent_28%),linear-gradient(180deg,_#f7faff_0%,_#eef5ff_100%)] pb-28 text-slate-900 selection:bg-[#1b5ed6]/25">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-10 md:px-10">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <BrainCircuit className="h-5 w-5 text-[#1b5ed6]" />
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
            <span className="font-semibold text-slate-900">02 / 05</span>
          </div>

          <div className="mb-8 flex gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-[#1b5ed6]" />
            <div className="h-1.5 flex-1 rounded-full bg-[#1b5ed6]" />
            <div className="h-1.5 flex-1 rounded-full bg-slate-200" />
            <div className="h-1.5 flex-1 rounded-full bg-slate-200" />
            <div className="h-1.5 flex-1 rounded-full bg-slate-200" />
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl font-black leading-[0.96] tracking-[-0.06em] text-slate-900 md:text-5xl">Personalidad y tono</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Define la actitud exacta con la que tu asistente interactuará con tus clientes en cada conversación.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.04)] md:p-6">
            {sliders.map((slider) => {
              const valorActual = tonoWhatsapp[slider.key as keyof typeof tonoWhatsapp] ?? 50;

              return (
                <div key={slider.key} className="space-y-3 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 md:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-slate-800">{slider.label}</label>
                    <span className="inline-flex items-center rounded-full border border-[#dfeaff] bg-[#edf4ff] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#1b5ed6]">
                      {valorActual}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={valorActual}
                    onChange={(e) => setTonoWhatsapp({ [slider.key]: parseInt(e.target.value) })}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#1b5ed6]"
                  />

                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
                    <span>{slider.min}</span>
                    <span>{slider.max}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.04)] md:p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Sparkles className="h-4 w-4 text-[#1b5ed6]" />
              <h3 className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Vista previa</h3>
            </div>

            <p className="mb-3 text-sm text-slate-600">Así responderá tu agente:</p>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700 italic shadow-inner">
              “{getPreviewText()}”
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[#dfeaff] bg-[#edf4ff] px-3 py-2 text-[11px] font-medium text-[#1b5ed6]">
              <MessageSquare className="h-4 w-4" />
              Actualización en tiempo real
            </div>
          </aside>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 md:px-10">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Paso 2 completado</div>
            <div className="mt-1 text-lg font-black tracking-[-0.05em] text-slate-900 md:text-xl">Personalidad calibrada</div>
          </div>

          <button
            onClick={() => router.push('/dashboard/onboarding/personalizacion')}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
}