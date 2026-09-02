"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, MessageSquare, PhoneCall, QrCode, ArrowRight, ShieldAlert, Loader2, Server, Activity } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

declare global {
  interface Window {
    FB?: any;
  }
}

export default function Paso07Activacion() {
  const router = useRouter();
  const sessionContext = useSession() || {};
  const session = sessionContext.data;
  const { nombreAgente, modulosSeleccionados } = useUpwayStore();

  const [sdkCargado, setSdkCargado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadowhatsapp, setEstadowhatsapp] = useState<'INACTIVE' | 'PENDING' | 'ACTIVE'>('INACTIVE');
  const [isProcessing, setIsProcessing] = useState(false);

  const inicializarFacebook = () => {
    if (!window.FB) return;
    const metaAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!metaAppId) {
      setError('Falta configurar la integración con Meta.');
      return;
    }
    window.FB.init({
      appId: metaAppId,
      cookie: true,
      xfbml: true,
      version: 'v20.0',
    });
    setSdkCargado(true);
  };

  useEffect(() => {
    if (window.FB) {
      inicializarFacebook();
      return;
    }
    const interval = window.setInterval(() => {
      if (window.FB) {
        inicializarFacebook();
        window.clearInterval(interval);
      }
    }, 200);
    return () => window.clearInterval(interval);
  }, []);

  const iniciarConexionMeta = () => {
    if (!window.FB) {
      setError('Meta no está listo. Desactiva tu bloqueador de anuncios y recarga la página.');
      return;
    }

    if (!(session?.user as any)?.id) {
      setError('No se detectó tu sesión. Por favor, recarga la página.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    window.FB.login(function (response: any) {
      (async () => {
        try {
          if (response && response.authResponse) {
            const res = await fetch('/api/whatsapp/guardar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: response.authResponse.code,
                userId: (session?.user as any)?.id,
              }),
            });

            if (res.ok) {
              console.log('¡Éxito! Meta vinculado y guardado en Neon DB');
              setEstadowhatsapp('PENDING');
            } else {
              const errData = await res.json();
              console.error('Fallo en backend:', errData);
              setError(errData.error || 'Error al guardar la configuración en la base de datos.');
              setEstadowhatsapp('INACTIVE');
            }
          } else {
            setError('Cancelaste el proceso o Meta no devolvió los permisos.');
            setEstadowhatsapp('INACTIVE');
          }
        } catch (err) {
          console.error('Error de red:', err);
          setError('Fallo de conexión. Inténtalo nuevamente.');
          setEstadowhatsapp('INACTIVE');
        } finally {
          setIsProcessing(false);
        }
      })();
    }, {
      config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID,
      scope: 'business_management,whatsapp_business_management,whatsapp_business_messaging',
      response_type: 'code',
      override_default_response_type: true,
      extras: { featureType: 'whatsapp_business_app_onboarding' },
    });
  };

  return (
    <>
      <Script src="https://connect.facebook.net/es_LA/sdk.js" strategy="afterInteractive" onLoad={inicializarFacebook} />

      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.14),_transparent_28%),linear-gradient(180deg,_#f5f9ff_0%,_#edf5ff_100%)] text-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(27,94,214,0.03),transparent_35%,rgba(16,185,129,0.04))]" />

        <div className="absolute top-5 right-5 z-20">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:text-slate-900"
          >
            Ir al panel
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 md:px-10">
          <header className="mx-auto mb-9 max-w-2xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#dfeaff] bg-white shadow-[0_20px_60px_rgba(27,94,214,0.08)] text-[#1b5ed6]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-black tracking-[-0.06em] text-slate-900 md:text-5xl">Aprovisionamiento exitoso</h1>
            <p className="mt-4 text-base text-slate-600 md:text-lg">
              La infraestructura de <span className="font-semibold text-slate-900">{nombreAgente || 'tu IA'}</span> está lista. Conecta tus canales para operar con confianza.
            </p>
          </header>

          <div className="grid gap-5 md:grid-cols-2">
            {modulosSeleccionados.includes('whatsapp') && (
              <div className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ebfff4] text-[#10b981] ring-1 ring-[#d6f7e6]">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Canal WhatsApp</h2>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">API Cloud Meta</p>
                    </div>
                  </div>
                  {estadowhatsapp !== 'INACTIVE' && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-amber-700">
                      Pendiente
                    </span>
                  )}
                </div>

                {estadowhatsapp === 'INACTIVE' ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                      <QrCode className="h-8 w-8" />
                    </div>
                    <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-600">
                      Vincula tu línea comercial autorizando los permisos en tu administrador comercial de Meta.
                    </p>
                    <button
                      onClick={iniciarConexionMeta}
                      disabled={!sdkCargado || isProcessing}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#10b981] px-5 py-3.5 text-sm font-bold text-slate-950 shadow-[0_12px_30px_rgba(16,185,129,0.22)] transition hover:bg-[#34d399] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {!sdkCargado || isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {isProcessing ? 'Sincronizando...' : 'Inicializando Meta...'}
                        </>
                      ) : (
                        'Vincular con Facebook'
                      )}
                    </button>
                    {error && (
                      <div className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left text-xs text-red-700">
                        <div className="flex items-start gap-2">
                          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex min-h-[220px] flex-col justify-center">
                    <div className="flex items-center gap-3 rounded-2xl border border-[#ccefe0] bg-[#ebfff4] p-3 text-sm font-medium text-[#0f8f5d]">
                      <CheckCircle2 className="h-5 w-5" />
                      Conexión activa y lista para recibir mensajes.
                    </div>
                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                      <p className="flex items-center gap-2"><PhoneCall className="h-4 w-4 text-[#10b981]" /> Línea conectada y verificada.</p>
                      <p className="flex items-center gap-2"><Activity className="h-4 w-4 text-[#10b981]" /> Monitor de recepción funcionando.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {modulosSeleccionados.includes('voz') && (
              <div className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1b5ed6] ring-1 ring-[#dfeaff]">
                      <PhoneCall className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Central telefónica</h2>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Motor de voz IA</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-[#dfeaff] bg-[#edf4ff] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#1b5ed6]">Online</span>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <span>Latencia de red</span>
                      <span className="flex items-center gap-1.5 text-[#10b981]">
                        <Activity className="h-3 w-3" /> 12ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Número asignado</span>
                      <span className="font-mono text-lg font-bold text-slate-900">+1 (800) 555-0199</span>
                    </div>
                  </div>

                  <button className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900">
                    Realizar llamada de prueba
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              Volver
            </button>
            <button
              onClick={() => router.push('/dashboard/bots')}
              disabled={estadowhatsapp === 'INACTIVE'}
              className={`rounded-xl px-5 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition ${
                estadowhatsapp !== 'INACTIVE'
                  ? 'bg-slate-900 text-white hover:-translate-y-0.5'
                  : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
              }`}
            >
              Ir al centro de mando
            </button>
          </div>
        </div>
      </div>
    </>
  );
}