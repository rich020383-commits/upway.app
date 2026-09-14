"use client";

import { useState, useEffect } from "react";
import { Menu, ArrowRight } from "lucide-react";
import Image from "next/image";

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
        <div className="flex items-center cursor-pointer">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1b3a5f] shadow-lg overflow-hidden">
            <Image src="/upway.png" alt="Upway Business" width={90} height={24} className="h-6 w-auto object-contain" priority />
          </div>
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
            className="bg-gradient-to-r from-[#1b5ed6] to-[#0d47a1] hover:from-[#1548a8] hover:to-[#0a3d8f] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center space-x-2 group"
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