"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import Script from 'next/script';

declare global {
  interface Window {
    FB?: any;
  }
}

export default function ActivacionWhatsAppPage() {
  const [sdkCargado, setSdkCargado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inicializarFacebook = () => {
    if (!window.FB) return;
    
    // Usamos tu App ID real directamente para no depender del entorno
    window.FB.init({
      appId: '1768431177666982', 
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
      setError('Meta no está listo. Desactiva tu bloqueador de anuncios y recarga.');
      return;
    }

    setError(null);

    // 🚀 LA MAGIA: Llamamos a Meta DIRECTO, sin pausas, sin setStates.
    // Esto garantiza al 1000% que el navegador NO bloquee la ventana emergente.
    window.FB.login((response: any) => {
      if (response.authResponse) {
        alert('🎉 ¡Línea de WhatsApp conectada y activada con éxito!');
        window.location.href = '/dashboard';
      } else {
        setError('La conexión con Meta fue cancelada o bloqueada.');
      }
    }, {
      config_id: '2018640519013518', // Tu Config ID real
      scope: 'business_management,whatsapp_business_management,whatsapp_business_messaging',
      response_type: 'code',
      override_default_response_type: true,
      extras: { featureType: 'whatsapp_business_app_onboarding' },
    });
  };

  return (
    <>
      <Script src='https://connect.facebook.net/es_LA/sdk.js' strategy='afterInteractive' onLoad={inicializarFacebook} />
      <div className='min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_55%)] bg-slate-950 px-4 py-12 text-white flex items-center justify-center'>
        <div className='w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0E14] shadow-2xl relative'>
          <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400'></div>
          <div className='grid md:grid-cols-2'>
            <div className='p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02]'>
              <div className='mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400'>
                <CheckCircle2 className='h-8 w-8' />
              </div>
              <h1 className='text-3xl font-bold text-white mb-4'>Simulador Listo</h1>
              <p className='text-slate-400 text-sm mb-6'>Dale permisos a Upway para que tome el control de tu línea.</p>
            </div>
            <div className='p-10 flex flex-col justify-center items-center text-center relative overflow-hidden'>
              <div className='relative z-10 w-full'>
                <h2 className='text-xl font-semibold text-white mb-2'>Conecta tu WhatsApp</h2>
                <p className='text-sm text-slate-400 mb-8'>Inicia sesión con la cuenta de Facebook de tu negocio.</p>

                <button onClick={iniciarConexionMeta} disabled={!sdkCargado} className='w-full flex items-center justify-center gap-3 rounded-2xl bg-[#1877F2] px-6 py-4 font-semibold text-white shadow-lg transition-all hover:bg-[#166FE5] disabled:opacity-70'>
                  <MessageCircle className='h-5 w-5 fill-white' />
                  <span>Conectar con Meta</span>
                </button>
                {error && <p className='mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-left text-xs text-amber-100'>{error}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}