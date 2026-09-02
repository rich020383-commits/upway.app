"use client";

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';

type TriageRule = {
  id: string;
  name: string;
  condition: string;
  severity: string;
  action: string;
  isActive: boolean;
};

const severityStyles: Record<string, string> = {
  critical: 'border-red-200 bg-red-50 text-red-700',
  high: 'border-orange-200 bg-orange-50 text-orange-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-slate-200 bg-slate-100 text-slate-600',
};

const emptyForm = { name: '', condition: '', severity: 'medium', action: '' };

export default function HealthTriagePage() {
  const [rules, setRules] = useState<TriageRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health/triage');
      const data = await res.json();
      setRules(data.items ?? []);
    } catch (error) {
      console.error('Error cargando reglas de triaje:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.condition.trim() || !form.action.trim()) {
      setFeedback('Completa nombre, condición y acción antes de guardar.');
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/health/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setForm(emptyForm);
        setFeedback('✅ Regla creada.');
        await loadRules();
      } else {
        setFeedback(data.error ?? 'No se pudo crear la regla.');
      }
    } catch (error) {
      console.error('Error creando regla de triaje:', error);
      setFeedback('Error de conexión al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule: TriageRule) => {
    try {
      const res = await fetch('/api/health/triage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, isActive: !rule.isActive }),
      });
      if (res.ok) await loadRules();
    } catch (error) {
      console.error('Error actualizando regla de triaje:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/health/triage?id=${id}`, { method: 'DELETE' });
      if (res.ok) await loadRules();
    } catch (error) {
      console.error('Error eliminando regla de triaje:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Triage</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Reglas de clasificación</h1>
      </div>

      {loading ? (
        <div className="upway-surface flex items-center gap-3 rounded-[26px] p-6 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando reglas de triaje...
        </div>
      ) : rules.length === 0 ? (
        <div className="upway-surface rounded-[26px] p-6 text-slate-600">Aún no hay reglas de triaje configuradas.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rules.map((rule) => (
            <div key={rule.id} className="upway-surface rounded-[24px] p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${severityStyles[rule.severity] ?? severityStyles.medium}`}>
                  {rule.severity}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(rule)}
                    className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${rule.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {rule.isActive ? 'Activa' : 'Inactiva'}
                  </button>
                  <button onClick={() => handleDelete(rule.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm font-bold text-slate-900">{rule.name}</div>
              <p className="mt-2 text-sm leading-6 text-slate-700"><strong>Condición:</strong> {rule.condition}</p>
              <p className="mt-1 text-sm leading-6 text-slate-700"><strong>Acción:</strong> {rule.action}</p>
            </div>
          ))}
        </div>
      )}

      <div className="upway-surface rounded-[28px] p-5">
        <div className="mb-3 text-lg font-black tracking-[-0.04em] text-slate-900">Nueva regla de triaje</div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Nombre de la regla"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#1b5ed6] focus:outline-none"
          />
          <select
            value={form.severity}
            onChange={(event) => setForm({ ...form, severity: event.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#1b5ed6] focus:outline-none"
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </select>
          <textarea
            value={form.condition}
            onChange={(event) => setForm({ ...form, condition: event.target.value })}
            placeholder="Condición (ej. dolor intenso, sangrado, embarazo con síntomas)"
            rows={3}
            className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#1b5ed6] focus:outline-none"
          />
          <textarea
            value={form.action}
            onChange={(event) => setForm({ ...form, action: event.target.value })}
            placeholder="Acción (ej. escalar a humano, priorizar respuesta)"
            rows={3}
            className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#1b5ed6] focus:outline-none"
          />
        </div>
        {feedback && <div className="mt-3 text-sm text-slate-600">{feedback}</div>}
        <button
          onClick={handleCreate}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1b5ed6] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#164cae] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Agregar regla
        </button>
      </div>
    </div>
  );
}
