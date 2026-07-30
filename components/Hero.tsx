"use client";

import ParticleBackground from "@/components/ParticleBackground";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-hidden">
      
      {/* 🚀 EL TEXTO Y LOS BOTONES (Capa inferior z-10) */}
      <section className="relative z-10 flex-1 flex items-center justify-center text-center px-4 mt-20">
        <div className="max-w-5xl mx-auto">
          
          <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-[#111827] leading-[1.15] mb-8">
            Creamos, impulsamos y <br className="hidden md:block"/>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#60A5FA]">
              transformamos empresas
            </span> <br className="hidden md:block"/>
            mediante inteligencia artificial.
          </h1>
          
          <p className="text-lg md:text-xl font-light text-[#6B7280] mb-12 max-w-2xl mx-auto leading-relaxed">
            Te acompañamos desde la concepción de una idea hasta la consolidación de una infraestructura operativa completamente automatizada.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center relative z-50">
            {/* Botón principal orientado a SaaS */}
            <a 
              href="/registro"
              className="group bg-[#2563EB] text-white px-8 py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-[#3B82F6] hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300"
            >
              Crea tu empleado digital
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>

            {/* Botón secundario */}
            <button 
              onClick={() => window.dispatchEvent(new Event('abrir-chat'))}
              className="px-8 py-4 rounded-full font-medium text-[#111827] bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-300"
            >
              Hablar con ventas
            </button>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto opacity-80">
            {[
              { val: "24/7", label: "Disponibilidad" },
              { val: "100%", label: "Escalabilidad" },
              { val: "IA", label: "Nativa" },
              { val: "∞", label: "Automatización" }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-medium text-[#111827]">{stat.val}</div>
                <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mt-2">{stat.label}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 🌌 LAS PARTÍCULAS POR ENCIMA */}
      <div className="absolute inset-0 z-40 pointer-events-none">
        <ParticleBackground />
      </div>

    </main>
  );
}