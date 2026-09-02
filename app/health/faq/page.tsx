"use client";

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';

type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  isPublished: boolean;
};

const emptyForm = { question: '', answer: '', category: 'general' };

export default function HealthFaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health/faq');
      const data = await res.json();
      setFaqs(data.items ?? []);
    } catch (error) {
      console.error('Error cargando FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  const handleCreate = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      setFeedback('Completa la pregunta y la respuesta antes de guardar.');
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/health/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setForm(emptyForm);
        setFeedback('✅ FAQ creada.');
        await loadFaqs();
      } else {
        setFeedback(data.error ?? 'No se pudo crear la FAQ.');
      }
    } catch (error) {
      console.error('Error creando FAQ:', error);
      setFeedback('Error de conexión al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (item: Faq) => {
    try {
      const res = await fetch('/api/health/faq', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isPublished: !item.isPublished }),
      });
      if (res.ok) await loadFaqs();
    } catch (error) {
      console.error('Error actualizando FAQ:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/health/faq?id=${id}`, { method: 'DELETE' });
      if (res.ok) await loadFaqs();
    } catch (error) {
      console.error('Error eliminando FAQ:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">FAQ</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Base de conocimiento</h1>
      </div>

      {loading ? (
        <div className="upway-surface flex items-center gap-3 rounded-[26px] p-6 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando base de conocimiento...
        </div>
      ) : faqs.length === 0 ? (
        <div className="upway-surface rounded-[26px] p-6 text-slate-600">Aún no hay preguntas frecuentes configuradas.</div>
      ) : (
        <div className="grid gap-4">
          {faqs.map((item) => (
            <div key={item.id} className="upway-surface rounded-[24px] p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-lg font-black tracking-[-0.04em] text-slate-900">{item.question}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePublish(item)}
                    className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {item.isPublished ? 'Publicada' : 'Oculta'}
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm leading-7 text-slate-600">{item.answer}</p>
            </div>
          ))}
        </div>
      )}

      <div className="upway-surface rounded-[28px] p-5">
        <div className="mb-3 text-lg font-black tracking-[-0.04em] text-slate-900">Nueva pregunta frecuente</div>
        <div className="grid gap-3">
          <input
            value={form.question}
            onChange={(event) => setForm({ ...form, question: event.target.value })}
            placeholder="Pregunta"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#1b5ed6] focus:outline-none"
          />
          <textarea
            value={form.answer}
            onChange={(event) => setForm({ ...form, answer: event.target.value })}
            placeholder="Respuesta"
            rows={3}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#1b5ed6] focus:outline-none"
          />
          <input
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            placeholder="Categoría (ej. general, citas, pagos)"
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
          Agregar FAQ
        </button>
      </div>
    </div>
  );
}
