"use client";

import React, { useState } from 'react';
import { ShieldCheck, Bot, Loader2, ExternalLink, Lock, Server } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Paso06Checkout() {
  const router = useRouter();
  
  // 🔥 HOTFIX: Evitamos que Next.js explote al compilar en estático en Render
  const sessionContext = useSession() || {};
  const session = sessionContext.data;
  
  const { 
    modulosSeleccionados, 
    nombreAgente,
    promptMaestro, 
    resetOnboarding 
  } = useUpwayStore();
  
  const [procesando, setProcesando] = useState(false);

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

  const handleSimularPago = async () => {
    setProcesando(true);
    
    // Validamos que el usuario esté realmente logueado antes de avanzar
    const userIdReal = (session?.user as any)?.id;
    if (!userIdReal) {
      alert("No se detectó una sesión activa. Por favor, recarga la página o vuelve a iniciar sesión.");
      setProcesando(false);
      return;
    }
    
    try {
      // 1. Guardamos el agente en la base de datos de Neon enviando el ID REAL
      const res = await fetch('/api/tienda/aprovisionar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdReal, // ID real obtenido de la sesión de NextAuth
          nombreNegocio: "Empresa Cliente", 
          nombreAgente: nombreAgente || 'Asistente IA',
          promptMaestro: promptMaestro || 'Eres un asistente útil.', 
          modulosSeleccionados: modulosSeleccionados,
        })
      });

      // 2. Simulación visual de la pasarela para UX
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (res.ok) {
        console.log("Infraestructura creada en BD con éxito");
        resetOnboarding(); // Limpiamos la memoria temporal
      } else {
        const errorData = await res.json();
        console.error("Error del servidor al aprovisionar:", errorData);
      }

      // 3. Redirigimos al paso de Meta para continuar el flujo
      router.push('/dashboard/onboarding/activacion');

    } catch (error) {
      console.error('Error de despliegue:', error);
      router.push('/dashboard/onboarding/activacion');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#07090C] text-[#F5F7FA] pb-20 font-sans selection:bg-[#19C8E8] selection:text-[#07090C] flex justify-center items-center">
      
      <div className="w-full max-w-5xl px-6 pt-12 md:pt-20">
        
        {/* Cabecera / Narrativa */}
        <div className="mb-12 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 text-[#8994A6] text-xs font-semibold tracking-widest uppercase mb-6">
            <Lock className="h-3 w-3" />
            <span>Paso Final</span>
            <span className="w-1 h-1 rounded-full bg-[#8994A6]"></span>
            <span className="text-[#19C8E8]">Despliegue</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Autorización de Facturación</h1>
          <p className="text-[#8994A6] text-lg max-w-2xl mx-auto md:mx-0">
            Revisa la configuración final de <strong className="text-[#F5F7FA]">{nombreAgente || 'tu agente'}</strong> y autoriza el aprovisionamiento de infraestructura en nuestros servidores.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          
          {/* COLUMNA IZQUIERDA: Resumen de Inversión */}
          <div className="space-y-6">
            <div className="bg-[#0D1117] border border-[#1E293B] p-8 rounded-2xl shadow-xl">
              
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#1E293B]">
                <h3 className="text-lg font-semibold flex items-center gap-3">
                  <Server className="text-[#9B5CFF] h-5 w-5" /> 
                  Infraestructura Upway
                </h3>
                <span className="text-[10px] font-mono tracking-widest text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-md border border-[#10B981]/20">
                  LISTO
                </span>
              </div>
              
              <div className="space-y-5 mb-8">
                {modulosSeleccionados.length === 0 && (
                  <p className="text-[#8994A6] text-sm italic">No hay módulos seleccionados.</p>
                )}
                
                {modulosSeleccionados.map((id: string) => {
                  const mod = detallesModulos[id];
                  if (!mod) return null;
                  return (
                    <div key={id} className="flex justify-between items-center text-sm">
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

              <div className="bg-[#07090C] border border-[#1E293B] rounded-xl p-6 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8994A6] mb-1">Total a facturar hoy</p>
                  <p className="text-[11px] text-[#8994A6]">Suscripción mensual recurrente</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[#F5F7FA] tracking-tight">
                    {fmt(totalMensual)}
                  </p>
                  <p className="text-[10px] font-mono text-[#8994A6] mt-1">COP / MES</p>
                </div>
              </div>

            </div>
          </div>

          {/* COLUMNA DERECHA: Pasarela de Pago */}
          <div className="bg-[#0D1117] border border-[#1E293B] p-8 md:p-10 rounded-2xl shadow-2xl flex flex-col justify-center relative overflow-hidden">
            
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#F5F7FA 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            <div className="relative z-10">
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-full flex items-center justify-center mb-6">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-[#F5F7FA]">Facturación Segura</h2>
                <p className="text-[#8994A6] text-sm leading-relaxed max-w-sm">
                  Transacción cifrada de extremo a extremo. Nosotros no almacenamos tus datos financieros.
                </p>
              </div>

              <button 
                onClick={handleSimularPago}
                disabled={procesando || totalMensual === 0}
                className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-3 transition-all ${
                  procesando 
                    ? 'bg-[#19C8E8]/10 text-[#19C8E8] border border-[#19C8E8]/30 cursor-not-allowed'
                    : 'bg-[#19C8E8] text-[#07090C] hover:bg-[#33DDFF] shadow-[0_0_20px_rgba(25,200,232,0.2)]'
                } disabled:opacity-50`}
              >
                {procesando ? (
                  <><Loader2 className="animate-spin" size={18} /> Autorizando despliegue...</>
                ) : (
                  <>Pagar y Activar Sistema <ExternalLink size={18} /></>
                )}
              </button>

              <div className="mt-8 pt-6 border-t border-[#1E293B] flex items-center justify-center gap-3 flex-wrap">
                <span className="text-[10px] font-mono text-[#8994A6] border border-[#1E293B] bg-[#07090C] px-3 py-1.5 rounded-md">VISA</span>
                <span className="text-[10px] font-mono text-[#8994A6] border border-[#1E293B] bg-[#07090C] px-3 py-1.5 rounded-md">MASTERCARD</span>
                <span className="text-[10px] font-mono text-[#8994A6] border border-[#1E293B] bg-[#07090C] px-3 py-1.5 rounded-md">PSE</span>
                <span className="text-[10px] font-mono text-[#8994A6] border border-[#1E293B] bg-[#07090C] px-3 py-1.5 rounded-md">BOLD</span>
              </div>
              
              <p className="text-center text-[10px] text-[#8994A6] mt-4 flex items-center justify-center gap-1">
                <Lock size={10} /> Conexión segura TLS 1.3
              </p>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}