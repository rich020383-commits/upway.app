"use client";

import { ArrowRight } from "lucide-react";

export default function Contact({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <section className="py-24 bg-blue-600 relative overflow-hidden">
      {/* Círculos decorativos */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-700 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/3" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-8">
          ¿Listo para transformar tu empresa con IA?
        </h2>
        <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
          No dejes que tu competencia te gane terreno. Agenda una consultoría gratuita y diseñemos juntos el futuro de tu negocio.
        </p>
        <button 
          onClick={onOpenModal}
          className="bg-white text-blue-600 hover:bg-slate-50 font-bold px-10 py-4 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center space-x-2 mx-auto"
        >
          <span>Solicitar asesoría gratuita</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}