"use client";

import React, { useState } from 'react';
import { ShieldCheck, Bot, Loader2, ExternalLink, Lock, Server } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Paso06Checkout() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const { 
    modulosSeleccionados, 
    nombreNegocio,
    nombreAgente,
    promptMaestro,
    telefonoAdmin 
  } = useUpwayStore();
  
  const [procesando, setProcesando] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

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
    
    const userIdReal = (session?.user as any)?.id;
    const userEmailReal = (session?.user as any)?.email;
    
    setDeployError(null);

    if (!userIdReal) {
      setDeployError('Sesión no detectada. Por favor, recarga la página o vuelve a iniciar sesión.');
      return;
    }

    if (!nombreNegocio.trim()) {
      setDeployError('Falta el nombre del negocio. Vuelve al paso de identidad para completarlo.');
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
          nombreNegocio,
          nombreAgente: nombreAgente || 'Asistente IA',
          promptMaestro: promptMaestro || 'Eres un asistente útil.', 
          modulosSeleccionados: modulosSeleccionados,
          telefonoAdmin: telefonoAdmin || '', 
        })
      });

      if (res.ok) {
        if (modulosSeleccionados.includes('whatsapp')) {
          router.push('/dashboard/onboarding/activacion');
        } else {
          router.push('/dashboard');
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Error del servidor:', errorData);
        setDeployError(errorData.error || 'Hubo un error en el despliegue. Intenta de nuevo o contacta soporte.');
      }

    } catch (error) {
      console.error('❌ Error de despliegue:', error);
      setDeployError(error instanceof Error ? error.message : 'No se pudo completar la activación.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    // 🔥 EL CASCARÓN: h-full y flex-col congelan la pantalla general
    <div className="flex flex-col h-full w-full relative bg-transparent text-[#F5F7FA]">
      
      {/* Botón de Ir al Panel */}
      <div className="absolute top-4 right-4 md:top-6 md:right-8 z-50">
        <Link 
          href="/dashboard" 
          className="text-xs md:text-sm font-semibold text-[#8994A6] hover:text-[#19C8E8] flex items-center gap-2 bg-[#1E293B]/30 hover:bg-[#1E293B] px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all duration-300 border border-[#1E293B]/50 hover:border-[#19C8E8]/30"
        >
          Ir al Panel
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* 🔥 EL RESORTE CENTRAL: Distribuye el contenido perfectamente al centro con scroll interno si es necesario */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-4 mt-8 md:mt-2 flex flex-col justify-center overflow-y-auto no-scrollbar">
        
        {/* Cabecera / Narrativa */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 text-[#8994A6] text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-4">
            <Lock className="h-3 w-3" />
            <span>Paso Final</span>
            <span className="w-1 h-1 rounded-full bg-[#8994A6]"></span>
            <span className="text-[#19C8E8]">Despliegue</span>
          </div>
          
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-2 md:mb-3">Autorización de Facturación</h1>
          <p className="text-[#8994A6] text-xs md:text-base max-w-2xl mx-auto md:mx-0">
            Revisa la configuración final de <strong className="text-[#F5F7FA]">{nombreAgente || 'tu agente'}</strong> y autoriza el aprovisionamiento de infraestructura en nuestros servidores.
          </p>
          <p className="text-[#8994A6] text-[10px] md:text-xs mt-1">
            Sesión: {(status as string) === 'loading' ? 'Cargando...' : (session?.user as any)?.email || 'No iniciada'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-10 pb-4">
          
          {/* COLUMNA IZQUIERDA: Resumen de Inversión */}
          <div className="space-y-4">
            <div className="bg-[#0D1117] border border-[#1E293B] p-6 md:p-8 rounded-2xl shadow-xl">
              
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1E293B]">
                <h3 className="text-base md:text-lg font-semibold flex items-center gap-3">
                  <Server className="text-[#9B5CFF] h-5 w-5" /> 
                  Infraestructura Upway
                </h3>
                <span className="text-[10px] font-mono tracking-widest text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-md border border-[#10B981]/20">
                  LISTO
                </span>
              </div>
              
              <div className="space-y-3 md:space-y-4 mb-6">
                {modulosSeleccionados.length === 0 && (
                  <p className="text-[#8994A6] text-xs md:text-sm italic">No hay módulos seleccionados.</p>
                )}
                
                {modulosSeleccionados.map((id: string) => {
                  const mod = detallesModulos[id];
                  if (!mod) return null;
                  return (
                    <div key={id} className="flex justify-between items-center text-xs md:text-sm">
                      <span className="text-[#8994A6]">{mod.nombre}</span>
                      <span className="font-mono text-[#F5F7FA] font-medium">
                        {mod.precio === 0 ? (
                          <span className="text-[#8994A6]">INCLUIDO</span>
                        ) : (
                          fmt(mod.precio)
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-[#07090C] border border-[#1E293B] rounded-xl p-4 md:p-5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-[#8994A6] mb-0.5">Total a facturar hoy</p>
                  <p className="text-[10px] text-[#8994A6]">Suscripción mensual recurrente</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl md:text-3xl font-bold text-[#F5F7FA] tracking-tight">
                    {fmt(totalMensual)}
                  </p>
                  <p className="text-[9px] md:text-[10px] font-mono text-[#8994A6] mt-0.5">COP / MES</p>
                </div>
              </div>

            </div>
          </div>

          {/* COLUMNA DERECHA: Pasarela de Pago */}
          <div className="bg-[#0D1117] border border-[#1E293B] p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col justify-center relative overflow-hidden">
            
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#F5F7FA 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            <div className="relative z-10">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 md:h-14 md:w-14 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck size={26} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-1 text-[#F5F7FA]">Facturación Segura</h2>
                <p className="text-[#8994A6] text-xs md:text-sm leading-relaxed max-w-xs">
                  Transacción cifrada de extremo a extremo. Nosotros no almacenamos tus datos financieros.
                </p>
              </div>

              <div className="mb-5 rounded-2xl border border-[#1E293B] bg-[#07090C] p-4">
                <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.2em] text-[#8994A6]">
                  Código de acceso / cupón
                </label>
                <div className="flex gap-2">
                  <input
                    value={promoCode}
                    onChange={(event) => setPromoCode(event.target.value)}
                    placeholder="UPWAY-TRIAL"
                    className="flex-1 rounded-xl border border-[#1E293B] bg-[#0D1117] px-3 py-2.5 text-sm text-[#F5F7FA] outline-none placeholder:text-[#8994A6] focus:border-[#19C8E8]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="rounded-xl border border-[#19C8E8]/30 bg-[#19C8E8]/10 px-3 py-2.5 text-xs font-semibold text-[#9be7ff] transition-colors hover:bg-[#19C8E8]/20"
                  >
                    Aplicar
                  </button>
                </div>
                {promoFeedback && (
                  <p className={`mt-2 text-xs ${promoFeedback.type === 'success' ? 'text-[#34D399]' : 'text-[#FCA5A5]'}`}>
                    {promoFeedback.text}
                  </p>
                )}
              </div>

              {deployError && (
                <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-[#FCA5A5]">
                  {deployError}
                </div>
              )}

              <button 
                onClick={handleSimularPago}
                disabled={procesando || totalMensual === 0 || (status as string) === 'loading'}
                className={`w-full py-3.5 md:py-4 rounded-xl font-bold flex justify-center items-center gap-3 transition-all text-sm md:text-base ${
                  procesando 
                    ? 'bg-[#19C8E8]/10 text-[#19C8E8] border border-[#19C8E8]/30 cursor-not-allowed'
                    : 'bg-[#19C8E8] text-[#07090C] hover:bg-[#33DDFF] shadow-[0_0_20px_rgba(25,200,232,0.2)]'
                } disabled:opacity-50`}
              >
                {procesando ? (
                  <><Loader2 className="animate-spin" size={18} /> Autorizando despliegue...</>
                ) : (
                  <> {appliedPromoCode ? 'Activar con código' : 'Pagar y Activar Sistema'} <ExternalLink size={18} /></>
                )}
              </button>

              <div className="mt-6 pt-5 border-t border-[#1E293B] flex items-center justify-center gap-2 md:gap-3 flex-wrap">
                <span className="text-[9px] md:text-[10px] font-mono text-[#8994A6] border border-[#1E293B] bg-[#07090C] px-2.5 py-1 rounded-md">VISA</span>
                <span className="text-[9px] md:text-[10px] font-mono text-[#8994A6] border border-[#1E293B] bg-[#07090C] px-2.5 py-1 rounded-md">MASTERCARD</span>
                <span className="text-[9px] md:text-[10px] font-mono text-[#8994A6] border border-[#1E293B] bg-[#07090C] px-2.5 py-1 rounded-md">PSE</span>
                <span className="text-[9px] md:text-[10px] font-mono text-[#8994A6] border border-[#1E293B] bg-[#07090C] px-2.5 py-1 rounded-md">BOLD</span>
              </div>
              
              <p className="text-center text-[9px] md:text-[10px] text-[#8994A6] mt-3 flex items-center justify-center gap-1">
                <Lock size={10} /> Conexión segura TLS 1.3
              </p>
            </div>

          </div>

        </div>
      </div>
      
    </div>
  );
}