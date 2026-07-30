"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Hotel, Utensils, Home, Stethoscope, Scale, Store, ArrowRight } from "lucide-react";

export default function Industries() {
  const [activeTab, setActiveTab] = useState(0);

  const industries = [
    {
      id: "inmobiliarias",
      name: "Inmobiliarias",
      icon: <Home className="w-5 h-5" />,
      title: "Precalificación y agendamiento en piloto automático.",
      description: "Tus agentes pierden horas respondiendo '¿Sigue disponible?'. Implementamos un sistema que perfila al cliente, muestra opciones según su presupuesto y agenda la visita directamente en el calendario de tu equipo.",
      metric: "+40%",
      metricLabel: "Aumento en visitas efectivas"
    },
    {
      id: "clinicas",
      name: "Clínicas y Salud",
      icon: <Stethoscope className="w-5 h-5" />,
      title: "Cero llamadas perdidas, agenda siempre llena.",
      description: "Automatiza la asignación de citas médicas, confirmaciones por WhatsApp y recordatorios. El paciente agenda a las 3:00 AM sin necesidad de una recepcionista y con cero errores humanos.",
      metric: "-80%",
      metricLabel: "Reducción de ausentismo"
    },
    {
      id: "constructoras",
      name: "Constructoras",
      icon: <Building2 className="w-5 h-5" />,
      title: "Respuestas inmediatas a inversionistas.",
      description: "Un cliente interesado en un proyecto sobre planos quiere respuestas ya. Automatizamos el envío de brochures, cotizaciones iniciales y canalizamos a los leads calificados directo al equipo comercial.",
      metric: "24/7",
      metricLabel: "Atención de leads de alto valor"
    },
    {
      id: "hoteles",
      name: "Hoteles",
      icon: <Hotel className="w-5 h-5" />,
      title: "Reservas directas sin comisiones de terceros.",
      description: "Tu asistente virtual atiende dudas sobre instalaciones, disponibilidad y procesa la reserva de la habitación directamente desde tu web o WhatsApp, aumentando tu margen de ganancia.",
      metric: "+35%",
      metricLabel: "Conversión de reserva directa"
    },
    {
      id: "abogados",
      name: "Firmas Legales",
      icon: <Scale className="w-5 h-5" />,
      title: "Filtro inteligente de consultas.",
      description: "Separa los casos rentables de las dudas gratuitas. El sistema atiende la primera línea, recopila la documentación básica del caso y agenda la asesoría de pago de forma automática.",
      metric: "100%",
      metricLabel: "Filtro de casos viables"
    },
    {
      id: "comercio",
      name: "Retail y Comercio",
      icon: <Store className="w-5 h-5" />,
      title: "Atención al cliente que escala con tus ventas.",
      description: "Resuelve el 90% de las preguntas frecuentes (estado de envíos, tallas, devoluciones) al instante, liberando a tu equipo para que se enfoque en estrategias de crecimiento.",
      metric: "90%",
      metricLabel: "Resolución automática de PQRs"
    }
  ];

  return (
    <section id="industrias" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Cabecera de la sección */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Especialización por Sector
          </h2>
          <p className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
            No vendemos código. <br className="hidden md:block"/>
            <span className="text-gradient">Vendemos resultados.</span>
          </p>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            Entendemos que cada industria tiene cuellos de botella únicos. Descubre cómo transformamos la operación de tu sector específico.
          </p>
        </div>

        {/* Contenedor Interactivo */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          
          {/* Menú Lateral (Pestañas) */}
          <div className="w-full lg:w-1/3 flex flex-col space-y-2">
            {industries.map((industry, index) => (
              <button
                key={industry.id}
                onClick={() => setActiveTab(index)}
                className={`flex items-center space-x-4 w-full text-left px-6 py-4 rounded-2xl transition-all duration-300 ${
                  activeTab === index 
                    ? "bg-white shadow-premium border border-slate-100 text-blue-600" 
                    : "hover:bg-slate-200/50 text-slate-600 hover:text-slate-900 transparent"
                }`}
              >
                <div className={`${activeTab === index ? "text-blue-600" : "text-slate-400"}`}>
                  {industry.icon}
                </div>
                <span className="font-semibold text-base">{industry.name}</span>
              </button>
            ))}
          </div>

          {/* Contenido Dinámico (Derecha) */}
          <div className="w-full lg:w-2/3 relative min-h-[350px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-premium absolute inset-0 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full">
                    <span className="text-blue-600 font-semibold text-sm tracking-wide">
                      {industries[activeTab].name}
                    </span>
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                    {industries[activeTab].title}
                  </h3>
                  
                  <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
                    {industries[activeTab].description}
                  </p>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <p className="text-4xl font-bold text-blue-600 tracking-tighter">
                      {industries[activeTab].metric}
                    </p>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      {industries[activeTab].metricLabel}
                    </p>
                  </div>
                  
                  <button className="text-slate-900 hover:text-blue-600 font-semibold flex items-center space-x-2 group transition-colors">
                    <span>Ver caso de éxito</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
        </div>
      </div>
    </section>
  );
}