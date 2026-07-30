"use client";

import { motion, Variants } from "framer-motion";
import { Bot, Cpu, Zap, BarChart3, Users, ShieldCheck } from "lucide-react";

export default function Services() {
  const services = [
    {
      icon: <Bot className="w-6 h-6 text-blue-600" />,
      title: "Agentes de IA Personalizados",
      description: "Chatbots y asistentes inteligentes entrenados con la información exclusiva de tu empresa para atender clientes 24/7 y cerrar ventas en automático.",
    },
    {
      icon: <Cpu className="w-6 h-6 text-blue-600" />,
      title: "Automatización de Procesos (RPA)",
      description: "Conectamos tus herramientas (CRM, WhatsApp, ERP) para eliminar tareas repetitivas. Ahorra cientos de horas hombre y reduce errores al 0%.",
    },
    {
      icon: <Zap className="w-6 h-6 text-blue-600" />,
      title: "Optimización con Modelos LLM",
      description: "Integramos el poder de GPT-4o o Gemini en tus flujos de trabajo internos para redactar informes, analizar contratos y tomar decisiones estratégicas.",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
      title: "IA para Ventas y Marketing",
      description: "Sistemas inteligentes de prospección automatizada que califican leads en tiempo real y agendan reuniones con clientes de alto valor sin que muevas un dedo.",
    },
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      title: "Consultoría Estratégica",
      description: "Analizamos tu modelo de negocio actual y diseñamos una hoja de ruta tecnológica para implementar Inteligencia Artificial donde genere más rentabilidad.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
      title: "Integración Segura y Escalable",
      description: "Garantizamos que toda la infraestructura de IA cumpla con los más altos estándares de privacidad de datos y se adapte al crecimiento de tu empresa.",
    },
  ];

  // ¡Aquí está la magia! Le decimos a TypeScript que esto es tipo "Variants"
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
  };

  return (
    <section id="servicios" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* CABECERA DE LA SECCIÓN */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Nuestras Soluciones
          </h2>
          <p className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
            Tecnología diseñada para <span className="text-gradient">multiplicar</span> tu productividad.
          </p>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            No vendemos código abstracto. Entregamos sistemas inteligentes que impactan directamente el crecimiento y la eficiencia de tu compañía.
          </p>
        </div>

        {/* GRID DE TARJETAS */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-slate-50/50 hover:bg-white p-8 rounded-2xl border border-slate-200/60 shadow-premium hover:shadow-premium-hover transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center shadow-sm mb-6 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors duration-300">
                {service.icon}
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight group-hover:text-blue-600 transition-colors">
                {service.title}
              </h3>
              
              <p className="text-slate-600 text-sm md:text-base font-normal leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}