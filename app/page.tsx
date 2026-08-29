"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Cpu,
  Menu,
  X,
  ShieldCheck,
  CheckCircle,
  Info,
  Sparkles
} from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import LeadModal from "@/components/LeadModal";
import { useLanguage } from "@/context/LanguageContext";
import BotonIdioma from "@/components/BotonIdioma";

// ==========================================
// ICONO META OFICIAL
// ==========================================
const MetaIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 512 512" fill="currentColor">
    <path d="M435.5 174.1c-22-19.1-51.2-26.6-79.8-26.6-43.1 0-81.8 19.3-100.8 52.6-18.7-33-57-52.6-100-52.6-28.7 0-58 7.5-80 26.6-47.5 41.3-43.8 116.5 13.4 153.3 27.6 17.8 61.1 23 93.3 23 48.7 0 88.5-22.3 107.5-43 2.1-2.2 4.2-4.7 6.1-7.2 4.9 8.2 10.9 16 18.2 23 20.2 19.2 48.2 27.2 76.5 27.2 32.2 0 65.7-5.2 93.3-23 57.2-36.8 60.9-112 13.4-153.3zm-308.2 129c-27.1 0-52-8.5-68.5-19.1-33.1-21.3-33-64.4 2-94.8 13.9-12.1 33.7-16.7 54-16.7 32 0 62.5 15.6 77.4 42.4-11.4 14-23.7 30.1-35.8 44.9-10.4-8.8-19.3-13.9-29.2-13.9-15.6 0-25 11.2-25 24 0 13.3 11 25.1 27.1 25.1 11.7 0 23.3-5.2 36-13.9-10.3 13.2-21.3 26.6-32.3 39.3-13.6-11.1-28.8-17.3-45.9-17.3z"/>
  </svg>
);

// ==========================================
// TIPOS Y DATOS DE LOS PLANES (Añadido el Plan Starter)
// ==========================================
type ContractOption = 1 | 2 | 3;
type PlanId = "starter" | "emprendedor" | "negocio" | "voz" | "pro";

interface Plan {
  id: PlanId;
  emoji: string;
  name: string;
  capacityLabel: string;
  capacityDesc: string;
  price: number;
  priceUsd: number;
  implFull: number;
  implFullUsd: number;
  implDiscount: number;
  implDiscountUsd: number;
  cuota: number;
  cuotaUsd: number;
  first4: number;
  first4Usd: number;
  popular?: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    emoji: "🌱",
    name: "Starter",
    capacityLabel: "Prueba la magia (Fricción Cero)",
    capacityDesc: "Ideal para validar la IA en tu embudo de ventas.",
    price: 99900,
    priceUsd: 49,
    implFull: 199900,
    implFullUsd: 99,
    implDiscount: 99900,
    implDiscountUsd: 49,
    cuota: 24975,
    cuotaUsd: 12,
    first4: 99900,
    first4Usd: 49,
  },
  {
    id: "emprendedor",
    emoji: "🏪",
    name: "PYME",
    capacityLabel: "Tu vendedor digital de WhatsApp",
    capacityDesc: "Automatización inteligente para tiendas y negocios.",
    price: 249900,
    priceUsd: 149,
    implFull: 499900,
    implFullUsd: 299,
    implDiscount: 249900,
    implDiscountUsd: 149,
    cuota: 62475,
    cuotaUsd: 37,
    first4: 249900,
    first4Usd: 149,
  },
  {
    id: "voz",
    emoji: "🎧",
    name: "Ejecutivo de Voz",
    capacityLabel: "El Poder de la Voz IA (Vapi)",
    capacityDesc: "Llamadas autónomas (Incluye 300 min/mes).",
    price: 599900,
    priceUsd: 499,
    implFull: 1199900,
    implFullUsd: 999,
    implDiscount: 599900,
    implDiscountUsd: 499,
    cuota: 149975,
    cuotaUsd: 125,
    first4: 599900,
    first4Usd: 499,
    popular: true, 
  },
  {
    id: "pro",
    emoji: "🚀",
    name: "Omnicanal",
    capacityLabel: "Infraestructura Total",
    capacityDesc: "Voz y texto unificados (Incluye 500 min/mes).",
    price: 899900,
    priceUsd: 799,
    implFull: 1799900,
    implFullUsd: 1598,
    implDiscount: 899900,
    implDiscountUsd: 799,
    cuota: 224975,
    cuotaUsd: 200,
    first4: 899900,
    first4Usd: 799,
  },
];

// ==========================================
// FEATURE GATING ACTUALIZADOS
// ==========================================
const INCLUDED_BASE = [
  "Atención corporativa automatizada 24/7",
  "Infraestructura Meta Oficial (Cero baneos)", 
  "Entrenamiento express (Tu PDF/Excel)",
  "Soporte técnico y reportes",
];

const EXTRA_NEGOCIO = [
  "Conexión con Catálogo e Inventario",
  "Lectura de audios y PDF",
  "Cerebro RAG (Memoria unificada)",
];

const EXTRA_VOZ = [
  "Llamadas autónomas con baja latencia",
  "Bolsa de minutos de Voz / Mes",
  "Gestión automática de citas (Calendar)",
  "Transcripción y análisis de llamadas"
];

const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function Home() {
  const router = useRouter(); 
  const { idioma } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHudOpen, setIsHudOpen] = useState(false); 

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [procesandoPago, setProcesandoPago] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const instalarApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('¡App instalada con éxito!');
      }
      setDeferredPrompt(null);
    }
  };

  const [contract, setContract] = useState<ContractOption>(2);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const abrirModal = () => setIsModalOpen(true);
    window.addEventListener("abrir-modal-lead", abrirModal);
    return () => window.removeEventListener("abrir-modal-lead", abrirModal);
  }, []);

  const iniciarFlujoOnboarding = async () => {
    setProcesandoPago(true);
    setTimeout(() => {
      router.push('/dashboard/onboarding');
    }, 800);
  };

  const getImplLabel = (plan: Plan) => {
    const isEn = idioma === 'en';
    if (contract === 1)
      return { 
        main: isEn ? `+ $${plan.implFullUsd}` : `+ ${fmt(plan.implFull)}`, 
        sub: isEn ? "Implementation per plan" : "Implementación según plan", 
        strike: null, 
        free: false 
      };
    if (contract === 2)
      return { 
        main: isEn ? `$${plan.implDiscountUsd}` : fmt(plan.implDiscount), 
        sub: isEn ? "Setup 50% OFF" : "Implementación 50% OFF", 
        strike: isEn ? `$${plan.implFullUsd}` : fmt(plan.implFull), 
        free: false 
      };
    return { 
      main: "GRATIS", 
      sub: isEn ? "Setup included" : "Implementación incluida", 
      strike: isEn ? `$${plan.implFullUsd}` : fmt(plan.implFull), 
      free: true 
    };
  };

  return (
    <main className="min-h-screen bg-[#03050a] text-white selection:bg-cyan-500/30 selection:text-white relative overflow-x-hidden antialiased pb-20 md:pb-0">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: "Sora", "Inter", system-ui, sans-serif; }
        .font-body { font-family: "Inter", system-ui, sans-serif; }
        .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); }
        .glass-strong { background: rgba(255,255,255,0.06); backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px); }
      `}</style>

      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ParticleBackground />
      </div>

      {/* NAVEGACIÓN SUPERIOR Y MENÚ MÓVIL */}
      <nav className="fixed w-full top-0 z-[60] border-b border-white/5 bg-black/10 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex max-w-[95rem] items-center justify-between px-6 py-4 lg:px-12">
          <a href="#top" className="flex items-center gap-3">
            <Image src="/upway.png" alt="Logo Upway" width={40} height={40} className="rounded-full object-contain" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-white/90 hidden sm:block">Upway_OS</span>
          </a>

          <div className="hidden items-center gap-8 text-sm text-white/60 md:flex font-mono tracking-wider">
            <a href="#ventajas" className="transition hover:text-cyan-400">{idioma === 'en' ? '/advantages' : '/ventajas'}</a>
            <a href="#planes" className="transition text-cyan-400 hover:text-cyan-300">{idioma === 'en' ? '/plans' : '/planes'}</a>
            <a href="#proceso" className="transition hover:text-cyan-400">{idioma === 'en' ? '/process' : '/proceso'}</a>
            <a href="#contacto" className="transition hover:text-cyan-400">{idioma === 'en' ? '/contact' : '/contacto'}</a>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {deferredPrompt && (
              <button onClick={instalarApp} className="text-sm font-mono text-[#00D1FF] transition hover:text-white flex items-center gap-2 border border-[#00D1FF]/30 px-3 py-1.5 rounded-full bg-[#00D1FF]/10">
                ↓ {idioma === 'en' ? 'Install App' : 'Instalar App'}
              </button>
            )}
            <BotonIdioma />
            <a href="/login" className="text-sm font-mono text-white/70 transition hover:text-white">[login]</a>
            <a href="/dashboard/bots" className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm font-mono text-cyan-300 transition hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-md">
              PANEL_IA →
            </a>
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-white/70 hover:text-white p-2 rounded-lg bg-white/5 border border-white/10">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-[#0A0E14]/95 backdrop-blur-xl border-b border-white/10 overflow-hidden">
              <div className="flex flex-col px-6 py-6 gap-6 font-mono text-sm tracking-widest">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-white/50 text-xs">IDIOMA / LANGUAGE</span>
                  <BotonIdioma />
                </div>
                <a href="#ventajas" onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white">{idioma === 'en' ? '/advantages' : '/ventajas'}</a>
                <a href="#planes" onClick={() => setIsMobileMenuOpen(false)} className="text-[#00D1FF]">{idioma === 'en' ? '/plans' : '/planes'}</a>
                <a href="#proceso" onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white">{idioma === 'en' ? '/process' : '/proceso'}</a>
                <a href="#contacto" onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white">{idioma === 'en' ? '/contact' : '/contacto'}</a>
                <div className="h-[1px] bg-white/10 w-full my-2" />
                {deferredPrompt && (
                  <button onClick={() => { instalarApp(); setIsMobileMenuOpen(false); }} className="w-full text-center py-3 rounded-lg border border-[#00D1FF]/40 bg-[#00D1FF]/10 text-[#00D1FF] font-bold">
                    ↓ {idioma === 'en' ? 'DOWNLOAD UPWAY APP' : 'DESCARGAR APP UPWAY'}
                  </button>
                )}
                <a href="/login" className="w-full text-center py-3 rounded-lg border border-white/20 bg-white/5 text-white/80">{idioma === 'en' ? 'LOG IN' : 'INICIAR SESIÓN'}</a>
                <a href="/dashboard/bots" className="w-full text-center py-3 rounded-lg bg-[#00D1FF] text-black font-bold shadow-[0_0_15px_rgba(0,209,255,0.4)]">{idioma === 'en' ? 'ENTER DASHBOARD →' : 'ENTRAR AL PANEL →'}</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO SECTION: SOPHIE V2 */}
      <section id="top" className="relative h-screen w-full overflow-hidden z-10">
        <video autoPlay loop muted playsInline preload="metadata" className="absolute inset-0 z-0 h-full w-full object-cover scale-[1.02] transform-gpu brightness-[1.15]">
          <source src="/sophie-animada.webm" type="video/webm" />
          <source src="/sophie-animada.mp4" type="video/mp4" />
        </video>
        
        <div className="absolute inset-0 z-10 shadow-[inset_0_0_150px_rgba(3,5,10,0.8)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-56 bg-gradient-to-t from-[#03050a] via-[#03050a]/80 to-transparent z-20 pointer-events-none" />
        
        <div className="absolute right-6 top-1/2 z-20 -translate-y-1/2">
          <button onClick={() => setIsHudOpen(true)} className={`group flex flex-col items-center gap-3 rounded-full border border-cyan-500/40 bg-white/[0.02] p-4 backdrop-blur-md transition-all hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] ${isHudOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <Menu className="h-6 w-6 text-cyan-400" />
            <span className="writing-vertical text-[10px] font-mono tracking-[0.3em] text-cyan-300" style={{ writingMode: 'vertical-rl' }}>{idioma === 'en' ? 'START_SYSTEM' : 'INICIAR_SISTEMA'}</span>
          </button>
        </div>

        <div className="absolute bottom-8 left-8 z-20 hidden md:block">
          <div className="flex flex-col gap-1.5 border-l-2 border-cyan-500/50 pl-3">
             <p className="text-[10px] font-mono text-cyan-400 tracking-widest">STATUS: ONLINE</p>
             <p className="text-[10px] font-mono text-white/50 tracking-widest">MODEL: SOPHIE_V2</p>
          </div>
        </div>

        <AnimatePresence>
          {isHudOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHudOpen(false)} className="absolute inset-0 z-30 bg-black/10" />
              <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="absolute right-0 top-0 bottom-0 z-40 w-full max-w-md border-l border-white/10 bg-white/[0.03] p-8 pt-32 shadow-[-20px_0_50px_rgba(0,0,0,0.3)] backdrop-blur-xl flex flex-col justify-center">
                <button onClick={() => setIsHudOpen(false)} className="absolute top-24 right-8 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 transition hover:bg-white/20 hover:text-white backdrop-blur-md">
                  <X className="h-5 w-5" />
                </button>
                <div className="mb-4 inline-flex items-center gap-2 border-r-2 border-cyan-500 pr-3 text-[10px] font-mono text-cyan-400 tracking-widest w-fit">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span> {idioma === 'en' ? 'VOICE AI ACTIVE' : 'INTELIGENCIA DE VOZ ACTIVA'}
                </div>
                <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {idioma === 'en' ? 'Hi, I am Sophie V2, UpWay’s' : 'Hola, soy Sophie V2, la'} <br/><span className="text-transparent bg-clip-text bg-gradient-to-l from-cyan-300 to-blue-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">{idioma === 'en' ? 'digital employee.' : 'empleada digital de UpWay.'}</span>
                </h1>
                <p className="mt-6 text-sm leading-relaxed text-white/90 font-medium drop-shadow-md">
                  {idioma === 'en' 
                    ? 'I am here to assist you. Want an AI like me working for your business? Talk to me right now and judge the technology level yourself.' 
                    : 'Estoy aquí para atenderte. ¿Quieres que una como yo trabaje para tu empresa? No nos cuentes. Habla conmigo ahora mismo y juzga tú mismo el nivel de la tecnología.'}
                </p>
                <div className="mt-10 flex flex-col gap-4">
                  <button onClick={() => { setIsHudOpen(false); window.dispatchEvent(new Event("abrir-chat")); }} className="group relative flex w-full items-center justify-center gap-3 border border-[#00D1FF]/60 bg-[#00D1FF]/20 px-6 py-4 text-sm font-display font-bold tracking-widest text-[#00D1FF] backdrop-blur-md transition-all hover:bg-[#00D1FF] hover:text-slate-950 hover:shadow-[0_0_30px_rgba(0,209,255,0.6)]">
                    <Cpu className="h-4 w-4" /> {idioma === 'en' ? 'TRY AGENT FREE' : 'PROBAR AGENTE GRATIS'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <a href="#planes" onClick={() => setIsHudOpen(false)} className="flex w-full items-center justify-center rounded-none border border-white/20 bg-black/20 px-6 py-4 text-sm font-mono tracking-widest text-white/80 backdrop-blur-md transition hover:bg-white/10 hover:text-white">
                    {idioma === 'en' ? 'VIEW PLANS & PRICING' : 'VER PLANES Y PRECIOS'}
                  </a>
                </div>

                <div className="mt-6 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-200/80 leading-relaxed font-body">
                    <strong>{idioma === 'en' ? 'Important note:' : 'Aclaración importante:'}</strong> {idioma === 'en' ? 'Configure a demo digital employee and experience it here on the web. Connection to your real WhatsApp is done only after purchasing a plan.' : 'Configura un empleado digital de demostración y vive la experiencia aquí en la web. La conexión oficial y sin riesgos con tu WhatsApp real se realiza en tu panel al contratar un plan.'}
                  </p>
                </div>

                <div className="mt-auto border-t border-white/20 pt-6">
                  <p className="text-[10px] font-mono text-white/60 tracking-widest drop-shadow-sm">UPWAY BUSINESS // GLOBAL HQ</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </section>

      {/* 🚀 INTEGRACIONES LOCALES (NUEVA FRANJA DE CONFIANZA) */}
      <div className="border-b border-white/5 bg-[#0a0e14] py-8 opacity-80 flex flex-col items-center">
        <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-5">
          {idioma === 'en' ? 'Ready to sync with your current tools' : 'Listo para sincronizarse con tu operación actual'}
        </p>
        <div className="flex flex-wrap justify-center items-center gap-10 opacity-60 grayscale hover:grayscale-0 transition-all">
          <span className="text-xl font-bold font-display text-white">Siigo</span>
          <span className="text-xl font-bold font-display text-white">Alegra</span>
          <span className="text-xl font-bold font-display text-white flex items-center gap-2"><MetaIcon/> WhatsApp API</span>
          <span className="text-xl font-bold font-display text-white">Google Calendar</span>
        </div>
      </div>

      {/* 🚀 CASO DE ÉXITO: EL EQUIPO Y BARAKAH */}
<section className="py-24 bg-[#07090C] border-b border-white/10">
  <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
    
    {/* Columna 1: Textos y Caso de Éxito Inworker con la foto de la CEO/Directora de Inworker */}
    <div>
      <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-400 mb-6">
        {idioma === 'en' ? 'Real Founders. Real Results.' : 'Fundadores reales. Resultados crudos.'}
      </div>
      <h2 className="text-4xl font-display font-bold text-white mb-6 leading-tight">
        {idioma === 'en' ? 'We built this because we were drowning in our own operations.' : 'Construimos esto porque nos ahogábamos en nuestras propias operaciones.'}
      </h2>
      <p className="text-gray-400 text-lg mb-8 leading-relaxed">
        {idioma === 'en' 
          ? 'We are not just selling software. We are business owners who needed an intelligent filter, not another dashboard.'
          : 'No somos una agencia vendiendo software. Somos empresarios que necesitábamos un filtro inteligente, no otro panel de control.'}
      </p>

      <div className="bg-[#0A0E14] border border-cyan-500/30 p-6 rounded-2xl relative overflow-hidden mt-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none"></div>
        
        {/* Cabecera del Caso de Éxito con la foto corporativa de Inworker */}
        <div className="flex items-center gap-4 mb-4">
          <img 
            src="/ceo-inworker.jpeg" 
            alt="Inworker Leadership" 
            className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500/40 shadow-md shrink-0" 
          />
          <div>
            <h4 className="font-display font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              {idioma === 'en' ? 'Internal Case Study' : 'Caso de Éxito'}
            </h4>
            <a 
              href="https://inworker.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-cyan-300 font-mono hover:underline flex items-center gap-1 mt-0.5"
            >
              inworker.co ↗
            </a>
          </div>
        </div>

        <p className="text-sm text-gray-400 leading-relaxed">
          {idioma === 'en' ? (
            <>Before scaling globally, Upway automated 85% of our client onboarding and vendor routing using <a href="https://inworker.co" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300 font-medium">inworker.co</a> infrastructure.</>
          ) : (
            <>Antes de escalar globalmente, Upway automatizó el 85% de nuestro onboarding y enrutamiento de proveedores usando la infraestructura de <a href="https://inworker.co" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300 font-medium">inworker.co</a>.</>
          )}
        </p>
      </div>
    </div>

    {/* Columna 2: Foto del equipo de Upway y LinkedIn de Sophia de Belfort debajo */}
    <div className="flex flex-col gap-4">
      <div className="relative h-[400px] bg-[#0A0E14] rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
        <img 
          src="/equipo-upway.jpg" 
          alt="Equipo Upway" 
          className="absolute inset-0 w-full h-full object-cover object-left md:object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        />
      </div>
      
      {/* Botón de LinkedIn con el nombre Sophia de Belfort */}
      <a 
        href="https://www.linkedin.com/in/mia-de-belfort-990164431" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium bg-cyan-950/40 px-4 py-2.5 rounded-xl border border-cyan-500/20 w-fit self-start shadow-md hover:bg-cyan-900/40"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
        <span>Sophia de Belfort | LinkedIn</span>
      </a>
    </div>

  </div>
</section>

      {/* EL EMPLEADO DIGITAL (VENTAJAS B2B) */}
      <section id="ventajas" className="relative py-32 bg-[#0A0E14] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00D1FF]/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-[95rem] mx-auto px-6 lg:px-12">
          
          <div className="text-center max-w-4xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D1FF]/30 bg-[#00D1FF]/10 px-4 py-1.5 text-xs font-bold text-[#00D1FF] mb-6 tracking-widest uppercase shadow-[0_0_15px_rgba(0,209,255,0.15)]">
              <Sparkles className="h-4 w-4" /> {idioma === 'en' ? 'Your business deserves more than a chatbot' : 'Tu empresa merece algo más que un chatbot'}
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
              {idioma === 'en' ? 'It is not just a response bot.' : 'No es un bot de respuestas.'} <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D1FF] to-blue-500">{idioma === 'en' ? 'It is your Digital Employee.' : 'Es tu Empleado Digital.'}</span>
            </h2>
            <p className="text-xl text-slate-300 font-medium tracking-wide">
              {idioma === 'en' ? 'Speaks. Listens. Understands. Attends. Executes.' : 'Habla. Escucha. Entiende. Atiende. Ejecuta.'}
            </p>
            <p className="mt-4 text-slate-400 text-lg leading-relaxed max-w-3xl mx-auto">
              {idioma === 'en' 
                ? 'An AI conversational agent designed to work alongside your business 24/7, servicing clients, handling requests and executing processes with absolute precision.' 
                : 'Una IA conversacional diseñada para trabajar junto a tu empresa 24/7, atender clientes, gestionar solicitudes y ejecutar procesos con precisión milimétrica.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            <div className="md:col-span-2 rounded-[32px] border border-[#00D1FF]/30 bg-gradient-to-br from-[#00D1FF]/10 to-transparent p-8 md:p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                <svg className="w-32 h-32 text-[#00D1FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <div className="relative z-10">
                <div className="inline-block px-3 py-1 bg-[#00D1FF]/20 border border-[#00D1FF]/30 text-[#00D1FF] rounded-lg text-xs font-bold font-mono mb-6">🎙️ {idioma === 'en' ? 'AUTONOMOUS VOICE TECHNOLOGY' : 'TECNOLOGÍA DE VOZ AUTÓNOMA'}</div>
                <h3 className="text-3xl font-display font-bold text-white mb-4">{idioma === 'en' ? 'It can also speak (and listen)' : 'También puede hablar (y escuchar)'}</h3>
                <p className="text-slate-300 text-lg leading-relaxed mb-6 max-w-xl">
                  {idioma === 'en' 
                    ? 'Your client calls. Your Digital Employee responds with a natural voice and a fluid conversational experience. Zero robotic menus.' 
                    : 'Tu cliente llama. Tu Empleado Digital responde con una voz natural y una experiencia conversacional fluida. Cero menús robóticos.'}
                </p>
                
                <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md max-w-xl border-l-4 border-l-[#00D1FF]">
                  <p className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00D1FF] animate-pulse"></span>
                    {idioma === 'en' ? 'Smart Interruption (Barge-in)' : 'Interrupción Inteligente (Barge-in)'}
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {idioma === 'en' 
                      ? 'If the agent is speaking and the client interrupts, the AI stops immediately, listens to the new context, and instantly adapts its response.' 
                      : 'Si el agente está hablando y el cliente lo interrumpe, la IA se calla inmediatamente, escucha el nuevo contexto y adapta su respuesta al instante.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-all flex flex-col justify-center">
              <div className="h-14 w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{idioma === 'en' ? 'Understands Context' : 'Entiende el Contexto'}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                {idioma === 'en' ? 'It maintains conversation threads and uses prior information to deliver relevant answers.' : 'No se trata solo de responder mensajes. Mantiene el hilo y utiliza información previa.'}
              </p>
              <h4 className="font-bold text-white mb-2 text-sm">{idioma === 'en' ? 'Listens to Audio' : 'Escucha Audios'}</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                {idioma === 'en' ? 'Processes long voice notes, understands them and keeps the flow naturally.' : 'Procesa notas de voz kilométricas, las entiende y continúa con naturalidad.'}
              </p>
            </div>

            <div className="rounded-[32px] border border-blue-500/20 bg-blue-500/5 p-8 hover:bg-blue-500/10 transition-all shadow-[0_0_20px_rgba(59,130,246,0.05)]">
              <div className="h-14 w-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30 text-blue-400">
                <MetaIcon />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{idioma === 'en' ? '100% Official API' : 'Conexión 100% Oficial'}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {idioma === 'en' ? 'Forget about unstable QR codes. We integrate your business via Official Meta Cloud API. Zero ban risk, infinite stability.' : 'Olvídate de los códigos QR inestables. Integramos tu línea vía WhatsApp Cloud API Oficial mediante Embedded Signup. 100% legal, 0% riesgo de baneo.'}
              </p>
            </div>

            <div className="md:col-span-2 rounded-[32px] border border-white/10 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-[#00D1FF]/10 flex items-center justify-center border border-[#00D1FF]/20">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-2xl font-display font-bold text-white">{idioma === 'en' ? 'More than answering: It Works' : 'Más que responder: Trabaja'}</h3>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8 mt-6">
                {(idioma === 'en' ? [
                  "Service clients 24/7 without rest",
                  "Real-time catalog & inventory lookup",
                  "Appointment & schedule management (Calendar)",
                  "Payment gateway & system integrations",
                  "Take orders and automate sales",
                  "Human agent handoff when necessary"
                ] : [
                  "Atender clientes 24/7 sin descanso",
                  "Consultar catálogo e inventario en tiempo real",
                  "Gestionar reservas y agenda (Calendario)",
                  "Integrarse con pasarelas de pago y sistemas",
                  "Tomar pedidos y automatizar ventas",
                  "Transferir a un asesor humano cuando sea necesario"
                ]).map((task, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[#00D1FF]/20 flex items-center justify-center border border-[#00D1FF]/40">
                      <svg className="w-3 h-3 text-[#00D1FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-sm text-slate-300">{task}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECCIÓN DE PRECIOS Y TRANSPARENCIA (MULTIMONEDA) */}
      <section id="planes" className="relative z-20 py-24 bg-gradient-to-b from-[#0A0E14] to-[#03050a] border-t border-white/5">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] left-[20%] w-[60%] h-[30%] bg-[#00D1FF]/[0.05] blur-[140px] rounded-full" />
        </div>

        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400 mb-4">/precios_upway</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
              {idioma === 'en' ? 'Hire your digital executive starting at $49/mo.' : 'Escala tu negocio sin crecer tu nómina.'}
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto font-medium mb-8">
              {idioma === 'en' ? 'Never miss another sale due to unanswered calls or messages.' : 'Nunca más pierdas una venta por una llamada o mensaje no atendido.'}
            </p>
          </div>

          <div className="max-w-6xl mx-auto mb-16 grid lg:grid-cols-3 gap-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <h3 className="font-display font-bold text-xl text-white mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#00D1FF]/10 flex items-center justify-center text-[#00D1FF]">⚖️</span>
                {idioma === 'en' ? 'Clear Expectations' : 'Claridad Absoluta'}
              </h3>
              <div className="space-y-4 font-body text-sm text-slate-300">
                <div className="flex gap-3"><CheckCircle className="h-5 w-5 text-[#00D1FF] shrink-0" /> <p><strong>{idioma === 'en' ? 'We do:' : 'Hacemos:'}</strong> {idioma === 'en' ? '24/7 automated tech, advanced memory, natural voice.' : 'Atención 24/7, memoria avanzada, voz natural y flujos precisos.'}</p></div>
                <div className="flex gap-3"><CheckCircle className="h-5 w-5 text-[#00D1FF] shrink-0" /> <p><strong>{idioma === 'en' ? 'We guarantee:' : 'Garantizamos:'}</strong> {idioma === 'en' ? 'You will never lose a client for failing to respond.' : 'Que nunca más perderás un cliente por no atenderlo a tiempo.'}</p></div>
              </div>
            </div>

            <div className="bg-[#00D1FF]/5 border border-[#00D1FF]/20 rounded-3xl p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(0,209,255,0.05)]">
              <h3 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-[#00D1FF]" />
                {idioma === 'en' ? '99.5% Uptime' : 'Garantía 99.5% Uptime'}
              </h3>
              <p className="font-body text-[13px] text-slate-300 leading-relaxed mb-4">
                {idioma === 'en' ? 'Our infrastructure is designed for Enterprise volume. We guarantee your operations never stop.' : 'Nuestra infraestructura está diseñada para volumen corporativo. Garantizamos que tu operación comercial nunca se detendrá.'}
              </p>
            </div>

            <div className="bg-blue-600/10 border border-blue-500/30 rounded-3xl p-8 backdrop-blur-sm">
              <h3 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-3">
                <div className="text-blue-400 bg-blue-500/20 p-2 rounded-full"><MetaIcon /></div>
                {idioma === 'en' ? 'Official Meta Partner' : 'Infraestructura Oficial Meta'}
              </h3>
              <p className="font-body text-[13px] text-slate-300 leading-relaxed">
                {idioma === 'en' ? 'No shady QR codes. We connect via WhatsApp Cloud API (Embedded Signup). 100% legal, zero ban risk.' : 'Cero códigos QR piratas. Integramos tu línea vía WhatsApp Cloud API Oficial mediante Embedded Signup. 100% legal, 0% riesgo de baneo.'}
              </p>
            </div>
          </div>

          <div className="mb-12 max-w-3xl mx-auto">
            <div className="glass-strong border border-white/10 rounded-[16px] p-1.5 flex flex-col sm:flex-row gap-1.5">
              <button onClick={() => setContract(1)} className={`flex-1 text-left rounded-[12px] px-4 py-3.5 transition-all border ${contract === 1 ? "bg-white text-black border-white shadow-[0_4px_20px_rgba(255,255,255,0.15)]" : "bg-transparent text-white/60 border-transparent hover:bg-white/[0.05] hover:text-white/90"}`}>
                <div className="font-display text-[13px] font-semibold tracking-tight">{idioma === 'en' ? 'Monthly (No lock-in)' : 'Mensual (Sin permanencia)'}</div>
                <div className={`font-body text-[12px] mt-1 leading-snug ${contract === 1 ? "text-black/60" : "text-white/40"}`}>{idioma === 'en' ? 'Standard setup fee' : 'Implementación según plan'}</div>
              </button>
              <button onClick={() => setContract(2)} className={`flex-1 text-left rounded-[12px] px-4 py-3.5 transition-all border relative overflow-hidden ${contract === 2 ? "bg-[#00D1FF] text-black border-[#00D1FF] shadow-[0_8px_32px_rgba(0,209,255,0.35)]" : "bg-transparent text-white/60 border-transparent hover:bg-white/[0.05] hover:text-white/90"}`}>
                {contract === 2 && <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent pointer-events-none" />}
                <div className="relative flex items-center gap-2">
                  <span className="font-display text-[13px] font-bold tracking-tight">{idioma === 'en' ? '12 Months' : '12 meses'}</span>
                  <span className={`font-body text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${contract === 2 ? "bg-black text-[#00D1FF]" : "bg-[#00D1FF] text-black"}`}>RECOMENDADO</span>
                </div>
                <div className={`relative font-body text-[12px] mt-1 leading-snug ${contract === 2 ? "text-black/70" : "text-white/40"}`}>{idioma === 'en' ? 'Setup 50% OFF' : 'Implementación 50% OFF'}</div>
              </button>
              <button onClick={() => setContract(3)} className={`flex-1 text-left rounded-[12px] px-4 py-3.5 transition-all border ${contract === 3 ? "bg-white text-black border-white shadow-[0_4px_20px_rgba(255,255,255,0.15)]" : "bg-transparent text-white/60 border-transparent hover:bg-white/[0.05] hover:text-white/90"}`}>
                <div className="font-display text-[13px] font-semibold tracking-tight">{idioma === 'en' ? 'Annual Prepaid' : 'Prepago Anual'}</div>
                <div className={`font-body text-[12px] mt-1 leading-snug ${contract === 3 ? "text-black/60" : "text-white/40"}`}>{idioma === 'en' ? 'Setup INCLUDED (Best value)' : 'Implementación INCLUIDA (Mayor ahorro)'}</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-8">
            {PLANS.map((plan) => {
              const impl = getImplLabel(plan);
              const displayPrice = idioma === 'en' ? `$${plan.priceUsd}` : fmt(plan.price);
              
              return (
                <div key={plan.id} className={`relative rounded-[24px] border p-[1px] flex flex-col group transition-all duration-300 ${plan.popular ? "border-[#00D1FF]/50 shadow-[0_0_80px_rgba(0,209,255,0.18)]" : "border-white/10 hover:border-white/[0.14]"}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <div className="font-display text-[10px] font-bold tracking-[0.12em] bg-[#00D1FF] text-black px-3.5 py-1 rounded-full shadow-[0_0_20px_rgba(0,209,255,0.6)]">MÁS POPULAR</div>
                    </div>
                  )}
                  <div className={`relative rounded-[23px] glass h-full p-6 flex flex-col flex-1 ${plan.popular ? "bg-gradient-to-b from-[#00D1FF]/[0.07] to-white/[0.02]" : ""}`}>
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[20px]">{plan.emoji}</span>
                        <span className="font-display text-[16px] font-bold tracking-tight">{plan.name}</span>
                      </div>
                    </div>

                    <div className="mb-5">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-[32px] font-bold tracking-[-0.03em] leading-none">{displayPrice}</span>
                        <span className="font-body text-[13px] text-white/40 font-medium">{idioma === 'en' ? '/ mo' : '/ mes'}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`font-display text-[13px] font-semibold tracking-tight ${impl.free ? "text-[#00D1FF]" : "text-white/90"}`}>{impl.main}</span>
                        {impl.strike && <span className="font-body text-[11px] text-white/25 line-through">{impl.strike}</span>}
                      </div>
                      <div className="font-body text-[10.5px] font-semibold mt-1.5 text-white/40">{impl.sub}</div>
                    </div>

                    <div className="mb-5">
                      <div className="font-body text-[10px] font-semibold tracking-[0.16em] uppercase text-[#00D1FF]/70 mb-1.5">{idioma === 'en' ? 'Capacity' : 'Capacidad'}</div>
                      <div className="font-display text-[13.5px] font-semibold text-white/90 leading-tight">{plan.capacityLabel}</div>
                      <div className="font-body text-[12.5px] text-white/50 mt-1 leading-snug">{plan.capacityDesc}</div>
                    </div>

                    <div className="h-[1px] bg-gradient-to-r from-white/10 to-transparent mb-5" />

                    <div className="mb-6 flex-1">
                      <div className="font-body text-[10px] font-semibold tracking-[0.16em] uppercase text-white/30 mb-3">{idioma === 'en' ? 'Includes digital worker' : 'Incluye empleado digital'}</div>
                      
                      <div className="space-y-2">
                        {INCLUDED_BASE.map((feat) => (
                          <div key={feat} className="flex items-center gap-2.5 font-body text-[13px] text-white/70 leading-snug">
                            {feat.includes('Meta') 
                              ? <MetaIcon /> 
                              : <CheckCircle className="w-[16px] h-[16px] text-[#00D1FF] shrink-0" />
                            }
                            {idioma === 'en' && feat === 'Soporte técnico y reportes' ? 'Technical support & reports' : feat}
                          </div>
                        ))}
                      </div>

                      {plan.id !== "starter" && (
                        <div className="mt-5">
                          <div className="font-body text-[10px] font-bold tracking-[0.14em] uppercase mb-2.5 text-[#00D1FF]/90 flex items-center gap-1.5">
                            <MetaIcon /> + {idioma === 'en' ? 'AI Text (Meta API)' : 'Texto IA (API Meta)'}
                          </div>
                          <div className="space-y-1.5">
                            {EXTRA_NEGOCIO.map((e) => (
                              <div key={e} className="flex gap-2 font-body text-[12px] text-white/70 leading-snug">
                                <CheckCircle className="w-[14px] h-[14px] text-[#00D1FF]/70 shrink-0" /> {e}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(plan.id === "voz" || plan.id === "pro") && (
                        <div className="mt-5">
                          <div className="font-body text-[10px] font-bold tracking-[0.14em] uppercase mb-2.5 text-[#00D1FF]">+ {idioma === 'en' ? 'AI Voice (Vapi)' : 'Voz IA (Vapi)'}</div>
                          <div className="space-y-1.5">
                            {EXTRA_VOZ.map((e) => (
                              <div key={e} className="flex gap-2 font-body text-[12px] text-white/70 leading-snug">
                                <CheckCircle className="w-[14px] h-[14px] text-[#00D1FF]/70 shrink-0" /> {e}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/5">
                      <button onClick={() => setCheckoutPlan(plan)} className={`w-full h-[46px] rounded-[12px] text-black font-display font-bold text-[14px] tracking-tight transition-colors flex items-center justify-center gap-2 ${plan.id === "starter" ? "bg-white hover:bg-gray-200" : "bg-[#00D1FF] hover:bg-[#33DDFF] shadow-[0_0_28px_rgba(0,209,255,0.35)]"}`}>
                        {plan.id === "starter" 
                          ? (idioma === 'en' ? 'Start Free Trial' : 'Iniciar Prueba') 
                          : (idioma === 'en' ? 'Automate my sales' : 'Quiero automatizar mis ventas')} 
                        <span className="text-[16px] font-medium">→</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🚀 NOTA LEGAL Y DE TRANSPARENCIA PARA BLINDAR COSTOS DE TERCEROS */}
          <div className="max-w-4xl mx-auto bg-black/40 border border-white/10 p-6 rounded-2xl text-center">
            <p className="text-xs text-slate-400 leading-relaxed font-body">
              <strong className="text-white">{idioma === 'en' ? 'Infrastructure Transparency:' : 'Transparencia de Infraestructura:'}</strong> 
              {idioma === 'en' 
                ? ' To guarantee your total control, WhatsApp message traffic is managed directly from your company\'s Official Meta account (consumption is billed by Meta). AI Voice plans include a monthly minute allocation managed by Upway. For corporate volumes, we offer minute reload packages at preferential rates.' 
                : ' Para garantizar tu control total, el tráfico de mensajes de WhatsApp se gestiona directamente desde la cuenta oficial de Meta de tu empresa (el consumo es facturado por Meta). Los planes de Voz IA incluyen una asignación mensual de minutos gestionada por Upway. Para recargas adicionales, ofrecemos paquetes corporativos.'}
            </p>
          </div>

        </div>
      </section>

      {/* 🚀 PROCESO (NUEVO ONBOARDING EXPRESS DE 3 PASOS - CERO FRICCIÓN) */}
      <section id="proceso" className="relative border-t border-white/5 bg-[#03050a] overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#00D1FF]/[0.03] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-[95rem] px-6 py-24 lg:px-12">
          <div className="max-w-3xl mb-16 text-center mx-auto">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-[#00D1FF] mb-4">/02_onboarding</p>
            <h2 className="text-3xl font-display font-bold text-white sm:text-4xl tracking-tight">
              {idioma === 'en' ? 'Your employee ready in 15 minutes.' : 'Tu empleado listo en 15 minutos.'}
            </h2>
            <p className="mt-4 text-slate-400 text-lg">{idioma === 'en' ? 'Zero friction. Upload your data and hit play.' : 'Cero fricción corporativa. Sube tu data y dale play.'}</p>
          </div>

          <div className="grid gap-12 md:grid-cols-3 max-w-5xl mx-auto text-center mt-10">
            {[
              { title: idioma === 'en' ? "Upload Knowledge" : "Sube tu conocimiento", desc: idioma === 'en' ? "Drag your catalog in PDF, Excel pricing, or manual. The AI memorizes it instantly." : "Arrastra tu catálogo en PDF, lista de precios en Excel o manual. La IA lo memoriza al instante." },
              { title: idioma === 'en' ? "Define Personality" : "Define la personalidad", desc: idioma === 'en' ? "Choose the tone of voice and select common objections from a template." : "Elige el tono de voz y selecciona las objeciones comunes de una plantilla rápida." },
              { title: idioma === 'en' ? "Connect & Ignite" : "Conecta y enciende", desc: idioma === 'en' ? "Link your Meta number or Vapi voice trunk with one click. Autopilot engaged." : "Vincula tu número de Meta o asigna tu línea de voz con un solo clic. Piloto automático activado." }
            ].map((step, index) => (
              <div key={step.title} className="rounded-[24px] border border-white/10 bg-white/[0.02] p-8 pt-12 relative group transition-all hover:bg-white/[0.04] hover:border-[#00D1FF]/30 flex flex-col items-center">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-[#00D1FF] text-xl font-bold text-black shadow-[0_0_20px_rgba(0,209,255,0.4)] group-hover:scale-110 transition-transform">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" className="relative border-t border-white/5 bg-gradient-to-b from-[#03050a] to-[#010204]">
        <div className="absolute inset-0 bg-[url('https://i.pinimg.com/736x/07/93/29/07932918dfec0b7ee8ed301abccdbbf9.jpg')] bg-cover bg-center opacity-[0.02] mix-blend-screen pointer-events-none" />

        <div className="relative z-10 mx-auto flex max-w-[95rem] flex-col gap-10 px-6 py-24 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 mb-6">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> {idioma === 'en' ? 'Your competitors are already using AI' : 'Tus competidores ya usan IA'}
            </div>
            <h2 className="text-4xl font-display font-bold text-white sm:text-5xl tracking-tight mb-6">
              {idioma === 'en' ? 'Never lose clients due to lack of immediate response.' : 'No pierdas más clientes por falta de atención inmediata.'}
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              {idioma === 'en' ? 'Schedule an infrastructure audit today and discover the exact ROI.' : 'Agenda una auditoría de infraestructura hoy mismo y descubre el ROI exacto.'}
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 md:p-10 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center lg:min-w-[420px]">
            <p className="text-sm font-semibold text-white/70 mb-6 uppercase tracking-widest">{idioma === 'en' ? 'Talk to an Engineer' : 'Habla con un Ingeniero'}</p>
            <button onClick={() => window.dispatchEvent(new Event("abrir-chat"))} className="w-full h-[56px] rounded-[16px] bg-[#00D1FF] text-black font-display font-bold text-[16px] tracking-tight hover:bg-[#33DDFF] hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(0,209,255,0.4)] flex items-center justify-center gap-3">
              {idioma === 'en' ? 'Automate my operations today' : 'Automatizar mi operación hoy'} <ArrowRight className="h-5 w-5" />
            </button>
            <p className="text-[11px] text-slate-500 mt-6 flex items-center justify-center gap-1.5 border-t border-white/10 pt-4 w-full">
              <ShieldCheck className="h-3.5 w-3.5 text-[#00D1FF]/70" /> {idioma === 'en' ? '100% Free feasibility analysis.' : 'Análisis de viabilidad 100% gratuito.'}
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-[#010204] py-10 relative z-20 pb-32 md:pb-10">
        <div className="mx-auto flex max-w-[95rem] flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between lg:px-12">
          
          <div className="flex items-center gap-4">
  <Image src="/upway.png" alt="Logo Upway" width={36} height={36} className="rounded-full object-contain grayscale opacity-70" />
  <div className="flex flex-col">
    <span className="text-xs font-mono uppercase tracking-[0.2em] text-white/80 font-semibold">Upway Business Corp.</span>
    <span className="text-[10px] font-mono text-white/40">Powered by Barakah Tech Hub S.A.S. — NIT: 902080128-8</span>
  </div>
</div>

          <div className="flex flex-col items-center md:items-start gap-2">
            <a href="mailto:contacto@upway.business" className="flex items-center gap-2 group">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00D1FF] group-hover:animate-ping" />
              <span className="text-[11px] font-mono tracking-widest text-[#00D1FF]/80 group-hover:text-[#00D1FF] transition-colors uppercase">
                contacto@upway.business
              </span>
            </a>
            <div className="flex gap-8 text-[11px] font-mono tracking-widest text-white/40">
              <Link href="/terminos" className="hover:text-[#00D1FF] transition-colors uppercase">{idioma === 'en' ? 'Terms' : 'Términos'}</Link>
              <Link href="/privacy" className="hover:text-[#00D1FF] transition-colors uppercase">{idioma === 'en' ? 'Privacy' : 'Privacidad'}</Link>
            </div>
          </div>

          <p className="text-[10px] font-mono text-white/30 text-center md:text-right">© 2026 UPWAY BUSINESS. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 p-4 bg-[#0A0E14]/90 backdrop-blur-xl border-t border-white/10">
        <button onClick={() => window.dispatchEvent(new Event("abrir-chat"))} className="w-full h-[50px] rounded-[14px] bg-[#00D1FF] text-black font-display font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,209,255,0.3)]">
           {idioma === 'en' ? 'Try Sophie V2 Free' : 'Probar gratis con Sophie V2'} <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* MODAL DE CHECKOUT (ADAPTATIVO COP / USD) */}
      <AnimatePresence>
        {checkoutPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !procesandoPago && setCheckoutPlan(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-[#0A0E14] border border-[#00D1FF]/30 rounded-[24px] shadow-[0_0_50px_rgba(0,209,255,0.15)] overflow-hidden z-10 pb-20 md:pb-0">
              <button disabled={procesandoPago} onClick={() => setCheckoutPlan(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50">✕</button>
              
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[28px]">{checkoutPlan.emoji}</span>
                  <div>
                    <h3 className="font-display text-[18px] font-bold text-white">Plan {checkoutPlan.name}</h3>
                    <p className="font-body text-[12px] text-white/50">{idioma === 'en' ? 'Corporate infrastructure activation' : 'Activación de infraestructura corporativa'}</p>
                  </div>
                </div>

                {(() => {
                  const isEn = idioma === 'en';
                  const planPrice = isEn ? checkoutPlan.priceUsd : checkoutPlan.price;
                  const valorImplementacion = contract === 2 
                    ? (isEn ? checkoutPlan.cuotaUsd : checkoutPlan.cuota) 
                    : contract === 3 
                    ? 0 
                    : (isEn ? checkoutPlan.implFullUsd : checkoutPlan.implFull);
                  const totalApagar = planPrice + valorImplementacion;
                  const formatMoney = (n: number) => isEn ? `$${n}` : fmt(n);

                  return (
                    <>
                      <div className="glass rounded-[16px] p-4 mb-6 border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-body text-[13px] text-white/70">{isEn ? 'Monthly Infrastructure' : 'Mensualidad Infraestructura'}</span>
                          <span className="font-display text-[14px] font-semibold">{formatMoney(planPrice)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-body text-[13px] text-white/70">
                            {contract === 2 
                              ? (isEn ? "Setup (Installment 1/4)" : "Implementación (Cuota 1/4)") 
                              : contract === 3 
                              ? (isEn ? "Setup (Free)" : "Implementación (Gratis)") 
                              : (isEn ? "Setup (Full)" : "Implementación (Full)")}
                          </span>
                          <span className="font-display text-[14px] font-semibold text-[#00D1FF]">
                            {contract === 3 ? (isEn ? "$0" : "$0") : formatMoney(valorImplementacion)}
                          </span>
                        </div>
                        <div className="h-[1px] bg-white/10 w-full my-3" />
                        <div className="flex justify-between items-center">
                          <span className="font-display font-bold text-[14px] text-white">{isEn ? 'Total reference value' : 'Valor total de referencia'}</span>
                          <span className="font-display font-bold text-[20px] text-white">{formatMoney(totalApagar)}</span>
                        </div>
                      </div>

                      <button onClick={iniciarFlujoOnboarding} disabled={procesandoPago} className="w-full h-[50px] rounded-[12px] bg-gradient-to-r from-blue-600 to-[#00D1FF] text-white font-display font-bold text-[15px] hover:shadow-[0_0_20px_rgba(0,209,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                        {procesandoPago 
                          ? (isEn ? 'Preparing workspace...' : 'Preparando entorno...') 
                          : (isEn ? '⚙️ Configure my AI Agent' : '⚙️ Configurar mi Agente IA')}
                      </button>
                    </>
                  );
                })()}

                <p className="text-center font-body text-[10px] text-white/30 mt-4 flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> 
                  {idioma === 'en' ? 'Step 1 of 2: Infrastructure Setup' : 'Paso 1 de 2: Configuración de Entorno'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-[110]">
        <LeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </main>
  );
}