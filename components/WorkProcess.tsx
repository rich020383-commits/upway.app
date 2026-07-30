"use client";

import { motion } from "framer-motion";
import { Search, PenTool, Code2, Rocket, GraduationCap, Headset } from "lucide-react";

export default function WorkProcess() {
  const steps = [
    { icon: <Search />, title: "1. Diagnóstico", desc: "Analizamos tus procesos actuales y detectamos dónde la IA generará el mayor ROI." },
    { icon: <PenTool />, title: "2. Diseño", desc: "Arquitectura de la solución a la medida de tus objetivos corporativos." },
    { icon: <Code2 />, title: "3. Desarrollo", desc: "Construcción de agentes y automatizaciones robustas, seguras y escalables." },
    { icon: <Rocket />, title: "4. Implementación", desc: "Despliegue controlado con pruebas reales en tu entorno de trabajo." },
    { icon: <GraduationCap />, title: "5. Capacitación", desc: "Entrenamos a tu equipo para gestionar y aprovechar las nuevas herramientas." },
    { icon: <Headset />, title: "6. Acompañamiento", desc: "Soporte continuo y optimización constante para seguir creciendo." },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-4">
            Metodología Upward
          </h2>
          <p className="text-4xl font-bold text-slate-900 tracking-tight">
            Un proceso probado para <span className="text-gradient">resultados garantizados</span>.
          </p>
        </div>

        <div className="space-y-0">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-8 relative pb-12 last:pb-0"
            >
              {/* Línea conectora */}
              {index !== steps.length - 1 && (
                <div className="absolute left-[27px] top-12 bottom-0 w-[2px] bg-slate-100" />
              )}
              
              {/* Icono */}
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 z-10 shadow-lg">
                {step.icon}
              </div>

              {/* Texto */}
              <div className="pt-2">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}