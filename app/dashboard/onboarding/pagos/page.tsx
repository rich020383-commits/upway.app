"use client";

import React, { useState } from 'react';
import { ShieldCheck, Bot, Loader2, Lock, Server, ArrowRight } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Paso06Checkout() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const { 
    modulosSeleccionados, 
    nombreAgente,
    promptMaestro,
    telefonoAdmin 
  } = useUpwayStore();
  
  const [procesando, setProcesando] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const detallesModulos: Record<string, { nombre: string, precio: number }> = {
    'whatsapp': { nombre: 'Motor WhatsApp (Texto)', precio: 399900 },
    'voz': { nombre: 'Motor Central Telefónica', precio: 599900 },
    'calendario': { nombre: 'Sincronización Agenda', precio: 39000 },
    'analitica': { nombre: 'Analítica Empresarial', precio: 19000 },
    'rag': { nombre: 'Cerebro RAG (Omnicanal)', precio: 0 },
  };

  const totalMensual = modulosSeleccionados.reduce((acc: number, id: string) => {
    return acc + (detallesModulos[id]?.precio || 0);
  }, 0);

  const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;

  const handleApplyPromo = async () => {
    const normalized = promoCode.trim();
    if (!normalized) {
      setPromoFeedback({ type: 'error', text: 'Ingresa un código de acceso para activar la prueba o el beneficio.' });
      return;
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro', promoCode: normalized }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'El código no es válido.');
      }

      setAppliedPromoCode(normalized);
      setPromoFeedback({
        type: 'success',
        text: data.message || 'Código validado correctamente.',
      });
    } catch (error) {
      console.error('Error validando código:', error);
      setAppliedPromoCode(null);
      setPromoFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'No se pudo validar el código.',
      });
    }
  };

  const handleSimularPago = async () => {
    if ((status as string) === 'loading') return;

    const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;
    const userIdReal = sessionUser?.id;
    const userEmailReal = sessionUser?.email;

    if (!userIdReal) {
      alert("❌ Error: Sesión no detectada. Por favor, recarga la página o vuelve a iniciar sesión.");
      return;
    }

    setProcesando(true);
    
    try {
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'pro',
          promoCode: appliedPromoCode || promoCode.trim() || undefined,
        }),
      });

      const checkoutData = await checkoutRes.json().catch(() => ({}));
      if (!checkoutRes.ok || !checkoutData.success) {
        throw new Error(checkoutData.error || 'No se pudo validar la autorización de acceso.');
      }

      if (checkoutData.mode === 'payment' && checkoutData.payment_url) {
        window.location.href = checkoutData.payment_url;
        return;
      }

      const res = await fetch('/api/tienda/aprovisionar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdReal,
          email: userEmailReal,
          nombreNegocio: "Empresa Cliente", 
          nombreAgente: nombreAgente || 'Asistente IA',
          promptMaestro: promptMaestro || 'Eres un asistente útil.', 
          modulosSeleccionados: modulosSeleccionados,
          telefonoAdmin: telefonoAdmin || '', 
        })
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      if (res.ok) {
        console.log("✅ Infraestructura creada en BD con éxito");
        if (modulosSeleccionados.includes('whatsapp')) {
          router.push('/dashboard/onboarding/activacion');
        } else {
          router.push('/dashboard');
        }
      } else {
        const errorData = await res.json();
        console.error("❌ Error del servidor:", errorData);
        alert("Hubo un error en el despliegue, pero serás redirigido a tu panel.");
        router.push('/dashboard');
      }

    } catch (error) {
      console.error('❌ Error de despliegue:', error);
      alert(error instanceof Error ? error.message : 'No se pudo completar la activación.');
      router.push('/dashboard');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(27,94,214,0.12),_transparent_28%),linear-gradient(180deg,_#f7faff_0%,_#eef5ff_100%)] pb-28 text-slate-900 selection:bg-[#1b5ed6]/25">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-10 md:px-10">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Lock className="h-5 w-5 text-[#1b5ed6]" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Upway</div>
              <div className="text-lg font-black tracking-[-0.05em] text-slate-900">Business</div>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            Ir al panel
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8">
          <div className="mb-8 flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-slate-500">
            <span>Paso final</span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span className="font-semibold text-slate-900">Despliegue</span>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl font-black leading-[0.96] tracking-[-0.06em] text-slate-900 md:text-5xl">Autorización de facturación</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Revisa la configuración final de <strong className="text-slate-900">{nombreAgente || 'tu agente'}</strong> y autoriza el aprovisionamiento de infraestructura en nuestros servidores.
            </p>
            <p className="mt-3 text-xs font-mono uppercase tracking-[0.18em] text-slate-500">
                Sesión: {(status as string) === 'loading' ? 'Cargando...' : ((session?.user as { email?: string | null } | undefined)?.email ?? 'No iniciada')}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <h3 className="flex items-center gap-3 text-xl font-black tracking-[-0.05em] text-slate-900">
                <Server className="h-5 w-5 text-[#1b5ed6]" />
                Infraestructura Upway
              </h3>
              <span className="rounded-full border border-[#c7f0d6] bg-[#ebfff3] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#1a7a52]">
                listo
              </span>
            </div>

            <div className="space-y-3 pb-6">
              {modulosSeleccionados.length === 0 && (
                <p className="text-sm text-slate-500 italic">No hay módulos seleccionados.</p>
              )}

              {modulosSeleccionados.map((id: string) => {
                const mod = detallesModulos[id];
                if (!mod) return null;
                return (
                  <div key={id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-3 py-3 text-sm">
                    <span className="text-slate-600">{mod.nombre}</span>
                    <span className="font-mono text-sm font-semibold text-slate-900">
                      {mod.precio === 0 ? <span className="text-slate-500">INCLUIDO</span> : fmt(mod.precio)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Total a facturar hoy</div>
                  <div className="mt-1 text-sm text-slate-500">Suscripción mensual recurrente</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black tracking-[-0.06em] text-slate-900">{fmt(totalMensual)}</div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">COP / mes</div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#c7f0d6] bg-[#ebfff3] text-[#1ea76d]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black tracking-[-0.05em] text-slate-900">Facturación segura</h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">
                Transacción cifrada de extremo a extremo. Nosotros no almacenamos tus datos financieros.
              </p>
            </div>

            <div className="mb-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
                Código de acceso / cupón
              </label>
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={(event) => setPromoCode(event.target.value)}
                  placeholder="UPWAY-TRIAL"
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1b5ed6] focus:ring-2 focus:ring-[#1b5ed6]/10"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="rounded-2xl bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                >
                  Aplicar
                </button>
              </div>

              {promoFeedback && (
                <p className={`mt-3 text-xs ${promoFeedback.type === 'success' ? 'text-[#1a7a52]' : 'text-red-600'}`}>
                  {promoFeedback.text}
                </p>
              )}

              <div className="mt-3 text-[10px] text-slate-500">
                Códigos de prueba sugeridos: <span className="font-mono text-slate-900">UPWAY-TRIAL</span> · <span className="font-mono text-slate-900">CLINICA-SELECTA</span>
              </div>
            </div>

            <button
              onClick={handleSimularPago}
              disabled={procesando || totalMensual === 0 || (status as string) === 'loading'}
              className={`flex w-full items-center justify-center gap-3 rounded-[20px] py-3.5 text-sm font-semibold transition ${
                procesando
                  ? 'cursor-not-allowed bg-slate-200 text-slate-700'
                  : 'bg-slate-950 text-white shadow-[0_16px_35px_rgba(15,23,42,0.12)] hover:-translate-y-0.5'
              }`}
            >
              {procesando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validando configuración...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  Activar en producción
                </>
              )}
            </button>

            {procesando && (
              <div className="mt-4 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
                Revisando permisos, infraestructura y despliegue
              </div>
            )}
          </article>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 md:px-10">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Activación final</div>
            <div className="mt-1 text-lg font-black tracking-[-0.05em] text-slate-900 md:text-xl">Listo para producir</div>
          </div>

          <button
            onClick={handleSimularPago}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5"
          >
            Finalizar configuración
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
}