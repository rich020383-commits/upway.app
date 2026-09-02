"use client";

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Mail, Lock, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const segment = searchParams.get('segment');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
        setCargando(false);
      } else if (result?.ok) {
        // Login inteligente: si viene de una mini landing con segmento explícito,
        // respetamos esa intención. Si no, dejamos que /dashboard decida según
        // el estado real de la cuenta (nueva vs. ya operativa).
        const target = segment ? `/dashboard/onboarding?segment=${segment}` : '/dashboard';
        router.push(target);
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error de conexión. Intenta nuevamente.');
      setCargando(false);
    }
  };

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
                Upway · Premium intelligence
              </div>

              <div className="mt-8 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/8 shadow-[0_15px_40px_rgba(17,24,39,0.38)]">
                  <Image src="/upway.png" alt="Logo Upway" width={48} height={48} className="object-contain" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-slate-200/70">Upway</div>
                  <div className="text-xl font-black tracking-[-0.05em]">Business Control</div>
                </div>
              </div>
            </div>

            <div>
              <h1 className="max-w-sm text-4xl font-black leading-[0.95] tracking-[-0.06em] md:text-5xl">
                La operación que se siente clara.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-slate-200/80">
                Gestiona atención, coordinación y automatización con una experiencia premium, segura y preparada para crecer sin fricción.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1b5ed6]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-200/70">Estado</div>
                  <div className="font-semibold text-white">Operación lista para activarse</div>
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
                Acceso seguro
              </div>
              <h2 className="text-3xl font-black tracking-[-0.05em] text-slate-900">Bienvenido a Upway</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Ingresa a tu centro de mando inteligente y continúa con tu operación.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="revisor_meta@upway.business"
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#1b5ed6] focus:ring-4 focus:ring-[#dfeaff]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#1b5ed6] focus:ring-4 focus:ring-[#dfeaff]"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="upway-button-primary flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {cargando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    Iniciar sesión
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6 flex items-center">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="mx-4 text-[10px] font-mono uppercase tracking-[0.22em] text-slate-400">o continúa con</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/dashboard/onboarding/lienzo' })}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.3-1.5-.3-2.7s.1-2 .3-2.7L1.6 6.4C.6 8.4 0 10.6 0 13s.6 4.6 1.6 6.6l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.3L1.6 15c1.9 3.8 5.8 8 10.4 8z" />
                </svg>
                Continuar con Google
              </button>

              <button
                type="button"
                onClick={() => signIn('linkedin', { callbackUrl: '/dashboard/onboarding/lienzo' })}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#0a66c2] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#004182]"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Continuar con LinkedIn
              </button>
            </div>

            <div className="mt-8 text-center text-sm text-slate-500">
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="font-semibold text-[#1b5ed6] hover:text-[#0e3ca2]">
                Solicitar acceso
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
      <LoginPage />
    </Suspense>
  );
}