"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Lightbulb,
  MonitorSmartphone,
  Palette,
  Rocket,
  Sparkles,
  TrendingUp,
  Video,
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

  const pillars = [
    {
      title: "Diseño de alto impacto",
      text: "Creamos experiencias visuales premium que hacen que cada marca se vea distinta.",
    },
    {
      title: "Automatización real",
      text: "Conectamos procesos, herramientas y agentes para que tu negocio se mueva solo.",
    },
    {
      title: "Estrategia de crecimiento",
      text: "Ponemos marketing, ventas y tecnología en una sola dirección para escalar.",
    },
  ];

  const steps = ["Tienes una idea", "La traducimos en estrategia", "Creamos tu experiencia", "Automatizamos y escalamos"];

  return (
    <main className="min-h-screen bg-[#050816] text-white selection:bg-violet-500/30 selection:text-white">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ParticleBackground />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <a href="#top" className="flex items-center gap-3">
            <Image src="/upway.png" alt="Logo Upway" width={42} height={42} className="rounded-full object-contain" />
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/90">Upway Business</span>
          </a>

          <div className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a href="#servicios" className="transition hover:text-white">Servicios</a>
            <a href="#proceso" className="transition hover:text-white">Proceso</a>
            <a href="#contacto" className="transition hover:text-white">Contacto</a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href="/login"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Iniciar sesión
            </a>
            <a
              href="/dashboard"
              className="rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/20"
            >
              Panel
            </a>
            <button
              onClick={() => window.dispatchEvent(new Event("abrir-chat"))}
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Hablar con un experto
            </button>
          </div>
        </div>
      </nav>

      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.28),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(255,255,255,0.08),_transparent_45%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col px-6 py-24 lg:px-8 lg:py-32">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-200">
              <Sparkles className="h-4 w-4" />
              Diseño, estrategia, automatización y crecimiento
            </div>

            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-7xl">
              Tu empresa, con la escala y la presencia de una marca premium.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70 sm:text-xl">
              Creamos experiencias digitales, productos inteligentes y procesos automatizados para negocios que quieren crecer sin perder identidad.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => window.dispatchEvent(new Event("abrir-chat"))}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
              >
                Agendar una demo
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#servicios"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explorar servicios
              </a>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                { value: "24/7", label: "automatización" },
                { value: "100%", label: "escalabilidad" },
                { value: "IA", label: "nativa" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-sm text-white/60">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="servicios" className="relative border-t border-white/10 bg-[#060913]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-300">Servicios</p>
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
                  className="rounded-3xl border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{stage.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/70">{stage.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {stage.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
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

      <section id="proceso" className="relative border-t border-white/10 bg-[#050816]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-300">Proceso</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Un camino claro para pasar de la idea a la ejecución.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-200">
                  {index + 1}
                </div>
                <p className="mt-4 text-lg font-semibold text-white">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" className="relative border-t border-white/10 bg-[#060913]">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-24 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-300">Contacto</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Tu próximo movimiento puede ser el más importante para tu negocio.
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Si quieres una propuesta más concreta, agendamos una llamada y diseñamos juntas el siguiente paso.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex items-center gap-3 text-white">
              <Rocket className="h-5 w-5 text-violet-300" />
              <p className="text-sm font-semibold uppercase tracking-[0.24em]">Listo para empezar</p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new Event("abrir-chat"))}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
            >
              Agendar una llamada
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#050816] py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 text-sm text-white/60 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/upway.png" alt="Logo Upway" width={36} height={36} className="rounded-full object-contain" />
            <span className="font-semibold uppercase tracking-[0.24em] text-white/80">Upway Business</span>
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