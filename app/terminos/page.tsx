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
          <p className="text-slate-500 text-sm font-mono tracking-widest">ÚLTIMA ACTUALIZACIÓN: 31 DE AGOSTO DE 2026</p>
        </div>

        {/* Contenido Legal */}
        <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-8 sm:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D1FF]/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="prose prose-invert max-w-none prose-slate relative z-10 font-body">
            
            <p className="lead text-lg text-slate-300 mb-8 font-medium">
              Bienvenido a Upway (incluyendo sus verticales <strong className="text-white">Upway Business</strong> y <strong className="text-[#00D1FF]">Upway Health</strong>). Los presentes Términos regulan el acceso a la infraestructura SaaS operada por <strong className="text-white">BARAKAH TECH HUB S.A.S.</strong>
            </p>
            <p className="mb-8 leading-relaxed">
              Al registrarse o utilizar nuestra plataforma de inteligencia artificial y automatización omnicanal, el usuario (en adelante, "el Cliente" o "la Clínica") acepta someterse a estos términos.
            </p>

            <h3 className="text-xl font-bold text-white mt-10 mb-4 flex items-center gap-2">
              <span className="text-[#00D1FF]">01.</span> Uso Aceptable del Servicio
            </h3>
            <p className="mb-4 leading-relaxed">
              El Cliente se obliga a utilizar el servicio de Upway únicamente para fines lícitos. En el caso de <strong>Upway Health</strong>, el empleado digital debe emplearse exclusivamente como asistente administrativo (agendamiento, información, recepción). <strong>La Inteligencia Artificial de Upway NO está diseñada para emitir diagnósticos médicos, prescribir tratamientos ni reemplazar el criterio de un profesional de la salud.</strong>
            </p>

            <h3 className="text-xl font-bold text-white mt-10 mb-4 flex items-center gap-2">
              <span className="text-[#00D1FF]">02.</span> Tratamiento de Datos y Consentimiento (Ley 1581 y DPA)
            </h3>
            <ul className="list-none space-y-3 mb-6">
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span><strong>El Rol de las Partes:</strong> El Cliente (la Clínica/Empresa) actúa como el <strong>Responsable del Tratamiento</strong> legal de los datos de sus pacientes. Upway actúa única y exclusivamente como <strong>Encargado del Tratamiento</strong>, proveyendo la infraestructura técnica.</span></li>
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span><strong>Habeas Data y Consentimiento:</strong> Es obligación indelegable del Cliente obtener el consentimiento previo, expreso e informado de sus pacientes antes de recolectar datos personales, información de salud o biometría (voz), en estricto cumplimiento de la Ley 1581 de 2012 y normativas equivalentes.</span></li>
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span><strong>Acuerdo de Procesamiento de Datos (DPA):</strong> Al usar Upway Health, el Cliente acepta nuestro DPA estándar, el cual certifica que Upway procesa la información en entornos aislados y cifrados, no vende los datos a terceros y no utiliza la información médica de los pacientes para entrenar modelos de IA generalizados.</span></li>
            </ul>

            <h3 className="text-xl font-bold text-white mt-10 mb-4 flex items-center gap-2">
              <span className="text-[#00D1FF]">03.</span> Inteligencia Artificial (Alucinaciones y Límites)
            </h3>
            <p className="mb-4 leading-relaxed">
              El Cliente comprende que la IA puede generar respuestas imprecisas ("alucinaciones"). BARAKAH TECH HUB S.A.S. no asume responsabilidad civil ni médica por interacciones autónomas de la IA con los pacientes. El Cliente debe utilizar el mecanismo de <em>Human Handoff</em> (intervención humana) para gestionar consultas críticas o que excedan la capacidad administrativa del bot.
            </p>

            <h3 className="text-xl font-bold text-white mt-10 mb-4 flex items-center gap-2">
              <span className="text-[#00D1FF]">04.</span> Prohibiciones Estrictas
            </h3>
            <p className="mb-4 leading-relaxed">Queda expresamente prohibido:</p>
            <ul className="list-none space-y-3 mb-6">
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span>Violar políticas de Meta Platforms (WhatsApp), Vapi, Google o AWS.</span></li>
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span>Extraer código, realizar ingeniería inversa o clonar la arquitectura multi-tenant de Upway.</span></li>
              <li className="flex gap-3"><span className="text-[#00D1FF]">✦</span> <span>Procesar o solicitar mediante el bot información bancaria explícita (como CVV de tarjetas) que viole estándares PCI-DSS.</span></li>
            </ul>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mt-8 mb-10">
              <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Sanciones por Incumplimiento
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                Cualquier violación a las leyes de privacidad de pacientes o a estas prohibiciones resultará en la terminación inmediata del servicio sin derecho a reembolso. El cliente asume la responsabilidad total frente a autoridades (como la SIC o el MinSalud).
              </p>
            </div>

            <hr className="border-white/10 my-10" />

            <div className="bg-[#00D1FF]/5 border border-[#00D1FF]/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Soporte Legal y Operativo</h3>
              <p className="text-slate-400 text-sm mb-4">
                Para requerimientos corporativos, DPA (Contrato de Encargo) o consultas sobre el SLA:
              </p>
              <a href="mailto:legal@upway.business" className="inline-flex items-center gap-2 text-[#00D1FF] hover:text-white transition-colors font-mono font-bold tracking-wide">
                legal@upway.business
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}