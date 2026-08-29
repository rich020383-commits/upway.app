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
                userId: (session?.user as any)?.id
              })
            });

            if (res.ok) {
              console.log("¡Éxito! Meta vinculado y guardado en Neon DB");
              setEstadowhatsapp('PENDING');
            } else {
              const errData = await res.json();
              console.error("Fallo en backend:", errData);
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
      
      {/* 🔥 EL CASCARÓN: h-full y flex-col congelan la pantalla general */}
      <div className="flex flex-col h-full w-full relative bg-transparent text-[#F5F7FA]">
        
        {/* Botón de Ir al Panel */}
        <div className="absolute top-4 right-4 md:top-6 md:right-8 z-50">
          <Link 
            href="/dashboard" 
            className="text-xs md:text-sm font-semibold text-[#8994A6] hover:text-[#10B981] flex items-center gap-2 bg-[#1E293B]/30 hover:bg-[#1E293B] px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all duration-300 border border-[#1E293B]/50 hover:border-[#10B981]/30"
          >
            Ir al Panel
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* 🔥 EL RESORTE CENTRAL: Distribuye el contenido perfectamente con scroll interno si hace falta */}
        <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-4 mt-6 md:mt-2 flex flex-col justify-center overflow-y-auto no-scrollbar">
          
          <header className="text-center mb-8 md:mb-10">
            <div className="inline-flex items-center justify-center h-14 w-14 md:h-16 md:w-16 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-2xl mb-4 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative">
              <CheckCircle2 size={30} />
              <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-[#10B981] rounded-full border-2 border-[#07090C] animate-pulse"></div>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-2 text-[#F5F7FA]">Aprovisionamiento Exitoso</h1>
            <p className="text-[#8994A6] text-xs md:text-base max-w-2xl mx-auto">
              La infraestructura de <strong className="text-[#F5F7FA] font-semibold">{nombreAgente || 'tu IA'}</strong> ha sido desplegada en nuestros servidores. Conecta tus líneas de comunicación para operar.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-5 lg:gap-8 pb-4">
            
            {/* TARJETA 1: CONEXIÓN WHATSAPP */}
            {modulosSeleccionados.includes('whatsapp') && (
              <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-6 md:p-7 shadow-xl flex flex-col relative overflow-hidden transition-all">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10B981 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                <div className="relative z-10 flex items-center justify-between mb-5 pb-4 border-b border-[#1E293B]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl text-[#10B981]">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-[#F5F7FA]">Canal WhatsApp</h2>
                      <p className="text-[10px] font-mono text-[#8994A6] uppercase tracking-widest mt-0.5">API Cloud Meta</p>
                    </div>
                  </div>
                  {estadowhatsapp !== 'INACTIVE' && (
                    <span className="text-[9px] font-mono tracking-widest text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md border border-yellow-500/20 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full animate-pulse"></span> PENDIENTE
                    </span>
                  )}
                </div>

                {estadowhatsapp === 'INACTIVE' ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-2 relative z-10">
                    <div className="mb-4 p-3 bg-[#07090C] border border-[#1E293B] rounded-2xl">
                      <QrCode className="h-12 w-12 text-[#8994A6]" />
                    </div>
                    <p className="text-xs md:text-sm text-[#8994A6] mb-6 leading-relaxed px-2">
                      Vincula tu línea comercial autorizando los permisos en tu administrador comercial de Meta.
                    </p>
                    
                    <button 
                      onClick={iniciarConexionMeta}
                      disabled={!sdkCargado || isProcessing}
                      className="w-full bg-[#1877F2] text-white py-3 rounded-xl font-bold hover:bg-[#166FE5] transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(24,119,242,0.2)] disabled:opacity-50 text-xs md:text-sm"
                    >
                      {!sdkCargado || isProcessing ? (
                        <><Loader2 className="animate-spin" size={16}/> {isProcessing ? 'Sincronizando...' : 'Inicializando Meta...'}</>
                      ) : (
                        'Vincular con Facebook'
                      )}
                    </button>
                    {error && (
                      <div className="mt-3 w-full rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-left flex gap-2 items-start">
                        <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={14} />
                        <p className="text-[10px] text-red-200">{error}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-2 relative z-10 animate-in fade-in zoom-in duration-500">
                    <div className="h-14 w-14 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                      <Loader2 className="h-7 w-7 text-yellow-500 animate-spin" />
                    </div>
                    <h3 className="text-base font-bold text-[#F5F7FA] mb-1">Vinculación Registrada</h3>
                    <p className="text-[#8994A6] text-xs mb-4">Tus datos se enviaron a Meta. La verificación puede tardar de 24 a 48 horas.</p>
                    
                    <div className="w-full bg-[#07090C] border border-[#1E293B] rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Server size={14} className="text-[#8994A6]" />
                        <span className="text-[#F5F7FA] font-mono tracking-wider">ESTADO WABA</span>
                      </div>
                      <span className="text-yellow-500 font-mono text-[10px]">EN REVISIÓN DE META</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TARJETA 2: CENTRAL TELEFÓNICA */}
            {modulosSeleccionados.includes('voz') && (
              <div className="bg-[#0D1117] border border-[#1E293B] rounded-2xl p-6 md:p-7 shadow-xl flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#19C8E8 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="relative z-10 flex items-center justify-between mb-5 pb-4 border-b border-[#1E293B]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#19C8E8]/10 border border-[#19C8E8]/20 rounded-xl text-[#19C8E8]">
                      <PhoneCall size={20} />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-[#F5F7FA]">Central Telefónica</h2>
                      <p className="text-[10px] font-mono text-[#8994A6] uppercase tracking-widest mt-0.5">Motor de Voz IA</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-[#19C8E8] bg-[#19C8E8]/10 px-2 py-1 rounded-md border border-[#19C8E8]/20 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-[#19C8E8] rounded-full animate-pulse"></span> ONLINE
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-center relative z-10">
                  <div className="bg-[#07090C] border border-[#1E293B] rounded-xl p-4 md:p-5">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E293B] text-xs">
                      <span className="font-semibold uppercase tracking-wider text-[#8994A6]">Latencia de red</span>
                      <span className="font-mono text-[#10B981] flex items-center gap-1.5"><Activity size={12} /> 12ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm font-semibold text-[#F5F7FA]">Número Asignado</span>
                      <span className="font-mono text-[#19C8E8] text-base md:text-lg tracking-wider">+1 (800) 555-0199</span>
                    </div>
                  </div>
                  <button className="mt-4 w-full border border-[#1E293B] text-[#F5F7FA] bg-[#121821] py-3 rounded-xl hover:bg-[#1E293B] transition-all font-semibold text-xs md:text-sm">
                    Realizar Llamada de Prueba
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🔥 BARRA INFERIOR: Anclada (shrink-0) */}
        <div className="shrink-0 w-full bg-[#07090C]/90 backdrop-blur-xl border-t border-[#1E293B] px-6 py-4 z-40">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div>
              <p className="text-[#8994A6] text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-1">
                Fase de despliegue
              </p>
              <p className="text-sm md:text-base font-bold text-[#F5F7FA]">
                {estadowhatsapp !== 'INACTIVE' ? 'Canales autorizados' : 'Requiere vinculación'}
              </p>
            </div>
            <button 
              onClick={() => router.push('/dashboard/bots')}
              disabled={estadowhatsapp === 'INACTIVE'}
              className={`flex items-center gap-2 md:gap-3 transition-all font-bold px-6 py-2.5 md:px-8 md:py-3.5 rounded-xl text-xs md:text-base shadow-2xl ${
                estadowhatsapp !== 'INACTIVE' 
                  ? 'bg-[#F5F7FA] text-[#07090C] hover:bg-[#E2E8F0]' 
                  : 'bg-[#121821] text-[#8994A6] border border-[#1E293B] cursor-not-allowed opacity-60'
              }`}
            >
              Ir al Panel de Control Central <ArrowRight size={18} />
            </button>
          </div>
        </div>

      </div>
    </>
  );
}