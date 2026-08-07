"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Smartphone, ShieldCheck, ArrowRight, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    FB?: {
      init: (params: Record<string, unknown>) => void;
      login: (callback: (response: unknown) => void, options?: Record<string, unknown>) => void;
    };
  }
}

export default function ActivacionWhatsAppPage() {
  const [conectando, setConectando] = useState(false);
  const [sdkCargado, setSdkCargado] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tiendaId, setTiendaId] = useState<string | null>(null);
  const router = useRouter();

  const inicializarFacebook = () => {
    if (!window.FB) return;

    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!appId) {
      setSdkError('Falta NEXT_PUBLIC_FACEBOOK_APP_ID en el entorno.');
      return;
    }

    try {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: true,
        version: 'v20.0',
      });
      setSdkCargado(true);
      setSdkError(null);
      console.log('✅ SDK de Meta listo.');
    } catch (e) {
      console.error('Error al inicializar FB:', e);
      setSdkError('No se pudo inicializar el SDK de Meta.');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cargarTiendaActual = async () => {
      try {
        const respuesta = await fetch('/api/tienda/me');
        if (respuesta.ok) {
          const datos = await respuesta.json();
          if (datos?.tiendaId) setTiendaId(datos.tiendaId);
        }
      } catch (error) {
        console.warn('No se pudo obtener la tienda actual:', error);
      }
    };

    void cargarTiendaActual();

    if (window.FB) {
      setTimeout(() => inicializarFacebook(), 0);
      return;
    }

    const interval = window.setInterval(() => {
      if (window.FB) {
        inicializarFacebook();
        window.clearInterval(interval);
      }
    }, 200);

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      if (!window.FB) {
        setSdkError('El SDK de Meta no cargó. Revisa tu conexión.');
      }
    }, 4000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, []);

  const iniciarConexionMeta = () => {
    // 1. VALIDACIÓN RÁPIDA
    if (!window.FB) {
      setError('Meta no está listo. Recarga la página.');
      return;
    }

    const redirectUri = `${window.location.origin}/dashboard/activacion`;

    // 2. LLAMADA INMEDIATA A META (ESTO EVITA EL BLOQUEO EN EL CELULAR)
    window.FB.login((response: unknown) => {
      const typedResponse = response as {
        authResponse?: { accessToken?: string; code?: string };
        status?: string;
      };
      
      const authResponse = typedResponse.authResponse;
      const metaCode = authResponse?.code || authResponse?.accessToken;

      if (authResponse && metaCode) {
        // Enviar a tu backend
        fetch('/api/meta/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tienda_id: tiendaId || 'tienda_revisor_001',
            metaCode,
            redirectUri,
          }),
        })
          .then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar credenciales');

            alert('🎉 ¡Línea de WhatsApp conectada y activada con éxito!');
            router.push('/dashboard');
          })
          .catch((error) => {
            console.error('❌ Error enviando datos:', error);
            setError('Problema vinculando la cuenta. Intenta de nuevo.');
            setConectando(false);
          });
      } else if (typedResponse.status === 'not_authorized' || typedResponse.status === 'unknown') {
        setError('No se completó la autorización de Meta. Intenta de nuevo.');
        setConectando(false);
      } else {
        setError('La conexión con Meta fue cancelada.');
        setConectando(false);
      }
    }, {
      // 3. PARÁMETROS V4 EXACTOS (La clave del éxito)
      config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID || '2018640519013518',
      scope: 'business_management,whatsapp_business_management,whatsapp_business_messaging',
      return_scopes: true,
      auth_type: 'rerequest',
      response_type: 'code',
      override_default_response_type: true,
      redirect_uri: redirectUri,
      extras: {
        version: 'v4',
        sessionInfoVersion: '3',
        featureType: 'whatsapp_business_app_onboarding',
      },
    });

    // 4. ACTUALIZAR UI (Se hace al final para no interrumpir el pop-up)
    setError(null);
    setConectando(true);
  };

  return (
    <>
      <Script
        src='https://connect.facebook.net/es_LA/sdk.js'
        strategy='afterInteractive'
        onLoad={inicializarFacebook}
        onError={() => setSdkError('Error cargando el SDK de Meta.')}
      />

      <div className='min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_55%)] bg-slate-950 px-4 py-12 text-white sm:px-6 lg:px-8 flex items-center justify-center'>
        <div className='w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0E14] shadow-2xl relative'>
          <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400'></div>

          <div className='grid md:grid-cols-2'>
            <div className='p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02]'>
              <div className='mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400'>
                <CheckCircle2 className='h-8 w-8' />
              </div>
              <h1 className='text-3xl font-bold tracking-tight text-white mb-4'>¡Pago confirmado!</h1>
              <p className='text-slate-400 text-sm leading-relaxed mb-6'>
                Tu plan ha sido activado con éxito. Ahora solo falta el último paso: darle permisos a la IA para que tome el control de tu línea.
              </p>
              <ul className='space-y-4'>
                <li className='flex items-start gap-3 text-sm text-slate-300'>
                  <ShieldCheck className='h-5 w-5 text-cyan-400 shrink-0 mt-0.5' />
                  <span>Conexión segura avalada por Meta.</span>
                </li>
                <li className='flex items-start gap-3 text-sm text-slate-300'>
                  <Smartphone className='h-5 w-5 text-cyan-400 shrink-0 mt-0.5' />
                  <span>Vincula tu número sin usar códigos QR.</span>
                </li>
              </ul>
            </div>

            <div className='p-10 flex flex-col justify-center items-center text-center relative overflow-hidden'>
              <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none'></div>
              <div className='relative z-10 w-full'>
                <div className='inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-6'>
                  <Sparkles className='h-3.5 w-3.5' /> Activación Oficial
                </div>
                <h2 className='text-xl font-semibold text-white mb-2'>Conecta tu WhatsApp</h2>
                <p className='text-sm text-slate-400 mb-8'>Inicia sesión con la cuenta de Facebook de tu negocio.</p>

                <button
                  onClick={iniciarConexionMeta}
                  disabled={conectando || !sdkCargado || !!sdkError}
                  className='group relative w-full flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#1877F2] px-6 py-4 font-semibold text-white shadow-[0_0_20px_rgba(24,119,242,0.3)] transition-all hover:bg-[#166FE5] hover:shadow-[0_0_30px_rgba(24,119,242,0.5)] disabled:opacity-70 disabled:cursor-not-allowed'
                >
                  {conectando ? (
                    <>
                      <Loader2 className='h-5 w-5 animate-spin' />
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className='h-5 w-5 fill-white' />
                      <span>{sdkCargado ? 'Conectar con Meta' : 'Cargando...'}</span>
                      <ArrowRight className='absolute right-6 h-5 w-5 opacity-0 -translate-x-4 transition-all group-hover:opacity-100 group-hover:translate-x-0' />
                    </>
                  )}
                </button>

                {sdkError && (
                  <p className='mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-left text-xs text-red-200'>
                    {sdkError}
                  </p>
                )}

                {error && (
                  <p className='mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-left text-xs text-amber-100'>
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}