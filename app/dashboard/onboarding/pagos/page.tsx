"use client";

import React, { useState } from 'react';
import { ShieldCheck, Bot, Loader2, ExternalLink } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter } from 'next/navigation';

export default function Paso07Checkout() {
  const router = useRouter();
  const { 
    totalMensual, 
    modulosSeleccionados, 
    nombreAgente, 
    nicho, 
    promptMaestro, 
    tonoWhatsapp,
    vozSeleccionada 
  } = useUpwayStore();
  
  const [procesando, setProcesando] = useState(false);

  const detallesModulos: Record<string, { nombre: string, precio: number }> = {
    'whatsapp': { nombre: 'WhatsApp IA', precio: 49 },
    'voz': { nombre: 'Central Telefónica', precio: 59 },
    'calendario': { nombre: 'Agenda Inteligente', precio: 29 },
  };

  // 🎬 VERSIÓN SIMULADA PARA EL VIDEO DE META
  const handleSimularPago = async () => {
    setProcesando(true);
    
    try {
      // Simulamos que está validando con el banco (2 segundos de carga)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // ¡Redirección directa a la pantalla de éxito que acabamos de crear!
      router.push('/dashboard/onboarding/activacion');

    } catch (error) {
      console.error('Error:', error);
      setProcesando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white p-8 md:p-16 flex justify-center items-center">
      
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12">
        
        {/* COLUMNA IZQUIERDA: RESUMEN DEL PEDIDO */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Resumen de Inversión</h1>
            <p className="text-slate-400">Tu asistente <strong className="text-white">{nombreAgente || 'IA'}</strong> está listo para salir a producción.</p>
          </div>

          <div className="bg-white/[0.02] border border-white/10 p-8 rounded-[32px] backdrop-blur-xl">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Bot className="text-blue-400" /> Sistema Upway 2.0
            </h3>
            
            <div className="space-y-4 mb-6">
              {modulosSeleccionados.map(id => (
                <div key={id} className="flex justify-between items-center text-slate-300">
                  <span>{detallesModulos[id]?.nombre}</span>
                  <span className="font-mono">${detallesModulos[id]?.precio}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-400">Total a facturar hoy</p>
                <p className="text-xs text-slate-500">Suscripción mensual recurrente</p>
              </div>
              <div className="text-4xl font-bold text-white">
                ${totalMensual} <span className="text-sm text-slate-500 font-normal">USD</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: BOTÓN DE PAGO SIMULADO */}
        <div className="flex flex-col justify-center items-center text-center bg-[#0A0A0F] border border-white/10 p-10 rounded-[32px] shadow-2xl">
          
          <div className="h-20 w-20 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck size={40} />
          </div>
          
          <h2 className="text-2xl font-bold mb-4">Pago Seguro Garantizado</h2>
          <p className="text-slate-400 mb-8 text-sm">
            Serás redirigido a la pasarela segura para procesar tu tarjeta de crédito. Nosotros no guardamos tus datos financieros.
          </p>

          <button 
            onClick={handleSimularPago}
            disabled={procesando || totalMensual === 0}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold hover:bg-blue-500 transition-all flex justify-center items-center gap-3 disabled:opacity-50 relative overflow-hidden"
          >
            {procesando ? (
              <><Loader2 className="animate-spin" size={20} /> Autorizando transacción...</>
            ) : (
              <>Pagar y Activar Sistema <ExternalLink size={20} /></>
            )}
          </button>

          <div className="mt-6 flex items-center gap-4 opacity-50">
            <span className="text-xs font-mono border px-2 py-1 rounded">VISA</span>
            <span className="text-xs font-mono border px-2 py-1 rounded">MASTERCARD</span>
            <span className="text-xs font-mono border px-2 py-1 rounded">PSE</span>
          </div>

        </div>
      </div>
    </div>
  );
}