"use client";

import { useEffect, useState } from 'react';
import { Loader2, MessageSquareText, Phone, Save } from 'lucide-react';

type AgentPayload = {
  id: string;
  name: string;
  prompt: string;
  channels: { whatsapp: boolean; vapi: boolean };
  isAiActive: boolean;
  status: 'active' | 'standby' | 'paused';
};

const statusStyles: Record<AgentPayload['status'], string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  standby: 'border-amber-200 bg-amber-50 text-amber-700',
  paused: 'border-slate-200 bg-slate-100 text-slate-500',
};

const statusLabels: Record<AgentPayload['status'], string> = {
  active: 'Activo',
  standby: 'En espera',
  paused: 'Pausado',
};

export default function AgentsPage() {
  const [agent, setAgent] = useState<AgentPayload | null>(null);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const loadAgent = async () => {
      try {
        const res = await fetch('/api/health/agents');
        const data = await res.json();
        const first = data.items?.[0] as AgentPayload | undefined;
        if (first) {
          setAgent(first);
          setName(first.name);
          setPrompt(first.prompt);
        }
      } catch (error) {
        console.error('Error cargando el agente clínico:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAgent();
  }, []);

  const handleSave = async () => {
    if (!agent) return;
    if (!name.trim() || !prompt.trim()) {
      setFeedback('Completa el nombre y las reglas del agente antes de guardar.');
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/health/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, name, prompt }),
      });
      const data = await res.json();
      if (res.ok) {
        setAgent(data.agent);
        setFeedback('✅ Cambios guardados.');
      } else {
        setFeedback(data.error ?? 'No se pudo guardar el agente.');
      }
    } catch (error) {
      console.error('Error guardando el agente clínico:', error);
      setFeedback('Error de conexión al guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Agentes</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Perfil clínico del agente</h1>
      </div>

      {loading ? (
        <div className="upway-surface flex items-center gap-3 rounded-[26px] p-6 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando configuración del agente...
        </div>
      ) : !agent ? (
        <div className="upway-surface rounded-[26px] p-6 text-slate-600">
          Aún no tienes un agente configurado. Completa el onboarding para crear el primero.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="upway-surface rounded-[26px] p-5 md:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-11 w-11 rounded-2xl bg-[#edf4ff] text-[#1b5ed6] flex items-center justify-center font-bold">
                {name.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${statusStyles[agent.status]}`}>
                {statusLabels[agent.status]}
              </span>
            </div>
            <div className="text-xl font-black tracking-[-0.04em] text-slate-900">{agent.name}</div>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <MessageSquareText className="h-4 w-4" />
              WhatsApp: {agent.channels.whatsapp ? 'conectado' : 'sin conectar'}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <Phone className="h-4 w-4" />
              Vapi (voz): {agent.channels.vapi ? 'conectado' : 'sin conectar'}
            </div>
          </div>

          <div className="upway-surface rounded-[28px] p-5 md:col-span-2">
            <div className="mb-3 text-lg font-black tracking-[-0.04em] text-slate-900">Editar agente</div>

            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nombre del agente
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#1b5ed6] focus:outline-none"
              placeholder="Ej. Sophie Care"
            />

            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Reglas / prompt maestro (tono, triaje, políticas de cancelación, FAQs)
            </label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              maxLength={8000}
              rows={10}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#1b5ed6] focus:outline-none"
              placeholder="Describe el tono, las reglas de triaje, la política de cancelación y las FAQs que el agente debe seguir."
            />

            {feedback && <div className="mt-3 text-sm text-slate-600">{feedback}</div>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1b5ed6] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#164cae] disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar cambios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
