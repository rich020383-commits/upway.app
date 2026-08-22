"use client";

import React, { useState } from 'react';
import { ShieldCheck, Bot, Loader2, ExternalLink, Lock, Server } from 'lucide-react';
import { useUpwayStore } from '../../../store/upwayStore';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Paso06Checkout() {
  const router = useRouter();
  const sessionContext = useSession() || {};
  const session = sessionContext.data;
  
  const { 
    modulosSeleccionados, 
    nombreAgente,
    promptMaestro, 
    resetOnboarding 
  } = useUpwayStore();
  
  const [procesando, setProcesando] = useState(false);

  // ... (detallesModulos y fmt igual) ...
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
    // 🔍 DEBUGGING: Mira qué hay en la consola (F12)
    console.log("🔍 Sesión actual:", session);

    // 🔥 BLINDAJE ESTRICTO: Si no hay ID real, NO avanzamos.
    const userIdReal = (session?.user as any)?.id;
    if (!userIdReal) {
      alert("❌ Error: No se detectó una sesión válida. Por favor, cierra sesión y vuelve a entrar en /login.");
      return;
    }

    setProcesando(true);
    
    try {
      const res = await fetch('/api/tienda/aprovisionar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdReal, // Aquí SÍ irá tu UUID real
          nombreNegocio: "Empresa Cliente", 
          nombreAgente: nombreAgente || 'Asistente IA',
          promptMaestro: promptMaestro || 'Eres un asistente útil.', 
          modulosSeleccionados: modulosSeleccionados,
        })
      });

      if (res.ok) {
        console.log("Infraestructura creada en BD con éxito");
        resetOnboarding(); 
      }

      router.push('/dashboard/onboarding/activacion');

    } catch (error) {
      console.error('Error de despliegue:', error);
      router.push('/dashboard/onboarding/activacion');
    } finally {
      setProcesando(false);
    }
  };

  // ... (el resto del return es igual) ...
  return (
    <main className="min-h-screen bg-[#07090C] text-[#F5F7FA] pb-20 font-sans selection:bg-[#19C8E8] selection:text-[#07090C] flex justify-center items-center">
      <div className="w-full max-w-5xl px-6 pt-12 md:pt-20">
        <div className="mb-12 text-center md:text-left">
           <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Autorización de Facturación</h1>
           <p className="text-[#8994A6] text-lg">Usuario logueado: {(session?.user as any)?.email || 'Cargando...'}</p>
        </div>
        {/* ... (el resto de la estructura igual) ... */}
        {/* Asegúrate de mantener la estructura del botón igual que antes */}
        <button onClick={handleSimularPago} className="...">Pagar y Activar</button>
      </div>
    </main>
  );
}