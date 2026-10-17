'use client';

import { useState, useEffect } from 'react';
import { Phone, User, Building2 } from 'lucide-react';
import LiveDemoPanel from '@/components/demo/live-demo-panel';

/**
 * Página de la demo en vivo (/demo).
 *
 * Flujo BOOM:
 * 1. Visitante escribe su celular → POST /api/demo/sessions (crea sesión).
 * 2. Llama al +57 601 9177737 desde ese celular.
 * 3. Telnyx webhook empareja la llamada por el número del llamante.
 * 4. El panel SSE muestra el transcript y los datos que Sophie captura en vivo.
 *
 * Si llega con ?sessionId= en la URL (desde el formulario de contacto de la
 * landing), salta directamente al panel y no pide volver a ingresar el celular.
 */
export default function DemoPage() {
  const [step, setStep] = useState<'ingresar' | 'llamar' | 'panel'>('ingresar');
  const [phone, setPhone] = useState('');
  const [nombre, setNombre] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Si ya viene con sessionId de la URL, ir directo al panel.
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get('sessionId');
      if (sid) {
        setSessionId(sid);
        setStep('panel');
      }
    }
  }, []);

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
        body: JSON.stringify({ phone: e164, nombre: nombre || null, institucion: institucion || null }),
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
    <main className="min-h-screen bg-[#f4faff] px-4 py-12 flex flex-col items-center">
      {/* Paso 1: Ingresar datos */}
      {step === 'ingresar' && (
        <section className="mb-10 rounded-[24px] border border-[#e0edf6] bg-white p-8 md:p-12 shadow-[0_10px_30px_rgba(15,31,54,0.10)] max-w-[480px] w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#e7fbfa] flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#0ba9a9]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0d3168]">Prueba la demo en vivo</h1>
          </div>
          <p className="text-[#55718f] mb-8 text-[15px] leading-relaxed">
            Ingresa tus datos y luego llama al <span className="font-mono text-[#0ba9a9] font-bold">+57 601 9177737</span>.
            Verás en esta pantalla cómo Sophie atiende, entiende tu necesidad y captura tus datos en tiempo real.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); crearSesion(); }} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-[#0d3168]">Nombre completo</label>
              <input
                type="text"
                placeholder="Andrés García"
                className="w-full pl-4 pr-4 py-3 rounded-xl border border-[#e0edf6] bg-[#f9fcff] text-[#0d3168] focus:ring-2 focus:ring-[#0ba9a9] focus:border-transparent outline-none transition-all"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-[#0d3168]">Empresa / Institución</label>
              <input
                type="text"
                placeholder="Mi clínica o negocio"
                className="w-full pl-4 pr-4 py-3 rounded-xl border border-[#e0edf6] bg-[#f9fcff] text-[#0d3168] focus:ring-2 focus:ring-[#0ba9a9] focus:border-transparent outline-none transition-all"
                value={institucion}
                onChange={(e) => setInstitucion(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2 relative">
              <label className="block text-[13px] font-bold text-[#0d3168]">Celular</label>
              <span className="absolute left-3 top-[8px] text-[#7b93ab]">+57</span>
              <input
                type="tel"
                placeholder="312 642 7856"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e0edf6] bg-[#f9fcff] text-[#0d3168] focus:ring-2 focus:ring-[#0ba9a9] focus:border-transparent outline-none transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                disabled={loading}
              />
            </div>
            {error && <p className="text-sm text-[#e2555f]">{error}</p>}
            <button
              type="submit"
              disabled={loading || phone.length === 0}
              className="w-full py-3.5 rounded-xl bg-[#0ba9a9] hover:bg-[#0c3775] disabled:bg-[#e0edf6] disabled:text-[#7b93ab] text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Creando sesión…' : 'Crear sesión de demo'}
            </button>
          </form>
          <p className="mt-4 text-xs text-[#7b93ab] text-center">
            Tu número solo se usa para emparejar la llamada con esta pantalla. Nunca lo mostramos completo.
          </p>
        </section>
      )}

      {/* Paso 2: Llamar */}
      {step === 'llamar' && (
        <section className="rounded-[24px] border border-[#e0edf6] bg-white p-8 md:p-12 shadow-[0_10px_30px_rgba(15,31,54,0.10)] text-center max-w-[480px] w-full">
          <div className="w-16 h-16 rounded-full bg-[#e7fbfa] flex items-center justify-center mx-auto mb-6">
            <Phone className="w-8 h-8 text-[#0ba9a9]" />
          </div>
          <h2 className="font-display text-[24px] font-extrabold leading-[1.1] tracking-[-1px] text-[#0d3168] mb-3">Llama ahora al</h2>
          <div className="font-mono text-3xl font-bold text-[#0ba9a9] mb-2">+57 601 9177737</div>
          <p className="text-[#55718f] mb-8 max-w-md mx-auto text-[15px]">
            Desde el celular que registraste, llama a ese número. Sophie responderá y esta pantalla se actualizará en vivo con todo lo que vaya capturando.
          </p>
          <button
            onClick={() => setStep('panel')}
            className="px-6 py-3 rounded-xl bg-[#0ba9a9] hover:bg-[#0c3775] text-white font-semibold transition-colors"
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