"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
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
        // 🔒 Ruta segura original al onboarding/lienzo
        router.push('/dashboard/onboarding/lienzo');
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error de conexión. Intenta nuevamente.');
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans p-6">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl mb-6 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Bienvenido a Upway</h1>
          <p className="text-slate-400 text-sm">Ingresa a tu centro de mando inteligente</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#0A0E14]/80 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] shadow-2xl">
          <div className="space-y-5 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="revisor_meta@upway.business"
                  className="w-full bg-[#121820] border border-white/5 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-slate-600 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#121820] border border-white/5 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-slate-600 outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-500 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50"
          >
            {cargando ? (
              <><Loader2 className="animate-spin h-5 w-5" /> Autenticando...</>
            ) : (
              <>Iniciar Sesión <ArrowRight className="h-5 w-5" /></>
            )}
          </button>

          <div className="relative flex py-6 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase tracking-widest">o continúa con</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* CONTENEDOR DE BOTONES SOCIALES */}
          <div className="flex flex-col gap-3">
            {/* BOTÓN DE GOOGLE */}
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard/onboarding/lienzo" })}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20 shadow-lg"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.3-1.5-.3-2.7s.1-2 .3-2.7L1.6 6.4C.6 8.4 0 10.6 0 13s.6 4.6 1.6 6.6l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.3L1.6 15c1.9 3.8 5.8 8 10.4 8z" />
              </svg>
              Continuar con Google
            </button>

            {/* BOTÓN PREMIUM DE LINKEDIN */}
            <button
              type="button"
              onClick={() => signIn("linkedin", { callbackUrl: "/dashboard/onboarding/lienzo" })}
              className="relative w-full rounded-xl bg-[#0A66C2] py-4 text-sm font-semibold text-white transition-all hover:bg-[#004182] hover:shadow-[0_0_20px_rgba(10,102,194,0.4)] flex items-center justify-center gap-3 overflow-hidden group shadow-lg"
            >
              {/* Efecto de brillo hover */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              
              <svg className="w-5 h-5 fill-current relative z-10" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="relative z-10">Continuar con LinkedIn</span>
            </button>
          </div>

        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Solicitar acceso
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}