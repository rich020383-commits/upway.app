"use client";

import React, { useState } from 'react';
import { ShieldCheck, Bot, Loader2, ExternalLink } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter } from 'next/navigation';

export default function Paso07Checkout() {
  const router = useRouter();
  const { 
    modulosSeleccionados, 
    nombreAgente 
  } = useUpwayStore();
  
  const [procesando, setProcesando] = useState(false);

  const detallesModulos: Record<string, { nombre: string, precio: number }> = {
    'whatsapp': { nombre: 'WhatsApp IA (Texto)', precio: 399900 },
    'voz': { nombre: 'Central Telefónica (Voz)', precio: 599900 },
    'calendario': { nombre: 'Agenda Inteligente', precio: 39000 },
    'analitica': { nombre: 'Analítica Avanzada', precio: 19000 },
    'rag': { nombre: 'Cerebro RAG (Omnicanal)', precio: 0 },
  };

  const totalMensual = modulosSeleccionados.reduce((acc: number, id: string) => {
    return acc + (detallesModulos[id]?.precio || 0);
  }, 0);

  const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;

  const handleSimularPago = async () => {
    setProcesando(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      router.push('/dashboard/onboarding/activacion');
    } catch (error) {
      console.error('Error:', error);
      setProcesando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white p-8 md:p-16 flex justify-center items-center">
      
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12">
        
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Resumen de Inversión</h1>
            <p className="text-slate-400">Tu asistente <strong className="text-white">{nombreAgente || 'IA'}</strong> está listo para salir a producción.</p>
          </div>

          <div className="bg-white/[0.02] border border-white/10 p-8 rounded-[32px] backdrop-blur-xl">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Bot className="text-cyan-400" /> Sistema Upway 2.0
            </h3>
            
            <div className="space-y-4 mb-6">
              {modulosSeleccionados.map((id: string) => {
                const mod = detallesModulos[id];
                if (!mod) return null;
                return (
                  <div key={id} className="flex justify-between items-center text-slate-300">
                    <span>{mod.nombre}</span>
                    <span className="font-mono">{mod.precio === 0 ? 'GRATIS' : fmt(mod.precio)}</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-white/10 pt-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-400">Total a facturar hoy</p>
                <p className="text-xs text-slate-500">Suscripción mensual recurrente</p>
              </div>
              <div className="text-3xl font-bold text-white">
                {fmt(totalMensual)} <span className="text-xs text-slate-500 font-normal">COP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center text-center bg-[#0A0A0F] border border-white/10 p-10 rounded-[32px] shadow-2xl">
          
          <div className="h-20 w-20 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck size={40} />
          </div>
          
          <h2 className="text-2xl font-bold mb-4">Pago Seguro Garantizado</h2>
          <p className="text-slate-400 mb-8 text-sm">
            Serás redirigido a la pasarela segura para procesar tu tarjeta. Nosotros no guardamos tus datos financieros.
          </p>

          <button 
            onClick={handleSimularPago}
            disabled={procesando || totalMensual === 0}
            className="w-full bg-[#00D1FF] text-black py-5 rounded-2xl font-bold hover:bg-[#33DDFF] transition-all flex justify-center items-center gap-3 disabled:opacity-50 relative overflow-hidden shadow-[0_0_25px_rgba(0,209,255,0.4)]"
          >
            {procesando ? (
              <><Loader2 className="animate-spin" size={20} /> Autorizando transacción...</>
            ) : (
              <>Pagar y Activar Sistema <ExternalLink size={20} /></>
            )}
          </button>

          <div className="mt-6 flex items-center gap-4 opacity-50">
            <span className="text-xs font-mono border border-white/20 px-2 py-1 rounded">VISA</span>
            <span className="text-xs font-mono border border-white/20 px-2 py-1 rounded">MASTERCARD</span>
            <span className="text-xs font-mono border border-white/20 px-2 py-1 rounded">PSE</span>
            <span className="text-xs font-mono border border-white/20 px-2 py-1 rounded">BOLD</span>
          </div>

        </div>
      </div>
    </div>
  );
}