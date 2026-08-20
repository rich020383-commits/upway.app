"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, MessageCircle, Zap } from 'lucide-react';
import Script from 'next/script';

declare global {
  interface Window {
    FB?: any;
  }
}

export default function ActivacionWhatsAppPage() {
  const [sdkCargado, setSdkCargado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  // ID de la tienda quemado para Inworker/Rich (lo puedes hacer dinámico después)
  const tiendaIdActual = '1172769935927318';

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
    setProcesando(true);

    window.FB.login(async (response: any) => {
      if (response.authResponse) {
        const code = response.authResponse.code; // El código de autorización de Meta

        try {
          // 🔥 ENVIAMOS EL CÓDIGO Y EL ID DE LA TIENDA AL BACKEND
          const res = await fetch('/api/whatsapp/guardar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              code: code,
              tiendaId: tiendaIdActual 
            })
          });

          const data = await res.json();

          if (res.ok) {
            alert('🎉 ¡Línea de WhatsApp conectada y guardada en la base de datos con éxito!');
          } else {
            console.error('Error en el servidor al guardar:', data.error);
            alert('Hubo un problema guardando los datos en la base de datos, pero la cuenta de Meta se creó.');
          }
        } catch (err) {
          console.error('Error de red al conectar con el backend:', err);
        } finally {
          setProcesando(false);
          window.location.href = '/dashboard/bots'; // Redirige al panel principal
        }

      } else {
        setProcesando(false);
        window.location.href = '/dashboard/bots';
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
      <div className='min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_55%)] bg-slate-950 px-4 py-12 text-white flex flex-col items-center justify-center'>
        
        <div className='w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0E14] shadow-2xl relative'>
          <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400'></div>
          <div className='grid md:grid-cols-2'>
            <div className='p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02]'>
              <div className='mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400'>
                <CheckCircle2 className='h-8 w-8' />
              </div>
              <h1 className='text-3xl font-bold text-white mb-4'>Vinculación Oficial</h1>
              <p className='text-slate-400 text-sm mb-6'>Concede los permisos para que tu Empleado Digital tome el control de tu línea y automatice tus ventas 24/7.</p>
              
              {/* Infobox de Claridad de Costos (Para evitar confusiones con Meta) */}
              <div className="mt-4 bg-[#1E293B]/30 border border-[#19C8E8]/20 rounded-2xl p-5">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-[#19C8E8]" /> 
                  Estructura de Costos
                </h4>
                <ul className="space-y-2 text-xs text-[#8994A6]">
                  <li className="flex gap-2">
                    <span className="text-[#19C8E8]">•</span>
                    <span><strong>Suscripción Upway:</strong> Pago fijo por la tecnología IA.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#19C8E8]">•</span>
                    <span><strong>Consumo Meta:</strong> WhatsApp cobra directamente a tu cuenta por cada conversación iniciada (tras 1,000 gratuitas).</span>
                  </li>
                </ul>
              </div>

            </div>
            <div className='p-10 flex flex-col justify-center items-center text-center relative overflow-hidden'>
              <div className='relative z-10 w-full'>
                <h2 className='text-xl font-semibold text-white mb-2'>Conecta tu WhatsApp</h2>
                <p className='text-sm text-slate-400 mb-8'>Inicia sesión con la cuenta de Facebook de tu negocio.</p>

                <button 
                  onClick={iniciarConexionMeta} 
                  disabled={!sdkCargado || procesando} 
                  className='w-full flex items-center justify-center gap-3 rounded-2xl bg-[#1877F2] px-6 py-4 font-semibold text-white shadow-lg transition-all hover:bg-[#166FE5] disabled:opacity-75 cursor-pointer'
                >
                  <MessageCircle className='h-5 w-5 fill-white' />
                  <span>{procesando ? 'Sincronizando con base de datos...' : 'Conectar con Meta'}</span>
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