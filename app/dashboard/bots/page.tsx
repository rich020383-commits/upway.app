"use client";

import React, { useState } from 'react';
import { Bot, MessageCircleMore, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AgentesBotPage() {
  const [nombreAgente, setNombreAgente] = useState('');
  const [promptMaestro, setPromptMaestro] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardarConfiguracion = async () => {
    if (!nombreAgente || !promptMaestro) {
      alert('Completa el nombre del agente y las reglas antes de guardar.');
      return;
    }

    setGuardando(true);
    try {
      const datosParaBackend = {
        tienda_id: '1172769935927318',
        nombre: nombreAgente,
        reglas: promptMaestro,
      };

      const respuesta = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaBackend),
      });

      if (respuesta.ok) {
        alert('El agente quedó configurado correctamente.');
      } else {
        alert('Hubo un problema al guardar la configuración.');
      }
    } catch (error) {
      console.error('Error conectando con el backend:', error);
      alert('No fue posible contactar con el servicio.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.13),_transparent_50%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/80 p-8 shadow-premium backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                <Bot className="h-4 w-4" />
                Agente IA premium
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Construye la voz de tu bot de WhatsApp</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">Define la personalidad de tu asistente, sus reglas operativas y su conexión con el negocio para ofrecer respuestas más inteligentes.</p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              <MessageCircleMore className="h-4 w-4" />
              Activar WhatsApp
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-premium">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Personalidad y reglas</h2>
                  <p className="text-sm text-slate-500">Da instrucciones claras para que la IA responda como tu marca.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nombre del agente</label>
                  <input type="text" value={nombreAgente} onChange={(e) => setNombreAgente(e.target.value)} placeholder="Ej. Asistente Upway" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-0 transition focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Prompt maestro</label>
                  <textarea value={promptMaestro} onChange={(e) => setPromptMaestro(e.target.value)} placeholder="Escribe las reglas, tono, prohibiciones y estilo de respuesta..." className="h-40 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500" />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-premium">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Base de conocimiento</h2>
                  <p className="text-sm text-slate-500">Conecta inventario, políticas y documentos para que el bot resuelva mejor.</p>
                </div>
              </div>
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm font-semibold text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700">
                <ArrowRight className="h-4 w-4" />
                Sincronizar inventario y documentos
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-premium">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300">
                <MessageCircleMore className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Inbox en vivo</h2>
                <p className="text-sm text-slate-400">Tu canal de conversación centralizado.</p>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/10 p-6 text-center">
              <p className="text-sm text-slate-300">Esperando mensajes entrantes...</p>
              <p className="mt-2 text-sm text-slate-400">Cuando los clientes escriban, verás el hilo aquí.</p>
            </div>

            <button onClick={guardarConfiguracion} disabled={guardando} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70">
              {guardando ? 'Guardando...' : 'Guardar y activar bot'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}