"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Correo o contraseña incorrectos.');
      return;
    }

    router.push('/dashboard/bots');
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_55%)] bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-white/10 bg-white/10 shadow-2xl shadow-blue-950/30 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-10 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-sm">
              <Sparkles className="h-4 w-4" />
              Upway Business
            </div>
            <h1 className="mt-8 text-4xl font-semibold leading-tight">Tu centro de operaciones, protegido y listo para crecer.</h1>
            <p className="mt-4 max-w-md text-sm text-blue-50/90">Gestiona bots de WhatsApp, inventario y automatizaciones con una experiencia premium pensada para negocios modernos.</p>
          </div>

          <div className="bg-slate-950/90 p-8 sm:p-10">
            <div className="mb-6">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-300">Iniciar sesión</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Accede a tu panel</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Correo</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none ring-0" placeholder="tu@negocio.com" required />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Contraseña</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none ring-0" placeholder="••••••••" required />
              </div>
              {error ? <p className="text-sm text-rose-400">{error}</p> : null}
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70">
                {loading ? 'Ingresando...' : 'Entrar'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 text-sm text-slate-400">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="font-semibold text-blue-400 hover:text-blue-300">Crear cuenta</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
