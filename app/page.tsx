"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Building2,
  Lightbulb,
  MonitorSmartphone,
  Palette,
  Rocket,
  Sparkles,
  Video,
  Activity,
  Cpu
} from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import Chatbot from "@/components/Chatbot";
import LeadModal from "@/components/LeadModal";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
        <ParticleBackground />
      </div>

      {/* NAVEGACIÓN (Adaptada a tonos oscuros y cyan) */}
      <nav className="fixed w-full top-0 z-50 border-b border-white/5 bg-[#03050a]/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between px-6 py-4 lg:px-8">
          <a href="#top" className="flex items-center gap-3">
            <Image src="/upway.png" alt="Logo Upway" width={42} height={42} className="rounded-full object-contain" />
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/90">Upway</span>
          </a>

          <div className="hidden items-center gap-8 text-sm text-white/50 md:flex font-medium tracking-wide">
            <a href="#servicios" className="transition hover:text-cyan-400">Servicios</a>
            <a href="#proceso" className="transition hover:text-cyan-400">Proceso</a>
            <a href="#contacto" className="transition hover:text-cyan-400">Contacto</a>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <a href="/login" className="text-sm font-semibold text-white/60 transition hover:text-white">
              Iniciar sesión
            </a>
            <a href="/dashboard" className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              Panel IA
            </a>
          </div>
        </div>
      </nav>

      {/* ========================================== */}
      {/* SECCIÓN PRINCIPAL: EL DOMINIO DE SOPHIE */}
      {/* ========================================== */}
      <section id="top" className="relative min-h-screen pt-24 pb-12 flex items-center overflow-hidden">
        
        {/* Luces volumétricas Cyberpunk */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-blue-700/20 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[70%] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="relative mx-auto flex w-full max-w-[90rem] flex-col px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 h-full gap-12">
          
          {/* MITAD IZQUIERDA (40%): Textos e Interfaz */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="lg:w-[45%] z-10 pt-10 lg:pt-0">
            
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-mono text-cyan-300 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              SOPHIE_OS V2.0 ACTIVA
            </div>

            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-[5rem]">
              La inteligencia <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">detrás de tu éxito.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400 font-light">
              Despierta el potencial de tu negocio. Automatiza tus ventas y operaciones con agentes de inteligencia artificial que piensan, responden y escalan con la identidad de tu marca.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => window.dispatchEvent(new Event("abrir-chat"))}
                className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-cyan-500 px-8 py-4 text-sm font-bold text-slate-950 transition-all hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
              >
                <Cpu className="h-4 w-4" />
                Desplegar mi bot
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* Métricas de Diagnóstico (Estilo HUD) */}
            <div className="mt-16 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 max-w-md">
              <div>
                <p className="text-xs font-mono text-cyan-500/70 mb-1">LATENCIA_API</p>
                <p className="text-2xl font-light tracking-wide text-white flex items-center gap-2">
                  0.8s <Activity className="h-4 w-4 text-cyan-400" />
                </p>
              </div>
              <div>
                <p className="text-xs font-mono text-cyan-500/70 mb-1">UPTIME_RED</p>
                <p className="text-2xl font-light tracking-wide text-white">99.9%</p>
              </div>
            </div>
          </motion.div>

          {/* MITAD DERECHA (60%): El Video Monumental de Sophie */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 1, delay: 0.3 }}
            className="lg:w-[55%] relative h-[60vh] lg:h-[85vh] w-full"
          >
            {/* Contenedor del video con diseño de cápsula cibernética */}
            <div className="absolute inset-0 rounded-[2.5rem] border border-cyan-500/20 bg-slate-900/40 p-2 backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.1)]">
              <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-black">
                
                {/* Sombra interna para dar profundidad */}
                <div className="absolute inset-0 z-10 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none"></div>

                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="absolute inset-0 h-full w-full object-cover opacity-90 scale-105"
                >
                  <source src="/sophie-animada.mp4" type="video/mp4" />
                </video>
                
                {/* HUD Overlay Flotante */}
                <div className="absolute top-8 right-8 z-20 flex flex-col gap-2">
                  <div className="flex items-center gap-2 bg-black/50 backdrop-blur px-3 py-1.5 rounded-md border border-cyan-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span className="text-[10px] font-mono text-cyan-300">BIOMETRIC_SYNC</span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/50 backdrop-blur px-3 py-1.5 rounded-md border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span className="text-[10px] font-mono text-white/70">NLP_ENGINE: READY</span>
                  </div>
                </div>

                <div className="absolute bottom-8 left-8 z-20 max-w-[200px]">
                   <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 w-[85%] animate-pulse"></div>
                   </div>
                   <p className="text-[10px] font-mono text-cyan-400 mt-2">PROCESSING_NEURAL_PATHWAYS...</p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ========================================== */}
      {/* SECCIONES SECUNDARIAS (Regresando a tu diseño original elegante) */}
      {/* ========================================== */}

      <section id="servicios" className="relative border-t border-white/5 bg-[#050816]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">Servicios</p>
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
                  className="rounded-3xl border border-white/5 bg-white/5 p-6 transition hover:border-cyan-500/30"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{stage.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">{stage.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {stage.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/5 bg-black/30 px-3 py-1 text-xs text-white/50">
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
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">Proceso</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Un camino claro para pasar de la idea a la ejecución.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-3xl border border-white/5 bg-white/5 p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Bot className="h-16 w-16" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-semibold text-cyan-400">
                  {index + 1}
                </div>
                <p className="mt-4 text-lg font-semibold text-white">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" className="relative border-t border-white/5 bg-[#050816]">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-24 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">Contacto</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Tu próximo movimiento puede ser el más importante para tu negocio.
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/50">
              Si quieres una propuesta más concreta, agendamos una llamada y diseñamos juntas el siguiente paso.
            </p>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/5 p-8 backdrop-blur shadow-2xl">
            <div className="flex items-center gap-3 text-white">
              <Rocket className="h-5 w-5 text-cyan-400" />
              <p className="text-sm font-semibold uppercase tracking-[0.24em]">Listo para empezar</p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new Event("abrir-chat"))}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
            >
              Agendar una llamada
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-[#03050a] py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 text-sm text-white/40 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/upway.png" alt="Logo Upway" width={36} height={36} className="rounded-full object-contain grayscale opacity-70" />
            <span className="font-semibold uppercase tracking-[0.24em] text-white/60">Upway Business</span>
          </div>
          <p>© 2026 Upway Business. Todos los derechos reservados.</p>
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