"use client";

import React from 'react';
import { ShieldCheck, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#03050a] px-4 py-12 text-slate-300 sm:px-6 lg:px-8 selection:bg-[#00D1FF]/30 selection:text-white">
      <div className="mx-auto max-w-4xl">
        
        {/* Cabecera */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-mono text-slate-400 hover:text-[#00D1FF] transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            [VOLVER_AL_INICIO]
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/30 shadow-[0_0_20px_rgba(0,209,255,0.2)]">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-display">Términos y Condiciones</h1>
          </div>
          <p className="text-slate-500 text-sm font-mono tracking-widest">ÚLTIMA ACTUALIZACIÓN: 16 DE AGOSTO DE 2026</p>
        </div>

        {/* Contenido Legal */}
        <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-8 sm:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Brillo de fondo */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D1FF]/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="prose prose-invert max-w-none prose-slate relative z-10 font-body">
            
            <p className="lead text-lg text-slate-300 mb-8 font-medium">
              Bienvenido a Upway Business. Los presentes Términos y Condiciones regulan el acceso y uso de la infraestructura de software como servicio (SaaS) Upway Business, operada por <strong className="text-white">BARAKAH TECH HUB S.A.S.</strong>, legalmente constituida en Colombia.
            </p>
            <p className="mb-8 leading-relaxed">
              Al registrarse, acceder o utilizar nuestra plataforma de inteligencia artificial, el usuario (en adelante, "el Cliente") acepta someterse a los presentes términos. Si no está de acuerdo con alguna de las condiciones, no deberá desplegar nuestros servicios corporativos.
            </p>

            <h3 className="text-xl font-bold text-white mt-10 mb-4 flex items-center gap-2">
              <span className="text-[#00D1FF]">01.</span> Uso Aceptable del Servicio
            </h3>
            <p className="mb-4 leading-relaxed">
              El Cliente se obliga a utilizar el servicio de UpWay únicamente para fines lícitos, éticos y dentro del marco legal colombiano. El empleado digital debe emplearse exclusivamente para atender comunicaciones propias de la operación comercial del cliente, agendar citas, procesar pedidos y brindar información autorizada.
            </p>

            <h3 className="text-xl font-bold text-white mt-10 mb-4 flex items-center gap-2">
              <span className="text-[#00D1FF]">02.</span> Actividades Estrictamente Prohibidas
            </h3>
            <p className="mb-4 leading-relaxed">Queda expresamente prohibido utilizar la plataforma, los canales de voz, WhatsApp o cualquier integración de UpWay para:</p>
            <ul className="list-none space-y-3 mb-6">
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span><strong>Spam y Publicidad Intrusiva:</strong> Envío masivo de mensajes no solicitados, cadenas o contenido publicitario no consentido.</span></li>
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span><strong>Fraude:</strong> Actividades fraudulentas, estafas, suplantación de identidad (phishing) o conductas que induzcan a error a terceros.</span></li>
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span><strong>Contenido Ilegal o Dañino:</strong> Contenido ilegal, difamatorio, obsceno, discriminatorio, violento o que promueva el odio por razones de raza, género, religión o condición socioeconómica.</span></li>
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span><strong>Violación de Propiedad Intelectual:</strong> Actividades que infrinjan derechos de autor, propiedad industrial o imagen de terceros.</span></li>
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span><strong>Clonación y Piratería:</strong> Usar la plataforma para competir directamente con UpWay, realizar ingeniería inversa, extraer código, copiar arquitectura o crear productos derivados.</span></li>
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span><strong>Violación de Políticas de Terceros:</strong> Cualquier actividad que viole las políticas de Meta Platforms (WhatsApp, Facebook), Vapi, Bold, Nequi, Google o AWS.</span></li>
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span><strong>Reventa No Autorizada:</strong> Transferir, revender, sublicenciar o permitir el acceso a terceros no autorizados sin consentimiento de UpWay.</span></li>
            </ul>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mt-8 mb-10">
              <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Consecuencias del Incumplimiento
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                El incumplimiento de cualquiera de las prohibiciones anteriores constituirá causal inmediata de terminación del servicio. UpWay se reserva el derecho de suspender, limitar o cancelar el acceso a la plataforma sin previo aviso y <strong>sin derecho a devolución de pagos realizados</strong> (incluyendo implementación y mensualidades).
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                El cliente será el único responsable civil y penalmente ante terceros y autoridades competentes. UpWay queda eximida de toda responsabilidad derivada de actos u omisiones atribuibles al cliente.
              </p>
            </div>

            <h3 className="text-xl font-bold text-white mt-10 mb-4 flex items-center gap-2">
              <span className="text-[#00D1FF]">03.</span> Inteligencia Artificial (Alucinaciones)
            </h3>
            <p className="mb-4 leading-relaxed">
              El Cliente comprende que la IA (texto y voz sintética) puede generar respuestas imprecisas o inesperadas ("alucinaciones"). BARAKAH TECH HUB S.A.S. no asume responsabilidad por pérdidas, compromisos financieros o malos entendidos derivados de las interacciones autónomas de la IA con los usuarios finales del Cliente.
            </p>

            <h3 className="text-xl font-bold text-white mt-10 mb-4 flex items-center gap-2">
              <span className="text-[#00D1FF]">04.</span> Tratamiento de Datos Personales (Ley 1581)
            </h3>
            <ul className="list-none space-y-3 mb-6">
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span>El Cliente actúa como el <strong>Responsable del Tratamiento</strong> de los datos de sus clientes. Upway Business actúa únicamente como <strong>Encargado del Tratamiento</strong>.</span></li>
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span>No comercializaremos ni compartiremos las bases de datos corporativas con terceros no autorizados.</span></li>
            </ul>

            <h3 className="text-xl font-bold text-white mt-10 mb-4 flex items-center gap-2">
              <span className="text-[#00D1FF]">05.</span> Infraestructura y Pagos
            </h3>
            <ul className="list-none space-y-3 mb-6">
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span>El acceso a la infraestructura requiere el pago de la suscripción acordada. Nos reservamos el derecho de apagar el entorno por impago.</span></li>
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span>Garantía de Servicio (SLA): Se aplicarán créditos de penalidad a favor del cliente únicamente por interrupciones atribuibles a la infraestructura de UpWay (excluyendo caídas de Meta, Bold o conectividad del cliente).</span></li>
            </ul>

            <hr className="border-white/10 my-10" />

            <div className="bg-[#00D1FF]/5 border border-[#00D1FF]/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Soporte Legal y Operativo</h3>
              <p className="text-slate-400 text-sm mb-4">
                Para requerimientos corporativos, reporte de abusos o consultas sobre este acuerdo de nivel de servicio (SLA), comuníquese a nuestro canal oficial:
              </p>
              <a href="mailto:notificaciones@upway.business" className="inline-flex items-center gap-2 text-[#00D1FF] hover:text-white transition-colors font-mono font-bold tracking-wide">
                notificaciones@upway.business
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}