"use client";

import { useState, useEffect } from "react"; 
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Lightbulb, Building2, Palette, MonitorSmartphone, Video, Bot, TrendingUp, CheckCircle2 } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import Chatbot from "@/components/Chatbot"; 
import LeadModal from "@/components/LeadModal"; 

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const abrirModal = () => setIsModalOpen(true); 
    window.addEventListener('abrir-modal-lead', abrirModal);
    return () => window.removeEventListener('abrir-modal-lead', abrirModal);
  }, []);

  const { scrollY } = useScroll();
  const navBackground = useTransform(scrollY, [0, 50], ["rgba(3, 7, 18, 0)", "rgba(3, 7, 18, 0.85)"]);
  const navBackdrop = useTransform(scrollY, [0, 50], ["blur(0px)", "blur(12px)"]);
  const navBorder = useTransform(scrollY, [0, 50], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.1)"]);

  const stages = [
    { icon: Lightbulb, title: "Tengo una idea", desc: "Te ayudamos a convertir una idea en una empresa.", tags: ["Modelo de negocio", "Plan del proyecto", "Roadmap", "Validación", "Estrategia"] },
    { icon: Building2, title: "Necesito crear mi empresa", desc: "Contamos con especialistas aliados para la estructuración formal.", tags: ["Constitución", "Asesoría legal", "Contabilidad", "Tributación", "Registro de marca"] },
    { icon: Palette, title: "Quiero una marca profesional", desc: "Diseño premium para destacar en tu industria.", tags: ["Logo", "Branding", "Manual de marca", "Presentaciones", "Identidad visual"] },
    { icon: MonitorSmartphone, title: "Necesito presencia digital", desc: "Desarrollo de alto nivel técnico y visual.", tags: ["Página web", "Landing Page", "Tienda Online", "App móvil", "Software a medida"] },
    { icon: Video, title: "Upway Studio", desc: "Transformamos productos comunes en marcas visualmente espectaculares.", tags: ["Comerciales IA", "Videos publicitarios", "Fotografía de producto", "Reels / TikTok", "Meta Ads"], isPremium: true },
    { icon: Bot, title: "Quiero automatizar mi empresa", desc: "Eficiencia operativa mediante inteligencia artificial.", tags: ["Agentes IA", "Chatbots", "WhatsApp IA", "Agentes de Voz", "CRM", "Integraciones APIs"] },
    { icon: TrendingUp, title: "Quiero crecer", desc: "Estrategias de adquisición de clientes basadas en datos.", tags: ["Marketing", "Meta & Google Ads", "SEO", "Consultoría", "Escalamiento"] },
  ];

  const processSteps = ["Tienes una idea", "Planeamos", "Creamos tu empresa", "Diseñamos tu marca", "Creamos tu página", "Creamos tu aplicación", "Creamos tu publicidad", "Automatizamos", "Escalamos"];

  return (
    <main className="bg-[#FFFFFF] text-[#111827] font-sans selection:bg-blue-100 selection:text-blue-900 relative overflow-hidden">
      
      <div className="fixed inset-0 z-40 pointer-events-none">
        <ParticleBackground />
      </div>

      <motion.nav 
        style={{ backgroundColor: navBackground, backdropFilter: navBackdrop, borderColor: navBorder }}
        className="fixed top-0 w-full z-50 border-b transition-colors duration-300 px-6 py-3 flex justify-between items-center"
      >
        <div className="flex items-center gap-4">
          <Image 
            src="/upway.png" 
            alt="Logo Upway Business" 
            width={45} 
            height={45} 
            className="object-contain drop-shadow-md"
          />
          <span className="font-medium text-lg tracking-widest text-white">UPWAY BUSINESS</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a href="/dashboard/bots" className="hover:text-white transition-colors duration-200">
            Agente IA
          </a>
          <a href="/dashboard/inventario" className="hover:text-white transition-colors duration-200">
            Inventario
          </a>
        </div>

        <button 
          onClick={() => window.dispatchEvent(new Event('abrir-chat'))}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]"
        >
          Agendar llamada
        </button>
      </motion.nav>

      <section className="relative min-h-screen bg-[#030712] flex flex-col justify-center overflow-hidden">
        
        <div className="container mx-auto px-6 text-center relative z-10 pt-32 pb-20">
          <div className="max-w-5xl mx-auto">
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              
              <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-white leading-[1.15] mb-8">
                Convertimos{" "}
                <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
                  ideas en empresas
                </span>{" "}
                <br className="hidden md:block"/>
                y transformamos empresas en{" "}
                <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  líderes.
                </span>
              </h1>
              
              <p className="text-lg md:text-xl font-light text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                Potenciamos tu visión mediante infraestructura operativa automatizada e inteligencia artificial de vanguardia.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 justify-center relative z-50">
                <button 
                  onClick={() => window.dispatchEvent(new Event('abrir-chat'))}
                  className="group bg-blue-600 text-white px-8 py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all duration-300"
                >
                  Agenda una demostración
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto opacity-80">
                {[
                  { val: "24/7", label: "Disponibilidad" },
                  { val: "100%", label: "Escalabilidad" },
                  { val: "IA", label: "Nativa" },
                  { val: "∞", label: "Automatización" }
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-3xl font-medium text-white">{stat.val}</div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-2">{stat.label}</div>
                  </div>
                ))}
              </div>

            </motion.div>
          </div>
        </div>

        <div className="absolute inset-0 z-20 pointer-events-none">
           <ParticleBackground />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-white z-30 pointer-events-none"></div>
      </section>

      <section id="soluciones" className="py-32 bg-white relative z-10">
        <div className="container mx-auto px-6 relative z-50">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-center mb-20 text-[#111827]">¿En qué etapa está tu negocio?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stages.map((stage, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={i} className="p-8 rounded-3xl border border-gray-100 bg-white hover:shadow-lg transition-shadow">
                <stage.icon className="w-8 h-8 text-[#2563EB] mb-6" />
                <h3 className="text-xl font-semibold mb-3">{stage.title}</h3>
                <p className="text-[#6B7280] text-sm mb-6">{stage.desc}</p>
                <ul className="space-y-2">
                  {stage.tags.map((tag, j) => <li key={j} className="flex items-center gap-2 text-sm text-[#111827]"><CheckCircle2 className="w-4 h-4 text-[#60A5FA]" /> {tag}</li>)}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="proceso" className="py-32 bg-[#111827] text-white relative z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#2563EB] blur-[120px] rounded-full opacity-20 pointer-events-none"></div>
        <div className="container mx-auto px-6 relative z-50 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-20">Nuestro Proceso</h2>
          <div className="flex flex-wrap justify-center items-center max-w-5xl mx-auto gap-4 md:gap-8">
            {processSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-4 md:gap-8">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center group cursor-default">
                  <div className="w-4 h-4 rounded-full bg-[#3B82F6] group-hover:bg-white group-hover:shadow-[0_0_20px_rgba(96,165,250,0.8)] transition-all duration-300 mb-4 ring-4 ring-[#111827]"></div>
                  <span className="text-sm md:text-base font-medium text-gray-400 group-hover:text-white transition-colors">{step}</span>
                </motion.div>
                {i !== processSteps.length - 1 && <div className="h-[1px] w-8 md:w-16 bg-gradient-to-r from-[#3B82F6] to-transparent opacity-50 mb-8"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="min-h-[60vh] bg-[#2563EB] flex items-center justify-center relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
        <div className="container mx-auto px-6 text-center relative z-50">
          <h2 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-10 leading-[1]">
            El futuro de tu empresa <br className="hidden md:block"/> comienza hoy.
          </h2>
          <button 
            onClick={() => window.dispatchEvent(new Event('abrir-chat'))}
            className="bg-white text-[#111827] px-10 py-5 rounded-full text-lg font-bold hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-300"
          >
            Agenda una demostración
          </button>
        </div>
      </section>

      <footer className="bg-white py-12 border-t border-gray-100 relative z-10">
        <div className="container mx-auto px-6 flex flex-col items-center md:items-start md:flex-row justify-between text-sm text-[#6B7280] font-medium relative z-50">
          
          <div className="flex flex-col items-center md:items-start mb-8 md:mb-0">
            <div className="flex items-center gap-4 mb-4 text-[#111827]">
              <Image 
                src="/upway.png" 
                alt="Logo Upway Business" 
                width={45} 
                height={45} 
                className="object-contain"
              />
              <span className="font-bold text-xl tracking-tighter">UPWAY BUSINESS</span>
            </div>
            
            <p className="text-slate-500 font-light mt-1 text-center md:text-left">
              Convertimos <span className="text-blue-600 font-medium">ideas</span> en empresas y transformamos empresas en <span className="text-blue-600 font-medium">líderes</span>.
            </p>
          </div>

          <div className="flex gap-8 mt-4 md:mt-0">
            <a href="#" className="hover:text-[#111827] transition-colors">Contacto</a>
            <a href="#" className="hover:text-[#111827] transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-[#111827] transition-colors">Políticas de Privacidad</a>
          </div>
        </div>
      </footer>

      <div className="relative z-50">
        <Chatbot />
      </div>

      <div className="relative z-[60]">
        <LeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>

    </main>
  );
}