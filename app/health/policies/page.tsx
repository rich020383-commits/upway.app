"use client";

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';

type Policy = {
  id: string;
  title: string;
  body: string;
  version: string;
  isRequired: boolean;
};

const emptyForm = { title: '', body: '', version: 'v1' };

export default function HealthPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health/policies');
      const data = await res.json();
      setPolicies(data.items ?? []);
    } catch (error) {
      console.error('Error cargando políticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setFeedback('Completa el título y el contenido antes de guardar.');
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/health/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setForm(emptyForm);
        setFeedback('✅ Política creada.');
        await loadPolicies();
      } else {
        setFeedback(data.error ?? 'No se pudo crear la política.');
      }
    } catch (error) {
      console.error('Error creando política:', error);
      setFeedback('Error de conexión al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRequired = async (policy: Policy) => {
    try {
      const res = await fetch('/api/health/policies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: policy.id, isRequired: !policy.isRequired }),
      });
      if (res.ok) await loadPolicies();
    } catch (error) {
      console.error('Error actualizando política:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/health/policies?id=${id}`, { method: 'DELETE' });
      if (res.ok) await loadPolicies();
    } catch (error) {
      console.error('Error eliminando política:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Políticas</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Control operativo</h1>
      </div>

      {loading ? (
        <div className="upway-surface flex items-center gap-3 rounded-[26px] p-6 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando políticas...
        </div>
      ) : policies.length === 0 ? (
        <div className="upway-surface rounded-[26px] p-6 text-slate-600">Aún no hay políticas configuradas.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {policies.map((policy) => (
            <div key={policy.id} className="upway-surface rounded-[24px] p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-lg font-black tracking-[-0.04em] text-slate-900">{policy.title}</div>
                <button onClick={() => handleDelete(policy.id)} className="text-slate-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm leading-7 text-slate-600">{policy.body}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{policy.version}</span>
                <button
                  onClick={() => handleToggleRequired(policy)}
                  className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${policy.isRequired ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                >
                  {policy.isRequired ? 'Obligatoria' : 'Opcional'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="upway-surface rounded-[28px] p-5">
        <div className="mb-3 text-lg font-black tracking-[-0.04em] text-slate-900">Nueva política</div>
        <div className="grid gap-3">
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Título (ej. Cancelación, Escalación, Cumplimiento)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#1b5ed6] focus:outline-none"
          />
          <textarea
            value={form.body}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
            placeholder="Descripción de la política"
            rows={3}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#1b5ed6] focus:outline-none"
          />
        </div>
        {feedback && <div className="mt-3 text-sm text-slate-600">{feedback}</div>}
        <button
          onClick={handleCreate}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1b5ed6] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#164cae] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Agregar política
        </button>
      </div>
    </div>
  );
}
