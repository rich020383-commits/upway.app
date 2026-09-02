'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const initialForm = {
  code: '',
  label: '',
  description: '',
  state: 'trial',
  type: 'trial',
  allowedRole: 'clinic-admin',
  isActive: true,
  expiresAt: '',
};

type AccessCodeRecord = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  state: string;
  type: string;
  allowedRole: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function BillingAccessCodesPage() {
  const { data: session, status } = useSession();
  const [codes, setCodes] = useState<AccessCodeRecord[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = useMemo(() => {
    const email = session?.user?.email?.toLowerCase();
    return email === 'revisor_meta@upway.business' || email === 'admin@upway.business';
  }, [session]);

  const loadCodes = async () => {
    const res = await fetch('/api/admin/access-codes', { method: 'GET' });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload.error || 'No se pudo cargar la lista de códigos.');
    }

    const payload = await res.json();
    setCodes(payload.codes ?? []);
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!isAdmin) return;

    loadCodes().catch((error) => {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error al cargar códigos.' });
    });
  }, [status, isAdmin]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          code: form.code.trim(),
          label: form.label.trim(),
          description: form.description.trim(),
          allowedRole: form.allowedRole.trim(),
          expiresAt: form.expiresAt || null,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || 'No se pudo guardar el código.');
      }

      setForm(initialForm);
      await loadCodes();
      setMessage({ type: 'success', text: 'Código guardado con éxito.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al guardar el código.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <main className="min-h-screen bg-slate-50 p-10 text-slate-900">Cargando…</main>;
  }

  if (!session || !isAdmin) {
    return (
      <main className="min-h-screen bg-slate-50 p-10 text-slate-900">
        <div className="mx-auto max-w-xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-rose-500">Acceso restringido</p>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.05em]">Sin permisos de administración</h1>
          <p className="mt-3 text-sm text-slate-600">Inicia sesión con una cuenta autorizada para gestionar códigos de acceso.</p>
          <Link href="/login" className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
            Ir a iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.12),_transparent_28%),linear-gradient(180deg,_#f5f9ff_0%,_#edf5ff_100%)] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#1b5ed6]">Administración</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.06em]">Códigos de acceso</h1>
          </div>
          <Link href="/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            Volver al panel
          </Link>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[30px] border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <h2 className="text-2xl font-black tracking-[-0.05em]">Crear / actualizar código</h2>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Código
                  <input
                    value={form.code}
                    onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1b5ed6]"
                    placeholder="UPWAY-TRIAL"
                    required
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Nombre visible
                  <input
                    value={form.label}
                    onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1b5ed6]"
                    placeholder="Prueba Upway"
                    required
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Descripción
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="mt-2 min-h-[90px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1b5ed6]"
                  placeholder="Acceso para clínicas pilotadas o clientes selectos."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block text-sm font-medium text-slate-700">
                  Estado inicial
                  <select
                    value={form.state}
                    onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1b5ed6]"
                  >
                    <option value="trial">TRIAL</option>
                    <option value="active">ACTIVE</option>
                    <option value="pending_payment">PENDING_PAYMENT</option>
                    <option value="paused">PAUSED</option>
                    <option value="suspended">SUSPENDED</option>
                    <option value="cancelled">CANCELLED</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Tipo
                  <select
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1b5ed6]"
                  >
                    <option value="trial">TRIAL</option>
                    <option value="invite">INVITE</option>
                    <option value="gift">GIFT</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Rol permitido
                  <select
                    value={form.allowedRole}
                    onChange={(event) => setForm((current) => ({ ...current, allowedRole: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1b5ed6]"
                  >
                    <option value="clinic-admin">clinic-admin</option>
                    <option value="operations-admin">operations-admin</option>
                    <option value="owner">owner</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <label className="block text-sm font-medium text-slate-700">
                  Fecha de expiración
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1b5ed6]"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-[#1b5ed6] focus:ring-[#1b5ed6]"
                  />
                  Activo
                </label>
              </div>

              {message && (
                <div className={`rounded-2xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#0d1727] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Guardando...' : 'Guardar código'}
              </button>
            </form>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <h2 className="text-2xl font-black tracking-[-0.05em]">Listado</h2>
            <div className="mt-6 space-y-3">
              {codes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  Todavía no hay códigos creados.
                </div>
              ) : (
                codes.map((code) => (
                  <div key={code.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-bold tracking-[0.08em] text-slate-800">{code.code}</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{code.label}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${code.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {code.isActive ? 'activo' : 'inactivo'}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">{code.description || 'Sin descripción.'}</p>

                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-1">{code.state}</span>
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-1">{code.type}</span>
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-1">rol: {code.allowedRole || 'clinic-admin'}</span>
                    </div>

                    {code.expiresAt && (
                      <p className="mt-3 text-xs text-slate-500">Expira: {new Date(code.expiresAt).toLocaleDateString('es-CO')}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
