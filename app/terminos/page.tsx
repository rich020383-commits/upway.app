"use client";

import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        
        {/* Cabecera */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Términos y Condiciones de Uso</h1>
          </div>
          <p className="text-slate-500 text-sm">Última actualización: 6 de agosto de 2026</p>
        </div>

        {/* Contenido Legal */}
        <div className="rounded-3xl border border-white/10 bg-[#0A0E14] p-8 sm:p-12 shadow-2xl">
          <div className="prose prose-invert max-w-none prose-slate">
            
            <p className="lead text-lg text-slate-300 mb-8">
              Bienvenido a Upway Business. Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma de software como servicio (SaaS) Upway Business, operada por <strong>BARAKAH TECH HUB S.A.S.</strong>, una empresa legalmente constituida bajo las leyes de la República de Colombia.
            </p>
            <p className="mb-8">
              Al registrarse, acceder o utilizar nuestra plataforma, el usuario (en adelante, "el Cliente") acepta someterse a los presentes términos. Si no está de acuerdo con alguna de las condiciones, no deberá utilizar nuestros servicios.
            </p>

            <h3 className="text-xl font-semibold text-white mt-8 mb-4">1. Descripción del Servicio</h3>
            <p className="mb-6 text-slate-400">
              Upway Business provee una plataforma tecnológica que permite a las empresas automatizar su atención al cliente en WhatsApp mediante el uso de Inteligencia Artificial y la integración oficial con la API de Meta (WhatsApp Cloud API). BARAKAH TECH HUB S.A.S. actúa exclusivamente como Proveedor de Tecnología (TP).
            </p>

            <h3 className="text-xl font-semibold text-white mt-8 mb-4">2. Responsabilidades del Cliente y Uso de WhatsApp</h3>
            <p className="mb-4 text-slate-400">El Cliente entiende y acepta que el uso de la plataforma está estrictamente sujeto a las Políticas de Comercio y Condiciones de Servicio de WhatsApp (Meta).</p>
            <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-400 marker:text-blue-500">
              <li>El Cliente es el único responsable de la calidad, legalidad y veracidad de los mensajes enviados a través de Upway Business.</li>
              <li><strong>Prohibición de Spam:</strong> Queda estrictamente prohibido utilizar la plataforma para enviar mensajes masivos no solicitados (spam), contenido fraudulento, ilegal o que vulnere derechos de terceros.</li>
              <li><strong>Bloqueos de Línea:</strong> BARAKAH TECH HUB S.A.S. no se hace responsable por suspensiones, bloqueos o baneos de cuentas de WhatsApp aplicados por Meta debido a infracciones cometidas por el Cliente.</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-8 mb-4">3. Inteligencia Artificial y Limitación de Responsabilidad</h3>
            <p className="mb-4 text-slate-400">Upway Business utiliza modelos de Inteligencia Artificial para generar respuestas automatizadas.</p>
            <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-400 marker:text-blue-500">
              <li>El Cliente comprende que la IA puede generar respuestas imprecisas o inesperadas ("alucinaciones"). Es responsabilidad del Cliente monitorear, configurar adecuadamente y supervisar el comportamiento de sus agentes virtuales.</li>
              <li>BARAKAH TECH HUB S.A.S. no asume responsabilidad civil, comercial o penal por pérdidas, daños, reclamos o malos entendidos derivados de las respuestas emitidas por la Inteligencia Artificial a los usuarios finales del Cliente.</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-8 mb-4">4. Tratamiento de Datos Personales (Habeas Data)</h3>
            <p className="mb-4 text-slate-400">En cumplimiento de la Ley 1581 de 2012 de la República de Colombia, BARAKAH TECH HUB S.A.S. se compromete a proteger la privacidad de los datos suministrados en la plataforma.</p>
            <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-400 marker:text-blue-500">
              <li>El Cliente actúa como el Responsable del Tratamiento de los datos de sus propios usuarios finales (sus clientes de WhatsApp). Upway Business actúa únicamente como Encargado del Tratamiento, procesando la información exclusivamente para permitir el funcionamiento del servicio.</li>
              <li>BARAKAH TECH HUB S.A.S. no comercializará, venderá ni compartirá los datos de las conversaciones del Cliente con terceros, salvo requerimiento de una autoridad judicial competente.</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-8 mb-4">5. Pagos, Suscripciones y Cancelaciones</h3>
            <p className="mb-4 text-slate-400">El acceso a las funciones premium de Upway Business requiere el pago de una suscripción.</p>
            <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-400 marker:text-blue-500">
              <li>Los pagos realizados no son reembolsables, salvo en los casos expresamente estipulados por el Estatuto del Consumidor de Colombia o a discreción de la empresa por fallas críticas y prolongadas del sistema.</li>
              <li>BARAKAH TECH HUB S.A.S. se reserva el derecho de suspender temporal o definitivamente el acceso a la plataforma en caso de impago o incumplimiento de estos términos.</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-8 mb-4">6. Propiedad Intelectual</h3>
            <p className="mb-6 text-slate-400">
              Todo el código fuente, diseño, logotipos, algoritmos, metodologías y arquitectura de software de Upway Business son propiedad exclusiva de BARAKAH TECH HUB S.A.S. El Cliente obtiene una licencia de uso temporal y revocable, pero no adquiere ningún derecho de propiedad sobre la tecnología subyacente.
            </p>

            <h3 className="text-xl font-semibold text-white mt-8 mb-4">7. Jurisdicción y Ley Aplicable</h3>
            <p className="mb-10 text-slate-400">
              Estos términos se rigen por las leyes de la República de Colombia. Cualquier controversia, disputa o reclamo derivado de la interpretación o ejecución de este contrato será sometido a los jueces y tribunales competentes en el territorio colombiano.
            </p>

            <hr className="border-white/10 my-8" />

            <h3 className="text-lg font-semibold text-white mb-4">Contacto</h3>
            <p className="text-slate-400">
              Para dudas, soporte o solicitudes relacionadas con estos términos, puede contactarnos a través de:<br/>
              <strong className="text-blue-400 mt-2 block">barakahtechhub@gmail.com</strong>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}