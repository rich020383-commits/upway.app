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
  Video,
  Cpu,
  Terminal
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
      
      {/* Fondo de Partículas global para las secciones de abajo */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ParticleBackground />
      </div>

      {/* ========================================== */}
      {/* NAVEGACIÓN (Flotante e invisible al tope) */}
      {/* ========================================== */}
      <nav className="fixed w-full top-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl transition-all duration-300">
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
            <a href="/dashboard" className="rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-5 py-2 text-sm font-mono text-cyan-200 transition hover:bg-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-md">
              PANEL_IA →
            </a>
          </div>
        </div>
      </nav>

      {/* ========================================== */}
      {/* HERO SECTION: VIDEO DE SOPHIE FULL SCREEN  */}
      {/* ========================================== */}
      <section id="top" className="relative h-screen w-full flex items-end justify-end overflow-hidden pb-12 lg:pb-20 pt-32">
        
        {/* 1. El Video Gigante */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 z-0 h-full w-full object-cover scale-[1.02]"
        >
          <source src="/sophie-animada.mp4" type="video/mp4" />
        </video>

        {/* 2. Filtros Gradientes para fundir el video con la web */}
        <div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,rgba(3,5,10,0.6)_0%,transparent_40%,transparent_60%,rgba(3,5,10,0.4)_100%)] pointer-events-none" />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#03050a] via-[#03050a]/40 to-transparent pointer-events-none" />

        {/* 3. Panel de Textos Corporativos (Ubicado Abajo a la Derecha) */}
        <div className="relative z-20 mx-auto w-full max-w-[95rem] px-6 lg:px-12 flex justify-end">
          
          <motion.div 
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }} 
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} 
            transition={{ duration: 1, delay: 0.5 }}
            className="w-full max-w-xl rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-mono text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              SISTEMA OPERATIVO ACTIVO
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Inteligencia artificial que mueve <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">tu negocio.</span>
            </h1>

            <p className="mt-5 text-base leading-relaxed text-slate-300 font-light">
              Despliega agentes virtuales que no solo responden, sino que dominan tus procesos corporativos, ventas y operaciones con la identidad de tu marca.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => window.dispatchEvent(new Event("abrir-chat"))}
                className="group relative flex items-center justify-center gap-3 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition-all hover:bg-cyan-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
              >
                <Cpu className="h-4 w-4" />
                Desplegar mi IA
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href="#servicios"
                className="flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 backdrop-blur-md"
              >
                Conocer más
              </a>
            </div>
          </motion.div>
          
        </div>
      </section>

      {/* ========================================== */}
      {/* SECCIONES SECUNDARIAS (El diseño oscuro encaja perfecto al hacer scroll) */}
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
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition hover:border-cyan-500/30 hover:bg-cyan-950/20"
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