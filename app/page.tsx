"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Building2,
  Lightbulb,
  MonitorSmartphone,
  Palette,
  Rocket,
  Video,
  Cpu,
  Terminal,
  X,
  Menu
} from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import Chatbot from "@/components/Chatbot";
import LeadModal from "@/components/LeadModal";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHudOpen, setIsHudOpen] = useState(false); // <--- Controla el menú desplegable derecho

  useEffect(() => {
    const abrirModal = () => setIsModalOpen(true);
    window.addEventListener("abrir-modal-lead", abrirModal);
    return () => window.removeEventListener("abrir-modal-lead", abrirModal);
  }, []);

  const stages = [
    {
      icon: Lightbulb,
      title: "Tengo una idea",
      description: "Convertimos una intuición en una propuesta clara, valida y accionable.",
      tags: ["Validación", "Roadmap", "Estrategia", "Modelo de negocio"],
    },
    {
      icon: Building2,
      title: "Quiero crear mi empresa",
      description: "Acompañamos la estructuración legal, comercial y operativa desde cero.",
      tags: ["Constitución", "Operación", "Contabilidad", "Registro"],
    },
    {
      icon: Palette,
      title: "Necesito una marca premium",
      description: "Diseñamos identidad visual con presencia, elegancia y alto impacto.",
      tags: ["Branding", "Logo", "Manual", "Presentaciones"],
    },
    {
      icon: MonitorSmartphone,
      title: "Quiero una presencia digital sólida",
      description: "Construimos productos digitales que venden, convencen y escalan.",
      tags: ["Landing Page", "Web", "App", "Software a medida"],
    },
    {
      icon: Video,
      title: "Upway Studio",
      description: "Transformamos productos y mensajes en experiencias visuales memorables.",
      tags: ["Videos IA", "Reels", "Ads", "Fotografía"],
    },
    {
      icon: Bot,
      title: "Quiero automatizar mi empresa",
      description: "Integramos IA y flujos para reducir tiempos operativos y mejorar la experiencia.",
      tags: ["Chatbot", "WhatsApp IA", "CRM", "Integraciones"],
    },
  ];

  const steps = ["Tienes una idea", "La traducimos en estrategia", "Creamos tu experiencia", "Automatizamos y escalamos"];

  return (
    <main className="min-h-screen bg-[#03050a] text-white selection:bg-cyan-500/30 selection:text-white">
      
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ParticleBackground />
      </div>

      {/* ========================================== */}
      {/* NAVEGACIÓN SUPERIOR */}
      {/* ========================================== */}
      <nav className="fixed w-full top-0 z-40 border-b border-white/5 bg-black/10 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex max-w-[95rem] items-center justify-between px-6 py-4 lg:px-12">
          <a href="#top" className="flex items-center gap-3">
            <Image src="/upway.png" alt="Logo Upway" width={40} height={40} className="rounded-full object-contain" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-white/90">Upway_OS</span>
          </a>

          <div className="hidden items-center gap-8 text-sm text-white/60 md:flex font-mono tracking-wider">
            <a href="#servicios" className="transition hover:text-cyan-400">/servicios</a>
            <a href="#proceso" className="transition hover:text-cyan-400">/proceso</a>
            <a href="#contacto" className="transition hover:text-cyan-400">/contacto</a>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <a href="/login" className="text-sm font-mono text-white/70 transition hover:text-white">
              [login]
            </a>
            <a href="/dashboard" className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm font-mono text-cyan-300 transition hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-md">
              PANEL_IA →
            </a>
          </div>
        </div>
      </nav>

      {/* ========================================== */}
      {/* HERO SECTION: VIDEO LIMPIO Y MENÚ LATERAL  */}
      {/* ========================================== */}
      <section id="top" className="relative h-screen w-full overflow-hidden">
        
        {/* EL VIDEO (Sin nada que lo tape por defecto) */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 z-0 h-full w-full object-cover scale-[1.02]"
        >
          <source src="/sophie-animada.mp4" type="video/mp4" />
        </video>

        {/* Viñeta sutil de sombras en los bordes */}
        <div className="absolute inset-0 z-10 shadow-[inset_0_0_150px_rgba(3,5,10,0.8)] pointer-events-none" />
        
        {/* ========================================== */}
        {/* BOTÓN FLOTANTE: "INICIAR SISTEMA" */}
        {/* ========================================== */}
        <div className="absolute right-6 top-1/2 z-20 -translate-y-1/2">
          <button
            onClick={() => setIsHudOpen(true)}
            className={`group flex flex-col items-center gap-3 rounded-full border border-cyan-500/40 bg-black/40 p-4 backdrop-blur-md transition-all hover:bg-cyan-900/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] ${isHudOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <Menu className="h-6 w-6 text-cyan-400" />
            <span className="writing-vertical text-[10px] font-mono tracking-[0.3em] text-cyan-300" style={{ writingMode: 'vertical-rl' }}>
              INICIAR_SISTEMA
            </span>
          </button>
        </div>

        {/* DATOS DE SISTEMA (Abajo a la izquierda, para equilibrar) */}
        <div className="absolute bottom-8 left-8 z-20 hidden md:block">
          <div className="flex flex-col gap-1.5 border-l-2 border-cyan-500/50 pl-3">
             <p className="text-[10px] font-mono text-cyan-400 tracking-widest">ESTADO: ONLINE</p>
             <p className="text-[10px] font-mono text-white/50 tracking-widest">MODELO: SOPHIE_V2</p>
          </div>
        </div>

        {/* ========================================== */}
        {/* EL PANEL DESPLEGABLE (HUD) DESDE LA DERECHA */}
        {/* ========================================== */}
        <AnimatePresence>
          {isHudOpen && (
            <>
              {/* Overlay oscuro para darle foco al panel */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsHudOpen(false)}
                className="absolute inset-0 z-30 bg-black/20 backdrop-blur-[2px]"
              />

              {/* El Panel de Cristal */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 z-40 w-full max-w-md border-l border-cyan-500/30 bg-[#03050a]/80 p-8 pt-32 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col justify-center"
              >
                {/* Botón Cerrar */}
                <button
                  onClick={() => setIsHudOpen(false)}
                  className="absolute top-24 right-8 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Contenido del Panel */}
                <div className="mb-4 inline-flex items-center gap-2 border-r-2 border-cyan-500 pr-3 text-[10px] font-mono text-cyan-400 tracking-widest w-fit">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  SISTEMA OPERATIVO ACTIVO
                </div>

                <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                  Inteligencia artificial que mueve <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-cyan-400 to-blue-400">tu negocio.</span>
                </h1>

                <p className="mt-6 text-sm leading-relaxed text-slate-300 font-light">
                  Despliega agentes virtuales que no solo responden, sino que dominan tus procesos corporativos, ventas y operaciones con la identidad de tu marca.
                </p>

                <div className="mt-10 flex flex-col gap-4">
                  <button
                    onClick={() => {
                      setIsHudOpen(false);
                      window.dispatchEvent(new Event("abrir-chat"));
                    }}
                    className="group relative flex w-full items-center justify-center gap-3 border border-cyan-500/50 bg-cyan-500/20 px-6 py-4 text-sm font-mono tracking-widest text-cyan-300 transition-all hover:bg-cyan-500 hover:text-slate-950 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]"
                  >
                    <Cpu className="h-4 w-4" />
                    DESPLEGAR AGENTE
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  <a
                    href="#servicios"
                    onClick={() => setIsHudOpen(false)}
                    className="flex w-full items-center justify-center rounded-none border border-white/10 bg-white/5 px-6 py-4 text-sm font-mono tracking-widest text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    EXPLORAR MÓDULOS
                  </a>
                </div>

                <div className="mt-auto border-t border-white/10 pt-6">
                  <p className="text-[10px] font-mono text-white/40 tracking-widest">UPWAY BUSINESS // COLOMBIA HQ</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </section>

      {/* ========================================== */}
      {/* SECCIONES SECUNDARIAS (Se mantienen iguales) */}
      {/* ========================================== */}
      <section id="servicios" className="relative bg-[#03050a]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">/01_servicios</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Soluciones pensadas para empresas que quieren avanzar con identidad.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <motion.div
                  key={stage.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition hover:border-cyan-500/30 hover:bg-cyan-950/10"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{stage.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">{stage.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {stage.tags.map((tag) => (
                      <span key={tag} className="rounded-md border border-white/5 bg-black/30 px-2.5 py-1 text-[11px] font-mono text-white/50">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="proceso" className="relative border-t border-white/5 bg-[#03050a]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">/02_proceso</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Un camino claro para pasar de la idea a la ejecución.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 relative overflow-hidden group">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-sm font-mono text-cyan-400">
                  0{index + 1}
                </div>
                <p className="mt-4 text-lg font-semibold text-white">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" className="relative border-t border-white/5 bg-[#03050a]">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-24 lg:flex-row lg:items-end lg:justify-between lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">/03_contacto</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Tu próximo movimiento puede ser el más importante para tu negocio.
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/50">
              Si quieres una propuesta más concreta, agendamos una llamada y diseñamos juntos el siguiente paso.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur shadow-2xl">
            <div className="flex items-center gap-3 text-white">
              <Terminal className="h-5 w-5 text-cyan-400" />
              <p className="text-xs font-mono uppercase tracking-[0.2em]">INICIAR_PROTOCOLO</p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new Event("abrir-chat"))}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Agendar una llamada
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-[#010204] py-8">
        <div className="mx-auto flex max-w-[95rem] flex-col gap-4 px-6 text-xs font-mono text-white/40 md:flex-row md:items-center md:justify-between lg:px-12">
          <div className="flex items-center gap-3">
            <Image src="/upway.png" alt="Logo Upway" width={32} height={32} className="rounded-full object-contain grayscale opacity-70" />
            <span className="uppercase tracking-[0.2em] text-white/60">Upway Business Corporation</span>
          </div>
          <p>© 2026 Upway Business. All rights reserved.</p>
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