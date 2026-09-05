"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { resolvePostLoginRoute, resolveVertical } from '../../lib/verticals';

function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const segment = searchParams.get('segment') ?? 'general';
  const requestedNext = searchParams.get('next');
  const nextRoute = requestedNext && requestedNext.startsWith('/') ? requestedNext : resolvePostLoginRoute(segment);
  const activeSegment = useMemo(() => resolveVertical(segment), [segment]);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      name,
      businessName,
      email,
      password,
      segment,
    };

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo crear la cuenta.');
      return;
    }

    router.push(`/login?next=${encodeURIComponent(nextRoute)}`);
  }

  return (
    <main className="upway-shell min-h-screen overflow-hidden px-6 py-10 text-slate-900">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white/70 shadow-[0_30px_80px_rgba(11,23,39,0.10)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden bg-[#0d1727] p-8 text-white md:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(123,176,255,0.25),_transparent_36%),linear-gradient(135deg,_rgba(17,24,39,0.7),_rgba(8,15,28,0.96))]" />
          <div className="absolute inset-0 opacity-30 upway-grid-pattern" />

          <div className="relative z-10 flex h-full flex-col justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-100/80">
                <span className="h-2 w-2 rounded-full bg-[#9fd4ff] shadow-[0_0_12px_rgba(159,212,255,0.8)]" />
                Upway · Solicitud de acceso
              </div>

              <div className="mt-8 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/8 shadow-[0_15px_40px_rgba(17,24,39,0.38)]">
                  <Image src="/upway.png" alt="Logo Upway" width={40} height={40} className="object-contain" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-slate-200/70">Upway</div>
                  <div className="text-xl font-black tracking-[-0.05em]">Business Control</div>
                </div>
              </div>
            </div>

            <div>
              <h1 className="max-w-sm text-4xl font-black leading-[0.95] tracking-[-0.06em] md:text-5xl">
                Construye tu operación con confianza.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-slate-200/80">
                Crea tu acceso a una plataforma premium para atención médica, coordinación y automatización con un nivel de servicio humano, claro y escalable.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1b5ed6]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-200/70">Segmento</div>
                  <div className="font-semibold text-white">{activeSegment.label}</div>
                  <div className="mt-1 text-sm text-slate-200/75">{activeSegment.description}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f8fbff] p-8 md:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dfeaff] bg-[#edf4ff] px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[#1b5ed6]">
                <span className="h-2 w-2 rounded-full bg-[#1b5ed6]" />
                Crear cuenta
              </div>
              <h2 className="text-3xl font-black tracking-[-0.05em] text-slate-900">Empieza hoy</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Completa tus datos y accede a tu centro de mando inteligente para {activeSegment.label.toLowerCase()}.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500">Nombre del responsable</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#1b5ed6] focus:ring-4 focus:ring-[#dfeaff]"
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500">Nombre de la clínica o negocio</label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#1b5ed6] focus:ring-4 focus:ring-[#dfeaff]"
                  placeholder={segment === 'health' ? 'Centro Médico Santa Lucía' : 'Tu negocio'}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500">Correo</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#1b5ed6] focus:ring-4 focus:ring-[#dfeaff]"
                  placeholder="tu@negocio.com"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500">Contraseña</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#1b5ed6] focus:ring-4 focus:ring-[#dfeaff]"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="upway-button-primary flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="font-semibold text-[#1b5ed6] hover:text-[#0e3ca2]">
                Iniciar sesión
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 text-slate-900">Cargando...</div>}>
      <RegisterPage />
    </Suspense>
  );
}
