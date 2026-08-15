"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    
    // Validaciones básicas de frontend
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      // 🚀 Llamada a nuestra nueva API real de Login
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Login exitoso: Redirigimos al Onboarding o Dashboard
        // Por esto:
router.push('/dashboard/onboarding/lienzo');
      } else {
        // Falló el login: Mostramos el mensaje exacto de la API
        setError(data.message || 'Error de autenticación.');
        setCargando(false);
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error de conexión. Intenta nuevamente.');
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans p-6">
      
      {/* Luces de fondo estilo Upway 2.0 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        
        {/* Cabecera del Login */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl mb-6 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Bienvenido a Upway</h1>
          <p className="text-slate-400 text-sm">Ingresa a tu centro de mando inteligente</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="bg-[#0A0E14]/80 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] shadow-2xl">
          
          <div className="space-y-5 mb-8">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="revisor@meta.com"
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

          {/* Manejo de Errores */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium animate-in fade-in zoom-in duration-300">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-500 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            {cargando ? (
              <><Loader2 className="animate-spin h-5 w-5" /> Autenticando...</>
            ) : (
              <>Iniciar Sesión <ArrowRight className="h-5 w-5" /></>
            )}
          </button>
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