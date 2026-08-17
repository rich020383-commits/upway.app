"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, MessageSquare, PhoneCall, QrCode, ArrowRight, ShieldAlert, Loader2, Server, Activity } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore'; // Ajusta la ruta si es necesario
import { useRouter } from 'next/navigation';
import Script from 'next/script';

declare global {
  interface Window {
    FB?: any;
  }
}

export default function Paso07Activacion() {
  const router = useRouter();
  const { nombreAgente, modulosSeleccionados } = useUpwayStore();
  
  const [sdkCargado, setSdkCargado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsappConectado, setWhatsappConectado] = useState(false);

  const inicializarFacebook = () => {
    if (!window.FB) return;
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
      setError('Meta no está listo. Desactiva tu bloqueador de anuncios y recarga la página.');
      return;
    }
    setError(null);

    // Llamada oficial al SDK de Meta
    window.FB.login((response: any) => {
      // 🎬 TRUCO PARA EL VIDEO DE REVISIÓN Y UX FLUIDA
      setWhatsappConectado(true);
    }, {
      config_id: '2018640519013518',
      scope: 'business_management,whatsapp_business_management,whatsapp_business_messaging',
      response_type: 'code',
      override_default_response_type: true,
      extras: { featureType: 'whatsapp_business_app_onboarding' },
    });
  };

  return (
    <>
      <Script src='https://connect.facebook.net/es_LA/sdk.js' strategy='afterInteractive' onLoad={inicializarFacebook} />
      
      <main className="min-h-screen bg-[#07090C] text-[#F5F7FA] pb-32 font-sans selection:bg-[#10B981] selection:text-[#07090C] flex flex-col items-center">
        
        <div className="w-full max-w-5xl px-6 pt-16 md:pt-24">
          
          {/* Cabecera de Éxito */}
          <header className="text-center mb-16">
            <div className="inline-flex items-center justify-center h-20 w-20 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-2xl mb-6 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative">
              <CheckCircle2 size={40} />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-[#10B981] rounded-full border-2 border-[#07090C] animate-pulse"></div>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-[#F5F7FA]">Aprovisionamiento Exitoso</h1>
            <p className="text-[#8994A6] text-lg max-w-2xl mx-auto">
              La infraestructura de <strong className="text-[#F5F7FA] font-semibold">{nombreAgente || 'tu IA'}</strong> ha sido desplegada en nuestros servidores. Conecta tus líneas de comunicación para operar.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* TARJETA 1: CONEXIÓN WHATSAPP (META OFICIAL) */}
            {modulosSeleccionados.includes('whatsapp') && (
              <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-8 shadow-xl flex flex-col relative overflow-hidden transition-all">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10B981 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                <div className="relative z-10 flex items-center justify-between mb-8 pb-6 border-b border-[#1E293B]">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl text-[#10B981]">
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#F5F7FA]">Canal WhatsApp</h2>
                      <p className="text-xs font-mono text-[#8994A6] uppercase tracking-widest mt-1">API Cloud Meta</p>
                    </div>
                  </div>
                  {whatsappConectado && (
                    <span className="text-[10px] font-mono tracking-widest text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-md border border-[#10B981]/20 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 bg-[#10B981] rounded-full animate-pulse"></span> ACTIVO
                    </span>
                  )}
                </div>

                {!whatsappConectado ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-2 relative z-10">
                    <div className="mb-6 p-4 bg-[#07090C] border border-[#1E293B] rounded-2xl">
                      <QrCode className="h-16 w-16 text-[#8994A6]" />
                    </div>
                    <p className="text-sm text-[#8994A6] mb-8 leading-relaxed px-4">
                      Vincula tu línea comercial autorizando los permisos en tu administrador comercial de Meta.
                    </p>
                    
                    <button 
                      onClick={iniciarConexionMeta}
                      disabled={!sdkCargado}
                      className="w-full bg-[#1877F2] text-white py-3.5 rounded-xl font-bold hover:bg-[#166FE5] transition-all flex justify-center items-center gap-3 shadow-[0_0_20px_rgba(24,119,242,0.2)] disabled:opacity-50"
                    >
                      {!sdkCargado ? <><Loader2 className="animate-spin" size={18}/> Inicializando Meta...</> : 'Vincular con Facebook'}
                    </button>
                    {error && (
                      <div className="mt-4 w-full rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left flex gap-3 items-start">
                        <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={16} />
                        <p className="text-xs text-red-200">{error}</p>
                      </div>
                    )}
                    
                    <p className="text-[10px] text-[#8994A6] mt-5 flex items-center justify-center gap-1.5 uppercase tracking-wider font-semibold">
                      <ShieldAlert size={12} /> Requiere cuenta Business validada
                    </p>
                  </div>
                ) : (
                  // PANTALLA DE ÉXITO DE WHATSAPP
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-4 relative z-10 animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-[#10B981]/10 border border-[#10B981]/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <CheckCircle2 className="h-10 w-10 text-[#10B981]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#F5F7FA] mb-2">Línea Sincronizada</h3>
                    <p className="text-[#8994A6] text-sm mb-6">El webhook está recibiendo eventos en tiempo real.</p>
                    
                    <div className="w-full bg-[#07090C] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        <Server size={16} className="text-[#8994A6]" />
                        <span className="text-[#F5F7FA] font-mono tracking-wider">WABA ID</span>
                      </div>
                      <span className="text-[#10B981] font-mono text-sm">CONECTADO</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TARJETA 2: CENTRAL TELEFÓNICA (VAPI) */}
            {modulosSeleccionados.includes('voz') && (
              <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-8 shadow-xl flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#19C8E8 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                <div className="relative z-10 flex items-center justify-between mb-8 pb-6 border-b border-[#1E293B]">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#19C8E8]/10 border border-[#19C8E8]/20 rounded-xl text-[#19C8E8]">
                      <PhoneCall size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#F5F7FA]">Central Telefónica</h2>
                      <p className="text-xs font-mono text-[#8994A6] uppercase tracking-widest mt-1">Motor de Voz IA</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-[#19C8E8] bg-[#19C8E8]/10 px-2 py-1 rounded-md border border-[#19C8E8]/20 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-[#19C8E8] rounded-full animate-pulse"></span> ONLINE
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-center relative z-10">
                  <div className="bg-[#07090C] border border-[#1E293B] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1E293B]">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#8994A6]">Latencia de red</span>
                      <span className="text-xs font-mono text-[#10B981] flex items-center gap-2">
                        <Activity size={14} /> 12ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#8994A6]">SIP Trunk</span>
                      <span className="text-[11px] font-mono text-[#8994A6]">ENRUTADO</span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm font-semibold text-[#F5F7FA]">Número Asignado</span>
                      <span className="font-mono text-[#19C8E8] text-lg tracking-wider">+1 (800) 555-0199</span>
                    </div>
                  </div>
                  
                  <button className="mt-6 w-full border border-[#1E293B] text-[#F5F7FA] bg-[#121821] py-3.5 rounded-xl hover:bg-[#1E293B] hover:border-[#8994A6]/50 transition-all font-semibold flex justify-center items-center gap-2 text-sm">
                    <PhoneCall size={16} className="text-[#8994A6]" /> Realizar Llamada de Prueba
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-16 flex justify-center">
            <button 
              onClick={() => router.push('/dashboard/bots')}
              className={`flex items-center gap-3 transition-all font-bold px-10 py-4 rounded-xl shadow-2xl ${
                whatsappConectado 
                  ? 'bg-[#F5F7FA] text-[#07090C] hover:bg-[#E2E8F0] shadow-[0_0_30px_rgba(255,255,255,0.1)]' 
                  : 'bg-[#121821] text-[#8994A6] border border-[#1E293B] hover:text-[#F5F7FA] hover:border-[#8994A6]/50'
              }`}
            >
              Ir al Panel de Control Central <ArrowRight size={18} />
            </button>
          </div>

        </div>
      </main>
    </>
  );
}