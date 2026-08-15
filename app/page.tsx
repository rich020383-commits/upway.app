"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Cpu,
  Menu,
  X
} from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import LeadModal from "@/components/LeadModal";

// ==========================================
// TIPOS Y DATOS DE LOS PLANES (High-Ticket B2B)
// ==========================================
type ContractOption = 1 | 2 | 3;
type PlanId = "emprendedor" | "negocio" | "voz" | "pro" | "personalizado";

interface Plan {
  id: PlanId;
  emoji: string;
  name: string;
  capacityLabel: string;
  capacityDesc: string;
  price: number;
  implFull: number;
  implDiscount: number;
  cuota: number;
  first4: number;
  popular?: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ==========================================
// 1. PLANES (Con la Voz como protagonista)
// ==========================================
const PLANS: Plan[] = [
  {
    id: "emprendedor",
    emoji: "🌱",
    name: "Esencial",
    capacityLabel: "Automatización Básica",
    capacityDesc: "Ideal para iniciar procesos corporativos.",
    price: 249900,
    implFull: 499900,
    implDiscount: 249900,
    cuota: 62475,
    first4: 249900,
  },
  {
    id: "voz",
    emoji: "🎧",
    name: "Central Voz IA",
    capacityLabel: "El Monstruo de Voz",
    capacityDesc: "Llamadas autónomas corporativas + 500 min Vapi.",
    price: 599900,
    implFull: 1199900,
    implDiscount: 599900,
    cuota: 149975,
    first4: 599900,
    popular: true, // 🌟 ¡Protagonista absoluto!
  },
  {
    id: "negocio",
    emoji: "💬",
    name: "WhatsApp IA",
    capacityLabel: "Monstruo de Texto 24/7",
    capacityDesc: "Hasta 5.000 chats, catálogos y pagos integrados.",
    price: 399900,
    implFull: 799900,
    implDiscount: 399900,
    cuota: 99975,
    first4: 399900,
  },
  {
    id: "pro",
    emoji: "🚀",
    name: "PRO (Omnicanal)",
    capacityLabel: "Infraestructura Total",
    capacityDesc: "WhatsApp + Voz + Agenda + Analítica Avanzada.",
    price: 899900,
    implFull: 1799900,
    implDiscount: 899900,
    cuota: 224975,
    first4: 899900,
  },
];

// ==========================================
// 2. FUNCIONES Y FEATURE GATING
// ==========================================
const INCLUDED_BASE = [
  "Atención corporativa automatizada 24/7",
  "Toma de pedidos y ventas inteligente",
  "Conexión oficial con Catálogo e Inventario",
  "Soporte técnico prioritario local",
];

const EXTRA_NEGOCIO = [
  "Procesamiento avanzado de Notas de Voz",
  "Lectura de Imágenes y Recibos (PDF)",
  "Pasarela de Pagos integrada (Bold/Nequi)",
  "Cerebro RAG (Memoria unificada)",
];

const EXTRA_VOZ = [
  "Llamadas autónomas (Salientes/Entrantes)",
  "IA con acento natural y ultra baja latencia",
  "Gestión automática de citas médicas",
  "Transcripción y análisis de llamadas"
];

const EXTRA_PRO = [
  "Todo el poder de Texto y Voz",
  "Agenda Inteligente (Google Calendar)",
  "Transferencia a Asesor Humano (Handoff)",
  "Dashboard de Analítica y Telemetría"
];

const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;

// ==========================================
// COMPONENTE PRINCIPAL (LANDING PAGE)
// ==========================================
export default function Home() {
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

  const iniciarPago = async (nombrePlan: string, totalPagar: number) => {
    setProcesandoPago(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: nombrePlan,
          precio: totalPagar,
          descripcion: `Suscripción Upway - Plan ${nombrePlan}`
        })
      });

      const data = await res.json();

      if (!res.ok || !data?.payment_url) {
        const message = data?.message || 'Hubo un error al generar el link de pago. Revisa tu backend.';
        throw new Error(message);
      }

      window.location.assign(data.payment_url);
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión con la pasarela de pagos.");
    } finally {
      setProcesandoPago(false);
    }
  };

  const getImplLabel = (plan: Plan) => {
    if (contract === 1)
      return { main: `+ ${fmt(plan.implFull)}`, sub: "pago único de implementación", strike: null, free: false };
    if (contract === 2)
      return { main: fmt(plan.implDiscount), sub: "Implementación 50% OFF", strike: fmt(plan.implFull), free: false };
    return { main: "GRATIS", sub: "Implementación", strike: fmt(plan.implFull), free: true };
  };

  const steps = ["Diseño de arquitectura", "Configuración de tu Empleado Digital", "Conexión oficial con Meta y pasarelas", "Operación autónoma y escalado"];

  return (
    <main className="min-h-screen bg-[#03050a] text-white selection:bg-cyan-500/30 selection:text-white relative overflow-x-hidden antialiased">
      
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

      {/* ========================================== */}
      {/* NAVEGACIÓN SUPERIOR Y MENÚ MÓVIL */}
      {/* ========================================== */}
      <nav className="fixed w-full top-0 z-[60] border-b border-white/5 bg-black/10 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex max-w-[95rem] items-center justify-between px-6 py-4 lg:px-12">
          <a href="#top" className="flex items-center gap-3">
            <Image src="/upway.png" alt="Logo Upway" width={40} height={40} className="rounded-full object-contain" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-white/90 hidden sm:block">Upway_OS</span>
          </a>

          <div className="hidden items-center gap-8 text-sm text-white/60 md:flex font-mono tracking-wider">
            <a href="#ventajas" className="transition hover:text-cyan-400">/ventajas</a>
            <a href="#planes" className="transition text-cyan-400 hover:text-cyan-300">/planes</a>
            <a href="#proceso" className="transition hover:text-cyan-400">/proceso</a>
            <a href="#contacto" className="transition hover:text-cyan-400">/contacto</a>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {deferredPrompt && (
              <button onClick={instalarApp} className="text-sm font-mono text-[#00D1FF] transition hover:text-white flex items-center gap-2 border border-[#00D1FF]/30 px-3 py-1.5 rounded-full bg-[#00D1FF]/10">
                ↓ Instalar App
              </button>
            )}
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
                <a href="#ventajas" onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white">/ventajas_upway</a>
                <a href="#planes" onClick={() => setIsMobileMenuOpen(false)} className="text-[#00D1FF]">/planes</a>
                <a href="#proceso" onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white">/proceso</a>
                <a href="#contacto" onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white">/contacto</a>
                <div className="h-[1px] bg-white/10 w-full my-2" />
                {deferredPrompt && (
                  <button onClick={() => { instalarApp(); setIsMobileMenuOpen(false); }} className="w-full text-center py-3 rounded-lg border border-[#00D1FF]/40 bg-[#00D1FF]/10 text-[#00D1FF] font-bold">
                    ↓ DESCARGAR APP UPWAY
                  </button>
                )}
                <a href="/login" className="w-full text-center py-3 rounded-lg border border-white/20 bg-white/5 text-white/80">INICIAR SESIÓN</a>
                <a href="/dashboard/bots" className="w-full text-center py-3 rounded-lg bg-[#00D1FF] text-black font-bold shadow-[0_0_15px_rgba(0,209,255,0.4)]">ENTRAR AL PANEL →</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ========================================== */}
      {/* HERO SECTION: SOPHIE V2 */}
      {/* ========================================== */}
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
            <span className="writing-vertical text-[10px] font-mono tracking-[0.3em] text-cyan-300" style={{ writingMode: 'vertical-rl' }}>INICIAR_SISTEMA</span>
          </button>
        </div>

        <div className="absolute bottom-8 left-8 z-20 hidden md:block">
          <div className="flex flex-col gap-1.5 border-l-2 border-cyan-500/50 pl-3">
             <p className="text-[10px] font-mono text-cyan-400 tracking-widest">ESTADO: ONLINE</p>
             <p className="text-[10px] font-mono text-white/50 tracking-widest">MODELO: SOPHIE_V2</p>
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
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span> INTELIGENCIA DE VOZ ACTIVA
                </div>
                <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  La primera inteligencia de voz <br/><span className="text-transparent bg-clip-text bg-gradient-to-l from-cyan-300 to-blue-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">autónoma para empresas.</span>
                </h1>
                <p className="mt-6 text-sm leading-relaxed text-white/90 font-medium drop-shadow-md">
                  Tus clientes no leen chats cuando tienen urgencias, te llaman. Despliega un agente telefónico con la voz de tu marca que responde, confirma citas y perfila clientes 24/7.
                </p>
                <div className="mt-10 flex flex-col gap-4">
                  <button onClick={() => { setIsHudOpen(false); window.dispatchEvent(new Event("abrir-chat")); }} className="group relative flex w-full items-center justify-center gap-3 border border-cyan-400/60 bg-cyan-500/20 px-6 py-4 text-sm font-mono tracking-widest text-cyan-100 backdrop-blur-md transition-all hover:bg-cyan-500 hover:text-slate-950 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                    <Cpu className="h-4 w-4" /> DESPLEGAR AGENTE <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <a href="#planes" onClick={() => setIsHudOpen(false)} className="flex w-full items-center justify-center rounded-none border border-white/20 bg-black/20 px-6 py-4 text-sm font-mono tracking-widest text-white/80 backdrop-blur-md transition hover:bg-white/10 hover:text-white">
                    VER PLANES Y PRECIOS
                  </a>
                </div>
                <div className="mt-auto border-t border-white/20 pt-6">
                  <p className="text-[10px] font-mono text-white/60 tracking-widest drop-shadow-sm">UPWAY BUSINESS // COLOMBIA HQ</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </section>

      {/* ========================================== */}
      {/* VENTAJAS B2B */}
      {/* ========================================== */}
      <section id="ventajas" className="relative py-24 bg-[#0A0E14] border-t border-white/5 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 max-w-[95rem] mx-auto px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 mb-6">
              El poder de la voz corporativa
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Sustituye la fricción operativa con <br className="hidden lg:block"/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">tecnología de alta fiabilidad.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              En sectores exigentes como salud (IPS) e inmobiliarias, las llamadas perdidas cuestan millones. Upway asegura el 100% de la atención telefónica y de chat.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/20 group-hover:scale-110 transition-transform"><span className="text-cyan-400 font-bold text-xl">🛡️</span></div>
              <h3 className="text-xl font-bold text-white mb-3">Cero llamadas perdidas</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Atiende múltiples llamadas simultáneas con acento natural, sin esperas y con integración directa al calendario.</p>
            </div>
            <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-8 shadow-[0_0_30px_rgba(6,182,212,0.1)] group">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6 border border-cyan-500/40 group-hover:scale-110 transition-transform"><span className="text-cyan-400 font-bold text-xl">🎧</span></div>
              <h3 className="text-xl font-bold text-white mb-3">Multimodalidad Nativa</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Combina la Central Telefónica de Voz (Vapi) y el Agente de Texto en WhatsApp bajo un mismo cerebro unificado (RAG).</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform"><span className="text-blue-400 font-bold text-xl">🛠️</span></div>
              <h3 className="text-xl font-bold text-white mb-3">Soporte Local en Colombia</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Ingeniería local disponible para respaldar la operación de tu negocio sin intermediarios extranjeros.</p>
            </div>
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 group">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/40 group-hover:scale-110 transition-transform"><span className="text-emerald-400 font-bold text-xl">⚡</span></div>
              <h3 className="text-xl font-bold text-white mb-3">Despliegue Inmediato</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Conexión oficial con la API Cloud de Meta y pasarelas de pago locales como Bold en minutos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* SECCIÓN DE PRECIOS */}
      {/* ========================================== */}
      <section id="planes" className="relative z-20 py-20 bg-gradient-to-b from-[#0A0E14] to-[#03050a]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] left-[20%] w-[60%] h-[30%] bg-[#00D1FF]/[0.05] blur-[140px] rounded-full" />
        </div>

        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400 mb-4">/precios_upway</p>
            <h2 className="text-4xl font-display font-bold text-white mb-4">La potencia de la voz y el texto,<br/>adaptadas a tu operación corporativa.</h2>
          </div>

          <div className="mb-10 max-w-2xl mx-auto">
            <div className="glass-strong border border-white/10 rounded-[16px] p-1.5 flex flex-col sm:flex-row gap-1.5">
              <button onClick={() => setContract(1)} className={`flex-1 text-left rounded-[12px] px-4 py-3.5 transition-all border ${contract === 1 ? "bg-white text-black border-white shadow-[0_4px_20px_rgba(255,255,255,0.15)]" : "bg-transparent text-white/60 border-transparent hover:bg-white/[0.05] hover:text-white/90"}`}>
                <div className="font-display text-[13px] font-semibold tracking-tight">Sin permanencia</div>
                <div className={`font-body text-[12px] mt-1 leading-snug ${contract === 1 ? "text-black/60" : "text-white/40"}`}>Implementación completa + mensual</div>
              </button>
              <button onClick={() => setContract(2)} className={`flex-1 text-left rounded-[12px] px-4 py-3.5 transition-all border relative overflow-hidden ${contract === 2 ? "bg-[#00D1FF] text-black border-[#00D1FF] shadow-[0_8px_32px_rgba(0,209,255,0.35)]" : "bg-transparent text-white/60 border-transparent hover:bg-white/[0.05] hover:text-white/90"}`}>
                {contract === 2 && <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent pointer-events-none" />}
                <div className="relative flex items-center gap-2">
                  <span className="font-display text-[13px] font-bold tracking-tight">12 meses</span>
                  <span className={`font-body text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${contract === 2 ? "bg-black text-[#00D1FF]" : "bg-[#00D1FF] text-black"}`}>RECOMENDADO</span>
                </div>
                <div className={`relative font-body text-[12px] mt-1 leading-snug ${contract === 2 ? "text-black/70" : "text-white/40"}`}>50% OFF impl. + 4 cuotas</div>
              </button>
              <button onClick={() => setContract(3)} className={`flex-1 text-left rounded-[12px] px-4 py-3.5 transition-all border ${contract === 3 ? "bg-white text-black border-white shadow-[0_4px_20px_rgba(255,255,255,0.15)]" : "bg-transparent text-white/60 border-transparent hover:bg-white/[0.05] hover:text-white/90"}`}>
                <div className="font-display text-[13px] font-semibold tracking-tight">Prepago anual</div>
                <div className={`font-body text-[12px] mt-1 leading-snug ${contract === 3 ? "text-black/60" : "text-white/40"}`}>Implementación GRATIS</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-12">
            {PLANS.map((plan) => {
              const impl = getImplLabel(plan);
              return (
                <div key={plan.id} className={`relative rounded-[24px] border p-[1px] group transition-all duration-300 ${plan.popular ? "border-[#00D1FF]/35 shadow-[0_0_80px_rgba(0,209,255,0.18)]" : "border-white/10 hover:border-white/[0.14]"}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <div className="font-display text-[10px] font-bold tracking-[0.12em] bg-[#00D1FF] text-black px-3.5 py-1 rounded-full shadow-[0_0_20px_rgba(0,209,255,0.6)]">MÁS POPULAR</div>
                    </div>
                  )}
                  <div className={`relative rounded-[23px] glass h-full p-6 flex flex-col ${plan.popular ? "bg-gradient-to-b from-[#00D1FF]/[0.07] to-white/[0.02]" : ""}`}>
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[20px]">{plan.emoji}</span>
                        <span className="font-display text-[16px] font-bold tracking-tight">{plan.name}</span>
                      </div>
                      <div className={`font-body text-[10.5px] font-semibold px-2.5 py-1 rounded-full border tracking-wide ${impl.free ? "bg-[#00D1FF] text-black border-[#00D1FF]" : "bg-white/[0.06] border-white/10 text-white/55"}`}>{impl.sub}</div>
                    </div>

                    <div className="mb-5">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-[32px] font-bold tracking-[-0.03em] leading-none">{fmt(plan.price)}</span>
                        <span className="font-body text-[13px] text-white/40 font-medium">/ mes</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`font-display text-[13px] font-semibold tracking-tight ${impl.free ? "text-[#00D1FF]" : "text-white/90"}`}>{impl.main}</span>
                        {impl.strike && <span className="font-body text-[11px] text-white/25 line-through">{impl.strike}</span>}
                      </div>
                    </div>

                    <div className="mb-5">
                      <div className="font-body text-[10px] font-semibold tracking-[0.16em] uppercase text-white/30 mb-1.5">Capacidad incluida</div>
                      <div className="font-display text-[13.5px] font-semibold text-white/90 leading-tight">{plan.capacityLabel}</div>
                      <div className="font-body text-[12.5px] text-white/50 mt-1 leading-snug">{plan.capacityDesc}</div>
                    </div>

                    <div className="h-[1px] bg-gradient-to-r from-white/10 to-transparent mb-5" />

                    <div className="mb-6">
                      <div className="font-body text-[10px] font-semibold tracking-[0.16em] uppercase text-white/30 mb-3">Incluye empleado digital</div>
                      
                      <div className="space-y-2">
                        {INCLUDED_BASE.map((feat) => (
                          <div key={feat} className="flex items-center gap-2.5 font-body text-[13px] text-white/70 leading-snug">
                            <div className="w-[18px] h-[18px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <div className="w-[5px] h-[5px] rounded-full bg-white/50" />
                            </div>
                            {feat}
                          </div>
                        ))}
                        
                        {plan.id === "emprendedor" && (
                          <div className="flex items-center gap-2.5 font-body text-[13px] text-red-400/80 leading-snug mt-2">
                             <div className="w-[18px] h-[18px] rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-[10px]">✕</div>
                             Limitado a solo texto (Sin audios / sin voz)
                          </div>
                        )}
                      </div>

                      {(plan.id === "negocio" || plan.id === "pro") && (
                        <div className="mt-5">
                          <div className="font-body text-[10px] font-bold tracking-[0.14em] uppercase mb-2.5 text-[#00D1FF]/90">+ Capacidades de Texto</div>
                          <div className="space-y-1.5">
                            {EXTRA_NEGOCIO.map((e) => (
                              <div key={e} className="flex gap-2 font-body text-[12px] text-white/70 leading-snug">
                                <span className="text-[#00D1FF]/60">•</span> {e}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(plan.id === "voz" || plan.id === "pro") && (
                        <div className="mt-5">
                          <div className="font-body text-[10px] font-bold tracking-[0.14em] uppercase mb-2.5 text-cyan-400">+ Potencia de Voz (Vapi)</div>
                          <div className="space-y-1.5">
                            {EXTRA_VOZ.map((e) => (
                              <div key={e} className="flex gap-2 font-body text-[12px] text-white/70 leading-snug">
                                <span className="text-cyan-400/60">•</span> {e}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {plan.id === "pro" && (
                        <div className="mt-5">
                          <div className="font-body text-[10px] font-bold tracking-[0.14em] uppercase text-[#00D1FF] mb-2.5">+ Nivel Corporativo Máximo</div>
                          <div className="space-y-1.5">
                            {EXTRA_PRO.map((e) => (
                              <div key={e} className="flex gap-2 font-body text-[12.5px] text-[#00D1FF] font-medium leading-snug">
                                <span className="text-[#00D1FF] drop-shadow-[0_0_5px_rgba(0,209,255,0.8)]">✦</span> {e}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-2">
                      <button onClick={() => setCheckoutPlan(plan)} className="w-full h-[46px] rounded-[12px] bg-[#00D1FF] text-black font-display font-bold text-[14px] tracking-tight hover:bg-[#33DDFF] transition-colors shadow-[0_0_28px_rgba(0,209,255,0.35)] flex items-center justify-center gap-2">
                        Elegir {plan.name} <span className="text-[16px] font-medium">→</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* PROCESO Y FOOTER */}
      {/* ========================================== */}
      <section id="proceso" className="relative border-t border-white/5 bg-[#03050a]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
          <div className="max-w-3xl"><p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">/02_proceso</p><h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Implementación corporativa sin fricciones.</h2></div>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 relative overflow-hidden group">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-sm font-mono text-cyan-400">0{index + 1}</div>
                <p className="mt-4 text-lg font-semibold text-white">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" className="relative border-t border-white/5 bg-[#03050a]">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-24 lg:flex-row lg:items-end lg:justify-between lg:px-12">
          <div className="max-w-2xl"><p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">/03_contacto</p><h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Eleva el nivel tecnológico de tu organización hoy.</h2></div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur shadow-2xl">
            <button onClick={() => window.dispatchEvent(new Event("abrir-chat"))} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
              Agendar asesoría técnica <ArrowRight className="h-4 w-4" />
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

      {/* ========================================== */}
      {/* MODAL DE CHECKOUT (BOLD) */}
      {/* ========================================== */}
      <AnimatePresence>
        {checkoutPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !procesandoPago && setCheckoutPlan(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-[#0A0E14] border border-[#00D1FF]/30 rounded-[24px] shadow-[0_0_50px_rgba(0,209,255,0.15)] overflow-hidden z-10">
              <button disabled={procesandoPago} onClick={() => setCheckoutPlan(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50">✕</button>
              
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[28px]">{checkoutPlan.emoji}</span>
                  <div>
                    <h3 className="font-display text-[18px] font-bold text-white">Plan {checkoutPlan.name}</h3>
                    <p className="font-body text-[12px] text-white/50">Activación de infraestructura corporativa</p>
                  </div>
                </div>

                {(() => {
                  const valorImplementacion = contract === 2 ? checkoutPlan.cuota : contract === 3 ? 0 : checkoutPlan.implFull;
                  const totalApagar = checkoutPlan.price + valorImplementacion;

                  return (
                    <>
                      <div className="glass rounded-[16px] p-4 mb-6 border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-body text-[13px] text-white/70">Mensualidad Infraestructura</span>
                          <span className="font-display text-[14px] font-semibold">{fmt(checkoutPlan.price)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-body text-[13px] text-white/70">
                            {contract === 2 ? "Implementación (Cuota 1/4)" : contract === 3 ? "Implementación (Gratis)" : "Implementación (Full)"}
                          </span>
                          <span className="font-display text-[14px] font-semibold text-[#00D1FF]">
                            {contract === 3 ? "$0" : fmt(valorImplementacion)}
                          </span>
                        </div>
                        <div className="h-[1px] bg-white/10 w-full my-3" />
                        <div className="flex justify-between items-center">
                          <span className="font-display font-bold text-[14px] text-white">Total a pagar hoy</span>
                          <span className="font-display font-bold text-[20px] text-white">{fmt(totalApagar)}</span>
                        </div>
                      </div>

                      <button onClick={() => iniciarPago(checkoutPlan.name, totalApagar)} disabled={procesandoPago} className="w-full h-[50px] rounded-[12px] bg-gradient-to-r from-[#FF424D] to-[#FF6B74] text-white font-display font-bold text-[15px] hover:shadow-[0_0_20px_rgba(255,66,77,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                        {procesandoPago ? 'Conectando con Bold...' : '🔒 Pagar de forma segura con Bold'}
                      </button>
                    </>
                  );
                })()}

                <p className="text-center font-body text-[10px] text-white/30 mt-4">Transacción segura procesada mediante pasarela Bold.</p>
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