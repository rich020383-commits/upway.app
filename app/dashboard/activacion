"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Smartphone, ShieldCheck, ArrowRight, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import Script from 'next/script';

// Declaración para que TypeScript no arroje error con el SDK de Facebook
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
  }
}

export default function ActivacionWhatsAppPage() {
  const [conectando, setConectando] = useState(false);
  const [sdkCargado, setSdkCargado] = useState(false);

  // 1. Inicializar el SDK de Facebook cuando la página cargue
  useEffect(() => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId      : process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '1768431177666982',
        cookie     : true,
        xfbml      : true,
        version    : 'v20.0'
      });
      setSdkCargado(true);
    };
  }, []);

  // 2. Función que abre el Popup de Meta Embedded Signup
  const iniciarConexionMeta = () => {
    if (!sdkCargado || !window.FB) {
      alert("El sistema de Meta se está cargando. Por favor, intenta en unos segundos.");
      return;
    }

    setConectando(true);
    
    // Llamada oficial al Login de Facebook
    window.FB.login((response: any) => {
      setConectando(false);
      
      if (response.authResponse) {
        console.log("✅ ¡Conexión exitosa! Tokens recibidos:", response.authResponse);
        const { accessToken } = response.authResponse;
        
        alert("¡Permisos otorgados exitosamente! Revisa la consola (F12) para ver tu token.");
        
      } else {
        console.log("❌ El usuario canceló la conexión o cerró la ventana.");
      }
    }, {
      scope: 'business_management,whatsapp_business_management,whatsapp_business_messaging',
      extras: { feature: 'whatsapp_embedded_signup' }
    });
  };

  return (
    <>
      <Script 
        src="https://connect.facebook.net/es_LA/sdk.js" 
        strategy="lazyOnload" 
      />

      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_55%)] bg-slate-950 px-4 py-12 text-white sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0E14] shadow-2xl relative transition-all duration-700 ease-out translate-y-0 opacity-100">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400"></div>

          <div className="grid md:grid-cols-2">
            
            {/* COLUMNA IZQUIERDA: Mensaje de éxito */}
            <div className="p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02]">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-4">
                ¡Pago confirmado!
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Tu plan ha sido activado con éxito. Ahora solo falta el último paso: darle permisos a la IA para que tome el control de tu línea comercial.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Conexión segura avalada por Meta.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <Smartphone className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Vincula tu número sin usar códigos QR.</span>
                </li>
              </ul>
            </div>

            {/* COLUMNA DERECHA: Botón de conexión Meta */}
            <div className="p-10 flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 w-full">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-6">
                  <Sparkles className="h-3.5 w-3.5" />
                  Activación Oficial
                </div>
                
                <h2 className="text-xl font-semibold text-white mb-2">Conecta tu WhatsApp</h2>
                <p className="text-sm text-slate-400 mb-8">
                  Inicia sesión con la cuenta de Facebook que administra tu negocio.
                </p>

                <button 
                  onClick={iniciarConexionMeta}
                  disabled={conectando || !sdkCargado}
                  className="group relative w-full flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#1877F2] px-6 py-4 font-semibold text-white shadow-[0_0_20px_rgba(24,119,242,0.3)] transition-all hover:bg-[#166FE5] hover:shadow-[0_0_30px_rgba(24,119,242,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {conectando ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Conectando con Meta...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-5 w-5 fill-white" />
                      <span>{sdkCargado ? "Conectar con Meta" : "Cargando seguridad..."}</span>
                      <ArrowRight className="absolute right-6 h-5 w-5 opacity-0 -translate-x-4 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}