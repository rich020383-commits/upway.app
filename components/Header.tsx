"use client";

import { useState, useEffect } from "react";
import { Menu, ArrowRight } from "lucide-react";

export default function Header({ onOpenModal }: { onOpenModal: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? "bg-white/75 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* LOGO */}
        <div className="flex items-center space-x-2 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">↑</span>
          </div>
          <span className="text-slate-900 font-bold text-xl tracking-tight">
            UPWAY <span className="text-blue-600">BUSINESS</span>
          </span>
        </div>

        {/* MENÚ CENTRAL */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <a href="#servicios" className="hover:text-blue-600 transition-colors">Servicios</a>
          <a href="#soluciones" className="hover:text-blue-600 transition-colors">Soluciones</a>
          <a href="#industrias" className="hover:text-blue-600 transition-colors">Industrias</a>
          <a href="#nosotros" className="hover:text-blue-600 transition-colors">Nosotros</a>
        </nav>

        {/* BOTONES DESTACADOS (SaaS) */}
        <div className="hidden md:flex items-center space-x-6">
          <a href="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
            Iniciar sesión
          </a>
          <button 
            onClick={onOpenModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md flex items-center space-x-2 group"
          >
            <span>Agenda una demostración</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* MENÚ MÓVIL */}
        <button onClick={onOpenModal} className="md:hidden text-slate-900">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}