'use client';

import { useState } from 'react';
import Phone from 'lucide-react/dist/lucide-react/icons/phone';
import LiveDemoPanel from '@/components/demo/live-demo-panel';

/**
 * Página de la demo en vivo (/demo).
 *
 * Flujo BOOM:
 * 1. Visitante escribe su celular → POST /api/demo/sessions (crea sesión).
 * 2. Llama al +57 601 9177737 desde ese celular.
 * 3. Telnyx webhook empareja la llamada por el número del llamante.
 * 4. El panel SSE muestra el transcript y los datos que Sophie captura en vivo.
 */
export default function DemoPage() {
  const [step, setStep] = useState<'ingresar' | 'llamar' | 'panel'>('ingresar');
  const [phone, setPhone] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const crearSesion = async () => {
    setError(null);
    const digitos = phone.replace(/\D/g, '');
    if (!/^(57)?\d{10}$/.test(digitos)) {
      setError('Ingresa un número celular colombiano válido (10 dígitos, ej. 3126427856).');
      return;
    }
    const e164 = `+57${digitos.startsWith('57') ? digitos.slice(2) : digitos}`;
    setLoading(true);
    try {
      const res = await fetch('/api/demo/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164 }),
      });
      if (!res.ok) throw new Error('No se pudo crear la sesión de demo.');
      const data = await res.json();
      setSessionId(data.sessionId);
      setStep('llamar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Paso 1: Ingresar celular */}
      {step === 'ingresar' && (
        <section className="mb-10 rounded-2xl bg-gradient-to-br from-blue-900/20 to-indigo-900/30 border border-blue-500/30 p-8 md:p-12 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-slate-100">Prueba la demo en vivo</h1>
          </div>
          <p className="text-slate-300 mb-6">
            Ingresa tu número celular y luego llama al <span className="font-mono text-blue-300">+57 601 9177737</span>.
            Verás en esta pantalla cómo Sophie atiende, entiende tu necesidad y captura tus datos en tiempo real.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); crearSesion(); }} className="space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400">+57</span>
              <input
                type="tel"
                placeholder="312 642 7856"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength="10"
                disabled={loading}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || phone.length === 0}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Creando sesión…' : 'Crear sesión de demo'}
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-500">
            Tu número solo se usa para emparejar la llamada con esta pantalla. Nunca lo mostramos completo.
          </p>
        </section>
      )}

      {/* Paso 2: Llamar */}
      {step === 'llamar' && (
        <section className="rounded-2xl bg-gradient-to-br from-emerald-900/20 to-teal-900/30 border border-emerald-500/30 p-8 md:p-12 shadow-xl text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Phone className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Llama ahora al</h2>
          <div className="font-mono text-3xl font-bold text-emerald-400 mb-2">+57 601 9177737</div>
          <p className="text-slate-300 mb-8 max-w-md mx-auto">
            Desde el celular que registraste, llama a ese número. Sophie responderá y esta pantalla se actualizará en vivo con todo lo que vaya capturando.
          </p>
          <button
            onClick={() => setStep('panel')}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
          >
            Ya llamé, mostrar panel
          </button>
        </section>
      )}

      {/* Paso 3: Panel en vivo */}
      {step === 'panel' && sessionId && (
        <LiveDemoPanel sessionId={sessionId} />
      )}
    </main>
  );
}