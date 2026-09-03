"use client";

import React from 'react';
import { Store, Mic2, ArrowRight, Terminal, User, Sparkles, Phone, Bot } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Paso03Personalizacion() {
  const router = useRouter();
  const { 
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
    <main className="relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(27,94,214,0.12),_transparent_28%),linear-gradient(180deg,_#f7faff_0%,_#eef5ff_100%)] pb-28 text-slate-900 selection:bg-[#1b5ed6]/25">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-10 md:px-10">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <User className="h-5 w-5 text-[#1b5ed6]" />
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
            <span className="font-semibold text-slate-900">03 / 05</span>
          </div>

          <div className="mb-8 flex gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-[#1b5ed6]" />
            <div className="h-1.5 flex-1 rounded-full bg-[#1b5ed6]" />
            <div className="h-1.5 flex-1 rounded-full bg-[#1b5ed6]" />
            <div className="h-1.5 flex-1 rounded-full bg-slate-200" />
            <div className="h-1.5 flex-1 rounded-full bg-slate-200" />
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl font-black leading-[0.96] tracking-[-0.06em] text-slate-900 md:text-5xl">Identidad del agente</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Bautiza a tu empleado digital y define su marco operativo. Esta será la cara visible frente a tus clientes.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.04)] md:p-6">
              <h3 className="mb-5 flex items-center gap-2 text-lg font-bold tracking-[-0.04em] text-slate-900">
                <User className="h-5 w-5 text-[#1b5ed6]" />
                Perfil público
              </h3>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Nombre del asistente</label>
                  <input
                    type="text"
                    value={nombreAgente}
                    onChange={(e) => setNombreAgente(e.target.value)}
                    placeholder="Ej. Sofía"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1b5ed6] focus:ring-2 focus:ring-[#1b5ed6]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Industria</label>
                  <div className="relative">
                    <Store className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={nicho}
                      onChange={(e) => setNicho(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#1b5ed6] focus:ring-2 focus:ring-[#1b5ed6]/10"
                    >
                      <option value="general">Empresa General (Servicios)</option>
                      <option value="restaurante">Restaurante / Comidas</option>
                      <option value="ferreteria">Ferretería / Construcción</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.04)] md:p-6">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold tracking-[-0.04em] text-slate-900">
                <Phone className="h-5 w-5 text-[#1b5ed6]" />
                Notificaciones de humano
              </h3>
              <p className="mb-5 text-sm leading-6 text-slate-600">
                Ingresa tu número de WhatsApp para recibir alertas cuando un cliente requiera intervención humana.
              </p>

              <div>
                <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Celular del admin</label>
                <input
                  type="text"
                  value={telefonoAdmin || ''}
                  onChange={(e) => setTelefonoAdmin(e.target.value)}
                  placeholder="Ej. +573001234567"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1b5ed6] focus:ring-2 focus:ring-[#1b5ed6]/10"
                />
              </div>
            </div>

            {modulosSeleccionados.includes('voz') && (
              <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.04)] md:p-6">
                <h3 className="mb-5 flex items-center gap-2 text-lg font-bold tracking-[-0.04em] text-slate-900">
                  <Mic2 className="h-5 w-5 text-[#1b5ed6]" />
                  Síntesis de voz
                </h3>

                <label className="mb-3 block text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Género de la IA telefónica</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setVozSeleccionada('femenina')}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      vozSeleccionada === 'femenina'
                        ? 'border-[#bfd8ff] bg-[#edf4ff] text-[#1b5ed6]'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Femenina
                  </button>
                  <button
                    onClick={() => setVozSeleccionada('masculina')}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      vozSeleccionada === 'masculina'
                        ? 'border-[#bfd8ff] bg-[#edf4ff] text-[#1b5ed6]'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Masculina
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.04)] md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-bold tracking-[-0.04em] text-slate-900">
                  <Terminal className="h-5 w-5 text-[#1b5ed6]" />
                  Core operativo
                </h3>
                <span className="rounded-full border border-[#dfeaff] bg-[#edf4ff] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#1b5ed6]">
                  Prompt maestro
                </span>
              </div>

              <div className="mb-5 flex items-start gap-3 rounded-[20px] border border-[#dfeaff] bg-[#edf4ff] p-4">
                <Bot className="mt-0.5 h-5 w-5 shrink-0 text-[#1b5ed6]" />
                <div className="text-sm leading-6 text-slate-700">
                  <span className="font-semibold text-slate-900">¿No sabes cómo estructurar tu prompt?</span>
                  <div className="mt-1">
                    Abre el chat con <span className="font-semibold text-slate-900">Sophie</span> y dile de qué trata tu negocio. Ella escribirá el prompt maestro optimizado para ti.
                  </div>
                </div>
              </div>

              <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Instrucciones de comportamiento</label>
              <textarea
                value={promptMaestro}
                onChange={(e) => setPromptMaestro(e.target.value)}
                placeholder="Ej: Eres un vendedor experto..."
                className="h-32 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1b5ed6] focus:ring-2 focus:ring-[#1b5ed6]/10 md:h-40"
              />
            </div>
          </div>

          <aside className="lg:sticky lg:top-6">
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.04)] md:p-6">
              <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-3">
                <Sparkles className="h-4 w-4 text-[#1b5ed6]" />
                <h3 className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Vista previa</h3>
              </div>

              <div className="flex min-h-[180px] items-end rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex w-full items-end gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1b5ed6] to-[#6bb8ff] text-white shadow-sm">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 rounded-[20px] rounded-bl-none border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700 shadow-sm">
                    {getMensajePrueba()}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-slate-500">
                Así interactuará {nombreAgente || 'tu IA'} con tus clientes.
              </p>
            </div>
          </aside>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 md:px-10">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Paso 3 completado</div>
            <div className="mt-1 text-lg font-black tracking-[-0.05em] text-slate-900 md:text-xl">Identidad configurada</div>
          </div>

          <button
            onClick={() => router.push('/dashboard/onboarding/conocimiento')}
            disabled={!nombreAgente.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
}