"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Terminal, Cpu, Activity, Zap, ShieldCheck } from "lucide-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  
  const [messages, setMessages] = useState([
    { role: "bot", content: "🧠 PROTOCOLO DE INICIO COMPLETO. Soy Sophie, Inteligencia Artificial de Upway. Analizo procesos, automatizo operaciones y escalo ventas. ¿Qué directriz o consulta tienes para tu negocio hoy?" }
  ]);
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const escucharBoton = () => {
      setIsOpen(true); 
    };
    window.addEventListener('abrir-chat', escucharBoton);
    return () => window.removeEventListener('abrir-chat', escucharBoton);
  }, []);

  // 🔥 NUEVA FUNCIÓN: Cierre a prueba de balas
  const cerrarChat = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Evita que otros elementos bloqueen el clic
    setIsOpen(false);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage]; 
    setMessages(updatedMessages); 
    setInput("");
    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://upway.business";
      const res = await fetch(`${baseUrl}/api/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }), 
      });
      const data = await res.json();
      
      const organicDelay = Math.floor(Math.random() * 1000) + 1000;
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
        setIsLoading(false);
      }, organicDelay);

    } catch (error) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "bot", content: "⚠️ ERROR DE SISTEMA: Interrupción en la red neuronal. Intenta enviar el comando nuevamente." }]);
        setIsLoading(false);
      }, 1500);
    }
  };

  return (
    <>
      {/* BOTÓN FLOTANTE */}
      <motion.button 
        animate={{ 
          boxShadow: isOpen 
            ? "0px 0px 0px rgba(0,0,0,0)" 
            : ["0px 0px 15px rgba(0,209,255,0.4)", "0px 0px 30px rgba(0,209,255,0.8)", "0px 0px 15px rgba(0,209,255,0.4)"]
        }}
        transition={{ duration: 2, repeat: isOpen ? 0 : Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full border border-[#00D1FF]/50 backdrop-blur-md transition-all z-[999] flex items-center justify-center overflow-hidden ${
          isOpen ? 'bg-[#0A0E14] text-white opacity-0 pointer-events-none' : 'bg-[#00D1FF]/10 text-[#00D1FF]'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[#00D1FF]/20 to-transparent pointer-events-none" />
        <Terminal className="w-6 h-6 relative z-10" />
      </motion.button>

      {/* PANEL DE COMANDO SOPHIE V2 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed bottom-6 right-6 w-[360px] md:w-[420px] h-[600px] bg-[#0A0E14]/90 backdrop-blur-2xl rounded-2xl shadow-[0_0_50px_rgba(0,209,255,0.15)] border border-[#00D1FF]/20 z-[1000] flex flex-col overflow-hidden ring-1 ring-white/5"
          >
            {/* CABECERA (HUD TECH) */}
            <div className="bg-[#03050a]/80 p-4 border-b border-[#00D1FF]/20 flex items-center justify-between shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,209,255,0.05)_50%)] bg-[length:100%_4px] pointer-events-none" />
              
              <div className="flex items-center gap-4 relative z-10">
                {/* NÚCLEO DE SOPHIE (Visualizador) */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: isLoading ? 360 : 0, scale: isLoading ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border border-[#00D1FF]/30 border-t-[#00D1FF] border-b-[#00D1FF]"
                  />
                  <motion.div
                    animate={{ rotate: isLoading ? -360 : 0 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 rounded-full border border-blue-500/30 border-l-blue-500 border-r-blue-500"
                  />
                  <div className={`w-4 h-4 rounded-full transition-all duration-300 ${isLoading ? 'bg-cyan-300 shadow-[0_0_15px_rgba(103,232,249,1)]' : 'bg-[#00D1FF] shadow-[0_0_10px_rgba(0,209,255,0.6)]'}`} />
                </div>

                <div>
                  <h3 className="font-display font-bold text-[14px] text-white tracking-wide flex items-center gap-1.5">
                    SOPHIE_V2 <ShieldCheck className="w-3.5 h-3.5 text-[#00D1FF]" />
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[9px] font-mono text-[#00D1FF]/70 uppercase tracking-widest">
                      <Cpu className="w-3 h-3" /> {isLoading ? "98%" : "12%"}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-mono text-[#00D1FF]/70 uppercase tracking-widest">
                      <Activity className="w-3 h-3" /> {isLoading ? "PROCESANDO" : "IDLE"}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 🔥 BOTÓN DE CIERRE REFORZADO */}
              <button 
                onClick={cerrarChat} 
                className="text-white/60 hover:text-white hover:bg-white/10 p-2.5 rounded-xl transition-all relative z-[9999] cursor-pointer flex items-center justify-center bg-black/20"
                title="Cerrar chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* ÁREA DE MENSAJES (TERMINAL) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-[#03050a]/50 to-[#0A0E14]/80 scroll-smooth">
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 250, damping: 25 }}
                  key={i} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-4 text-[13px] leading-relaxed relative ${
                      m.role === 'user' 
                        ? 'bg-[#00D1FF]/10 text-white border border-[#00D1FF]/30 rounded-lg rounded-tr-none shadow-[0_0_15px_rgba(0,209,255,0.1)]' 
                        : 'bg-white/[0.03] text-slate-300 border border-white/10 rounded-lg rounded-tl-none'
                    }`}
                  >
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30" />

                    {m.content.includes('[ABRIR_FORMULARIO]') ? (
                      <div className="flex flex-col gap-3">
                        <span>{m.content.replace('[ABRIR_FORMULARIO]', '')}</span>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => window.dispatchEvent(new Event('abrir-modal-lead'))}
                          className="bg-[#00D1FF]/20 border border-[#00D1FF]/50 text-[#00D1FF] px-4 py-2.5 rounded text-[12px] font-mono tracking-widest uppercase hover:bg-[#00D1FF] hover:text-black transition-all flex items-center justify-center gap-2 mt-2"
                        >
                          <Zap className="w-4 h-4" /> INICIAR PROTOCOLO
                        </motion.button>
                      </div>
                    ) : (
                      <span className="font-body">{m.content}</span>
                    )}
                  </div>
                </motion.div>
              ))}
              
              <AnimatePresence>
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/[0.03] border border-white/10 p-3.5 rounded-lg rounded-tl-none flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-[#00D1FF]/50 uppercase tracking-widest mr-2">Calculando</span>
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-1.5 h-3 bg-[#00D1FF] skew-x-[-20deg]" />
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-3 bg-[#00D1FF] skew-x-[-20deg]" />
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-3 bg-[#00D1FF] skew-x-[-20deg]" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT DE TERMINAL */}
            <div className="p-4 bg-[#03050a] border-t border-[#00D1FF]/20 shrink-0">
              <div className="relative flex items-center bg-[#0A0E14] border border-white/10 focus-within:border-[#00D1FF]/50 rounded text-white overflow-hidden transition-colors">
                <div className="pl-3 text-[#00D1FF] font-mono text-[14px]">{'>'}</div>
                <input 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ingresa un comando o pregunta..."
                  disabled={isLoading}
                  className="w-full bg-transparent pl-3 pr-12 py-3.5 text-[13px] font-mono text-white placeholder-white/30 outline-none disabled:opacity-50"
                />
                <button 
                  onClick={sendMessage} 
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/5 hover:bg-[#00D1FF]/20 disabled:bg-transparent text-[#00D1FF] disabled:text-white/20 p-2 rounded transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}