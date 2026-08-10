import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_55%)] bg-slate-950 text-slate-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Botón de retorno */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
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
                Política de Privacidad
              </h1>
              <p className="text-sm text-slate-400">
                Upway Business (BARAKAH TECH HUB S.A.S.) — Última actualización: 10 de agosto de 2026
              </p>
            </div>
          </div>

          <hr className="border-white/10 my-8" />

          {/* Cuerpo del Contenido */}
          <div className="space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base">
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                1. Información que Recopilamos
              </h2>
              <p>
                Para poder ofrecer nuestros servicios de control empresarial y automatización de mensajería, <strong>Upway Business</strong> recopila únicamente datos de carácter estrictamente comercial y operativo, tales como:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-400">
                <li>Datos de identificación del negocio (nombre de la empresa, correo electrónico corporativo y datos públicos del perfil comercial).</li>
                <li>Identificadores de la cuenta de WhatsApp Business y tokens de acceso otorgados de forma voluntaria a través del flujo oficial de autenticación de Meta (<span className="text-slate-200">Embedded Signup</span>).</li>
                {/* 🚀 INYECCIÓN LEGAL BSUID */}
                <li><strong>Nombres de Usuario de WhatsApp y BSUIDs</strong> (Identificadores de usuario de ámbito comercial), recopilados automáticamente al interactuar con la plataforma utilizando las configuraciones de privacidad avanzadas de Meta.</li>
                <li><strong>No recopilamos ni procesamos información personal sensible</strong> (como datos financieros privados, de salud, creencias u otros catalogados como confidenciales por las normativas de protección de datos).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-cyan-400" />
                2. Uso de la Información
              </h2>
              <p>
                Los datos recopilados se utilizan exclusivamente para los siguientes fines operativos:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-400">
                <li>Configurar y conectar de forma segura tu línea de WhatsApp Business con las herramientas de automatización e inteligencia artificial de Upway.</li>
                {/* 🚀 INYECCIÓN LEGAL ENRUTAMIENTO ANÓNIMO */}
                <li>Procesar y enrutar las conversaciones utilizando identificadores BSUID, garantizando que el agente de inteligencia artificial pueda interactuar <strong>sin exponer ni requerir el número telefónico real</strong> del usuario final.</li>
                <li>Facilitar la gestión de interacciones comerciales dentro del panel de control de la plataforma (<span className="text-slate-200">Business Control</span>).</li>
                <li>Enviar notificaciones técnicas relevantes sobre el estado de tu suscripción o servicio.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">3. Integración con Meta y Terceros</h2>
              <p>
                Upway Business utiliza las APIs oficiales provistas por Meta Platforms, Inc. El proceso de vinculación de números se realiza mediante el registro integrado avalado por Meta. La información intercambiada se rige bajo los estándares de seguridad y cifrado de las plataformas oficiales de Meta. No compartimos, vendemos ni comercializamos datos con terceros ajenos a la operación del servicio.
              </p>
            </section>

            {/* 🚀 NUEVA SECCIÓN: REGLAS DE CONTACTO ÉTICO PARA BLINDARTE */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">4. Privacidad del Consumidor y Contacto Ético</h2>
              <p>
                Implementamos medidas técnicas y organizativas de la industria para salvaguardar la privacidad. <strong>Upway prohíbe estrictamente</strong> a las empresas usuarias el uso de tácticas, scripts o software de terceros para extraer (scrape) o intentar descubrir los números de teléfono ocultos detrás de un Nombre de Usuario o BSUID. La única forma válida de obtener el contacto directo de un usuario anónimo es mediante la solicitud explícita facilitada por la plataforma y aprobada por el consumidor.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">5. Derechos de los Usuarios y Control de Datos</h2>
              <p>
                En todo momento, los usuarios y administradores tienen el control absoluto de su cuenta. Puedes revocar los permisos de acceso, desconectar tu línea de WhatsApp Business o solicitar la eliminación de los datos asociados a tu registro en nuestra plataforma enviando una solicitud a través de nuestros canales de soporte oficiales.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">6. Modificaciones a esta Política</h2>
              <p>
                Nos reservamos el derecho de actualizar esta política de privacidad para reflejar mejoras tecnológicas o cambios normativos. Cualquier modificación será publicada directamente en nuestra plataforma.
              </p>
            </section>

          </div>

          {/* Pie de página informativo */}
          <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Cumple con los estándares de seguridad y BSUID de Meta
            </span>
            <span>© 2026 BARAKAH TECH HUB S.A.S. Todos los derechos reservados.</span>
          </div>

        </div>
      </div>
    </div>
  );
}