"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, FileText, CheckCircle2, Activity } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_55%)] bg-slate-950 text-slate-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Botón de retorno */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>

        {/* Contenedor Principal */}
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0E14] shadow-2xl relative p-8 sm:p-12">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400"></div>

          {/* Encabezado */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Política de Privacidad Integral
              </h1>
              <p className="text-sm text-slate-400">
                Upway (BARAKAH TECH HUB S.A.S.) — Última actualización: 31 de agosto de 2026
              </p>
            </div>
          </div>

          <hr className="border-white/10 my-8" />

          <div className="space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base">
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                1. Información que Recopilamos (B2B)
              </h2>
              <p>
                Para prestar nuestros servicios SaaS, <strong>Upway</strong> recopila de sus Clientes Directos (Empresas y Clínicas) datos de carácter corporativo:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-400">
                <li>Datos de registro (correo, nombre de la entidad, información de facturación).</li>
                <li>Tokens de acceso de la API oficial de Meta Platforms (WhatsApp Business).</li>
                <li>Identificadores BSUID necesarios para el enrutamiento de la inteligencia artificial.</li>
              </ul>
            </section>

            <section className="space-y-3 bg-emerald-950/20 p-6 rounded-2xl border border-emerald-500/20">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                2. Upway Health y Privacidad de Datos Médicos (HIPAA)
              </h2>
              <p className="text-slate-300 mt-2">
                En nuestra vertical de salud (<strong>Upway Health</strong>), procesamos información de pacientes (chats, notas de voz, agendas) <strong>estrictamente en calidad de Encargados del Tratamiento</strong>.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-400 mt-3">
                <li><strong>Aislamiento de Infraestructura:</strong> Los datos de pacientes se almacenan en arquitecturas de bases de datos compartimentadas (Multi-tenant lógicos mediante identificadores únicos de clínica) o contenedores dedicados.</li>
                <li><strong>Cero Entrenamiento Externo:</strong> Upway garantiza que la información clínica y personal recolectada por nuestros clientes <strong>NO</strong> se utiliza para entrenar inteligencias artificiales públicas ni se comparte con corporaciones de terceros sin acuerdos de confidencialidad médica (BAA).</li>
                <li><strong>Seguridad Sensible:</strong> Aplicamos cifrado en tránsito (HTTPS/WSS) y medidas de protección avanzadas exigidas por las regulaciones locales (Ley 1581) e internacionales.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-cyan-400" />
                3. Uso de las APIs de Google
              </h2>
              <p>
                El uso y transferencia que hace Upway de la información recibida de las API de Google a cualquier otra aplicación se ajustará a la <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 underline font-medium">Política de datos del usuario de los servicios API de Google</a>, incluidos los requisitos de Uso Limitado.
              </p>
              <p className="text-slate-400 mt-2">
                No transferimos datos de Workspace ni calendarios a proveedores de IA de terceros para el entrenamiento de modelos generalizados. 
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">4. Integración con Meta y Voz (Vapi)</h2>
              <p>
                Upway utiliza canales de comunicación avalados por Meta y procesadores de voz en la nube. Prohibimos a nuestros clientes el uso de técnicas de extracción de datos (scraping). La clínica cliente se compromete a notificar a sus pacientes que las interacciones de voz y texto serán procesadas por sistemas automatizados.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">5. Derechos de los Usuarios y Control</h2>
              <p>
                Los administradores tienen control total sobre sus integraciones. Si un paciente final desea ejercer su derecho de eliminación de historia o chats (Habeas Data), debe solicitarlo directamente a la Clínica (el Responsable). Upway proveerá a la Clínica las herramientas tecnológicas para ejecutar dicha eliminación de nuestra infraestructura de inmediato.
              </p>
            </section>

          </div>

          {/* Pie de página informativo */}
          <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Soberanía de Datos y Cumplimiento Ley 1581 de 2012
            </span>
            <span>© 2026 BARAKAH TECH HUB S.A.S. Todos los derechos reservados.</span>
          </div>

        </div>
      </div>
    </div>
  );
}