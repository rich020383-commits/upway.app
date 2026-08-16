"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Cpu,
  Menu,
  X,
  ShieldCheck,
  CheckCircle,
  Info
} from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import LeadModal from "@/components/LeadModal";

// ==========================================
// TIPOS Y DATOS DE LOS PLANES (High-Ticket B2B)
// ==========================================
type ContractOption = 1 | 2 | 3;
type PlanId = "emprendedor" | "negocio" | "voz" | "pro";

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
// 1. PLANES (Reestructuración Ejecutiva)
// ==========================================
const PLANS: Plan[] = [
  {
    id: "emprendedor",
    emoji: "🏪",
    name: "PYME",
    capacityLabel: "Tu vendedor digital de WhatsApp",
    capacityDesc: "WhatsApp inteligente para tiendas, salones y negocios de barrio.",
    price: 249900,
    implFull: 499900,
    implDiscount: 249900,
    cuota: 62475,
    first4: 249900,
  },
  {
    id: "negocio",
    emoji: "💬",
    name: "Ejecutivo de Chat",
    capacityLabel: "Atención Masiva 24/7",
    capacityDesc: "Atención masiva por WhatsApp con memoria, pagos y reportes.",
    price: 399900,
    implFull: 799900,
    implDiscount: 399900,
    cuota: 99975,
    first4: 399900,
  },
  {
    id: "voz",
    emoji: "🎧",
    name: "Ejecutivo de Voz",
    capacityLabel: "El Poder de la Voz IA",
    capacityDesc: "Llamadas autónomas con acento natural y análisis de conversaciones.",
    price: 599900,
    implFull: 1199900,
    implDiscount: 599900,
    cuota: 149975,
    first4: 599900,
    popular: true, 
  },
  {
    id: "pro",
    emoji: "🚀",
    name: "Director Omnicanal",
    capacityLabel: "Infraestructura Total",
    capacityDesc: "Voz, texto, agenda y analítica avanzada para operaciones corporativas.",
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
  "Soporte técnico inmediato en Colombia",
  "Reporte de ventas y conversaciones",
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
      return { main: `+ ${fmt(plan.implFull)}`, sub: "Implementación según plan", strike: null, free: false };
    if (contract === 2)
      return { main: fmt(plan.implDiscount), sub: "Implementación 50% OFF", strike: fmt(plan.implFull), free: false };
    return { main: "GRATIS", sub: "Implementación incluida", strike: fmt(plan.implFull), free: true };
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
                  Hola, soy Sophie V2, la <br/><span className="text-transparent bg-clip-text bg-gradient-to-l from-cyan-300 to-blue-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">empleada digital de UpWay.</span>
                </h1>
                <p className="mt-6 text-sm leading-relaxed text-white/90 font-medium drop-shadow-md">
                  Estoy aquí para atenderte. ¿Quieres que una como yo trabaje para tu empresa? No nos cuentes. Habla conmigo ahora mismo y juzga tú mismo el nivel de la tecnología.
                </p>
                <div className="mt-10 flex flex-col gap-4">
                  <button onClick={() => { setIsHudOpen(false); window.dispatchEvent(new Event("abrir-chat")); }} className="group relative flex w-full items-center justify-center gap-3 border border-[#00D1FF]/60 bg-[#00D1FF]/20 px-6 py-4 text-sm font-display font-bold tracking-widest text-[#00D1FF] backdrop-blur-md transition-all hover:bg-[#00D1FF] hover:text-slate-950 hover:shadow-[0_0_30px_rgba(0,209,255,0.6)]">
                    <Cpu className="h-4 w-4" /> PROBAR AGENTE GRATIS <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <a href="#planes" onClick={() => setIsHudOpen(false)} className="flex w-full items-center justify-center rounded-none border border-white/20 bg-black/20 px-6 py-4 text-sm font-mono tracking-widest text-white/80 backdrop-blur-md transition hover:bg-white/10 hover:text-white">
                    VER PLANES Y PRECIOS
                  </a>
                </div>

                <div className="mt-6 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-200/80 leading-relaxed font-body">
                    <strong>Aclaración importante:</strong> Configura un empleado digital de demostración y vive la experiencia aquí en la web. La conexión con tu WhatsApp real se realiza únicamente después de contratar un plan.
                  </p>
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
      {/* EL EMPLEADO DIGITAL (NUEVAS VENTAJAS B2B) */}
      {/* ========================================== */}
      <section id="ventajas" className="relative py-32 bg-[#0A0E14] border-t border-white/5 overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00D1FF]/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-[95rem] mx-auto px-6 lg:px-12">
          
          <div className="text-center max-w-4xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-bold text-red-400 mb-6 tracking-widest uppercase">
              Tu empresa merece algo más que un chatbot
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
              No es un bot de respuestas. <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D1FF] to-blue-500">Es tu Empleado Digital.</span>
            </h2>
            <p className="text-xl text-slate-300 font-medium tracking-wide">
              Habla. Escucha. Entiende. Atiende. Ejecuta.
            </p>
            <p className="mt-4 text-slate-400 text-lg leading-relaxed max-w-3xl mx-auto">
              Una IA conversacional diseñada para trabajar junto a tu empresa 24/7, atender clientes, gestionar solicitudes y ejecutar procesos con precisión milimétrica.
            </p>
          </div>

          {/* BENTO GRID DE CARACTERÍSTICAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            {/* 1. EL PROTAGONISTA: LA VOZ Y LA INTERRUPCIÓN (Ocupa 2 columnas) */}
            <div className="md:col-span-2 rounded-[32px] border border-[#00D1FF]/30 bg-gradient-to-br from-[#00D1FF]/10 to-transparent p-8 md:p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                <svg className="w-32 h-32 text-[#00D1FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <div className="relative z-10">
                <div className="inline-block px-3 py-1 bg-[#00D1FF]/20 border border-[#00D1FF]/30 text-[#00D1FF] rounded-lg text-xs font-bold font-mono mb-6">🎙️ TECNOLOGÍA DE VOZ AUTÓNOMA</div>
                <h3 className="text-3xl font-display font-bold text-white mb-4">También puede hablar (y escuchar)</h3>
                <p className="text-slate-300 text-lg leading-relaxed mb-6 max-w-xl">
                  Tu cliente llama. Tu Empleado Digital responde con una <strong>voz colombiana natural</strong> y una experiencia conversacional fluida. Cero menús robóticos.
                </p>
                
                {/* El super diferenciador */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md max-w-xl border-l-4 border-l-[#00D1FF]">
                  <p className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00D1FF] animate-pulse"></span>
                    Interrupción Inteligente (Barge-in)
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Si el agente está hablando y el cliente lo interrumpe, <strong>la IA se calla inmediatamente, escucha el nuevo contexto y adapta su respuesta al instante.</strong> Una experiencia diseñada para sentirse idéntica a hablar con un humano real.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. CONTEXTO Y NOTAS DE VOZ */}
            <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-all flex flex-col justify-center">
              <div className="h-14 w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Entiende el Contexto</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                No se trata solo de responder mensajes. Mantiene el hilo de la conversación y utiliza la información previa para ofrecer respuestas relevantes.
              </p>
              <h4 className="font-bold text-white mb-2 text-sm">Escucha Audios</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Tus clientes no tienen que escribir. El sistema procesa notas de voz kilométricas, las entiende y continúa la conversación con total naturalidad.
              </p>
            </div>

            {/* 3. CONVERSACIONES FLUIDAS */}
            <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-all">
              <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Conversaciones Fluidas</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Olvídate de los menús rígidos y las reglas mecánicas. Tu Empleado Digital responde de forma natural para ofrecer una experiencia cercana, rápida y altamente personalizada por WhatsApp o Web.
              </p>
            </div>

            {/* 4. LA LISTA DE TRABAJO (Ocupa 2 columnas) */}
            <div className="md:col-span-2 rounded-[32px] border border-white/10 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-[#00D1FF]/10 flex items-center justify-center border border-[#00D1FF]/20">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-2xl font-display font-bold text-white">Más que responder: Trabaja</h3>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8 mt-6">
                {[
                  "Atender clientes 24/7 sin descanso",
                  "Consultar catálogo e inventario en tiempo real",
                  "Gestionar reservas y agenda (Calendario)",
                  "Integrarse con pasarelas de pago y sistemas",
                  "Tomar pedidos y automatizar ventas",
                  "Transferir a un asesor humano cuando sea necesario"
                ].map((task, i) => (
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

          <div className="mt-16 text-center">
            <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium">
              Mientras tu equipo se concentra en tareas de alto valor que requieren intervención humana real, tu <strong className="text-white">Empleado Digital</strong> se encarga del 80% de la operación automatizable.
            </p>
          </div>

        </div>
      </section>

      {/* ========================================== */}
      {/* SECCIÓN DE PRECIOS Y TRANSPARENCIA */}
      {/* ========================================== */}
      <section id="planes" className="relative z-20 py-24 bg-gradient-to-b from-[#0A0E14] to-[#03050a]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] left-[20%] w-[60%] h-[30%] bg-[#00D1FF]/[0.05] blur-[140px] rounded-full" />
        </div>

        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400 mb-4">/precios_upway</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
              Contrata a tu ejecutivo digital desde $249.900/mes.
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto font-medium">
              Nunca más pierdas una venta por una llamada o mensaje no atendido.
            </p>
          </div>

          {/* 🛡️ TRANSPARENCIA UPWAY Y GARANTÍA */}
          <div className="max-w-5xl mx-auto mb-16 grid md:grid-cols-2 gap-6">
            
            {/* Tarjeta 1: Claridad */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <h3 className="font-display font-bold text-xl text-white mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#00D1FF]/10 flex items-center justify-center text-[#00D1FF]">⚖️</span>
                Claridad antes de que contrates
              </h3>
              <div className="space-y-4 font-body text-sm text-slate-300">
                <div className="flex gap-3"><CheckCircle className="h-5 w-5 text-[#00D1FF] shrink-0" /> <p><strong>Hacemos:</strong> Tecnología que atiende 24/7, memoria avanzada, voz natural, soporte técnico inmediato en Colombia.</p></div>
                <div className="flex gap-3"><CheckCircle className="h-5 w-5 text-[#00D1FF] shrink-0" /> <p><strong>Garantizamos:</strong> Que nunca más perderás un cliente por no atenderlo a tiempo.</p></div>
                <div className="flex gap-3 opacity-60"><X className="h-5 w-5 text-slate-500 shrink-0" /> <p><strong>No hacemos:</strong> Marketing, promesas mágicas de ventas o publicidad. Eso depende de tu producto y estrategia.</p></div>
              </div>
            </div>

            {/* Tarjeta 2: Garantía con Exclusiones */}
            <div className="bg-[#00D1FF]/5 border border-[#00D1FF]/20 rounded-3xl p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(0,209,255,0.05)] flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-3">
                  <ShieldCheck className="h-8 w-8 text-[#00D1FF]" />
                  Garantía de Funcionamiento
                </h3>
                <p className="font-body text-[13px] text-slate-300 mb-4 leading-relaxed">
                  Garantizamos un uptime del 99.5%. Si por un fallo <strong>exclusivo de nuestra infraestructura</strong> el servicio se interrumpe por más de 4 horas continuas, te acreditamos el 10% de tu mensualidad (50% si supera las 24 horas).
                </p>
              </div>
              
              <div className="bg-black/30 border border-white/5 rounded-xl p-4 mt-2">
                <p className="font-body text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-white/80">Exclusiones:</strong> No aplica por mantenimientos programados, fallos de tu conectividad, bloqueos por mal uso, ni por caídas de plataformas de terceros (Meta, WhatsApp, Vapi, Bold, Nequi). La implementación es un servicio dedicado y no es reembolsable.
                </p>
              </div>
            </div>

          </div>
          {/* AQUI TERMINA EL BLOQUE DE TRANSPARENCIA Y GARANTÍA */}

          {/* TOGGLE DE PAGO */}
          <div className="mb-12 max-w-3xl mx-auto">
            <div className="glass-strong border border-white/10 rounded-[16px] p-1.5 flex flex-col sm:flex-row gap-1.5">
              <button onClick={() => setContract(1)} className={`flex-1 text-left rounded-[12px] px-4 py-3.5 transition-all border ${contract === 1 ? "bg-white text-black border-white shadow-[0_4px_20px_rgba(255,255,255,0.15)]" : "bg-transparent text-white/60 border-transparent hover:bg-white/[0.05] hover:text-white/90"}`}>
                <div className="font-display text-[13px] font-semibold tracking-tight">Mensual (Sin permanencia)</div>
                <div className={`font-body text-[12px] mt-1 leading-snug ${contract === 1 ? "text-black/60" : "text-white/40"}`}>Implementación según plan</div>
              </button>
              <button onClick={() => setContract(2)} className={`flex-1 text-left rounded-[12px] px-4 py-3.5 transition-all border relative overflow-hidden ${contract === 2 ? "bg-[#00D1FF] text-black border-[#00D1FF] shadow-[0_8px_32px_rgba(0,209,255,0.35)]" : "bg-transparent text-white/60 border-transparent hover:bg-white/[0.05] hover:text-white/90"}`}>
                {contract === 2 && <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent pointer-events-none" />}
                <div className="relative flex items-center gap-2">
                  <span className="font-display text-[13px] font-bold tracking-tight">12 meses</span>
                  <span className={`font-body text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${contract === 2 ? "bg-black text-[#00D1FF]" : "bg-[#00D1FF] text-black"}`}>RECOMENDADO</span>
                </div>
                <div className={`relative font-body text-[12px] mt-1 leading-snug ${contract === 2 ? "text-black/70" : "text-white/40"}`}>Implementación 50% OFF</div>
              </button>
              <button onClick={() => setContract(3)} className={`flex-1 text-left rounded-[12px] px-4 py-3.5 transition-all border ${contract === 3 ? "bg-white text-black border-white shadow-[0_4px_20px_rgba(255,255,255,0.15)]" : "bg-transparent text-white/60 border-transparent hover:bg-white/[0.05] hover:text-white/90"}`}>
                <div className="font-display text-[13px] font-semibold tracking-tight">Prepago Anual</div>
                <div className={`font-body text-[12px] mt-1 leading-snug ${contract === 3 ? "text-black/60" : "text-white/40"}`}>Implementación INCLUIDA (Mayor ahorro)</div>
              </button>
            </div>
          </div>

          {/* GUÍA DE ELECCIÓN */}
          <div className="max-w-4xl mx-auto mb-12 flex flex-wrap justify-center gap-3">
            <div className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs font-mono text-white/70">¿Solo tienes WhatsApp y quieres vender más? → <strong className="text-white">PYME</strong></div>
            <div className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs font-mono text-white/70">¿Atiendes más de 50 chats al día? → <strong className="text-[#00D1FF]">Ejecutivo de Chat</strong></div>
            <div className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs font-mono text-white/70">¿Te llaman por teléfono y pierdes citas? → <strong className="text-[#00D1FF]">Ejecutivo de Voz</strong></div>
            <div className="bg-[#00D1FF]/10 border border-[#00D1FF]/30 rounded-full px-4 py-2 text-xs font-mono text-[#00D1FF]">¿Quieres todo integrado con reportes avanzados? → <strong className="text-white">Director Omnicanal</strong></div>
          </div>

          {/* TABLA DE PRECIOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-12">
            {PLANS.map((plan) => {
              const impl = getImplLabel(plan);
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
                        <span className="font-display text-[32px] font-bold tracking-[-0.03em] leading-none">{fmt(plan.price)}</span>
                        <span className="font-body text-[13px] text-white/40 font-medium">/ mes</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`font-display text-[13px] font-semibold tracking-tight ${impl.free ? "text-[#00D1FF]" : "text-white/90"}`}>{impl.main}</span>
                        {impl.strike && <span className="font-body text-[11px] text-white/25 line-through">{impl.strike}</span>}
                      </div>
                      <div className="font-body text-[10.5px] font-semibold mt-1.5 text-white/40">{impl.sub}</div>
                    </div>

                    <div className="mb-5">
                      <div className="font-body text-[10px] font-semibold tracking-[0.16em] uppercase text-[#00D1FF]/70 mb-1.5">Capacidad</div>
                      <div className="font-display text-[13.5px] font-semibold text-white/90 leading-tight">{plan.capacityLabel}</div>
                      <div className="font-body text-[12.5px] text-white/50 mt-1 leading-snug">{plan.capacityDesc}</div>
                    </div>

                    <div className="h-[1px] bg-gradient-to-r from-white/10 to-transparent mb-5" />

                    <div className="mb-6 flex-1">
                      <div className="font-body text-[10px] font-semibold tracking-[0.16em] uppercase text-white/30 mb-3">Incluye empleado digital</div>
                      
                      <div className="space-y-2">
                        {INCLUDED_BASE.map((feat) => (
                          <div key={feat} className="flex items-center gap-2.5 font-body text-[13px] text-white/70 leading-snug">
                            <CheckCircle className="w-[16px] h-[16px] text-[#00D1FF] shrink-0" />
                            {feat}
                          </div>
                        ))}
                      </div>

                      {(plan.id === "negocio" || plan.id === "pro") && (
                        <div className="mt-5">
                          <div className="font-body text-[10px] font-bold tracking-[0.14em] uppercase mb-2.5 text-[#00D1FF]/90">+ Capacidades de Texto</div>
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
                          <div className="font-body text-[10px] font-bold tracking-[0.14em] uppercase mb-2.5 text-[#00D1FF]">+ Potencia de Voz (Vapi)</div>
                          <div className="space-y-1.5">
                            {EXTRA_VOZ.map((e) => (
                              <div key={e} className="flex gap-2 font-body text-[12px] text-white/70 leading-snug">
                                <CheckCircle className="w-[14px] h-[14px] text-[#00D1FF]/70 shrink-0" /> {e}
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

                    <div className="mt-auto pt-4 border-t border-white/5">
                      <button onClick={() => setCheckoutPlan(plan)} className="w-full h-[46px] rounded-[12px] bg-[#00D1FF] text-black font-display font-bold text-[14px] tracking-tight hover:bg-[#33DDFF] transition-colors shadow-[0_0_28px_rgba(0,209,255,0.35)] flex items-center justify-center gap-2">
                        Quiero automatizar mis ventas <span className="text-[16px] font-medium">→</span>
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
      {/* PROCESO Y FOOTER (B2B OPTIMIZED) */}
      {/* ========================================== */}
      <section id="proceso" className="relative border-t border-white/5 bg-[#03050a] overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#00D1FF]/[0.03] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-[95rem] px-6 py-24 lg:px-12">
          <div className="max-w-3xl mb-16">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-[#00D1FF] mb-4">/02_onboarding</p>
            <h2 className="text-3xl font-display font-bold text-white sm:text-4xl tracking-tight">
              Implementación corporativa en <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D1FF] to-blue-500">4 pasos exactos.</span>
            </h2>
            <p className="mt-4 text-slate-400 text-lg">Un proceso de ingeniería estructurado para que tu operación no se detenga mientras hacemos la transición a la IA.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Auditoría de Arquitectura", desc: "Mapeamos tus procesos, embudos y base de conocimientos para diseñar el 'cerebro' ideal de tu IA." },
              { title: "Entrenamiento (RAG)", desc: "Inyectamos tus catálogos, PDFs y reglas de negocio para evitar 'alucinaciones' y asegurar precisión." },
              { title: "Despliegue Oficial", desc: "Conexión segura de infraestructura con WhatsApp Cloud API (Meta) y Centrales de Voz Vapi." },
              { title: "Operación Autónoma", desc: "Tu agente asume el control 24/7. Monitorea métricas y respuestas desde tu Dashboard en tiempo real." }
            ].map((step, index) => (
              <div key={step.title} className="rounded-[24px] border border-white/10 bg-white/[0.02] p-8 relative overflow-hidden group transition-all hover:bg-white/[0.04] hover:border-[#00D1FF]/30">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] font-display text-8xl font-bold text-white group-hover:text-[#00D1FF] group-hover:opacity-10 transition-all">
                  {index + 1}
                </div>
                
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00D1FF]/10 text-lg font-mono font-bold text-[#00D1FF] mb-6 shadow-[0_0_20px_rgba(0,209,255,0.15)] group-hover:scale-110 transition-transform">
                  0{index + 1}
                </div>
                <h3 className="mt-4 text-xl font-bold text-white mb-3">{step.title}</h3>
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
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 mb-6">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> El costo de inacción es alto
            </div>
            <h2 className="text-4xl font-display font-bold text-white sm:text-5xl tracking-tight mb-6">
              No pierdas más clientes por <br className="hidden md:block"/>falta de atención inmediata.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Tus competidores ya están automatizando sus canales. Agenda una auditoría de infraestructura hoy mismo y descubre el ROI exacto de implementar nuestra tecnología en tu empresa.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 md:p-10 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center lg:min-w-[420px]">
            <p className="text-sm font-semibold text-white/70 mb-6 uppercase tracking-widest">Habla con un Ingeniero</p>
            <button onClick={() => window.dispatchEvent(new Event("abrir-chat"))} className="w-full h-[56px] rounded-[16px] bg-[#00D1FF] text-black font-display font-bold text-[16px] tracking-tight hover:bg-[#33DDFF] hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(0,209,255,0.4)] flex items-center justify-center gap-3">
              Automatizar mi operación hoy <ArrowRight className="h-5 w-5" />
            </button>
            <button onClick={() => window.dispatchEvent(new Event("abrir-chat"))} className="mt-4 text-[12px] font-semibold text-white/40 hover:text-white transition-colors underline decoration-white/20 underline-offset-4">
              Mantener mi operación manual
            </button>
            <p className="text-[11px] text-slate-500 mt-6 flex items-center justify-center gap-1.5 border-t border-white/10 pt-4 w-full">
              <ShieldCheck className="h-3.5 w-3.5 text-[#00D1FF]/70" /> Análisis de viabilidad 100% gratuito.
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
              <span className="text-[10px] font-mono text-white/40">Powered by Barakah Tech Hub S.A.S.</span>
            </div>
          </div>

          <div className="flex gap-8 text-[11px] font-mono tracking-widest text-white/40">
            <a href="/terminos" className="hover:text-[#00D1FF] transition-colors uppercase">Términos de Servicio</a>
            {/* Como la Ley 1581 está en el numeral 04 de los términos, lo enviamos allí mismo por ahora */}
            <a href="/terminos" className="hover:text-[#00D1FF] transition-colors uppercase">Privacidad (Ley 1581)</a>
          </div>

          <p className="text-[10px] font-mono text-white/30">© 2026 UPWAY BUSINESS. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

      {/* ========================================== */}
      {/* STICKY CTA (MÓVIL) */}
      {/* ========================================== */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 p-4 bg-[#0A0E14]/90 backdrop-blur-xl border-t border-white/10">
        <button onClick={() => window.dispatchEvent(new Event("abrir-chat"))} className="w-full h-[50px] rounded-[14px] bg-[#00D1FF] text-black font-display font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,209,255,0.3)]">
           Probar gratis con Sophie V2 <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* ========================================== */}
      {/* MODAL DE CHECKOUT (BOLD) */}
      {/* ========================================== */}
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